import { randomUUID } from "node:crypto";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { z } from "zod";
import { envelope, pageEnvelope } from "../../src/lib/api/schemas";
import {
  judgeVerdicts,
  languageCapabilitiesSchema,
  learningProfileJobSchema,
  learningProfileSchema,
  learningRecommendationBatchSchema,
  platformProblemDetailSchema,
  platformProblemSummarySchema,
  SOURCE_BYTE_LIMIT,
  submissionAnalysisViewSchema,
  submissionSourceSchema,
  submissionViewSchema,
  trainingRecordSchema,
  type SubmissionView,
} from "../../src/lib/api/v02-schemas";
import {
  v02ExternalProblem,
  v02Problems,
  v02SourceCode,
} from "../../src/lib/demo/v02-fixtures";
import { test, expect, configureUpstream } from "./fixtures";

// This suite crosses the actual static frontend proxy into the isolated HTTP
// fixture. It verifies the documented JSON contract, never a live backend.
const origin = "http://127.0.0.1:3100";
const api = `${origin}/api/v1`;
const problemRef = v02Problems[0].problemRef;
const writeHeaders = (key = randomUUID()) => ({
  Origin: origin,
  "Idempotency-Key": key,
});

async function data<T>(response: APIResponse, schema: z.ZodType<T>) {
  expect(response.ok(), `${response.status()} ${response.url()}`).toBe(true);
  return envelope(schema).parse(await response.json()).data;
}

async function createSubmission(
  request: APIRequestContext,
  sourceCode = v02SourceCode,
  key = randomUUID(),
) {
  return request.post(`${api}/submissions`, {
    headers: writeHeaders(key),
    data: { problemRef, languageId: "cpp17", sourceCode },
  });
}

async function judged(request: APIRequestContext, submissionId: string) {
  let latest: SubmissionView | undefined;
  await expect
    .poll(async () => {
      latest = await data(
        await request.get(`${api}/submissions/${submissionId}`),
        submissionViewSchema,
      );
      return latest.judgeStatus;
    })
    .toMatch(/^(COMPLETED|FAILED|CANCELLED)$/);
  return latest!;
}

async function analysis(request: APIRequestContext, submissionId: string) {
  let latest: z.infer<typeof submissionAnalysisViewSchema> | undefined;
  await expect
    .poll(async () => {
      latest = await data(
        await request.get(`${api}/submissions/${submissionId}/analysis`),
        submissionAnalysisViewSchema,
      );
      return latest.status;
    })
    .toMatch(/^(SUCCEEDED|PARTIAL|FAILED|SKIPPED|NOT_REQUESTED)$/);
  return latest!;
}

test.beforeEach(() => configureUpstream());

test("V0.2: published bank, immutable history and compiler capabilities preserve opaque IDs", async ({
  request,
}) => {
  const bank = pageEnvelope(platformProblemSummarySchema).parse(
    await (await request.get(`${api}/platform-problems`)).json(),
  );
  expect(bank.data.length).toBeGreaterThan(0);
  expect(bank.data.every((problem) => problem.status === "PUBLISHED")).toBe(
    true,
  );
  expect(bank.data.map((problem) => problem.problemRef.problemId)).toContain(
    "9007199254741993",
  );
  expect(bank.data.some((problem) => problem.difficulty === null)).toBe(true);
  expect(bank.data.some((problem) => problem.status !== "PUBLISHED")).toBe(
    false,
  );
  const withdrawn = v02Problems[2].problemRef;
  const historical = await data(
    await request.get(
      `${api}/platform-problems/${withdrawn.problemId}/versions/${withdrawn.problemVersionId}`,
    ),
    platformProblemDetailSchema,
  );
  expect(historical.problemRef).toEqual(withdrawn);
  expect(historical.status).toBe("WITHDRAWN");
  const capabilities = await data(
    await request.get(`${api}/judge-languages`),
    languageCapabilitiesSchema,
  );
  expect(
    capabilities.languages.map((language) => language.languageId),
  ).toContain("cpp17");
  expect(capabilities.capabilityVersion).toMatch(/^[a-f0-9]{64}$/);
  expect(
    (await request.get(`${api}/platform-problems?status=DRAFT`)).status(),
  ).toBeGreaterThanOrEqual(400);
});

