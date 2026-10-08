import { z } from "zod";
import {
  idSchema,
  uuidSchema,
  instantSchema,
  summarySchema,
  dimensionCodes,
  windows,
  modes,
  reasonCodes,
  hasValidDimensionRanking,
} from "./schemas";

const count = z.number().int().nonnegative().safe();
const positive = z.number().int().positive().safe();
const numeric = z.number().finite();
const nullableNumber = numeric.nullable();
const text = z.string().min(1);
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const problemSources = ["PLATFORM", "EXTERNAL"] as const;
export const recommendationSources = ["ALL", "PLATFORM", "EXTERNAL"] as const;
export const trainingStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export const difficultyScales = [
  "CF_RATING",
  "PLATFORM_RATING",
  "UNRATED",
] as const;
export const judgeStatuses = [
  "QUEUED",
  "DISPATCHING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export const judgeVerdicts = [
  "AC",
  "WA",
  "TLE",
  "MLE",
  "RE",
  "CE",
  "OLE",
  "IE",
] as const;
export const analysisStatuses = [
  "NOT_REQUESTED",
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "PARTIAL",
  "FAILED",
  "SKIPPED",
] as const;
export const platformProblemRefSchema = z.object({
  source: z.literal("PLATFORM"),
  platform: z.literal("startrack"),
  problemId: idSchema,
  problemVersionId: uuidSchema,
});
export const externalProblemRefSchema = z.object({
  source: z.literal("EXTERNAL"),
  platform: z.literal("codeforces"),
  problemId: idSchema,
  problemVersionId: z.null(),
});
export const problemRefSchema = z.discriminatedUnion("source", [
  platformProblemRefSchema,
  externalProblemRefSchema,
]);
const problemSummaryObject = z.object({
  problemRef: problemRefSchema,
  title: z.string().nullable(),
  difficulty: positive.nullable(),
  difficultyScale: z.enum(difficultyScales),
  tags: z.array(z.string()),
  url: z.string().nullable(),
});
function validProblemSummary(value: z.infer<typeof problemSummaryObject>) {
  return (
    (value.difficultyScale === "UNRATED"
      ? value.difficulty === null
      : value.difficulty !== null) &&
    (value.problemRef.source === "PLATFORM"
      ? value.url === null && value.difficultyScale !== "CF_RATING"
      : value.difficultyScale !== "PLATFORM_RATING")
  );
}
export const problemSummarySchema = problemSummaryObject.refine(
  validProblemSummary,
  "Invalid problem owner, URL or difficulty scale",
);
const tagsSchema = z
  .array(z.string().min(1).max(128))
  .max(32)
  .refine((items) => new Set(items).size === items.length, "Duplicate tags");
const platformProblemObject = problemSummaryObject.extend({
  problemRef: platformProblemRefSchema,
  difficultyScale: z.enum(["PLATFORM_RATING", "UNRATED"]),
  tags: tagsSchema,
  url: z.null(),
  status: z.enum(["DRAFT", "PUBLISHED", "WITHDRAWN"]),
  catalogVersion: idSchema,
  timeLimitMs: positive,
  memoryLimitBytes: positive,
  languageIds: z.array(text),
  updatedAt: instantSchema,
});
export const platformProblemSummarySchema =
  platformProblemObject.refine(validProblemSummary);
export const platformProblemDetailSchema = platformProblemObject
  .extend({
    statement: z.object({
      format: z.literal("MARKDOWN"),
      content: z.string(),
      input: z.string().nullable(),
      output: z.string().nullable(),
    }),
    samples: z.array(z.object({ input: z.string(), output: z.string() })),
    license: z.object({
      spdxId: z.string().nullable(),
      notice: z.string(),
      sourceUrl: z.string(),
    }),
  })
  .refine(validProblemSummary);
