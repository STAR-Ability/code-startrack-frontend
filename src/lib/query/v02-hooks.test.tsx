import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { UserDto } from "@/lib/api/schemas";
import type { CreateSubmissionInput } from "@/lib/api/v02-schemas";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { v02Submission, v02LearningProfile } from "@/lib/demo/v02-fixtures";
import { v02 } from "@/lib/api/v02";
import { ApiError } from "@/lib/api/errors";
import { keys } from "./keys";
import { v02Keys } from "./v02";
import {
  useV02Analysis,
  useV02Mutation,
  useV02Submission,
  invalidateV02LearningSources,
  useV02LatestProfile,
} from "./v02-hooks";

const session = vi.hoisted(() => ({ user: null as UserDto | null }));
vi.mock("@/components/workspace/account-provider", () => ({
  useWorkspaceSession: () => ({ data: session.user }),
}));
function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(keys.session, demoUser);
  session.user = demoUser;
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}
async function tick(milliseconds = 1) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("V0.2 mounted polling and mutation ownership", () => {
  it("reconciles a stale automatic profile with only latest GETs, pausing hidden reads and stopping when fresh", async () => {
    const stale = { ...v02LearningProfile(), stale: true };
    const fresh = { ...stale, snapshotId: fixtureUuid(2309), stale: false };
    const profiles = [stale, stale, fresh];
    const fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: profiles.shift() ?? fresh,
            requestId: fixtureUuid(9999),
          }),
        ),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    const { client, wrapper } = harness();
    const { result } = renderHook(() => useV02LatestProfile("ALL"), {
      wrapper,
    });
    await tick();
    expect(result.current.data?.stale).toBe(true);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tick(9000);
    expect(fetch).toHaveBeenCalledTimes(1);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tick();
    expect(fetch).toHaveBeenCalledTimes(2);
    await tick(3000);
    expect(result.current.data?.snapshotId).toBe(fresh.snapshotId);
    await tick(9000);
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const call of fetch.mock.calls) {
      expect(call[0]).toBe("/api/v1/me/learning-profile/latest?window=ALL");
      expect(call[1].method).toBe("GET");
    }
    client.clear();
  });
  it("reconciles a null first profile only after an actual source-change signal", async () => {
    const read = vi
      .spyOn(v02, "learningProfile")
      .mockResolvedValueOnce(null)
      .mockResolvedValue(v02LearningProfile());
    const rebuild = vi.spyOn(v02, "rebuildProfile");
    const { client, wrapper } = harness();
    await invalidateV02LearningSources(client, demoUser.publicId);
    const { result } = renderHook(() => useV02LatestProfile("ALL"), {
      wrapper,
    });
    await tick();
    expect(result.current.data).toBeNull();
    await tick(3000);
    expect(result.current.data?.stale).toBe(false);
    expect(read).toHaveBeenCalledTimes(2);
    expect(rebuild).not.toHaveBeenCalled();
    client.clear();
  });
  it("stops stale reconciliation after its bounded attempt and lets Refresh restart reads", async () => {
    const read = vi
      .spyOn(v02, "learningProfile")
      .mockResolvedValue({ ...v02LearningProfile(), stale: true });
    const { client, wrapper } = harness();
    const { result } = renderHook(() => useV02LatestProfile("ALL"), {
      wrapper,
    });
    await tick();
    await tick(61000);
    const boundedCount = read.mock.calls.length;
    await tick(30000);
    expect(read).toHaveBeenCalledTimes(boundedCount);
    await act(async () => {
      await result.current.refetch();
    });
    await tick(3000);
    expect(read.mock.calls.length).toBeGreaterThan(boundedCount + 1);
    client.clear();
  });
  it("refreshes dynamic completion/stale flags in recommendation history and detail after source changes", async () => {
    const { client } = harness();
    const resources = [
      "training-records",
      "training-record",
      "learning-profile",
      "learning-history",
      "recommendations",
      "recommendation-history",
      "recommendation-batch",
    ];
    for (const resource of [...resources, "learning-snapshot"])
      client.setQueryData(v02Keys.resource(demoUser.publicId, resource), {
        frozen: true,
      });
    await invalidateV02LearningSources(client, demoUser.publicId);
    for (const resource of resources)
      expect(
        client.getQueryState(v02Keys.resource(demoUser.publicId, resource))
          ?.isInvalidated,
      ).toBe(true);
    expect(
      client.getQueryState(
        v02Keys.resource(demoUser.publicId, "learning-snapshot"),
      )?.isInvalidated,
    ).toBe(false);
    client.clear();
  });
  it("retains the accepted write's key when its response fails validation", async () => {
    const submission = v02Submission();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { accepted: true },
            requestId: fixtureUuid(9999),
          }),
          { status: 202 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: submission, requestId: fixtureUuid(9999) }),
        ),
      );
    vi.stubGlobal("fetch", fetch);
    const { client, wrapper } = harness();
    const { result } = renderHook(
      () =>
        useV02Mutation("submission", (body: CreateSubmissionInput, key) =>
          v02.createSubmission(body, key),
        ),
      { wrapper },
    );
    const ref = submission.problem.problemRef;
    if (ref.source !== "PLATFORM") throw new Error("Expected platform fixture");
    const body = {
      problemRef: ref,
      languageId: "cpp17",
      sourceCode: "int main() {}",
    };
    act(() => result.current.mutate(body));
    await tick();
    expect(result.current.error).toMatchObject({ code: "INVALID_RESPONSE" });
    act(() => result.current.mutate(body));
    await tick();
    expect(fetch.mock.calls[1][1].headers["Idempotency-Key"]).toBe(
      fetch.mock.calls[0][1].headers["Idempotency-Key"],
    );
    expect(result.current.data?.submissionId).toBe(submission.submissionId);
    client.clear();
  });
  it("preserves a higher cached revision when the current-task observer remounts", async () => {
    const submission = v02Submission();
    const cached = {
      analysisId: submission.analysisId,
      status: "PARTIAL" as const,
      revision: 5,
      result: null,
      error: null,
    };
    vi.spyOn(v02, "submissionAnalysis").mockResolvedValue({
      ...cached,
      revision: 2,
    });
    const { client, wrapper } = harness();
    client.setQueryData(
      v02Keys.resource(demoUser.publicId, "submission-analysis", {
        submissionId: submission.submissionId,
        analysisId: submission.analysisId,
      }),
      cached,
    );
    const { result } = renderHook(
      () => useV02Analysis(submission.submissionId, submission),
      { wrapper },
    );
    await tick();
    expect(result.current.data?.revision).toBe(5);
    client.clear();
  });
  it("pauses while hidden and immediately reads when visible again", async () => {
    const running = v02Submission(undefined, {
      judgeStatus: "RUNNING",
      judgeResult: null,
    });
    const read = vi.spyOn(v02, "submission").mockResolvedValue(running);
    const { client, wrapper } = harness();
    renderHook(() => useV02Submission(running.submissionId), { wrapper });
    await tick();
    expect(read).toHaveBeenCalledTimes(1);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tick(9000);
    expect(read).toHaveBeenCalledTimes(1);
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await tick();
    expect(read).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it("continues static analysis after judging completes and stops at PARTIAL", async () => {
    const submission = v02Submission();
    const judge = vi.spyOn(v02, "submission").mockResolvedValue(submission);
    const analysis = vi
      .spyOn(v02, "submissionAnalysis")
      .mockResolvedValueOnce({
        analysisId: submission.analysisId,
        status: "RUNNING",
        revision: 2,
        result: null,
        error: null,
      })
      .mockResolvedValue({
        analysisId: submission.analysisId,
        status: "PARTIAL",
        revision: 3,
        result: null,
        error: {
          code: "TOOL_TIMEOUT",
          message: "Partial evidence",
          retryable: true,
        },
      });
    const { client, wrapper } = harness();
    renderHook(
      () => {
        const judge = useV02Submission(submission.submissionId);
        return useV02Analysis(submission.submissionId, judge.data);
      },
      { wrapper },
    );
    await tick();
    await tick(3000);
    expect(judge).toHaveBeenCalledTimes(1);
    expect(analysis).toHaveBeenCalledTimes(2);
    await tick(6000);
    expect(analysis).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it("does not publish a mutation result or invoke UI callbacks after an identity change", async () => {
    let resolve!: (value: string) => void;
    const request = new Promise<string>((done) => {
      resolve = done;
    });
    const run = vi.fn().mockReturnValue(request);
    const onSuccess = vi.fn();
    const { client, wrapper } = harness();
    const { result, rerender } = renderHook(
      () => useV02Mutation("submission", run, onSuccess),
      { wrapper },
    );
    act(() => result.current.mutate({ sourceCode: "private" }));
    await tick();
    const other = { ...demoUser, publicId: fixtureUuid(7777) };
    client.setQueryData(keys.session, other);
    session.user = other;
    rerender();
    await act(async () => {
      resolve("old private result");
    });
    await tick();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    client.clear();
  });
  it("starts reading a new projected task even when the old task is terminal", async () => {
    const old = v02Submission();
    const next = {
      ...old,
      analysisId: fixtureUuid(2201),
      analysisStatus: "QUEUED" as const,
      analysisRevision: 0,
    };
    const read = vi
      .spyOn(v02, "submissionAnalysis")
      .mockResolvedValueOnce({
        analysisId: old.analysisId,
        status: "PARTIAL",
        revision: 20,
        result: null,
        error: null,
      })
      .mockResolvedValue({
        analysisId: next.analysisId,
        status: "QUEUED",
        revision: 0,
        result: null,
        error: null,
      });
    const { client, wrapper } = harness();
    const { result, rerender } = renderHook(
      ({ submission }) => useV02Analysis(submission.submissionId, submission),
      { wrapper, initialProps: { submission: old } },
    );
    await tick();
    expect(result.current.data?.analysisId).toBe(old.analysisId);
    rerender({ submission: next });
    await tick();
    expect(read).toHaveBeenCalledTimes(2);
    expect(result.current.data?.analysisId).toBe(next.analysisId);
    expect(result.current.data?.revision).toBe(0);
    client.clear();
  });
  it("ignores a delayed old task response after the projected identity changes", async () => {
    const old = v02Submission();
    const next = {
      ...old,
      analysisId: fixtureUuid(2201),
      analysisStatus: "QUEUED" as const,
      analysisRevision: 0,
    };
    let resolve!: (
      value: Awaited<ReturnType<typeof v02.submissionAnalysis>>,
    ) => void;
    const delayed = new Promise<
      Awaited<ReturnType<typeof v02.submissionAnalysis>>
    >((done) => {
      resolve = done;
    });
    vi.spyOn(v02, "submissionAnalysis")
      .mockReturnValueOnce(delayed)
      .mockResolvedValue({
        analysisId: next.analysisId,
        status: "QUEUED",
        revision: 0,
        result: null,
        error: null,
      });
    const { client, wrapper } = harness();
    const { result, rerender } = renderHook(
      ({ submission }) => useV02Analysis(submission.submissionId, submission),
      { wrapper, initialProps: { submission: old } },
    );
    await tick();
    rerender({ submission: next });
    await tick();
    await act(async () => {
      resolve({
        analysisId: old.analysisId,
        status: "SUCCEEDED",
        revision: 20,
        result: null,
        error: null,
      });
    });
    await tick();
    expect(result.current.data?.analysisId).toBe(next.analysisId);
    expect(result.current.data?.revision).toBe(0);
    client.clear();
  });
  it("rechecks identity after cancellation before publishing successful mutation callbacks", async () => {
    const { client, wrapper } = harness();
    let finishCancellation!: () => void;
    const cancellation = new Promise<void>((done) => {
      finishCancellation = done;
    });
    vi.spyOn(client, "cancelQueries").mockReturnValue(cancellation);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(
      () => useV02Mutation("rebuild-profile", async () => "job", onSuccess),
      { wrapper },
    );
    act(() => result.current.mutate(undefined));
    await tick();
    const other = { ...demoUser, publicId: fixtureUuid(7777) };
    client.setQueryData(keys.session, other);
    session.user = other;
    rerender();
    await act(async () => {
      finishCancellation();
    });
    await tick();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    client.clear();
  });
  it("retries an uncertain write with the same operation key and uses a fresh key after editing", async () => {
    const run = vi.fn().mockRejectedValue(new ApiError("TIMEOUT"));
    const { client, wrapper } = harness();
    const { result } = renderHook(() => useV02Mutation("submission", run), {
      wrapper,
    });
    act(() => result.current.mutate({ sourceCode: "original" }));
    await tick();
    act(() => result.current.mutate({ sourceCode: "original" }));
    await tick();
    expect(run.mock.calls[1][1]).toBe(run.mock.calls[0][1]);
    act(() => result.current.mutate({ sourceCode: "edited" }));
    await tick();
    expect(run.mock.calls[2][1]).not.toBe(run.mock.calls[0][1]);
    client.clear();
  });
});