for (const verdict of judgeVerdicts) {
  test(`V0.2: ${verdict} remains a documented judge result independent of static analysis`, async ({
    request,
  }) => {
    await configureUpstream({ v02JudgeVerdict: verdict });
    const created = await data(
      await createSubmission(request),
      submissionViewSchema,
    );
    const result = await judged(request, created.submissionId);
    expect(result.judgeResult?.verdict).toBe(verdict);
    expect(result.judgeStatus).toBe(verdict === "IE" ? "FAILED" : "COMPLETED");
    if (verdict === "IE") expect(result.judgeError).not.toBeNull();
    if (verdict === "CE") expect(result.judgeResult?.compileLog).not.toBeNull();
    const records = pageEnvelope(trainingRecordSchema).parse(
      await (
        await request.get(`${api}/me/training-records?source=PLATFORM`)
      ).json(),
    );
    const record = records.data.find(
      (item) => item.lastSubmissionId === created.submissionId,
    );
    expect(record).toBeDefined();
    expect(record?.status).toBe(verdict === "AC" ? "COMPLETED" : "IN_PROGRESS");
    expect(record?.acceptedSubmissionCount).toBe(verdict === "AC" ? 1 : 0);
  });
}

for (const judgeStatus of ["FAILED", "CANCELLED"] as const) {
  test(`V0.2: local ${judgeStatus} preserves submission history without fabricating a verdict`, async ({
    request,
  }) => {
    await configureUpstream({
      v02JudgeStatus: judgeStatus,
      v02JudgeLocalFailure: judgeStatus === "FAILED",
      v02JudgeRetryable: judgeStatus === "FAILED",
    });
    const created = await data(
      await createSubmission(request),
      submissionViewSchema,
    );
    const result = await judged(request, created.submissionId);
    expect(result.judgeResult).toBeNull();
    if (judgeStatus === "FAILED") {
      expect(result.judgeTaskId).toBeNull();
      expect(result.judgeError?.retryable).toBe(true);
    }
    const listed = pageEnvelope(submissionViewSchema).parse(
      await (await request.get(`${api}/submissions`)).json(),
    );
    expect(listed.data.map((item) => item.submissionId)).toContain(
      created.submissionId,
    );
  });
}

for (const state of ["PARTIAL", "FAILED", "SKIPPED"] as const) {
  test(`V0.2: ${state} analysis retries under a new task identity while AC stays completed`, async ({
    request,
  }) => {
    await configureUpstream({
      v02AnalysisStatus: state,
      v02AnalysisRetryStatus: "SUCCEEDED",
    });
    const created = await data(
      await createSubmission(request),
      submissionViewSchema,
    );
    const judge = await judged(request, created.submissionId);
    expect(judge.judgeResult?.verdict).toBe("AC");
    const old = await analysis(request, created.submissionId);
    expect(old.status).toBe(state);
    if (state === "PARTIAL") {
      expect(old.result).not.toBeNull();
      expect(old.result?.tools.some((tool) => tool.status === "FAILED")).toBe(
        true,
      );
    }
    const retryKey = randomUUID();
    const retry = await request.post(
      `${api}/submissions/${created.submissionId}/analysis/retry`,
      { headers: writeHeaders(retryKey) },
    );
    expect([200, 202]).toContain(retry.status());
    const queued = await data(retry, submissionAnalysisViewSchema);
    expect(queued.analysisId).not.toBe(old.analysisId);
    const replay = await data(
      await request.post(
        `${api}/submissions/${created.submissionId}/analysis/retry`,
        {
          headers: writeHeaders(retryKey),
        },
      ),
      submissionAnalysisViewSchema,
    );
    expect(replay.analysisId).toBe(queued.analysisId);
    const completed = await analysis(request, created.submissionId);
    expect(completed.status).toBe("SUCCEEDED");
    expect(completed.result?.analysisId).toBe(queued.analysisId);
    expect(
      (await judged(request, created.submissionId)).judgeResult?.verdict,
    ).toBe("AC");
    expect(completed.result?.synthesis).toEqual({
      status: "NOT_REQUESTED",
      provider: null,
      model: null,
      promptVersion: null,
      content: null,
      error: null,
    });
  });
}

