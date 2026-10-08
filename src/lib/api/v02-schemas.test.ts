import { describe, expect, it } from "vitest";
import { fixtureUuid } from "@/lib/demo/fixtures";
import {
  v02Problems,
  v02ExternalProblem,
  v02Submission,
  v02Analysis,
  v02LearningProfile,
  v02RecommendationBatch,
} from "@/lib/demo/v02-fixtures";
import {
  problemRefSchema,
  problemSummarySchema,
  platformProblemDetailSchema,
  submissionViewSchema,
  staticAnalysisResultSchema,
  submissionAnalysisViewSchema,
  learningProfileSchema,
  learningRecommendationBatchSchema,
  createSubmissionSchema,
  createTrainingRecordSchema,
  importProblemsSchema,
  metadataVersionSchema,
  problemFiltersSchema,
  submissionFiltersSchema,
  sourceByteLength,
  SOURCE_BYTE_LIMIT,
  problemIdentity,
  problemVersionIdentity,
} from "./v02-schemas";

describe("V0.2 data identities and required fields", () => {
  it("keeps overlapping decimal IDs separate across owners and versions", () => {
    const platform = v02Problems[0].problemRef;
    const external = v02ExternalProblem.problemRef;
    expect(problemRefSchema.parse(platform).problemId).toBe("9007199254741993");
    expect(problemIdentity(platform)).not.toBe(problemIdentity(external));
    const newer = { ...platform, problemVersionId: fixtureUuid(7777) };
    expect(problemIdentity(platform)).toBe(problemIdentity(newer));
    expect(problemVersionIdentity(platform)).not.toBe(
      problemVersionIdentity(newer),
    );
    for (const bad of [
      { ...platform, platform: "codeforces" },
      { ...platform, problemVersionId: null },
      { ...external, problemVersionId: fixtureUuid(7777) },
      { ...platform, problemId: Number(platform.problemId) },
    ])
      expect(problemRefSchema.safeParse(bad).success).toBe(false);
  });
  it("requires nullable fields and preserves independent difficulty scales", () => {
    expect(platformProblemDetailSchema.parse(v02Problems[0])).toEqual(
      v02Problems[0],
    );
    expect(
      problemSummarySchema.safeParse({
        ...v02ExternalProblem,
        difficultyScale: "PLATFORM_RATING",
      }).success,
    ).toBe(false);
    expect(
      platformProblemDetailSchema.safeParse({
        ...v02Problems[0],
        url: "https://example.invalid",
      }).success,
    ).toBe(false);
    expect(
      platformProblemDetailSchema.safeParse({
        ...v02Problems[1],
        difficulty: undefined,
      }).success,
    ).toBe(false);
    expect(
      platformProblemDetailSchema.safeParse({
        ...v02Problems[1],
        difficulty: 800,
      }).success,
    ).toBe(false);
  });
  it("accepts local recoverable dispatch failure without inventing a judge result", () => {
    const local = v02Submission(undefined, {
      judgeStatus: "FAILED",
      judgeTaskId: null,
      judgeResult: null,
      judgeError: {
        code: "JUDGE_TIMEOUT",
        message: "Awaiting reconciliation",
        retryable: true,
      },
    });
    expect(submissionViewSchema.parse(local)).toEqual(local);
    expect(
      submissionViewSchema.safeParse({
        ...local,
        judgeResult: v02Submission().judgeResult,
      }).success,
    ).toBe(false);
    expect(
      submissionViewSchema.safeParse(
        v02Submission(undefined, {
          judgeResult: { ...v02Submission().judgeResult!, verdict: "IE" },
        }),
      ).success,
    ).toBe(false);
    expect(
      submissionViewSchema.safeParse(
        v02Submission(undefined, {
          judgeResult: { ...v02Submission().judgeResult!, passedTestCount: 13 },
        }),
      ).success,
    ).toBe(false);
    expect(
      submissionViewSchema.safeParse(
        v02Submission(undefined, { judgeStatus: "SUCCESS" as never }),
      ).success,
    ).toBe(false);
  });
  it("validates tool evidence, source hashes and current synthesis release", () => {
    const result = v02Analysis();
    expect(staticAnalysisResultSchema.parse(result)).toEqual(result);
    expect(
      staticAnalysisResultSchema.safeParse({
        ...result,
        sourceSha256: "A".repeat(64),
      }).success,
    ).toBe(false);
    expect(
      staticAnalysisResultSchema.safeParse({
        ...result,
        findings: [{ ...result.findings[0], startLine: 4, endLine: 3 }],
      }).success,
    ).toBe(false);
    expect(
      staticAnalysisResultSchema.safeParse({
        ...result,
        findings: [{ ...result.findings[0], file: "/private/main.cpp" }],
      }).success,
    ).toBe(false);
    expect(
      staticAnalysisResultSchema.safeParse({
        ...result,
        synthesis: { ...result.synthesis, content: "Invented explanation" },
      }).success,
    ).toBe(false);
    expect(
      submissionAnalysisViewSchema.safeParse({
        analysisId: fixtureUuid(7777),
        status: "PARTIAL",
        revision: 2,
        result,
        error: null,
      }).success,
    ).toBe(false);
  });
  it("accepts zero and four-window learning profiles and rejects inconsistent evidence", () => {
    for (const window of ["7D", "30D", "365D", "ALL"] as const)
      for (const empty of [false, true])
        expect(
          learningProfileSchema.safeParse(v02LearningProfile(window, empty))
            .success,
        ).toBe(true);
    const profile = v02LearningProfile();
    expect(
      learningProfileSchema.safeParse({
        ...profile,
        algorithmVersion: "profile-v0.13.1",
      }).success,
    ).toBe(false);
    expect(
      learningProfileSchema.safeParse({
        ...profile,
        sources: { ...profile.sources, platformSubmissionCount: 100 },
      }).success,
    ).toBe(false);
    expect(
      learningProfileSchema.safeParse({
        ...profile,
        dimensions: profile.dimensions.slice(1),
      }).success,
    ).toBe(false);
    expect(
      learningProfileSchema.safeParse({
        ...profile,
        period: { ...profile.period, start: profile.period.end },
      }).success,
    ).toBe(false);
  });
  it("requires frozen recommendation ranks, source selection and namespaced uniqueness", () => {
    const batch = v02RecommendationBatch();
    expect(learningRecommendationBatchSchema.parse(batch)).toEqual(batch);
    expect(
      learningRecommendationBatchSchema.safeParse({ ...batch, resultCount: 0 })
        .success,
    ).toBe(false);
    expect(
      learningRecommendationBatchSchema.safeParse({
        ...batch,
        source: "PLATFORM",
      }).success,
    ).toBe(false);
    expect(
      learningRecommendationBatchSchema.safeParse({
        ...batch,
        recommendations: batch.recommendations.map((item) => ({
          ...item,
          rank: 1,
        })),
      }).success,
    ).toBe(false);
  });
});

