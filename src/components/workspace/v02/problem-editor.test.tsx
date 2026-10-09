import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
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
import { v02Keys } from "@/lib/query/v02";
import { ProblemEditor } from "./problem-editor";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/problems/detail",
  useRouter: () => navigation,
}));
vi.mock("../account-provider", async () => {
  const { keys } = await import("@/lib/query/keys");
  return {
    useWorkspaceSession: () =>
      useQuery({
        queryKey: keys.session,
        queryFn: async () => null,
        enabled: false,
      }),
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
  navigation.push.mockReset();
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.spyOn(v02, "submission").mockImplementation(async (id) =>
    v02Submission(id),
  );
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

  it("submits exact source and fixed problem reference, then shows the accepted result in the editor", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockResolvedValue(v02Submission());
    const result = editor();
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
    expect(
      await screen.findByRole("link", { name: "View submission" }),
    ).toHaveAttribute(
      "href",
      "/submissions/detail?submissionId=9007199254748001",
    );
    expect(navigation.push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("tab", { name: "Submission results" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Source code" })).toHaveValue(
      source,
    );
    expect(
      result.client.getQueryData(
        v02Keys.resource(demoUser.publicId, "submission", {
          submissionId: "9007199254748001",
        }),
      ),
    ).toEqual(v02Submission());
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

  it("keeps a previous accepted result explicit while a later non-denied request fails", async () => {
    vi.spyOn(v02, "createSubmission")
      .mockResolvedValueOnce(v02Submission())
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR"));
    editor();
    const input = screen.getByRole("textbox", { name: "Source code" });
    fireEvent.change(input, { target: { value: "int original;\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByRole("link", { name: "View submission" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "int edited;\n" } });
    expect(
      screen.getByText(
        "The code, language or problem version has changed. This result belongs to the submitted version.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByRole("button", { name: "Retry this submission" });
    expect(screen.getByText("Previous submission result")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View submission" }),
    ).toHaveAttribute(
      "href",
      "/submissions/detail?submissionId=9007199254748001",
    );
    expect(screen.getByText("12 / 12")).toBeInTheDocument();
    expect(input).toHaveValue("int edited;\n");
  });

  it("continues aggregate polling while samples are selected and the console is collapsed", async () => {
    const queued = v02Submission(undefined, {
      judgeStatus: "QUEUED",
      judgeRevision: 1,
      judgeResult: null,
    });
    let completed = false;
    const read = vi
      .mocked(v02.submission)
      .mockImplementation(async () => (completed ? v02Submission() : queued));
    const submit = vi.spyOn(v02, "createSubmission").mockResolvedValue(queued);
    const source = vi.spyOn(v02, "submissionSource");
    const result = editor();
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: "int submitted;\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByText("Queued");
    await waitFor(() => expect(read).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: "Public samples" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse test panel" }),
    );
    completed = true;
    await waitFor(
      () =>
        expect(
          result.client.getQueryData<ReturnType<typeof v02Submission>>(
            v02Keys.resource(demoUser.publicId, "submission", {
              submissionId: queued.submissionId,
            }),
          )?.judgeStatus,
        ).toBe("COMPLETED"),
      { timeout: 5000 },
    );
    fireEvent.click(screen.getByRole("button", { name: "Expand test panel" }));
    fireEvent.click(screen.getByRole("tab", { name: "Submission results" }));
    expect(screen.getByText("AC · Accepted")).toBeInTheDocument();
    expect(submit).toHaveBeenCalledOnce();
    expect(source).not.toHaveBeenCalled();
  });

  it.each([403, 404])(
    "does not revive an accepted result after denied POST %s and draft resets",
    async (status) => {
      const submit = vi
        .spyOn(v02, "createSubmission")
        .mockResolvedValueOnce(v02Submission())
        .mockRejectedValueOnce(new ApiError("PRIVACY_DENIED", status))
        .mockResolvedValueOnce(v02Submission("9007199254748002"));
      editor();
      const input = screen.getByRole("textbox", { name: "Source code" });
      fireEvent.change(input, { target: { value: "int original;\n" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for judging" }),
      );
      await screen.findByRole("link", { name: "View submission" });
      await waitFor(() => expect(input).toBeEnabled());
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for judging" }),
      );
      await screen.findByRole("button", { name: "Retry this submission" });
      expect(
        screen.queryByRole("link", { name: "View submission" }),
      ).not.toBeInTheDocument();
      fireEvent.change(input, { target: { value: "int edited;\n" } });
      fireEvent.change(
        screen.getByRole("combobox", { name: "Compiler language" }),
        { target: { value: "c11" } },
      );
      fireEvent.change(
        screen.getByRole("combobox", { name: "Compiler language" }),
        { target: { value: "cpp17" } },
      );
      expect(
        screen.queryByRole("link", { name: "View submission" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("12 / 12")).not.toBeInTheDocument();
      expect(screen.queryByText("9007199254748001")).not.toBeInTheDocument();
      expect(submit).toHaveBeenCalledTimes(2);
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for judging" }),
      );
      expect(
        await screen.findByRole("link", { name: "View submission" }),
      ).toHaveAttribute(
        "href",
        "/submissions/detail?submissionId=9007199254748002",
      );
    },
  );

  it("keeps accepted language and version separate when the current draft changes", async () => {
    const submit = vi
      .spyOn(v02, "createSubmission")
      .mockResolvedValue(v02Submission());
    const result = editor();
    const input = screen.getByRole("textbox", { name: "Source code" });
    fireEvent.change(input, { target: { value: "int submitted;\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await screen.findByRole("link", { name: "View submission" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(
      screen.getByRole("combobox", { name: "Compiler language" }),
      { target: { value: "c11" } },
    );
    result.rerenderProblem({
      ...v02Problems[0],
      problemRef: {
        ...v02Problems[0].problemRef,
        problemVersionId: fixtureUuid(2999),
      },
    });
    expect(screen.getByText("cpp17")).toBeInTheDocument();
    expect(
      screen.getByText(v02Problems[0].problemRef.problemVersionId!),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The code, language or problem version has changed. This result belongs to the submitted version.",
      ),
    ).toBeInTheDocument();
    expect(submit).toHaveBeenCalledOnce();
  });

  it.each(["accepted", "denied"] as const)(
    "ignores an older %s completion after a compiler reset starts a newer same-user request",
    async (outcome) => {
      let finishOld!: (submission: ReturnType<typeof v02Submission>) => void;
      let denyOld!: (error: ApiError) => void;
      const oldResponse = new Promise<ReturnType<typeof v02Submission>>(
        (resolve, reject) => {
          finishOld = resolve;
          denyOld = reject;
        },
      );
      const submit = vi
        .spyOn(v02, "createSubmission")
        .mockReturnValueOnce(oldResponse)
        .mockResolvedValueOnce(
          v02Submission("9007199254748002", { languageId: "c11" }),
        );
      vi.mocked(v02.submission).mockImplementation(async (id) =>
        v02Submission(id, { languageId: "c11" }),
      );
      const result = editor();
      const input = screen.getByRole("textbox", { name: "Source code" });
      fireEvent.change(input, { target: { value: "int old;\n" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for judging" }),
      );
      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
      // Exercise a late select event even though normal pending controls are disabled.
      fireEvent.change(
        screen.getByRole("combobox", { name: "Compiler language" }),
        { target: { value: "c11" } },
      );
      await waitFor(() => expect(input).toBeEnabled());
      fireEvent.change(input, { target: { value: "int newest;\n" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for judging" }),
      );
      expect(
        await screen.findByRole("link", { name: "View submission" }),
      ).toHaveAttribute(
        "href",
        "/submissions/detail?submissionId=9007199254748002",
      );
      await act(async () => {
        if (outcome === "accepted") finishOld(v02Submission());
        else denyOld(new ApiError("PRIVACY_DENIED", 404));
      });
      expect(
        screen.getByRole("link", { name: "View submission" }),
      ).toHaveAttribute(
        "href",
        "/submissions/detail?submissionId=9007199254748002",
      );
      expect(
        result.client.getQueryData(
          v02Keys.resource(demoUser.publicId, "submission", {
            submissionId: "9007199254748001",
          }),
        ),
      ).toBeUndefined();
      expect(submit).toHaveBeenCalledTimes(2);
    },
  );

  it("does not restore an in-flight accepted POST after logout", async () => {
    let finish!: (submission: ReturnType<typeof v02Submission>) => void;
    vi.spyOn(v02, "createSubmission").mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const result = editor();
    fireEvent.change(screen.getByRole("textbox", { name: "Source code" }), {
      target: { value: "int private;\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for judging" }));
    await waitFor(() => expect(v02.createSubmission).toHaveBeenCalledOnce());
    await act(async () => {
      result.client.setQueryData(keys.session, null);
      result.client.removeQueries({ queryKey: ["private"] });
      finish(v02Submission());
    });
    expect(
      screen.queryByRole("link", { name: "View submission" }),
    ).not.toBeInTheDocument();
    expect(
      result.client.getQueryCache().findAll({ queryKey: ["private"] }),
    ).toHaveLength(0);
    expect(v02.submission).not.toHaveBeenCalled();
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