test("V0.2: unmodified UTF-8 source is private and byte limits differ from character limits", async ({
  request,
}) => {
  const source = `  // 非ASCII源码\n${v02SourceCode}\n  `;
  const created = await data(
    await createSubmission(request, source),
    submissionViewSchema,
  );
  const response = await request.get(
    `${api}/submissions/${created.submissionId}/source`,
  );
  expect(response.headers()["cache-control"]).toMatch(/private/);
  expect(response.headers()["cache-control"]).toMatch(/no-store/);
  expect((await data(response, submissionSourceSchema)).sourceCode).toBe(
    source,
  );
  const oversize = "中".repeat(Math.floor(SOURCE_BYTE_LIMIT / 3) + 1);
  expect(oversize.length).toBeLessThan(SOURCE_BYTE_LIMIT);
  const tooLarge = await createSubmission(request, oversize);
  expect(tooLarge.status()).toBe(413);
  expect((await tooLarge.json()).error.code).toBe("SOURCE_TOO_LARGE");
  expect((await createSubmission(request, " \n\t ")).status()).toBe(400);
  const absent = await request.get(
    `${api}/submissions/9007199254749999/source`,
  );
  expect(absent.status()).toBe(404);
  expect((await absent.json()).error.code).toBe("SUBMISSION_NOT_FOUND");
});

test("V0.2: source-changing reuse of an idempotency key conflicts, exact replay does not duplicate", async ({
  request,
}) => {
  const key = randomUUID();
  const created = await data(
    await createSubmission(request, v02SourceCode, key),
    submissionViewSchema,
  );
  const response = await createSubmission(request, v02SourceCode, key);
  expect(response.status()).toBe(200);
  expect((await data(response, submissionViewSchema)).submissionId).toBe(
    created.submissionId,
  );
  const conflict = await createSubmission(
    request,
    `${v02SourceCode}\n// changed`,
    key,
  );
  expect(conflict.status()).toBe(409);
  expect((await conflict.json()).error.code).toBe("IDEMPOTENCY_CONFLICT");
  const listed = pageEnvelope(submissionViewSchema).parse(
    await (
      await request.get(`${api}/submissions?problemId=${problemRef.problemId}`)
    ).json(),
  );
  expect(
    listed.data.filter((item) => item.submissionId === created.submissionId),
  ).toHaveLength(1);
});

test("V0.2: local and external equal numeric problem IDs remain separate plans, navigation is not completion", async ({
  request,
}) => {
  await configureUpstream({ noAccounts: true });
  const local = await data(
    await request.post(`${api}/me/training-records`, {
      headers: writeHeaders(),
      data: { problemRef },
    }),
    trainingRecordSchema,
  );
  const external = await data(
    await request.post(`${api}/me/training-records`, {
      headers: writeHeaders(),
      data: { problemRef: v02ExternalProblem.problemRef },
    }),
    trainingRecordSchema,
  );
  expect(local.problem.problemRef.problemId).toBe(
    external.problem.problemRef.problemId,
  );
  expect(local.trainingRecordId).not.toBe(external.trainingRecordId);
  expect(local.status).toBe("PLANNED");
  expect(external.status).toBe("PLANNED");
  const duplicate = await request.post(`${api}/me/training-records`, {
    headers: writeHeaders(),
    data: { problemRef: v02ExternalProblem.problemRef },
  });
  expect(duplicate.status()).toBe(200);
  expect((await data(duplicate, trainingRecordSchema)).trainingRecordId).toBe(
    external.trainingRecordId,
  );
  const externalPage = pageEnvelope(trainingRecordSchema).parse(
    await (
      await request.get(
        `${api}/me/training-records?source=EXTERNAL&status=PLANNED`,
      )
    ).json(),
  );
  expect(
    externalPage.data.every(
      (record) => record.problem.problemRef.source === "EXTERNAL",
    ),
  ).toBe(true);
  expect(
    externalPage.data.some(
      (record) => record.trainingRecordId === external.trainingRecordId,
    ),
  ).toBe(true);
  const ranged = pageEnvelope(trainingRecordSchema).parse(
    await (
      await request.get(
        `${api}/me/training-records?from=2026-01-01T00%3A00%3A00Z`,
      )
    ).json(),
  );
  expect(
    ranged.data.some(
      (record) => record.trainingRecordId === external.trainingRecordId,
    ),
  ).toBe(false);
  const fakeLocal = await request.post(`${api}/submissions`, {
    headers: writeHeaders(),
    data: {
      problemRef: v02ExternalProblem.problemRef,
      languageId: "cpp17",
      sourceCode: v02SourceCode,
    },
  });
  expect(fakeLocal.status()).toBe(400);
});

test("V0.2: an uncertain accepted submission recovers with the same key exactly once", async ({
  request,
}) => {
  await configureUpstream({ v02LoseResponse: true });
  const key = randomUUID();
  const lost = await createSubmission(request, v02SourceCode, key).catch(
    () => null,
  );
  expect(lost === null || !lost.ok()).toBe(true);
  const replay = await createSubmission(request, v02SourceCode, key);
  expect(replay.status()).toBe(200);
  const recovered = await data(replay, submissionViewSchema);
  const listed = pageEnvelope(submissionViewSchema).parse(
    await (await request.get(`${api}/submissions`)).json(),
  );
  expect(
    listed.data.filter((item) => item.submissionId === recovered.submissionId),
  ).toHaveLength(1);
});

