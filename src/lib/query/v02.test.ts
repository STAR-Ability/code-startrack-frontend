import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { v02Submission, v02LearningProfile } from "@/lib/demo/v02-fixtures";
import { fixtureUuid } from "@/lib/demo/fixtures";
import {
  v02Keys,
  V02OperationKeys,
  V02AnalysisTasks,
  latestProfilePollDelay,
  V02LatestProfilePolling,
  judgePollDelay,
  analysisPollDelay,
  profilePollDelay,
  acceptAnalysis,
  acceptSubmission,
} from "./v02";
describe("V0.2 independent task polling", () => {
  it("polls only stale latest profiles and backs off read failures", () => {
    const profile = v02LearningProfile();
    expect(latestProfilePollDelay({ ...profile, stale: true })).toBe(3000);
    expect(
      latestProfilePollDelay(
        { ...profile, stale: true },
        1,
        new ApiError("NETWORK_ERROR"),
      ),
    ).toBe(6000);
    expect(
      latestProfilePollDelay(
        { ...profile, stale: true },
        5,
        new ApiError("ALGORITHM_TIMEOUT", 504),
      ),
    ).toBe(30000);
    expect(latestProfilePollDelay(profile)).toBe(false);
    expect(latestProfilePollDelay(null)).toBe(false);
    expect(
      latestProfilePollDelay(profile, 0, new ApiError("UNAUTHORIZED", 401)),
    ).toBe(false);
  });
  it("bounds stale/null reconciliation and permits a fresh manual read attempt", () => {
    const polling = new V02LatestProfilePolling();
    const stale = { ...v02LearningProfile(), stale: true };
    expect(polling.delay(stale, 0, null, undefined, 0)).toBe(3000);
    expect(polling.delay(stale, 0, null, undefined, 60000)).toBe(false);
    polling.reset(60000);
    expect(polling.delay(stale, 0, null, undefined, 60000)).toBe(3000);
    const initial = new V02LatestProfilePolling();
    expect(initial.delay(null, 0, null, undefined, 0)).toBe(false);
    expect(initial.delay(null, 0, null, 0, 0)).toBe(3000);
    expect(initial.delay(null, 0, null, 0, 60000)).toBe(false);
  });
  it("stops only actual/definitive judge terminal states and reconciles uncertain local failures", () => {
    const active = v02Submission(undefined, {
      judgeStatus: "RUNNING",
      judgeResult: null,
    });
    expect(judgePollDelay(active)).toBe(3000);
    expect(judgePollDelay(active, 1)).toBe(6000);
    expect(judgePollDelay(active, 6)).toBe(30000);
    expect(judgePollDelay(v02Submission())).toBe(false);
    const local = v02Submission(undefined, {
      judgeStatus: "FAILED",
      judgeTaskId: null,
      judgeResult: null,
      judgeError: {
        code: "JUDGE_TIMEOUT",
        message: "Reconciling",
        retryable: true,
      },
    });
    expect(judgePollDelay(local)).toBe(30000);
    expect(
      judgePollDelay({
        ...local,
        judgeError: { ...local.judgeError!, retryable: false },
      }),
    ).toBe(false);
    expect(judgePollDelay({ ...local, judgeTaskId: fixtureUuid(2100) })).toBe(
      false,
    );
    expect(
      judgePollDelay(active, 0, new ApiError("SUBMISSION_NOT_FOUND", 404)),
    ).toBe(false);
  });
  it("does not share the old AI job or judge status vocabulary", () => {
    const analysis = {
      analysisId: fixtureUuid(2200),
      status: "RUNNING" as const,
      revision: 2,
      result: null,
      error: null,
    };
    expect(analysisPollDelay(analysis)).toBe(3000);
    for (const status of ["SUCCEEDED", "PARTIAL", "FAILED", "SKIPPED"] as const)
      expect(analysisPollDelay({ ...analysis, status })).toBe(false);
    const job = {
      jobId: fixtureUuid(2300),
      status: "RUNNING" as const,
      sourceFingerprint: "a".repeat(64),
      profileJobId: null,
      error: null,
      createdAt: "2026-10-07T02:30:00Z",
      updatedAt: "2026-10-07T02:30:00Z",
      finishedAt: null,
    };
    expect(profilePollDelay(job)).toBe(3000);
    expect(profilePollDelay({ ...job, status: "SUCCEEDED" })).toBe(false);
  });
  it("compares revisions within a task and accepts a new task's lower revision", () => {
    const previous = {
      analysisId: fixtureUuid(2200),
      status: "PARTIAL" as const,
      revision: 20,
      result: null,
      error: null,
    };
    expect(acceptAnalysis(previous, { ...previous, revision: 2 })).toBe(
      previous,
    );
    const retry = {
      ...previous,
      analysisId: fixtureUuid(2201),
      revision: 0,
      status: "QUEUED" as const,
    };
    expect(acceptAnalysis(previous, retry)).toBe(retry);
    const submission = v02Submission();
    expect(
      acceptSubmission(submission, { ...submission, judgeRevision: 1 }),
    ).toBe(submission);
    const newTask = {
      ...submission,
      analysisId: fixtureUuid(2201),
      analysisRevision: 0,
    };
    expect(acceptSubmission(submission, newTask)).toBe(newTask);
  });
});
describe("private caches and uncertain mutation operations", () => {
  it("supports bodyless writes and keeps their uncertain retry key", () => {
    const store = new V02OperationKeys();
    const first = store.key("a", "rebuild-profile", undefined);
    store.finish("a", "rebuild-profile", undefined, new ApiError("TIMEOUT"));
    expect(store.key("a", "rebuild-profile", undefined)).toBe(first);
    store.finish("a", "rebuild-profile", undefined);
    expect(store.key("a", "rebuild-profile", undefined)).not.toBe(first);
  });
  it("retires old tasks without rejecting a newer analysis endpoint response ahead of the projection", () => {
    const tasks = new V02AnalysisTasks();
    const old = {
      analysisId: fixtureUuid(2200),
      status: "PARTIAL" as const,
      revision: 20,
      result: null,
      error: null,
    };
    const current = {
      ...old,
      analysisId: fixtureUuid(2201),
      status: "QUEUED" as const,
      revision: 0,
    };
    tasks.project(old.analysisId);
    expect(tasks.accept(old)).toBe(old);
    expect(tasks.accept(current)).toBe(current);
    tasks.project(old.analysisId);
    expect(tasks.accept(old)).toBe(current);
    const external = { ...current, analysisId: fixtureUuid(2202) };
    tasks.project(external.analysisId);
    expect(() => tasks.accept(current)).toThrow(
      expect.objectContaining({ code: "STALE_TASK_RESPONSE" }),
    );
    expect(tasks.accept(external)).toBe(external);
  });
  it("partitions private resources by user, namespace, filters and version", () => {
    expect(
      v02Keys.resource("a", "training", { source: "EXTERNAL" }),
    ).not.toEqual(v02Keys.resource("b", "training", { source: "EXTERNAL" }));
    expect(
      v02Keys.resource("a", "training", { source: "EXTERNAL" }),
    ).not.toEqual(v02Keys.resource("a", "training", { source: "PLATFORM" }));
    const ref = v02Submission().problem.problemRef;
    if (ref.source !== "PLATFORM") throw new Error("Expected platform fixture");
    expect(v02Keys.problem("a", ref)).not.toEqual(
      v02Keys.problem("a", { ...ref, problemVersionId: fixtureUuid(7777) }),
    );
  });
  it("keeps the same key across uncertain retries but renews it after success, edits and definite errors", () => {
    const store = new V02OperationKeys();
    const body = { sourceCode: "x", languageId: "cpp17" };
    const first = store.key("a", "submission", body);
    store.finish("a", "submission", body, new ApiError("TIMEOUT"));
    expect(
      store.key("a", "submission", { languageId: "cpp17", sourceCode: "x" }),
    ).toBe(first);
    store.finish(
      "a",
      "submission",
      body,
      new ApiError("INVALID_RESPONSE", 202),
    );
    expect(store.key("a", "submission", body)).toBe(first);
    const edited = store.key("a", "submission", { ...body, sourceCode: "y" });
    expect(edited).not.toBe(first);
    const reverted = store.key("a", "submission", body);
    expect(reverted).not.toBe(first);
    store.finish("a", "submission", body);
    const next = store.key("a", "submission", body);
    expect(next).not.toBe(reverted);
    store.finish(
      "a",
      "submission",
      body,
      new ApiError("PROBLEM_VERSION_CONFLICT", 409),
    );
    expect(store.key("a", "submission", body)).not.toBe(next);
    expect(store.key("b", "submission", body)).not.toBe(next);
  });
});
