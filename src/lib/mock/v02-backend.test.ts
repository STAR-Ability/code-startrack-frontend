// @vitest-environment node
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMockBackend } from "./backend.mjs";
import { demoAccounts, fixtureUuid } from "../demo/fixtures";
import {
  v02Analysis,
  v02ExternalProblem,
  v02Languages,
  v02LearningProfile,
  v02Problems,
  v02RecommendationBatch,
  v02SourceCode,
  v02Submission,
  v02UnsafeStatement,
} from "../demo/v02-fixtures";
import {
  importJobSchema,
  languageCapabilitiesSchema,
  learningProfileJobSchema,
  learningProfileSchema,
  learningRecommendationBatchSchema,
  platformProblemDetailSchema,
  platformProblemSummarySchema,
  staticAnalysisResultSchema,
  submissionAnalysisViewSchema,
  submissionSourceSchema,
  submissionViewSchema,
  trainingRecordSchema,
} from "../api/v02-schemas";

const server = createMockBackend();
let base: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
async function control(body: Record<string, unknown> = {}) {
  const response = await fetch(`${base}/__control`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(200);
}
beforeEach(() => control());
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  expect(response.headers.get("X-codeStartrack-Mock")).toBe("true");
  return { response, payload: await response.json() };
}
const localRef = v02Problems[0].problemRef;
const input = (sourceCode = v02SourceCode) => ({
  problemRef: localRef,
  languageId: "cpp17",
  sourceCode,
});
async function createSubmission(config: Record<string, unknown> = {}) {
  await control({ scenario: "v02-new-learner", ...config });
  const result = await call("/submissions", "POST", input(), fixtureUuid(4000));
  expect(result.response.status).toBe(202);
  return submissionViewSchema.parse(result.payload.data);
}
async function finishJudge(id: string) {
  let result;
  for (let index = 0; index < 3; index++)
    result = await call(`/submissions/${id}`);
  return submissionViewSchema.parse(result!.payload.data);
}

describe("V0.2 public synthetic fixtures", () => {
  it("matches exact public DTOs, owner namespaces and explicit null evidence", () => {
    v02Problems.forEach((item) =>
      expect(platformProblemDetailSchema.parse(item)).toEqual(item),
    );
    expect(languageCapabilitiesSchema.parse(v02Languages)).toEqual(
      v02Languages,
    );
    expect(submissionViewSchema.parse(v02Submission())).toEqual(
      v02Submission(),
    );
    expect(staticAnalysisResultSchema.parse(v02Analysis())).toEqual(
      v02Analysis(),
    );
    expect(
      staticAnalysisResultSchema
        .parse(v02Analysis(undefined, undefined, true))
        .tools.some((item) => item.status === "FAILED"),
    ).toBe(true);
    for (const window of ["7D", "30D", "365D", "ALL"] as const)
      for (const empty of [false, true])
        expect(
          learningProfileSchema.safeParse(v02LearningProfile(window, empty))
            .success,
        ).toBe(true);
    for (const source of ["ALL", "PLATFORM", "EXTERNAL"] as const)
      for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"] as const)
        expect(
          learningRecommendationBatchSchema.safeParse(
            v02RecommendationBatch(source, mode),
          ).success,
        ).toBe(true);
    expect(v02ExternalProblem.problemRef.problemId).toBe(localRef.problemId);
    expect(v02ExternalProblem.problemRef.platform).not.toBe(localRef.platform);
  });
});