export const languageCapabilitySchema = z.object({
  languageId: text,
  displayName: z.string(),
  languageFamily: text,
  compilerVersion: z.string(),
  sourceFilename: text,
  analysisSupported: z.boolean(),
});
export const languageCapabilitiesSchema = z.object({
  languages: z.array(languageCapabilitySchema),
  capabilityVersion: sha256Schema,
});
export const taskErrorSchema = z.object({
  code: text,
  message: z.string(),
  retryable: z.boolean(),
});
export const judgeResultSchema = z
  .object({
    verdict: z.enum(judgeVerdicts),
    timeMs: numeric.nonnegative().nullable(),
    memoryBytes: count.nullable(),
    passedTestCount: count,
    totalTestCount: count,
    score: nullableNumber,
    compileLog: z
      .string()
      .nullable()
      .refine(
        (value) =>
          value === null || new TextEncoder().encode(value).byteLength <= 16384,
      ),
    diagnosticCode: z.string().nullable(),
    judgedAt: instantSchema,
  })
  .refine(
    (value) => value.passedTestCount <= value.totalTestCount,
    "Invalid test counts",
  );
export const submissionViewSchema = z
  .object({
    submissionId: idSchema,
    problem: problemSummarySchema.refine(
      (value) => value.problemRef.source === "PLATFORM",
    ),
    languageId: text,
    judgeTaskId: uuidSchema.nullable(),
    judgeStatus: z.enum(judgeStatuses),
    judgeRevision: count,
    judgeResult: judgeResultSchema.nullable(),
    judgeError: taskErrorSchema.nullable(),
    analysisId: uuidSchema.nullable(),
    analysisStatus: z.enum(analysisStatuses),
    analysisRevision: count,
    analysisError: taskErrorSchema.nullable(),
    submittedAt: instantSchema,
    updatedAt: instantSchema,
  })
  .superRefine((value, ctx) => {
    const active = ["QUEUED", "DISPATCHING", "RUNNING"].includes(
      value.judgeStatus,
    );
    if (
      (active || value.judgeStatus === "COMPLETED") &&
      value.judgeError !== null
    )
      ctx.addIssue({
        code: "custom",
        message: "Active/successful judge must not have an error",
      });
    if (
      value.judgeStatus === "COMPLETED" &&
      (!value.judgeResult ||
        value.judgeResult.verdict === "IE" ||
        !value.judgeTaskId)
    )
      ctx.addIssue({
        code: "custom",
        message: "Completed judge requires a real non-IE result",
      });
    if (value.judgeStatus === "CANCELLED" && value.judgeResult !== null)
      ctx.addIssue({
        code: "custom",
        message: "Cancelled judge has no verdict",
      });
    if (
      value.judgeStatus === "FAILED" &&
      (!value.judgeError ||
        (value.judgeResult !== null &&
          (value.judgeResult.verdict !== "IE" || !value.judgeTaskId)))
    )
      ctx.addIssue({
        code: "custom",
        message: "Failed judge requires an infrastructure error",
      });
    if (active && value.judgeResult !== null)
      ctx.addIssue({ code: "custom", message: "Active judge has no result" });
  });
export const submissionSourceSchema = z.object({
  submissionId: idSchema,
  sourceCode: z.string(),
  sourceSha256: sha256Schema,
  languageId: text,
});
export const analysisMetricsSchema = z.object({
  sourceLines: count.nullable(),
  functionCount: count.nullable(),
  maxCyclomaticComplexity: numeric.nonnegative().nullable(),
  meanCyclomaticComplexity: numeric.nonnegative().nullable(),
  duplicateLines: count.nullable(),
  maintainabilityIndex: nullableNumber,
});
export const analysisFindingSchema = z
  .object({
    findingId: text,
    tool: text,
    ruleId: text,
    severity: z.enum(["INFO", "WARNING", "ERROR"]),
    category: z.enum([
      "COMPLEXITY",
      "BUG_RISK",
      "STYLE",
      "PERFORMANCE",
      "DUPLICATION",
    ]),
    message: z.string(),
    file: text.refine(
      (value) =>
        !value.startsWith("/") &&
        !value.includes("\\") &&
        !value.split("/").includes("..") &&
        !/^[a-z]+:/i.test(value),
    ),
    startLine: positive,
    endLine: positive,
    column: positive.nullable(),
  })
  .refine((value) => value.endLine >= value.startLine, "Invalid finding range");