test("V0.2: another user's source is indistinguishable from a missing submission", async ({
  request,
}) => {
  const created = await data(
    await createSubmission(request),
    submissionViewSchema,
  );
  await configureUpstream({ publicId: randomUUID() }, true);
  const forbidden = await request.get(
    `${api}/submissions/${created.submissionId}/source`,
  );
  const absent = await request.get(
    `${api}/submissions/9007199254749999/source`,
  );
  expect(forbidden.status()).toBe(404);
  expect(absent.status()).toBe(404);
  expect((await forbidden.json()).error.code).toBe(
    (await absent.json()).error.code,
  );
});

test("V0.2: authenticated nonstudents can read the bank but cannot submit", async ({
  request,
}) => {
  await configureUpstream({ roles: ["GUEST"] });
  expect((await request.get(`${api}/platform-problems`)).status()).toBe(200);
  const response = await createSubmission(request);
  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe("ROLE_REQUIRED");
});

test("V0.2: all four learning windows and frozen snapshots remain available without a CF binding", async ({
  request,
}) => {
  await configureUpstream({ noAccounts: true });
  for (const window of ["7D", "30D", "365D", "ALL"] as const) {
    const latest = await data(
      await request.get(`${api}/me/learning-profile/latest?window=${window}`),
      learningProfileSchema.nullable(),
    );
    expect(latest).not.toBeNull();
    expect(latest?.window).toBe(window);
    const history = pageEnvelope(learningProfileSchema).parse(
      await (
        await request.get(`${api}/me/learning-profile/history?window=${window}`)
      ).json(),
    );
    expect(history.data.map((profile) => profile.snapshotId)).toContain(
      latest!.snapshotId,
    );
    const snapshot = await data(
      await request.get(`${api}/me/learning-profile/${latest!.snapshotId}`),
      learningProfileSchema,
    );
    expect(snapshot.snapshotId).toBe(latest!.snapshotId);
    expect(snapshot.window).toBe(window);
    expect(snapshot.period.start === null).toBe(window === "ALL");
    expect(snapshot.sources.sourceAccountIds).toEqual([]);
    expect(snapshot.currentRating).toBeNull();
  }
  const job = await data(
    await request.post(`${api}/me/learning-profile/rebuild`, {
      headers: writeHeaders(),
    }),
    learningProfileJobSchema,
  );
  await expect
    .poll(async () => {
      const result = await data(
        await request.get(`${api}/learning-profile-jobs/${job.jobId}`),
        learningProfileJobSchema,
      );
      return result.status;
    })
    .toBe("SUCCEEDED");
});

test("V0.2: absence, successful zero evidence and stale profile are different states", async ({
  request,
}) => {
  await configureUpstream({ v02NoProfile: true });
  expect(
    await data(
      await request.get(`${api}/me/learning-profile/latest`),
      learningProfileSchema.nullable(),
    ),
  ).toBeNull();
  await configureUpstream({ zero: true, noAccounts: true });
  const zero = await data(
    await request.get(`${api}/me/learning-profile/latest`),
    learningProfileSchema,
  );
  expect(zero.summary.submissionCount).toBe(0);
  expect(zero.dimensions).toHaveLength(6);
  expect(zero.dimensions.every((dimension) => dimension.score === 0)).toBe(
    true,
  );
  expect(zero.codeQuality.analyzedSubmissionCount).toBe(0);
  await configureUpstream({ stale: true });
  expect(
    (
      await data(
        await request.get(`${api}/me/learning-profile/latest`),
        learningProfileSchema,
      )
    ).stale,
  ).toBe(true);
});

