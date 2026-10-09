import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { ApiError } from "@/lib/api/errors";
import type { UserDto } from "@/lib/api/schemas";
import { v02 } from "@/lib/api/v02";
import type { SubmissionView } from "@/lib/api/v02-schemas";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { v02Submission } from "@/lib/demo/v02-fixtures";
import { keys } from "@/lib/query/keys";
import { v02Keys } from "@/lib/query/v02";
import {
  EditorSubmissionResult,
  type EditorSubmissionAttempt,
} from "./editor-submission-result";

vi.mock("next/navigation", () => ({
  usePathname: () => "/problems/detail",
}));
vi.mock("@/components/workspace/account-provider", async () => {
  const { useQuery } = await import("@tanstack/react-query");
  const { keys } = await import("@/lib/query/keys");
  return {
    useWorkspaceSession: () =>
      useQuery<UserDto | null>({
        queryKey: keys.session,
        queryFn: async () => null,
        enabled: false,
      }),
  };
});

const clients = new Set<QueryClient>();

function view(
  submission: SubmissionView,
  flags = { previous: false, draftChanged: false },
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  clients.add(client);
  client.setQueryData(keys.session, demoUser);
  const queryKey = v02Keys.resource(demoUser.publicId, "submission", {
    submissionId: submission.submissionId,
  });
  client.setQueryData(queryKey, submission);
  const attempt: EditorSubmissionAttempt = {
    publicId: demoUser.publicId,
    submissionId: submission.submissionId,
    languageId: submission.languageId,
    problemVersionId: submission.problem.problemRef.problemVersionId!,
    sourceCode: "  int main() {}\n",
    requestNumber: 1,
  };
  const result = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <EditorSubmissionResult attempt={attempt} pending={false} {...flags} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...result, client, queryKey, attempt };
}

async function tick(milliseconds = 1) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

function metric(label: string) {
  const group = screen.getByText(label).parentElement!;
  return within(group).getByRole("definition");
}