export const toolRunSchema = z.object({
  tool: text,
  version: text,
  configSha256: sha256Schema,
  status: z.enum(["SUCCEEDED", "FAILED", "SKIPPED"]),
  durationMs: count,
  error: taskErrorSchema.nullable(),
});
export const staticAnalysisResultSchema = z
  .object({
    schemaVersion: z.literal("0.2.0"),
    analysisId: uuidSchema,
    submissionId: idSchema,
    sourceSha256: sha256Schema,
    languageId: text,
    toolchainVersion: text,
    resultHash: sha256Schema,
    metrics: analysisMetricsSchema,
    findings: z.array(analysisFindingSchema),
    tools: z.array(toolRunSchema),
    reproducibility: z.object({
      imageDigest: text,
      configSha256: sha256Schema,
      sourceSha256: sha256Schema,
    }),
    synthesis: z.object({
      status: z.literal("NOT_REQUESTED"),
      provider: z.null(),
      model: z.null(),
      promptVersion: z.null(),
      content: z.null(),
      error: z.null(),
    }),
  })
  .refine(
    (value) => value.sourceSha256 === value.reproducibility.sourceSha256,
    "Mismatched reproducibility source",
  );
export const submissionAnalysisViewSchema = z
  .object({
    analysisId: uuidSchema.nullable(),
    status: z.enum(analysisStatuses),
    revision: count,
    result: staticAnalysisResultSchema.nullable(),
    error: taskErrorSchema.nullable(),
  })
  .refine(
    (value) =>
      value.result === null || value.result.analysisId === value.analysisId,
    "Mismatched analysis identity",
  );
export const trainingRecordSchema = z
  .object({
    trainingRecordId: uuidSchema,
    problem: problemSummarySchema,
    status: z.enum(trainingStatuses),
    recommendationBatchId: uuidSchema.nullable(),
    firstSubmittedAt: instantSchema.nullable(),
    lastSubmittedAt: instantSchema.nullable(),
    attemptCount: count,
    acceptedSubmissionCount: count,
    lastSubmissionId: idSchema.nullable(),
    completedAt: instantSchema.nullable(),
    createdAt: instantSchema,
    updatedAt: instantSchema,
  })
  .refine(
    (value) => value.acceptedSubmissionCount <= value.attemptCount,
    "Invalid attempt counts",
  );
export const learningDifficultyStatSchema = z
  .object({
    difficulty: positive.nullable(),
    difficultyScale: z.enum(difficultyScales),
    attemptedProblemCount: count,
    solvedCount: count,
  })
  .refine(
    (value) =>
      (value.difficultyScale === "UNRATED"
        ? value.difficulty === null
        : value.difficulty !== null) &&
      value.solvedCount <= value.attemptedProblemCount,
  );
