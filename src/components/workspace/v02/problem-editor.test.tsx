import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { ApiError } from "@/lib/api/errors";
import { v02 } from "@/lib/api/v02";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import {
  v02Languages,
  v02Problems,
  v02Submission,
} from "@/lib/demo/v02-fixtures";
import { keys } from "@/lib/query/keys";
import { ProblemEditor } from "./problem-editor";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/problems/detail",
  useRouter: () => navigation,
}));
vi.mock("../account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return { useWorkspaceSession: () => ({ data: demoUser }) };
});

beforeEach(() => {
  vi.restoreAllMocks();
  navigation.push.mockReset();
  document.cookie = "codestartrack_locale=en; Path=/";
});

function editor(problem: PlatformProblemDetail = v02Problems[0]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(keys.session, demoUser);
  const refreshProblem = vi.fn();
  const tree = (item: PlatformProblemDetail) => (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <ProblemEditor
          problem={item}
          capabilities={v02Languages}
          refreshProblem={refreshProblem}
          refreshLanguages={vi.fn()}
        />
      </LocaleProvider>
    </QueryClientProvider>
  );
  const result = render(tree(problem));
  fireEvent.click(
    screen.getByRole("button", { name: "Use plain text editor" }),
  );
  return {
    ...result,
    client,
    refreshProblem,
    rerenderProblem: (item: PlatformProblemDetail) =>
      result.rerender(tree(item)),
  };
}

describe("platform code submission", () => {
  it("blocks blank and oversized UTF-8 source with associated form errors", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockResolvedValue(v02Submission());
    editor();
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    expect(
      screen.getByText("Enter source code containing more than whitespace."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Source code" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Source code" })).toHaveFocus();
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: "练".repeat(87_382) },
    });
    expect(
      screen.getByText(
        "Source exceeds 262144 UTF-8 bytes. Shorten it before submitting.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit for judging" }),
    ).toBeDisabled();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits original source and the exact fixed problem reference, then opens its accepted ID", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockResolvedValue(v02Submission());
    editor();
    const source = "  int main() { return 0; }  \n\n";
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: source },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith(
      {
        problemRef: v02Problems[0].problemRef,
        languageId: "cpp17",
        sourceCode: source,
      },
      expect.stringMatching(/^[\da-f-]{36}$/i),
    );
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        "/submissions/detail?submissionId=9007199254748001",
      ),
    );
  });

  it("reuses the uncertain operation key and creates a different key after editing", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockRejectedValue(new ApiError("NETWORK_ERROR"));
    editor();
    const input = screen.getByRole("textbox", { name: "Source code" });
    fireEvent.change(input, { target: { value: "int main() {}\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByRole("button", { name: "Retry this submission" });
    fireEvent.click(
      screen.getByRole("button", { name: "Retry this submission" }),
    );
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Retry this submission" });
    expect(submit.mock.calls[1][1]).toBe(submit.mock.calls[0][1]);
    fireEvent.change(input, {
      target: { value: "int main() { return 0; }\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(3));
    expect(submit.mock.calls[2][1]).not.toBe(submit.mock.calls[0][1]);
  });

  it("preserves source on a refreshed problem version and waits for an explicit new submission", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockRejectedValueOnce(new ApiError("PROBLEM_VERSION_CONFLICT", 409))
      .mockResolvedValue(v02Submission());
    const result = editor();
    const source = "  int main() {}\n";
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: source },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByRole("button", { name: "Retry this submission" });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Refresh current problem" })[0],
    );
    expect(result.refreshProblem).toHaveBeenCalledOnce();
    const newProblem = {
      ...v02Problems[0],
      problemRef: {
        ...v02Problems[0].problemRef,
        problemVersionId: fixtureUuid(2999),
      },
    };
    result.rerenderProblem(newProblem);
    expect(screen.getByRole("textbox", { name: "Source code" })).toHaveValue(
      source,
    );
    expect(submit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[1][0].problemRef.problemVersionId).toBe(
      newProblem.problemRef.problemVersionId,
    );
    expect(submit.mock.calls[1][1]).not.toBe(submit.mock.calls[0][1]);
  });

  it("offers only executable problem languages and allows judging while analysis is unavailable", () => {
    editor({ ...v02Problems[0], languageIds: ["c11", "python3"] });
    expect(
      screen.queryByRole("option", { name: /C\+\+/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByText(
        /Analysis is currently unavailable; judging is still available/,
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: "int main() {}" },
    });
    expect(
      screen.getByRole("button", { name: "Submit for judging" }),
    ).toBeEnabled();
  });

  it("keeps separate memory drafts by language and disables submission for withdrawn problems", () => {
    const result = editor();
    const input = screen.getByRole("textbox", { name: "Source code" });
    fireEvent.change(input, { target: { value: "cpp draft" } });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Compiler language" }),
      { target: { value: "c11" } },
    );
    expect(input).toHaveValue("");
    fireEvent.change(input, { target: { value: "c draft" } });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Compiler language" }),
      { target: { value: "cpp17" } },
    );
    expect(input).toHaveValue("cpp draft");
    result.rerenderProblem({ ...v02Problems[0], status: "WITHDRAWN" });
    expect(
      screen.getByRole("button", { name: "Submit for judging" }),
    ).toBeDisabled();
  });
});