beforeEach(() => {
  vi.useFakeTimers();
  document.cookie = "codestartrack_locale=en; Path=/";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("inline submission results", () => {
  it("shows the accepted queued projection and polls to real aggregate results without another write or source read", async () => {
    const queued = v02Submission(undefined, {
      judgeStatus: "QUEUED",
      judgeRevision: 1,
      judgeResult: null,
    });
    const completed = v02Submission(queued.submissionId);
    const read = vi
      .spyOn(v02, "submission")
      .mockResolvedValueOnce(queued)
      .mockResolvedValue(completed);
    const submit = vi.spyOn(v02, "createSubmission");
    const source = vi.spyOn(v02, "submissionSource");
    const analysis = vi.spyOn(v02, "submissionAnalysis");
    view(queued, { previous: false, draftChanged: true });

    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.queryByText(/AC ·/)).not.toBeInTheDocument();
    expect(screen.queryByText("Tests passed")).not.toBeInTheDocument();
    expect(screen.getByText(queued.languageId)).toBeInTheDocument();
    expect(
      screen.getByText(queued.problem.problemRef.problemVersionId!),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This result belongs to the submitted version/),
    ).toBeInTheDocument();
    await tick();
    expect(read).toHaveBeenCalledTimes(1);

    await tick(3000);
    expect(screen.getByText("AC · Accepted")).toBeInTheDocument();
    expect(metric("Maximum CPU time")).toHaveTextContent("12 ms");
    expect(metric("Peak memory")).toHaveTextContent("1 MiB");
    expect(metric("Tests passed")).toHaveTextContent("12 / 12");
    expect(
      screen.getByRole("link", { name: "View submission" }),
    ).toHaveAttribute(
      "href",
      `/submissions/detail?submissionId=${queued.submissionId}`,
    );
    await tick(30000);
    expect(read).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(source).not.toHaveBeenCalled();
    expect(analysis).not.toHaveBeenCalled();
  });

  it("renders compilation failure diagnostics as escaped text and preserves unavailable metrics", async () => {
    const completed = v02Submission();
    const compileLog = '<script>alert("unsafe")</script>\nmain.cpp:2: error';
    const submission = v02Submission(completed.submissionId, {
      judgeResult: {
        ...completed.judgeResult!,
        verdict: "CE",
        timeMs: null,
        memoryBytes: null,
        score: null,
        compileLog,
        diagnosticCode: "COMPILATION_FAILED",
      },
    });
    vi.spyOn(v02, "submission").mockResolvedValue(submission);
    const { container } = view(submission);
    await tick();

    expect(screen.getByText("CE · Compilation error")).toBeInTheDocument();
    expect(metric("Maximum CPU time")).toHaveTextContent("Unavailable");
    expect(metric("Peak memory")).toHaveTextContent("Unavailable");
    expect(metric("Score")).toHaveTextContent("Unavailable");
    expect(screen.queryByText("0 ms")).not.toBeInTheDocument();
    expect(screen.queryByText("0 MiB")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Compilation log")).toHaveTextContent(
      compileLog,
      { normalizeWhitespace: false },
    );
    expect(screen.getByText("COMPILATION_FAILED")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("shows structured judge service errors without manufacturing a verdict or test result", async () => {
    const submission = v02Submission(undefined, {
      judgeStatus: "FAILED",
      judgeResult: null,
      judgeError: {
        code: "SANDBOX_UNAVAILABLE",
        message: "Unavailable sandbox",
        retryable: true,
      },
    });
    const read = vi.spyOn(v02, "submission").mockResolvedValue(submission);
    view(submission, { previous: true, draftChanged: false });
    await tick();

    expect(screen.getByText("Previous submission result")).toBeInTheDocument();
    expect(screen.getByText("Judge service failed")).toBeInTheDocument();
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("SANDBOX_UNAVAILABLE");
    expect(error).toHaveTextContent("Unavailable sandbox");
    expect(error).toHaveTextContent("Recoverable");
    expect(
      screen.getByText("This service error does not count as a wrong answer."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/IE ·/)).not.toBeInTheDocument();
    expect(screen.queryByText("Tests passed")).not.toBeInTheDocument();
    await tick(30000);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it.each([403, 404])(
    "suppresses all cached result and attempt details after a denied GET (%s)",
    async (status) => {
      const submission = v02Submission();
      const read = vi
        .spyOn(v02, "submission")
        .mockRejectedValue(new ApiError("RESULT_ACCESS_DENIED", status));
      const { client, queryKey } = view(submission, {
        previous: true,
        draftChanged: true,
      });
      expect(screen.getByText("AC · Accepted")).toBeInTheDocument();
      await tick();

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(client.getQueryData(queryKey)).toEqual(submission);
      for (const text of [
        "AC · Accepted",
        "Maximum CPU time",
        "Peak memory",
        "Tests passed",
        "12 / 12",
        "cpp17",
        submission.submissionId,
        submission.problem.problemRef.problemVersionId!,
        "Previous submission result",
      ]) {
        expect(screen.queryByText(text)).not.toBeInTheDocument();
      }
      expect(
        screen.queryByText(/This result belongs to the submitted version/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "View submission" }),
      ).not.toBeInTheDocument();
      await tick(60000);
      expect(read).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["logout", null],
    ["another owner", { ...demoUser, publicId: fixtureUuid(9999) }],
  ] as const)(
    "hides the prior owner's result after %s and rejects its late in-flight projection",
    async (_description, nextUser) => {
      const queued = v02Submission(undefined, {
        judgeStatus: "QUEUED",
        judgeRevision: 1,
        judgeResult: null,
      });
      let resolve!: (value: SubmissionView) => void;
      const read = vi.spyOn(v02, "submission").mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      const { client, queryKey } = view(queued);
      await tick();
      expect(screen.getByText("Queued")).toBeInTheDocument();
      expect(read).toHaveBeenCalledTimes(1);
      const signal = read.mock.calls[0][1]!;

      act(() => client.setQueryData(keys.session, nextUser));
      await tick();
      expect(signal.aborted).toBe(true);
      expect(screen.queryByText("Queued")).not.toBeInTheDocument();
      expect(screen.queryByText("cpp17")).not.toBeInTheDocument();
      expect(screen.queryByText(queued.submissionId)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "View submission" }),
      ).not.toBeInTheDocument();

      await act(async () => resolve(v02Submission(queued.submissionId)));
      await tick(30000);
      expect(screen.queryByText("AC · Accepted")).not.toBeInTheDocument();
      expect(client.getQueryData(queryKey)).toEqual(queued);
      if (nextUser) {
        expect(
          client.getQueryData(
            v02Keys.resource(nextUser.publicId, "submission", {
              submissionId: queued.submissionId,
            }),
          ),
        ).toBeUndefined();
      }
      expect(read).toHaveBeenCalledTimes(1);
      expect(
        client.getQueryCache().findAll({
          queryKey: ["private", nextUser?.publicId ?? "none"],
        }),
      ).toHaveLength(0);
    },
  );
});