export const learningProfileSourcesSchema = z.object({
  platformSubmissionCount: count,
  externalSubmissionCount: count,
  codeAnalysisCount: count,
  sourceAccountIds: z.array(idSchema),
});
export const codeQualitySchema = z.object({
  analyzedSubmissionCount: count,
  warningCount: count,
  errorCount: count,
  maxCyclomaticComplexity: numeric.nonnegative().nullable(),
});
const learningAnalysisObject = z.object({
  window: z.enum(windows),
  period: z.object({ start: instantSchema.nullable(), end: instantSchema }),
  summary: summarySchema,
  currentRating: nullableNumber,
  maxRating: nullableNumber,
  overallScore: numeric.min(0).max(100),
  dimensions: z
    .array(
      z.object({
        code: z.enum(dimensionCodes),
        name: z.string(),
        displayOrder: positive.max(6),
        score: numeric.min(0).max(100),
        attemptedProblemCount: count,
        solvedCount: count,
        submissionCount: count,
        averageSolvedDifficulty: nullableNumber,
        rankOrder: positive.max(6),
      }),
    )
    .length(6),
  weakestDimension: z.enum(dimensionCodes),
  tagStats: z.array(
    z.object({
      tag: z.string(),
      attemptedProblemCount: count,
      solvedCount: count,
      submissionCount: count,
    }),
  ),
  difficultyStats: z.array(learningDifficultyStatSchema),
  activityStats: z.array(
    z.object({
      date: z.iso.date(),
      submissionCount: count,
      acceptedSubmissionCount: count,
      failedSubmissionCount: count,
      pendingSubmissionCount: count,
      solvedCount: count,
    }),
  ),
  sources: learningProfileSourcesSchema,
  codeQuality: codeQualitySchema,
});
function validLearningAnalysis(value: z.infer<typeof learningAnalysisObject>) {
  const s = value.summary;
  return (
    hasValidDimensionRanking(value) &&
    new Set(value.dimensions.map((d) => d.displayOrder)).size === 6 &&
    (value.window === "ALL"
      ? value.period.start === null
      : value.period.start !== null) &&
    s.solvedCount <= s.attemptedProblemCount &&
    s.attemptedProblemCount <= s.submissionCount &&
    s.unsolvedProblemCount === s.attemptedProblemCount - s.solvedCount &&
    s.acceptedSubmissionCount +
      s.failedSubmissionCount +
      s.pendingSubmissionCount ===
      s.submissionCount &&
    s.ratedSolvedCount + s.unratedSolvedCount === s.solvedCount &&
    value.sources.platformSubmissionCount +
      value.sources.externalSubmissionCount ===
      s.submissionCount &&
    value.sources.codeAnalysisCount ===
      value.codeQuality.analyzedSubmissionCount
  );
}
export const learningAnalysisResultSchema = learningAnalysisObject.refine(
  validLearningAnalysis,
  "Invalid learning evidence counts or dimensions",
);
export const learningProfileSchema = learningAnalysisObject
  .extend({
    publicId: uuidSchema,
    snapshotId: uuidSchema,
    profileJobId: uuidSchema,
    sourceFingerprint: sha256Schema,
    algorithmVersion: z.literal("learning-profile-v0.2.1"),
    mappingVersion: z.literal("mapping-v0.11.1"),
    timezone: z.literal("Asia/Shanghai"),
    dataCutoffAt: instantSchema,
    createdAt: instantSchema,
    stale: z.boolean(),
  })
  .refine(
    validLearningAnalysis,
    "Invalid learning evidence counts or dimensions",
  );
export const learningProfileJobSchema = z.object({
  jobId: uuidSchema,
  status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"]),
  sourceFingerprint: sha256Schema,
  profileJobId: uuidSchema.nullable(),
  error: taskErrorSchema.nullable(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
  finishedAt: instantSchema.nullable(),
});
export const learningRecommendationSchema = z.object({
  rank: positive,
  problem: problemSummarySchema,
  score: numeric.min(0).max(1),
  reasonCode: z.enum(reasonCodes),
  reason: z.string(),
  matchedDimension: z.enum(dimensionCodes).nullable(),
  solvedSinceGeneration: z.boolean(),
});
export const learningRecommendationBatchSchema = z
  .object({
    batchId: uuidSchema,
    analysisSnapshotId: uuidSchema,
    sourceFingerprint: sha256Schema,
    source: z.enum(recommendationSources),
    mode: z.enum(modes),
    algorithmVersion: z.literal("learning-recommend-v0.2.1"),
    mappingVersion: text,
    candidateCount: count,
    resultCount: count,
    recommendations: z.array(learningRecommendationSchema).max(50),
    generatedAt: instantSchema,
    stale: z.boolean(),
  })
  .refine(
    (value) =>
      value.resultCount === value.recommendations.length &&
      value.resultCount <= value.candidateCount &&
      value.recommendations.every(
        (r, index) =>
          r.rank === index + 1 &&
          (value.source === "ALL" ||
            r.problem.problemRef.source === value.source),
      ) &&
      new Set(
        value.recommendations.map((r) => problemIdentity(r.problem.problemRef)),
      ).size === value.resultCount,
    "Invalid recommendation ranks, sources or identities",
  );
export const importItemSchema = z.object({
  packagePath: text,
  status: z.enum(["PENDING", "VALIDATED", "REJECTED"]),
  problemId: idSchema.nullable(),
  problemVersionId: uuidSchema.nullable(),
  licenseStatus: z.enum(["PENDING", "VERIFIED", "MISSING", "REVIEW_REQUIRED"]),
  validationStatus: z.enum(["PENDING", "PASSED", "FAILED"]),
  errors: z.array(taskErrorSchema),
});
export const taskBaseSchema = z.object({
  requestId: uuidSchema,
  revision: count,
  status: z.string(),
  error: taskErrorSchema.nullable(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
  finishedAt: instantSchema.nullable(),
});
export const importJobSchema = taskBaseSchema
  .extend({
    status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "PARTIAL", "FAILED"]),
    importJobId: uuidSchema,
    source: z.literal("OJ_LAB"),
    repositoryUrl: z.literal("https://github.com/oj-lab/problem-packages"),
    sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
    packageCount: count,
    completedPackageCount: count,
    items: z.array(importItemSchema),
  })
  .refine(
    (value) =>
      value.items.length === value.packageCount &&
      value.completedPackageCount ===
        value.items.filter((i) => i.status !== "PENDING").length,
    "Invalid import package counts",
  );