describe("V0.2 strict request validation", () => {
  const submission = {
    problemRef: v02Problems[0].problemRef,
    languageId: "cpp17",
    sourceCode: "  int main() {}\n",
  };
  it("preserves source bytes, rejects empty/oversized UTF-8 source and external judge requests", () => {
    expect(createSubmissionSchema.parse(submission).sourceCode).toBe(
      submission.sourceCode,
    );
    expect(sourceByteLength("星轨")).toBe(6);
    expect(
      createSubmissionSchema.safeParse({
        ...submission,
        sourceCode: "星".repeat(Math.floor(SOURCE_BYTE_LIMIT / 3) + 1),
      }).success,
    ).toBe(false);
    expect(
      createSubmissionSchema.safeParse({ ...submission, sourceCode: " \n\t" })
        .success,
    ).toBe(false);
    expect(
      createSubmissionSchema.safeParse({
        ...submission,
        problemRef: v02ExternalProblem.problemRef,
      }).success,
    ).toBe(false);
    expect(
      createSubmissionSchema.safeParse({
        ...submission,
        judgeStatus: "COMPLETED",
      }).success,
    ).toBe(false);
    expect(
      createTrainingRecordSchema.safeParse({
        problemRef: v02ExternalProblem.problemRef,
      }).success,
    ).toBe(true);
    expect(
      createTrainingRecordSchema.safeParse({
        problemRef: { ...submission.problemRef, extra: true },
      }).success,
    ).toBe(false);
  });
  it("validates exact filters and normalized administrator imports", () => {
    expect(problemFiltersSchema.parse({ q: "  sum  " }).q).toBe("sum");
    expect(
      problemFiltersSchema.safeParse({
        minDifficulty: 1000,
        maxDifficulty: 800,
      }).success,
    ).toBe(false);
    expect(
      submissionFiltersSchema.safeParse({ verdict: "ACCEPTED" }).success,
    ).toBe(false);
    const body = {
      source: "OJ_LAB",
      repositoryUrl: "https://github.com/oj-lab/problem-packages",
      revision: "a".repeat(40),
      packagePaths: ["problems/sum"],
    };
    expect(importProblemsSchema.safeParse(body).success).toBe(true);
    for (const path of [
      "problems/../secret",
      "/problems/sum",
      "problems//sum",
      "https://example.invalid",
      "problems/./sum",
      "problems/sum/",
    ])
      expect(
        importProblemsSchema.safeParse({ ...body, packagePaths: [path] })
          .success,
      ).toBe(false);
    expect(
      importProblemsSchema.safeParse({
        ...body,
        packagePaths: ["problems/sum", "problems/sum"],
      }).success,
    ).toBe(false);
    expect(
      metadataVersionSchema.safeParse({
        baseProblemVersionId: fixtureUuid(2000),
        tags: [],
        difficulty: null,
        difficultyScale: "UNRATED",
      }).success,
    ).toBe(true);
    expect(
      metadataVersionSchema.safeParse({
        baseProblemVersionId: fixtureUuid(2000),
        tags: ["math", "math"],
        difficulty: 800,
        difficultyScale: "PLATFORM_RATING",
      }).success,
    ).toBe(false);
  });
});
