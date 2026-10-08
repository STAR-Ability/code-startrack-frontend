import { afterEach, describe, expect, it, vi } from "vitest";
import { v02 } from "./v02";
import { fixtureUuid, demoUser } from "@/lib/demo/fixtures";
import {
  v02Problems,
  v02Languages,
  v02Submission,
  v02Analysis,
  v02LearningProfile,
  v02RecommendationBatch,
  v02SourceCode,
} from "@/lib/demo/v02-fixtures";
const key = fixtureUuid(9999);
afterEach(() => vi.unstubAllGlobals());
function response(data: unknown, paginated = false) {
  const fetch = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          data,
          ...(paginated
            ? {
                meta: {
                  page: 1,
                  pageSize: 20,
                  total: Array.isArray(data) ? data.length : 0,
                  hasNext: false,
                },
              }
            : {}),
          requestId: key,
        }),
      ),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
describe("V0.2 exact public API requests", () => {
  it("uses public problem/version/language endpoints and opaque IDs", async () => {
    let fetch = response([v02Problems[0]], true);
    await v02.problems({
      q: " sum ",
      minDifficulty: 800,
      maxDifficulty: 1200,
      page: 1,
    });
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/platform-problems?status=PUBLISHED&page=1&q=sum&minDifficulty=800&maxDifficulty=1200",
    );
    fetch = response(v02Problems[0]);
    await v02.problem(v02Problems[0].problemRef.problemId);
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/v1/platform-problems/${v02Problems[0].problemRef.problemId}`,
    );
    await v02.problemVersion(
      v02Problems[0].problemRef.problemId,
      v02Problems[0].problemRef.problemVersionId,
    );
    expect(fetch.mock.calls[1][0]).toBe(
      `/api/v1/platform-problems/${v02Problems[0].problemRef.problemId}/versions/${v02Problems[0].problemRef.problemVersionId}`,
    );
    fetch = response(v02Languages);
    await v02.languages();
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/judge-languages");
  });
  it("sends original source and idempotency keys and keeps retry endpoints bodyless", async () => {
    const fetch = response(v02Submission());
    const body = {
      problemRef: v02Problems[0].problemRef,
      languageId: "cpp17",
      sourceCode: `  ${v02SourceCode}\n`,
    };
    await v02.createSubmission(body, key);
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/submissions");
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Idempotency-Key": key },
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(body);
    const retryFetch = response({
      analysisId: fixtureUuid(2200),
      status: "QUEUED",
      revision: 0,
      result: null,
      error: null,
    });
    await v02.retryAnalysis(v02Submission().submissionId, key);
    expect(retryFetch.mock.calls).toHaveLength(1);
    expect(retryFetch.mock.calls[0][0]).toBe(
      `/api/v1/submissions/${v02Submission().submissionId}/analysis/retry`,
    );
    expect(retryFetch.mock.calls[0][1]).not.toHaveProperty("body");
    expect(retryFetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(key);
    const poll = response({
      analysisId: fixtureUuid(2200),
      status: "PARTIAL",
      revision: 2,
      result: v02Analysis(),
      error: null,
    });
    await v02.submissionAnalysis(v02Submission().submissionId);
    expect(poll.mock.calls[0][0]).toBe(
      `/api/v1/submissions/${v02Submission().submissionId}/analysis`,
    );
  });
  it("uses independent new learning paths with identity/window validation", async () => {
    let fetch = response(v02LearningProfile());
    await v02.learningProfile(demoUser.publicId);
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/me/learning-profile/latest?window=ALL",
    );
    response(v02LearningProfile());
    await expect(v02.learningProfile(fixtureUuid(7777))).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    fetch = response(null);
    expect(await v02.learningProfile(demoUser.publicId)).toBeNull();
    fetch = response([], true);
    await v02.learningHistory(demoUser.publicId, "30D", {
      page: 2,
      pageSize: 10,
    });
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/me/learning-profile/history?window=30D&page=2&pageSize=10",
    );
    fetch = response({
      jobId: key,
      status: "QUEUED",
      sourceFingerprint: "a".repeat(64),
      profileJobId: null,
      error: null,
      createdAt: v02LearningProfile().createdAt,
      updatedAt: v02LearningProfile().createdAt,
      finishedAt: null,
    });
    await v02.rebuildProfile(key);
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/me/learning-profile/rebuild");
    expect(fetch.mock.calls[0][1]).not.toHaveProperty("body");
    await v02.profileJob(key);
    expect(fetch.mock.calls[1][0]).toBe(`/api/v1/learning-profile-jobs/${key}`);
  });
  it("never substitutes CF/old recommendation paths or invents history filters", async () => {
    let fetch = response(v02RecommendationBatch());
    await v02.recommendations();
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/me/recommendations/latest?source=ALL&mode=HYBRID",
    );
    await v02.generateRecommendations(
      { source: "ALL", mode: "HYBRID", limit: 10 },
      key,
    );
    expect(fetch.mock.calls[1][0]).toBe("/api/v1/me/recommendations/generate");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
      source: "ALL",
      mode: "HYBRID",
      limit: 10,
    });
    response(v02RecommendationBatch());
    await expect(v02.recommendations("EXTERNAL")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    fetch = response([], true);
    await v02.recommendationHistory({ page: 1 });
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/me/recommendations/history?page=1",
    );
  });
  it("rejects undeclared or malformed writes before the network boundary", async () => {
    const fetch = response(v02Submission());
    await expect(
      v02.createSubmission(
        {
          problemRef: v02Problems[0].problemRef,
          languageId: "cpp17",
          sourceCode: "   ",
        },
        key,
      ),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(
      v02.createSubmission(
        {
          problemRef: v02Problems[0].problemRef,
          languageId: "cpp17",
          sourceCode: "星".repeat(90000),
        },
        key,
      ),
    ).rejects.toMatchObject({ code: "SOURCE_TOO_LARGE" });
    await expect(
      v02.generateRecommendations({ limit: 51 }, key),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(() => v02.rebuildProfile("not-a-uuid")).toThrow();
    expect(() =>
      v02.importProblems(
        {
          source: "OJ_LAB",
          repositoryUrl: "https://github.com/oj-lab/problem-packages",
          revision: "a".repeat(40),
          packagePaths: ["problems/../secret"],
        },
        key,
      ),
    ).toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects mismatched detail/source/analysis identities", async () => {
    response(v02Problems[0]);
    await expect(v02.problem("123")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    response(v02Submission());
    await expect(v02.submission("123")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    response({
      submissionId: "123",
      sourceCode: v02SourceCode,
      sourceSha256: "a".repeat(64),
      languageId: "cpp17",
    });
    await expect(
      v02.submissionSource(v02Submission().submissionId),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    response({
      analysisId: fixtureUuid(2200),
      status: "SUCCEEDED",
      revision: 3,
      result: v02Analysis("123"),
      error: null,
    });
    await expect(
      v02.submissionAnalysis(v02Submission().submissionId),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("keeps training attribution at the exact new endpoint and submits both source identities", async () => {
    const problem = v02Problems[0];
    const record = {
      trainingRecordId: fixtureUuid(2500),
      problem,
      status: "PLANNED",
      recommendationBatchId: fixtureUuid(2402),
      firstSubmittedAt: null,
      lastSubmittedAt: null,
      attemptCount: 0,
      acceptedSubmissionCount: 0,
      lastSubmissionId: null,
      completedAt: null,
      createdAt: problem.updatedAt,
      updatedAt: problem.updatedAt,
    };
    let fetch = response(record);
    await v02.createTrainingRecord(
      {
        problemRef: problem.problemRef,
        recommendationBatchId: record.recommendationBatchId,
      },
      key,
    );
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/me/training-records");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      problemRef: problem.problemRef,
      recommendationBatchId: record.recommendationBatchId,
    });
    await v02.trainingRecord(record.trainingRecordId);
    expect(fetch.mock.calls[1][0]).toBe(
      `/api/v1/me/training-records/${record.trainingRecordId}`,
    );
    fetch = response([], true);
    await v02.trainingRecords({
      page: 2,
      source: "EXTERNAL",
      status: "IN_PROGRESS",
      from: "2026-10-01T00:00:00Z",
    });
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/v1/me/training-records?page=2&source=EXTERNAL&status=IN_PROGRESS&from=2026-10-01T00%3A00%3A00Z",
    );
  });
  it("implements all ADMIN signatures without direct owner-service requests", async () => {
    const problem = v02Problems[0],
      problemId = problem.problemRef.problemId;
    const body = {
      source: "OJ_LAB" as const,
      repositoryUrl: "https://github.com/oj-lab/problem-packages" as const,
      revision: "a".repeat(40),
      packagePaths: ["problems/sum"],
    };
    let fetch = response({
      requestId: key,
      revision: 0,
      status: "QUEUED",
      error: null,
      createdAt: problem.updatedAt,
      updatedAt: problem.updatedAt,
      finishedAt: null,
      importJobId: fixtureUuid(2600),
      source: body.source,
      repositoryUrl: body.repositoryUrl,
      sourceRevision: body.revision,
      packageCount: 1,
      completedPackageCount: 0,
      items: [
        {
          packagePath: body.packagePaths[0],
          status: "PENDING",
          problemId: null,
          problemVersionId: null,
          licenseStatus: "PENDING",
          validationStatus: "PENDING",
          errors: [],
        },
      ],
    });
    await v02.importProblems(body, key);
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/admin/problem-imports");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(body);
    await v02.importJob(fixtureUuid(2600));
    expect(fetch.mock.calls[1][0]).toBe(
      `/api/v1/admin/problem-imports/${fixtureUuid(2600)}`,
    );
    fetch = response(problem);
    await v02.publishProblem(
      problemId,
      { problemVersionId: problem.problemRef.problemVersionId },
      key,
    );
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/v1/admin/platform-problems/${problemId}/publish`,
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      problemVersionId: problem.problemRef.problemVersionId,
    });
    fetch = response({ ...problem, status: "DRAFT" });
    const metadata = {
      baseProblemVersionId: problem.problemRef.problemVersionId,
      tags: ["implementation"],
      difficulty: 800,
      difficultyScale: "PLATFORM_RATING" as const,
    };
    await v02.metadataVersion(problemId, metadata, key);
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/v1/admin/platform-problems/${problemId}/metadata-versions`,
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(metadata);
    fetch = response({ problemId, status: "WITHDRAWN", catalogVersion: "13" });
    await v02.withdrawProblem(problemId, { reason: "Package review" }, key);
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/v1/admin/platform-problems/${problemId}/withdraw`,
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      reason: "Package review",
    });
    for (const call of fetch.mock.calls)
      expect(call[1].headers["Idempotency-Key"]).toBe(key);
  });
});