export const SOURCE_BYTE_LIMIT = 262144;
export function sourceByteLength(source: string) {
  return new TextEncoder().encode(source).byteLength;
}
export const createSubmissionSchema = z.strictObject({
  problemRef: platformProblemRefSchema.strict(),
  languageId: text,
  sourceCode: z
    .string()
    .refine((value) => value.trim().length > 0, "Blank source")
    .refine(
      (value) => sourceByteLength(value) <= SOURCE_BYTE_LIMIT,
      "Source too large",
    ),
  trainingRecordId: uuidSchema.optional(),
});
export const createTrainingRecordSchema = z.strictObject({
  problemRef: z.discriminatedUnion("source", [
    platformProblemRefSchema.strict(),
    externalProblemRefSchema.strict(),
  ]),
  recommendationBatchId: uuidSchema.optional(),
});
export const generateRecommendationsSchema = z.strictObject({
  source: z.enum(recommendationSources).optional(),
  mode: z.enum(modes).optional(),
  limit: positive.max(50).optional(),
});
const packagePathSchema = z
  .string()
  .refine(
    (value) =>
      value.startsWith("problems/") &&
      !value.includes("\\") &&
      [...value].every(
        (character) =>
          character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
      ) &&
      !value.endsWith("/") &&
      value
        .split("/")
        .every((part) => part !== "" && part !== "." && part !== ".."),
    "Invalid package path",
  );
export const importProblemsSchema = z.strictObject({
  source: z.literal("OJ_LAB"),
  repositoryUrl: z.literal("https://github.com/oj-lab/problem-packages"),
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  packagePaths: z
    .array(packagePathSchema)
    .min(1)
    .max(100)
    .refine(
      (paths) => new Set(paths).size === paths.length,
      "Duplicate package paths",
    ),
});
export const publishProblemSchema = z.strictObject({
  problemVersionId: uuidSchema,
});
export const withdrawProblemSchema = z.strictObject({
  reason: z.string().refine((value) => value.trim().length > 0),
});
export const metadataVersionSchema = z
  .strictObject({
    baseProblemVersionId: uuidSchema,
    tags: tagsSchema,
    difficulty: positive.nullable(),
    difficultyScale: z.enum(["PLATFORM_RATING", "UNRATED"]),
  })
  .refine((value) =>
    value.difficultyScale === "UNRATED"
      ? value.difficulty === null
      : value.difficulty !== null,
  );
export const pagingSchema = z.strictObject({
  page: positive.optional(),
  pageSize: positive.max(100).optional(),
});
const dateFilters = {
  from: instantSchema.optional(),
  to: instantSchema.optional(),
};
const validDateRange = (value: { from?: string; to?: string }) =>
  !value.from || !value.to || Date.parse(value.from) < Date.parse(value.to);
export const problemFiltersSchema = pagingSchema
  .extend({
    q: z.string().trim().min(1).max(100).optional(),
    tag: z.string().min(1).max(128).optional(),
    minDifficulty: positive.optional(),
    maxDifficulty: positive.optional(),
    status: z.literal("PUBLISHED").optional(),
  })
  .refine(
    (value) =>
      value.minDifficulty === undefined ||
      value.maxDifficulty === undefined ||
      value.minDifficulty <= value.maxDifficulty,
  );
export const submissionFiltersSchema = pagingSchema
  .extend({
    problemId: idSchema.optional(),
    judgeStatus: z.enum(judgeStatuses).optional(),
    verdict: z.enum(judgeVerdicts).optional(),
    ...dateFilters,
  })
  .refine(validDateRange);
export const trainingFiltersSchema = pagingSchema
  .extend({
    source: z.enum(problemSources).optional(),
    status: z.enum(trainingStatuses).optional(),
    ...dateFilters,
  })
  .refine(validDateRange);