test("V0.2: all recommendation sources and modes preserve backend rank, namespace and history", async ({
  request,
}) => {
  for (const source of ["ALL", "PLATFORM", "EXTERNAL"] as const) {
    for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"] as const) {
      const batch = await data(
        await request.get(
          `${api}/me/recommendations/latest?source=${source}&mode=${mode}`,
        ),
        learningRecommendationBatchSchema,
      );
      expect(batch.source).toBe(source);
      expect(batch.mode).toBe(mode);
      if (source !== "ALL")
        expect(
          batch.recommendations.every(
            (item) => item.problem.problemRef.source === source,
          ),
        ).toBe(true);
      expect(batch.recommendations.map((item) => item.rank)).toEqual(
        batch.recommendations.map((_, index) => index + 1),
      );
      const history = pageEnvelope(learningRecommendationBatchSchema).parse(
        await (
          await request.get(
            `${api}/me/recommendations/history?source=${source}&mode=${mode}`,
          )
        ).json(),
      );
      expect(history.data.map((item) => item.batchId)).toContain(batch.batchId);
      expect(
        await data(
          await request.get(`${api}/me/recommendations/${batch.batchId}`),
          learningRecommendationBatchSchema,
        ),
      ).toEqual(batch);
    }
  }
  await configureUpstream({ emptyCandidates: true });
  const empty = await data(
    await request.get(`${api}/me/recommendations/latest`),
    learningRecommendationBatchSchema,
  );
  expect(empty.recommendations).toEqual([]);
  expect(empty.resultCount).toBe(0);
});

test("V0.2: judge and later static evidence publish distinct frozen learning snapshots", async ({
  request,
}) => {
  await configureUpstream({
    scenario: "v02-new-learner",
    v02KeepAnalysis: true,
  });
  const submitted = await data(
    await createSubmission(request),
    submissionViewSchema,
  );
  await judged(request, submitted.submissionId);
  const basic = await data(
    await request.get(`${api}/me/learning-profile/latest`),
    learningProfileSchema,
  );
  expect(basic.summary.acceptedSubmissionCount).toBe(1);
  expect(basic.sources.platformSubmissionCount).toBe(1);
  expect(basic.codeQuality.analyzedSubmissionCount).toBe(0);
  await configureUpstream({ v02KeepAnalysis: false }, true);
  expect((await analysis(request, submitted.submissionId)).status).toBe(
    "SUCCEEDED",
  );
  const enriched = await data(
    await request.get(`${api}/me/learning-profile/latest`),
    learningProfileSchema,
  );
  expect(enriched.snapshotId).not.toBe(basic.snapshotId);
  expect(enriched.summary).toEqual(basic.summary);
  expect(enriched.codeQuality.analyzedSubmissionCount).toBe(1);
  expect(enriched.sources.codeAnalysisCount).toBe(1);
  const frozen = await data(
    await request.get(`${api}/me/learning-profile/${basic.snapshotId}`),
    learningProfileSchema,
  );
  expect(frozen.codeQuality.analyzedSubmissionCount).toBe(0);
  expect(frozen.summary).toEqual(basic.summary);
});

test("V0.2: unavailable analysis does not block accepted judgment or legacy CF reads", async ({
  request,
}) => {
  await configureUpstream({ v02AnalysisUnavailable: true });
  const legacy = (await (
    await request.get(`${api}/me/analysis/latest?window=ALL`)
  ).json()) as { data: { snapshotId: string; summary: unknown } | null };
  const submitted = await data(
    await createSubmission(request),
    submissionViewSchema,
  );
  expect(
    (await judged(request, submitted.submissionId)).judgeResult?.verdict,
  ).toBe("AC");
  expect((await analysis(request, submitted.submissionId)).status).toBe(
    "SKIPPED",
  );
  const reread = await request.get(`${api}/me/analysis/latest?window=ALL`);
  expect(reread.status()).toBe(200);
  const current = (await reread.json()) as typeof legacy;
  expect(current.data?.snapshotId).toBe(legacy.data?.snapshotId);
  expect(current.data?.summary).toEqual(legacy.data?.summary);
});

test("V0.2: accepted queued judge work resumes without a second submission write", async ({
  request,
}) => {
  await configureUpstream({ v02KeepJudge: true });
  const submitted = await data(
    await createSubmission(request),
    submissionViewSchema,
  );
  for (let index = 0; index < 3; index++) {
    const active = await data(
      await request.get(`${api}/submissions/${submitted.submissionId}`),
      submissionViewSchema,
    );
    expect(["QUEUED", "DISPATCHING", "RUNNING"]).toContain(active.judgeStatus);
    expect(active.judgeResult).toBeNull();
  }
  await configureUpstream({ v02KeepJudge: false }, true);
  expect(
    (await judged(request, submitted.submissionId)).judgeResult?.verdict,
  ).toBe("AC");
  const listed = pageEnvelope(submissionViewSchema).parse(
    await (await request.get(`${api}/submissions`)).json(),
  );
  expect(
    listed.data.filter((item) => item.submissionId === submitted.submissionId),
  ).toHaveLength(1);
});