describe("V0.2 authenticated HTTP service", () => {
  it("filters a single catalog snapshot before pagination and preserves unmodified detail", async () => {
    const all = await call("/platform-problems?pageSize=1");
    expect(all.payload.meta).toEqual({
      page: 1,
      pageSize: 1,
      total: 2,
      hasNext: true,
    });
    expect(
      platformProblemSummarySchema.parse(all.payload.data[0]).problemRef,
    ).toEqual(localRef);
    const filtered = await call(
      "/platform-problems?q=%20sum%20&tag=implementation&minDifficulty=800&maxDifficulty=800",
    );
    expect(filtered.payload.meta.total).toBe(1);
    expect(
      (await call("/platform-problems?tag=%20implementation%20")).payload.meta
        .total,
    ).toBe(0);
    expect(
      (await call("/platform-problems?minDifficulty=1")).payload.meta.total,
    ).toBe(1);
    expect((await call("/platform-problems?page=100")).payload.data).toEqual(
      [],
    );
    const detail = await call(`/platform-problems/${localRef.problemId}`);
    expect(platformProblemDetailSchema.parse(detail.payload.data)).toEqual(
      v02Problems[0],
    );
    const languages = await call("/judge-languages");
    expect(
      languageCapabilitiesSchema.parse(languages.payload.data).languages[0]
        .languageId,
    ).toBe("cpp17");
  });

  it("allows every logged-in role to browse while personal resources require STUDENT", async () => {
    await control({ roles: ["COACH"] });
    expect((await call("/platform-problems")).response.status).toBe(200);
    expect((await call("/judge-languages")).response.status).toBe(200);
    const denied = await call("/submissions");
    expect(denied.response.status).toBe(403);
    expect(denied.payload.error.code).toBe("ROLE_REQUIRED");
    await control({ roles: ["ADMIN"] });
    expect((await call("/me/learning-profile/latest")).response.status).toBe(
      403,
    );
    await control({ loggedOut: true });
    expect((await call("/platform-problems")).payload.error.code).toBe(
      "SESSION_EXPIRED",
    );
  });

  it("serves readable default statements and explicit adversarial security evidence", async () => {
    const path = `/platform-problems/${localRef.problemId}`;
    const normal = platformProblemDetailSchema.parse(
      (await call(path)).payload.data,
    );
    expect(normal.statement.content).not.toMatch(/<script|javascript:/i);
    expect(normal.statement.content).toContain(
      "Read two integers and print their sum.",
    );
    await control({ scenario: "v02-unsafe-statement" });
    const adversarial = platformProblemDetailSchema.parse(
      (await call(path)).payload.data,
    );
    expect(adversarial.statement.content).toBe(v02UnsafeStatement);
    expect(adversarial.statement.content).toContain(
      "<script>alert('unsafe fixture')</script>",
    );
    expect(adversarial.statement.content).toContain(
      "[Unsafe link](javascript:alert(1))",
    );
    await control({ preserveCalls: true, v02UnsafeStatement: false });
    expect((await call(path)).payload.data.statement.content).toBe(
      normal.statement.content,
    );
  });

  it("completes the pure-platform loop before independent analysis, with byte-exact private source", async () => {
    const sourceCode = `  ${v02SourceCode}\n// 中文🙂\r\n`;
    await control({ scenario: "v02-new-learner" });
    const created = await call(
      "/submissions",
      "POST",
      input(sourceCode),
      fixtureUuid(4001),
    );
    const submission = submissionViewSchema.parse(created.payload.data);
    const source = await call(`/submissions/${submission.submissionId}/source`);
    expect(source.response.headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
    const returned = submissionSourceSchema.parse(source.payload.data);
    expect(returned.sourceCode).toBe(sourceCode);
    expect(returned.sourceSha256).toBe(
      createHash("sha256").update(sourceCode).digest("hex"),
    );
    const judged = await finishJudge(submission.submissionId);
    expect(judged.judgeResult?.verdict).toBe("AC");
    expect(judged.analysisStatus).toBe("QUEUED");
    const training = trainingRecordSchema.parse(
      (await call("/me/training-records")).payload.data[0],
    );
    expect(training).toMatchObject({
      status: "COMPLETED",
      attemptCount: 1,
      acceptedSubmissionCount: 1,
      lastSubmissionId: submission.submissionId,
    });
    const beforeAnalysis = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(beforeAnalysis.sources).toMatchObject({
      platformSubmissionCount: 1,
      externalSubmissionCount: 0,
      codeAnalysisCount: 0,
      sourceAccountIds: [],
    });
    expect(beforeAnalysis.summary).toMatchObject({
      solvedCount: 1,
      ratedSolvedCount: 0,
      unratedSolvedCount: 1,
      averageSolvedDifficulty: null,
    });
    const first = await call(
      `/submissions/${submission.submissionId}/analysis`,
    );
    expect(submissionAnalysisViewSchema.parse(first.payload.data).status).toBe(
      "RUNNING",
    );
    const second = submissionAnalysisViewSchema.parse(
      (await call(`/submissions/${submission.submissionId}/analysis`)).payload
        .data,
    );
    expect(second.status).toBe("SUCCEEDED");
    expect(second.result?.sourceSha256).toBe(returned.sourceSha256);
    expect(second.result?.synthesis.status).toBe("NOT_REQUESTED");
    const afterAnalysis = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(afterAnalysis.codeQuality.analyzedSubmissionCount).toBe(1);
    expect(afterAnalysis.snapshotId).not.toBe(beforeAnalysis.snapshotId);
    expect(afterAnalysis.dimensions).toEqual(beforeAnalysis.dimensions);
  });

  it("isolates users and preserves same-key operations without duplicated submissions", async () => {
    await control({ scenario: "v02-new-learner" });
    const key = fixtureUuid(4010);
    const first = await call("/submissions", "POST", input(), key);
    const replay = await call("/submissions", "POST", input(), key);
    expect(replay.response.status).toBe(200);
    expect(replay.payload.data).toEqual(first.payload.data);
    expect((await call("/submissions")).payload.meta.total).toBe(1);
    expect(
      (await call("/submissions", "POST", input("int main(){}"), key)).payload
        .error.code,
    ).toBe("IDEMPOTENCY_CONFLICT");
    await control({ preserveCalls: true, publicId: fixtureUuid(4999) });
    expect(
      (await call(`/submissions/${first.payload.data.submissionId}/source`))
        .payload.error.code,
    ).toBe("SUBMISSION_NOT_FOUND");
    const other = await call("/submissions", "POST", input(), key);
    expect(other.response.status).toBe(202);
    expect(other.payload.data.submissionId).not.toBe(
      first.payload.data.submissionId,
    );
    await control({ preserveCalls: true, publicId: fixtureUuid(1) });
    expect(
      (await call(`/submissions/${first.payload.data.submissionId}/source`))
        .response.status,
    ).toBe(200);
  });

  it("recovers a lost response using the original key and handles transient in-progress writes", async () => {
    await control({ scenario: "v02-new-learner", v02LoseResponse: true });
    const key = fixtureUuid(4020);
    await expect(
      fetch(`${base}/api/v1/submissions`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify(input()),
      }),
    ).rejects.toThrow();
    const recovered = await call("/submissions", "POST", input(), key);
    expect(recovered.response.status).toBe(200);
    expect((await call("/submissions")).payload.meta.total).toBe(1);
    await control({ scenario: "v02-new-learner", v02InProgress: true });
    const pending = await call("/submissions", "POST", input(), key);
    expect(pending.payload.error.code).toBe("REQUEST_IN_PROGRESS");
    expect(pending.response.headers.get("Retry-After")).toBe("2");
    expect(
      (await call("/submissions", "POST", input("int main(){}"), key)).payload
        .error.code,
    ).toBe("IDEMPOTENCY_CONFLICT");
    expect(
      (await call("/submissions", "POST", input(), key)).response.status,
    ).toBe(202);
  });

  it("enforces exact UTF-8 source limits, undeclared fields and required UUID keys", async () => {
    await control({ scenario: "v02-new-learner" });
    expect(
      (await call("/submissions", "POST", input(), undefined)).response.status,
    ).toBe(400);
    expect(
      (await call("/submissions", "POST", input(" \n\t"), fixtureUuid(4030)))
        .response.status,
    ).toBe(400);
    expect(
      (
        await call(
          "/submissions",
          "POST",
          input("🙂".repeat(65537)),
          fixtureUuid(4031),
        )
      ).payload.error.code,
    ).toBe("SOURCE_TOO_LARGE");
    expect(
      (
        await call(
          "/submissions",
          "POST",
          input("🙂".repeat(65536)),
          fixtureUuid(4032),
        )
      ).response.status,
    ).toBe(202);
    expect(
      (
        await call(
          "/submissions",
          "POST",
          { ...input(), extra: true },
          fixtureUuid(4033),
        )
      ).response.status,
    ).toBe(400);
    expect(
      (
        await call(
          "/submissions",
          "POST",
          { ...input(), problemRef: v02ExternalProblem.problemRef },
          fixtureUuid(4034),
        )
      ).payload.error.code,
    ).toBe("INVALID_PROBLEM_REF");
    const oversized = await call(
      "/submissions",
      "POST",
      input("x".repeat(2097152)),
      fixtureUuid(4035),
    );
    expect(oversized.payload.error.code).toBe("INPUT_TOO_LARGE");
  });

  it("keeps old versions readable after withdrawal and refreshes version conflicts safely", async () => {
    const historical = v02Problems[2];
    expect(
      (await call(`/platform-problems/${historical.problemRef.problemId}`))
        .response.status,
    ).toBe(404);
    const old = await call(
      `/platform-problems/${historical.problemRef.problemId}/versions/${historical.problemRef.problemVersionId}`,
    );
    expect(platformProblemDetailSchema.parse(old.payload.data).status).toBe(
      "WITHDRAWN",
    );
    expect(
      (
        await call(
          "/submissions",
          "POST",
          { ...input(), problemRef: historical.problemRef },
          fixtureUuid(4040),
        )
      ).payload.error.code,
    ).toBe("PROBLEM_NOT_SUBMITTABLE");
    const draft = v02Problems[3];
    expect(
      (
        await call(
          `/platform-problems/${draft.problemRef.problemId}/versions/${draft.problemRef.problemVersionId}`,
        )
      ).response.status,
    ).toBe(404);
    await control({ scenario: "v02-new-learner", v02VersionConflict: true });
    expect(
      (await call("/submissions", "POST", input(), fixtureUuid(4041))).payload
        .error.code,
    ).toBe("PROBLEM_VERSION_CONFLICT");
    const current = platformProblemDetailSchema.parse(
      (await call(`/platform-problems/${localRef.problemId}`)).payload.data,
    );
    expect(current.problemRef.problemVersionId).not.toBe(
      localRef.problemVersionId,
    );
    expect(
      (
        await call(
          `/platform-problems/${localRef.problemId}/versions/${localRef.problemVersionId}`,
        )
      ).response.status,
    ).toBe(200);
    expect(
      (
        await call(
          "/submissions",
          "POST",
          { ...input(), problemRef: current.problemRef },
          fixtureUuid(4042),
        )
      ).response.status,
    ).toBe(202);
  });

  it.each(["AC", "WA", "TLE", "MLE", "RE", "CE", "OLE", "IE"] as const)(
    "delivers a true %s verdict without conflating infrastructure failure",
    async (verdict) => {
      const submission = await createSubmission({ v02JudgeVerdict: verdict });
      const result = await finishJudge(submission.submissionId);
      expect(result.judgeResult?.verdict).toBe(verdict);
      expect(result.judgeStatus).toBe(
        verdict === "IE" ? "FAILED" : "COMPLETED",
      );
      const profile = learningProfileSchema.parse(
        (await call("/me/learning-profile/latest")).payload.data,
      );
      expect(profile.summary.failedSubmissionCount).toBe(
        verdict === "AC" || verdict === "IE" ? 0 : 1,
      );
      expect(profile.summary.acceptedSubmissionCount).toBe(
        verdict === "AC" ? 1 : 0,
      );
      if (verdict === "CE")
        expect(result.judgeResult).toMatchObject({
          timeMs: null,
          memoryBytes: null,
        });
    },
  );

  it("shows cancellation and local dispatch failure without a fabricated verdict, then reconciles", async () => {
    let submission = await createSubmission({ v02JudgeStatus: "CANCELLED" });
    const cancelled = await finishJudge(submission.submissionId);
    expect(cancelled).toMatchObject({
      judgeStatus: "CANCELLED",
      judgeResult: null,
    });
    expect(
      (await call("/me/learning-profile/latest")).payload.data.summary
        .failedSubmissionCount,
    ).toBe(0);
    submission = await createSubmission({ v02JudgeLocalFailure: true });
    expect(submission).toMatchObject({
      judgeStatus: "FAILED",
      judgeTaskId: null,
      judgeResult: null,
    });
    expect(submission.judgeError?.retryable).toBe(true);
    expect(
      (await call(`/submissions/${submission.submissionId}`)).payload.data
        .judgeStatus,
    ).toBe("FAILED");
    expect(
      (await call(`/submissions/${submission.submissionId}`)).payload.data
        .judgeStatus,
    ).toBe("RUNNING");
    const terminal = submissionViewSchema.parse(
      (await call(`/submissions/${submission.submissionId}`)).payload.data,
    );
    expect(terminal.judgeResult?.verdict).toBe("AC");
    expect((await call("/submissions")).payload.meta.total).toBe(1);
  });

  it("seeds analysis evidence only for completed judge results", async () => {
    await control({ scenario: "v02-all-verdicts", noAccounts: true });
    const rows = (await call("/submissions")).payload.data.map(
      (item: unknown) => submissionViewSchema.parse(item),
    );
    expect(rows).toHaveLength(10);
    const completed = rows.filter(
      (item: ReturnType<typeof submissionViewSchema.parse>) =>
        item.judgeStatus === "COMPLETED",
    );
    expect(completed).toHaveLength(7);
    for (const submission of rows) {
      const analysis = submissionAnalysisViewSchema.parse(
        (await call(`/submissions/${submission.submissionId}/analysis`)).payload
          .data,
      );
      if (submission.judgeStatus === "COMPLETED") {
        expect(analysis.status).toBe("SUCCEEDED");
        expect(analysis.result).not.toBeNull();
      } else {
        expect(submission).toMatchObject({
          analysisStatus: "NOT_REQUESTED",
          analysisId: null,
          analysisRevision: 0,
          analysisError: null,
        });
        expect(analysis).toEqual({
          analysisId: null,
          status: "NOT_REQUESTED",
          revision: 0,
          result: null,
          error: null,
        });
      }
    }
    const profile = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(profile.sources.codeAnalysisCount).toBe(completed.length);
    expect(profile.codeQuality.analyzedSubmissionCount).toBe(completed.length);
  });

  it.each(["PARTIAL", "FAILED", "SKIPPED"] as const)(
    "keeps an AC when analysis is %s and retries as a new task",
    async (status) => {
      const submission = await createSubmission({ v02AnalysisStatus: status });
      await finishJudge(submission.submissionId);
      await call(`/submissions/${submission.submissionId}/analysis`);
      const analysis = submissionAnalysisViewSchema.parse(
        (await call(`/submissions/${submission.submissionId}/analysis`)).payload
          .data,
      );
      expect(analysis.status).toBe(status);
      const profileBefore = learningProfileSchema.parse(
        (await call("/me/learning-profile/latest")).payload.data,
      );
      const retry = await call(
        `/submissions/${submission.submissionId}/analysis/retry`,
        "POST",
        undefined,
        fixtureUuid(4050),
      );
      expect(retry.response.status).toBe(202);
      expect(retry.payload.data.analysisId).not.toBe(analysis.analysisId);
      expect(retry.payload.data.result).toBeNull();
      expect(
        (await call("/me/learning-profile/latest")).payload.data.codeQuality,
      ).toEqual(profileBefore.codeQuality);
      const active = await call(
        `/submissions/${submission.submissionId}/analysis/retry`,
        "POST",
        undefined,
        fixtureUuid(4051),
      );
      expect(active.response.status).toBe(200);
      expect(active.payload.data.analysisId).toBe(
        retry.payload.data.analysisId,
      );
      await call(`/submissions/${submission.submissionId}/analysis`);
      const complete = submissionAnalysisViewSchema.parse(
        (await call(`/submissions/${submission.submissionId}/analysis`)).payload
          .data,
      );
      expect(complete.status).toBe("SUCCEEDED");
      expect(
        (await call(`/submissions/${submission.submissionId}`)).payload.data
          .judgeResult.verdict,
      ).toBe("AC");
      expect(
        (
          await call(
            `/submissions/${submission.submissionId}/analysis/retry`,
            "POST",
            undefined,
            fixtureUuid(4052),
          )
        ).payload.error.code,
      ).toBe("ANALYSIS_ALREADY_COMPLETE");
    },
  );

  it("changes dynamic capabilities during algorithm downtime while judging remains available", async () => {
    const original = (await call("/judge-languages")).payload.data;
    await control({ v02AnalysisUnavailable: true });
    const changed = languageCapabilitiesSchema.parse(
      (await call("/judge-languages")).payload.data,
    );
    expect(changed.languages[0].languageId).toBe("cpp17");
    expect(changed.languages[0].analysisSupported).toBe(false);
    expect(changed.capabilityVersion).not.toBe(original.capabilityVersion);
    const submission = await createSubmission({ v02AnalysisUnavailable: true });
    expect(
      (await finishJudge(submission.submissionId)).judgeResult?.verdict,
    ).toBe("AC");
    expect(
      (await call(`/submissions/${submission.submissionId}/analysis`)).payload
        .data.status,
    ).toBe("SKIPPED");
    expect(
      (
        await call(
          `/submissions/${submission.submissionId}/analysis/retry`,
          "POST",
          undefined,
          fixtureUuid(4060),
        )
      ).payload.error.code,
    ).toBe("ALGORITHM_UNAVAILABLE");
  });

  it("keeps all four profile snapshots frozen across asynchronous rebuild jobs", async () => {
    await control({ noAccounts: true });
    const before = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest?window=ALL")).payload.data,
    );
    const first = await call(
      "/me/learning-profile/rebuild",
      "POST",
      undefined,
      fixtureUuid(4070),
    );
    expect(first.response.status).toBe(202);
    const existing = await call(
      "/me/learning-profile/rebuild",
      "POST",
      undefined,
      fixtureUuid(4071),
    );
    expect(existing.response.status).toBe(200);
    expect(existing.payload.data.jobId).toBe(first.payload.data.jobId);
    const job = learningProfileJobSchema.parse(first.payload.data);
    expect(
      (await call(`/learning-profile-jobs/${job.jobId}`)).payload.data.status,
    ).toBe("RUNNING");
    const complete = learningProfileJobSchema.parse(
      (await call(`/learning-profile-jobs/${job.jobId}`)).payload.data,
    );
    expect(complete.status).toBe("SUCCEEDED");
    for (const window of ["7D", "30D", "365D", "ALL"]) {
      const latest = learningProfileSchema.parse(
        (await call(`/me/learning-profile/latest?window=${window}`)).payload
          .data,
      );
      expect(latest.profileJobId).toBe(complete.profileJobId);
      expect(latest.window).toBe(window);
      const history = await call(
        `/me/learning-profile/history?window=${window}`,
      );
      expect(history.payload.meta.total).toBe(2);
    }
    expect(
      (await call(`/me/learning-profile/${before.snapshotId}`)).payload.data,
    ).toEqual(before);
  });

  it("retains the highest historical rating when the current rating is absent", async () => {
    await control({ scenario: "v02-historical-rating" });
    const profile = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(profile.currentRating).toBeNull();
    expect(profile.maxRating).toBe(1600);
    expect(profile.sources.sourceAccountIds).toHaveLength(1);
  });

  it("distinguishes successful zero, no snapshot, stale evidence and failed profile jobs", async () => {
    await control({ scenario: "v02-new-learner" });
    expect((await call("/me/learning-profile/latest")).payload.data).toBeNull();
    await control({ scenario: "v02-zero", noAccounts: true });
    const zero = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(zero.summary.submissionCount).toBe(0);
    expect(zero.dimensions.every((item) => item.score === 0)).toBe(true);
    expect(zero.codeQuality.maxCyclomaticComplexity).toBeNull();
    await control({ stale: true });
    expect((await call("/me/learning-profile/latest")).payload.data.stale).toBe(
      true,
    );
    expect(
      (
        await call(
          "/me/recommendations/generate",
          "POST",
          {},
          fixtureUuid(4080),
        )
      ).payload.error.code,
    ).toBe("PROFILE_NOT_READY");
    await control({ v02ProfileJobFailed: true, noAccounts: true });
    const job = (
      await call(
        "/me/learning-profile/rebuild",
        "POST",
        undefined,
        fixtureUuid(4081),
      )
    ).payload.data;
    await call(`/learning-profile-jobs/${job.jobId}`);
    const failed = await call(`/learning-profile-jobs/${job.jobId}`);
    expect(failed.response.status).toBe(200);
    expect(failed.payload.data.status).toBe("FAILED");
    expect(failed.payload.data.error.retryable).toBe(true);
  });

  it("retains invalid source history for rebuild while keeping the derived profile stale", async () => {
    await control({ invalid: true });
    const rebuilt = await call(
      "/me/learning-profile/rebuild",
      "POST",
      undefined,
      fixtureUuid(4082),
    );
    expect(rebuilt.response.status).toBe(202);
    await call(`/learning-profile-jobs/${rebuilt.payload.data.jobId}`);
    expect(
      (await call(`/learning-profile-jobs/${rebuilt.payload.data.jobId}`))
        .payload.data.status,
    ).toBe("SUCCEEDED");
    const latest = learningProfileSchema.parse(
      (await call("/me/learning-profile/latest")).payload.data,
    );
    expect(latest.sources.sourceAccountIds).toContain(
      demoAccounts[0].accountId,
    );
    expect(latest.sources.externalSubmissionCount).toBeGreaterThan(0);
    expect(latest.stale).toBe(true);
    expect(
      (
        await call(
          "/me/recommendations/generate",
          "POST",
          {},
          fixtureUuid(4083),
        )
      ).payload.error.code,
    ).toBe("PROFILE_NOT_READY");
    await control({ scenario: "v02-new-learner" });
    await call("/oj-accounts", "POST", {
      platform: "codeforces",
      username: "SyntheticUnsynced",
    });
    expect(
      (
        await call(
          "/me/learning-profile/rebuild",
          "POST",
          undefined,
          fixtureUuid(4084),
        )
      ).payload.error.code,
    ).toBe("USER_SOURCE_NOT_READY");
  });

  it("freezes all source/mode rankings and updates completion flags without owner collisions", async () => {
    const before = learningRecommendationBatchSchema.parse(
      (await call("/me/recommendations/latest?source=ALL&mode=HYBRID")).payload
        .data,
    );
    expect(
      before.recommendations.filter(
        (item) => item.problem.problemRef.problemId === localRef.problemId,
      ),
    ).toHaveLength(2);
    for (const source of ["ALL", "PLATFORM", "EXTERNAL"])
      for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"]) {
        const latest = learningRecommendationBatchSchema.parse(
          (
            await call(
              `/me/recommendations/latest?source=${source}&mode=${mode}`,
            )
          ).payload.data,
        );
        expect(latest).toMatchObject({ source, mode });
      }
    const create = await call(
      "/submissions",
      "POST",
      input(),
      fixtureUuid(4090),
    );
    await finishJudge(create.payload.data.submissionId);
    const after = learningRecommendationBatchSchema.parse(
      (await call(`/me/recommendations/${before.batchId}`)).payload.data,
    );
    expect(
      after.recommendations.map((item) => [
        item.rank,
        item.reason,
        item.score,
        item.problem,
      ]),
    ).toEqual(
      before.recommendations.map((item) => [
        item.rank,
        item.reason,
        item.score,
        item.problem,
      ]),
    );
    expect(
      after.recommendations.find(
        (item) =>
          item.problem.problemRef.source === "PLATFORM" &&
          item.problem.problemRef.problemId === localRef.problemId,
      )?.solvedSinceGeneration,
    ).toBe(true);
    expect(
      after.recommendations.find(
        (item) => item.problem.problemRef.source === "EXTERNAL",
      )?.solvedSinceGeneration,
    ).toBe(false);
    const generated = await call(
      "/me/recommendations/generate",
      "POST",
      { source: "ALL", mode: "HYBRID", limit: 1 },
      fixtureUuid(4091),
    );
    expect(generated.response.status).toBe(201);
    expect(generated.payload.data.resultCount).toBe(1);
    expect(
      generated.payload.data.recommendations[0].problem.problemRef,
    ).not.toEqual(localRef);
    expect(
      (await call("/me/recommendations/history?source=ALL&mode=HYBRID")).payload
        .meta.total,
    ).toBe(2);
    await control({ emptyCandidates: true });
    expect(
      (await call("/me/recommendations/latest")).payload.data.recommendations,
    ).toEqual([]);
  });

  it("blocks recommendations while a previously synced CF source is queued or running", async () => {
    const accountPath = `/oj-accounts/${demoAccounts[0].accountId}`;
    const originalAccount = (await call(accountPath)).payload.data;
    expect((await call("/me/learning-profile/latest")).payload.data.stale).toBe(
      false,
    );
    const sync = await call(`${accountPath}/sync`, "POST");
    expect(sync.response.status).toBe(202);
    expect((await call(accountPath)).payload.data.lastSyncedAt).toBe(
      originalAccount.lastSyncedAt,
    );
    expect((await call("/me/learning-profile/latest")).payload.data.stale).toBe(
      true,
    );
    expect(
      (
        await call(
          "/me/recommendations/generate",
          "POST",
          {},
          fixtureUuid(4190),
        )
      ).payload.error.code,
    ).toBe("PROFILE_NOT_READY");
    expect(
      (
        await call(
          "/me/learning-profile/rebuild",
          "POST",
          undefined,
          fixtureUuid(4194),
        )
      ).payload.error.code,
    ).toBe("USER_SOURCE_NOT_READY");
    await control({ preserveCalls: true, keepRunning: true });
    expect(
      (await call(`/sync-jobs/${sync.payload.data.jobId}`)).payload.data.status,
    ).toBe("RUNNING");
    expect(
      (
        await call(
          "/me/recommendations/generate",
          "POST",
          {},
          fixtureUuid(4191),
        )
      ).payload.error.code,
    ).toBe("PROFILE_NOT_READY");
    await control({ preserveCalls: true, keepRunning: false });
    expect(
      (await call(`/sync-jobs/${sync.payload.data.jobId}`)).payload.data.status,
    ).toBe("SUCCESS");
    const rebuilt = await call(
      "/me/learning-profile/rebuild",
      "POST",
      undefined,
      fixtureUuid(4192),
    );
    await call(`/learning-profile-jobs/${rebuilt.payload.data.jobId}`);
    await call(`/learning-profile-jobs/${rebuilt.payload.data.jobId}`);
    expect((await call("/me/learning-profile/latest")).payload.data.stale).toBe(
      false,
    );
    expect(
      (
        await call(
          "/me/recommendations/generate",
          "POST",
          {},
          fixtureUuid(4193),
        )
      ).response.status,
    ).toBe(201);
  });

  it("deduplicates training plans, freezes first attribution and uses actual external sync results", async () => {
    const batch = (await call("/me/recommendations/latest")).payload.data;
    const payload = {
      problemRef: v02ExternalProblem.problemRef,
      recommendationBatchId: batch.batchId,
    };
    const first = await call(
      "/me/training-records",
      "POST",
      payload,
      fixtureUuid(4100),
    );
    expect(first.response.status).toBe(201);
    const plan = trainingRecordSchema.parse(first.payload.data);
    expect(plan.status).toBe("PLANNED");
    const otherBatch = (
      await call("/me/recommendations/latest?source=EXTERNAL")
    ).payload.data;
    const repeat = await call(
      "/me/training-records",
      "POST",
      { ...payload, recommendationBatchId: otherBatch.batchId },
      fixtureUuid(4101),
    );
    expect(repeat.response.status).toBe(200);
    expect(repeat.payload.data.trainingRecordId).toBe(plan.trainingRecordId);
    expect(repeat.payload.data.recommendationBatchId).toBe(batch.batchId);
    expect(
      (await call(`/me/training-records/${plan.trainingRecordId}`)).payload.data
        .status,
    ).toBe("PLANNED");
    expect(
      (
        await call(
          "/me/training-records?source=EXTERNAL&from=2026-10-01T00:00:00Z",
        )
      ).payload.meta.total,
    ).toBe(0);
    await control({ preserveCalls: true, v02ExternalAccepted: true });
    const completed = trainingRecordSchema.parse(
      (await call(`/me/training-records/${plan.trainingRecordId}`)).payload
        .data,
    );
    expect(completed).toMatchObject({
      status: "COMPLETED",
      attemptCount: 1,
      acceptedSubmissionCount: 1,
    });
    expect(
      (await call(`/me/training-records/${plan.trainingRecordId}`)).payload.data
        .updatedAt,
    ).toBe(completed.updatedAt);
    await control({ preserveCalls: true, v02ExternalRevoked: true });
    expect(
      (await call(`/me/training-records/${plan.trainingRecordId}`)).payload.data
        .status,
    ).toBe("IN_PROGRESS");
    expect(
      (
        await call(
          "/me/training-records",
          "POST",
          { ...payload, recommendationBatchId: fixtureUuid(999) },
          fixtureUuid(4102),
        )
      ).payload.error.code,
    ).toBe("RESOURCE_NOT_FOUND");
  });

  it("serves admin signatures with immutable metadata versions and explicit publishing", async () => {
    await control({ roles: ["ADMIN"] });
    const old = platformProblemDetailSchema.parse(
      (await call(`/platform-problems/${localRef.problemId}`)).payload.data,
    );
    const metadata = {
      baseProblemVersionId: localRef.problemVersionId,
      tags: ["math"],
      difficulty: null,
      difficultyScale: "UNRATED",
    };
    const created = await call(
      `/admin/platform-problems/${localRef.problemId}/metadata-versions`,
      "POST",
      metadata,
      fixtureUuid(4110),
    );
    expect(created.response.status).toBe(201);
    const draft = platformProblemDetailSchema.parse(created.payload.data);
    expect(draft.status).toBe("DRAFT");
    expect(
      (await call(`/platform-problems/${localRef.problemId}`)).payload.data,
    ).toEqual(old);
    const published = await call(
      `/admin/platform-problems/${localRef.problemId}/publish`,
      "POST",
      { problemVersionId: draft.problemRef.problemVersionId },
      fixtureUuid(4111),
    );
    expect(
      platformProblemDetailSchema.parse(published.payload.data).tags,
    ).toEqual(["math"]);
    const catalog = (await call("/platform-problems")).payload.data;
    expect(
      catalog.every(
        (item: { catalogVersion: string }) =>
          item.catalogVersion === published.payload.data.catalogVersion,
      ),
    ).toBe(true);
    expect(
      (
        await call(
          `/platform-problems/${localRef.problemId}/versions/${localRef.problemVersionId}`,
        )
      ).payload.data.statement,
    ).toEqual(old.statement);
    const withdrawn = await call(
      `/admin/platform-problems/${localRef.problemId}/withdraw`,
      "POST",
      { reason: "Synthetic maintenance" },
      fixtureUuid(4112),
    );
    expect(withdrawn.payload.data.status).toBe("WITHDRAWN");
    expect(
      (await call(`/platform-problems/${localRef.problemId}`)).response.status,
    ).toBe(404);
  });

  it("polls partial imports as HTTP200 with package-order validation and license rejection", async () => {
    await control({ roles: ["ADMIN"], v02ImportPartial: true });
    const input = {
      source: "OJ_LAB",
      repositoryUrl: "https://github.com/oj-lab/problem-packages",
      revision: "a".repeat(40),
      packagePaths: ["problems/sum", "problems/unlicensed"],
    };
    const imported = await call(
      "/admin/problem-imports",
      "POST",
      input,
      fixtureUuid(4120),
    );
    expect(imported.response.status).toBe(202);
    const job = importJobSchema.parse(imported.payload.data);
    await call(`/admin/problem-imports/${job.importJobId}`);
    const completed = await call(`/admin/problem-imports/${job.importJobId}`);
    expect(completed.response.status).toBe(200);
    const terminal = importJobSchema.parse(completed.payload.data);
    expect(terminal.status).toBe("PARTIAL");
    expect(terminal.items.map((item) => item.packagePath)).toEqual(
      input.packagePaths,
    );
    expect(terminal.items[1].licenseStatus).toBe("MISSING");
    expect(
      (
        await call(
          "/admin/problem-imports",
          "POST",
          { ...input, packagePaths: ["problems/../secrets"] },
          fixtureUuid(4121),
        )
      ).response.status,
    ).toBe(400);
    await control({ roles: ["ADMIN"], v02LicenseMissing: true });
    expect(
      (
        await call(
          `/admin/platform-problems/${localRef.problemId}/publish`,
          "POST",
          { problemVersionId: localRef.problemVersionId },
          fixtureUuid(4122),
        )
      ).payload.error.code,
    ).toBe("PACKAGE_LICENSE_MISSING");
  });

  it("rejects ambiguous filters, bodies on no-body operations and foreign resources", async () => {
    for (const path of [
      "/platform-problems?q=",
      "/platform-problems?minDifficulty=900&maxDifficulty=800",
      "/submissions?verdict=ACCEPTED",
      "/submissions?page=1&page=2",
      "/me/training-records?source=ALL",
      "/me/recommendations/latest?mode=OTHER",
      "/me/recommendations/latest?extra=1",
    ])
      expect((await call(path)).response.status, path).toBe(400);
    expect(
      (await call("/me/learning-profile/latest?window=BAD")).payload.error.code,
    ).toBe("INVALID_ANALYSIS_WINDOW");
    expect(
      (
        await call(
          "/me/learning-profile/rebuild",
          "POST",
          {},
          fixtureUuid(4130),
        )
      ).response.status,
    ).toBe(400);
    for (const [path, code] of [
      ["/submissions/1/source", "SUBMISSION_NOT_FOUND"],
      [`/me/training-records/${fixtureUuid(1)}`, "TRAINING_RECORD_NOT_FOUND"],
      [`/learning-profile-jobs/${fixtureUuid(1)}`, "TASK_NOT_FOUND"],
      [`/me/learning-profile/${fixtureUuid(1)}`, "RESOURCE_NOT_FOUND"],
      [`/me/recommendations/${fixtureUuid(1)}`, "RESOURCE_NOT_FOUND"],
    ])
      expect((await call(path)).payload.error.code).toBe(code);
  });
});