export const recommendationFiltersSchema = pagingSchema.extend({
  source: z.enum(recommendationSources).optional(),
  mode: z.enum(modes).optional(),
});

export type ProblemRef = z.infer<typeof problemRefSchema>;
export type PlatformProblemRef = z.infer<typeof platformProblemRefSchema>;
export type ProblemSource = ProblemRef["source"];
export type Platform = ProblemRef["platform"];
export type ProblemSummary = z.infer<typeof problemSummarySchema>;
export type PlatformProblemSummary = z.infer<
  typeof platformProblemSummarySchema
>;
export type PlatformProblemDetail = z.infer<typeof platformProblemDetailSchema>;
export type PlatformProblemStatus = PlatformProblemSummary["status"];
export type LanguageCapability = z.infer<typeof languageCapabilitySchema>;
export type LanguageCapabilities = z.infer<typeof languageCapabilitiesSchema>;
export type TaskError = z.infer<typeof taskErrorSchema>;
export type JudgeResult = z.infer<typeof judgeResultSchema>;
export type SubmissionView = z.infer<typeof submissionViewSchema>;
export type SubmissionSource = z.infer<typeof submissionSourceSchema>;
export type JudgeStatus = SubmissionView["judgeStatus"];
export type JudgeVerdict = JudgeResult["verdict"];
export type AnalysisStatus = SubmissionView["analysisStatus"];
export type AnalysisMetrics = z.infer<typeof analysisMetricsSchema>;
export type AnalysisFinding = z.infer<typeof analysisFindingSchema>;
export type ToolRun = z.infer<typeof toolRunSchema>;
export type StaticAnalysisResult = z.infer<typeof staticAnalysisResultSchema>;
export type SubmissionAnalysisView = z.infer<
  typeof submissionAnalysisViewSchema
>;
export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
export type TrainingStatus = TrainingRecord["status"];
export type LearningDifficultyStat = z.infer<
  typeof learningDifficultyStatSchema
>;
export type DifficultyScale = LearningDifficultyStat["difficultyScale"];
export type LearningProfileSources = z.infer<
  typeof learningProfileSourcesSchema
>;
export type CodeQuality = z.infer<typeof codeQualitySchema>;
export type LearningAnalysisResult = z.infer<
  typeof learningAnalysisResultSchema
>;
export type LearningProfile = z.infer<typeof learningProfileSchema>;
export type LearningProfileJob = z.infer<typeof learningProfileJobSchema>;
export type ProfileJobStatus = LearningProfileJob["status"];
export type LearningRecommendation = z.infer<
  typeof learningRecommendationSchema
>;
export type LearningRecommendationBatch = z.infer<
  typeof learningRecommendationBatchSchema
>;
export type RecommendationSource = LearningRecommendationBatch["source"];
export type ImportItem = z.infer<typeof importItemSchema>;
export type TaskBase = z.infer<typeof taskBaseSchema>;
export type ImportJob = z.infer<typeof importJobSchema>;
export type ImportStatus = ImportJob["status"];
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CreateTrainingRecordInput = z.infer<
  typeof createTrainingRecordSchema
>;
export type GenerateRecommendationsInput = z.infer<
  typeof generateRecommendationsSchema
>;
export type ImportProblemsInput = z.infer<typeof importProblemsSchema>;
export type PublishProblemInput = z.infer<typeof publishProblemSchema>;
export type WithdrawProblemInput = z.infer<typeof withdrawProblemSchema>;
export type MetadataVersionInput = z.infer<typeof metadataVersionSchema>;
export type ProblemFilters = z.infer<typeof problemFiltersSchema>;
export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;
export type TrainingFilters = z.infer<typeof trainingFiltersSchema>;
export type RecommendationFilters = z.infer<typeof recommendationFiltersSchema>;
export type Paging = z.infer<typeof pagingSchema>;

/** Versions are excluded for training deduplication and included for immutable editor/results. */
export function problemIdentity(ref: ProblemRef) {
  return `${ref.source}:${ref.platform}:${ref.problemId}`;
}
export function problemVersionIdentity(ref: ProblemRef) {
  return `${problemIdentity(ref)}:${ref.problemVersionId ?? "none"}`;
}
