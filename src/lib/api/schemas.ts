import { z } from "zod";

// IDs are opaque decimal strings, including values above Number.MAX_SAFE_INTEGER.
export const idSchema = z.string().regex(/^[1-9]\d*$/);
export const uuidSchema = z.uuid();
export const instantSchema = z.iso.datetime();
const count = z.number().int().nonnegative().safe();
const numeric = z.number().finite();
const nullableNumber = numeric.nullable();
const nullableText = z.string().nullable();
export const windows = ["7D", "30D", "365D", "ALL"] as const;
export const modes = ["LEVEL", "WEAKNESS", "HYBRID"] as const;
export const dimensionCodes = [
  "IMPLEMENTATION",
  "ALGORITHMS",
  "DATA_STRUCTURES",
  "DYNAMIC_PROGRAMMING",
  "GRAPHS",
  "MATH",
] as const;
export const verdicts = [
  "ACCEPTED",
  "PARTIAL",
  "WRONG_ANSWER",
  "TIME_LIMIT",
  "MEMORY_LIMIT",
  "RUNTIME_ERROR",
  "COMPILE_ERROR",
  "SKIPPED",
  "CHALLENGED",
  "IDLENESS_LIMIT",
  "PRESENTATION_ERROR",
  "PENDING",
  "OTHER",
] as const;
export const reasonCodes = [
  "WEAK_DIMENSION_MATCH",
  "LEVEL_MATCH",
  "SLIGHTLY_ABOVE_LEVEL",
  "TAG_MATCH",
  "BALANCED_PRACTICE",
  "RECENT_WEAKNESS",
  "LOW_ATTEMPT_COVERAGE",
  "RATING_GROWTH_STEP",
  "MIXED_SKILL_MATCH",
  "DEFAULT_RECOMMENDATION",
] as const;
export const jobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "PARTIAL",
  "FAILED",
]);
const jobStageSchema = z.enum([
  "USER_INFO",
  "SUBMISSIONS",
  "RATING_HISTORY",
  "PROBLEM_CATALOG",
  "ANALYSIS",
  "DONE",
]);
export const userSchema = z.object({
  publicId: uuidSchema,
  username: z.string(),
  displayName: nullableText,
  email: z.string(),
  avatarUrl: nullableText,
  emailVerified: z.boolean(),
  accountStatus: z.enum(["ACTIVE", "LOCKED", "DISABLED", "DELETED"]),
  roles: z.array(z.string()),
  primaryRole: z.string(),
  locale: z.string(),
  timezone: z.string(),
});
export const accountSchema = z.object({
  accountId: idSchema,
  platform: z.literal("codeforces"),
  username: z.string(),
  bindStatus: z.enum(["ACTIVE", "INVALID", "UNBOUND"]),
  rating: nullableNumber,
  maxRating: nullableNumber,
  rank: nullableText,
  maxRank: nullableText,
  contribution: nullableNumber,
  friendOfCount: count.nullable(),
  firstName: nullableText,
  lastName: nullableText,
  country: nullableText,
  city: nullableText,
  organization: nullableText,
  avatarUrl: nullableText,
  titlePhotoUrl: nullableText,
  registeredAt: instantSchema.nullable(),
  lastOnlineAt: instantSchema.nullable(),
  lastSyncedAt: instantSchema.nullable(),
  lastSyncStatus: jobStatusSchema.nullable(),
  nextSyncAt: instantSchema.nullable(),
  boundAt: instantSchema,
  unboundAt: instantSchema.nullable(),
});
export const jobSchema = z.object({
  jobId: uuidSchema,
  accountId: idSchema.nullable(),
  scope: z.enum(["ACCOUNT_FULL", "ANALYSIS_ONLY", "PROBLEM_CATALOG"]),
  triggerType: z.enum(["MANUAL", "SCHEDULED", "SYSTEM"]),
  status: jobStatusSchema,
  stage: jobStageSchema.nullable(),
  itemsFetched: count,
  itemsInserted: count,
  itemsUpdated: count,
  errors: z.array(
    z.object({
      stage: jobStageSchema,
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    }),
  ),
  requestedAt: instantSchema,
  startedAt: instantSchema.nullable(),
  finishedAt: instantSchema.nullable(),
});
export const syncStatusSchema = z.object({
  accountId: idSchema,
  lastSyncedAt: instantSchema.nullable(),
  lastSyncStatus: jobStatusSchema.nullable(),
  nextSyncAt: instantSchema.nullable(),
  latestJob: jobSchema.nullable(),
});
export const problemSchema = z.object({
  problemId: idSchema,
  platform: z.literal("codeforces"),
  externalProblemKey: z.string(),
  title: nullableText,
  difficulty: nullableNumber,
  points: nullableNumber,
  tags: z.array(z.string()),
  solvedCount: count.nullable(),
  url: nullableText,
  isGym: z.boolean(),
  catalogSource: z.enum(["CATALOG", "INFERRED"]),
});
export const problemProgressSchema = z.object({
  accountId: idSchema,
  problem: problemSchema,
  progress: z.object({
    attemptCount: count,
    accepted: z.boolean(),
    acceptedSubmissionCount: count,
    failedSubmissionCount: count,
    pendingSubmissionCount: count,
    firstSubmittedAt: instantSchema,
    lastSubmittedAt: instantSchema,
    acceptedAt: instantSchema.nullable(),
  }),
});
export const submissionSchema = z.object({
  submissionId: idSchema,
  accountId: idSchema,
  externalSubmissionId: idSchema,
  problem: problemSchema,
  verdict: z.enum(verdicts),
  verdictRaw: nullableText,
  programmingLanguage: nullableText,
  participantType: nullableText,
  memberHandles: z.array(z.string()),
  teamId: idSchema.nullable(),
  teamName: nullableText,
  testset: nullableText,
  passedTestCount: count.nullable(),
  timeMs: nullableNumber,
  memoryBytes: nullableNumber,
  submittedAt: instantSchema,
});
export const ratingSchema = z.object({
  accountId: idSchema,
  contestId: count,
  contestName: z.string(),
  rank: count,
  oldRating: numeric,
  newRating: numeric,
  occurredAt: instantSchema,
});
export const summarySchema = z.object({
  attemptedProblemCount: count,
  solvedCount: count,
  unsolvedProblemCount: count,
  submissionCount: count,
  acceptedSubmissionCount: count,
  failedSubmissionCount: count,
  pendingSubmissionCount: count,
  ratedSolvedCount: count,
  unratedSolvedCount: count,
  averageSolvedDifficulty: nullableNumber,
  maxSolvedDifficulty: nullableNumber,
  activeDays: count,
});
export const analysisSchema = z
  .object({
    accountId: idSchema,
    snapshotId: uuidSchema,
    algorithmVersion: z.string(),
    mappingVersion: z.string(),
    timezone: z.string(),
    dataCutoffAt: instantSchema,
    sourceDataVersion: idSchema,
    createdAt: instantSchema,
    stale: z.boolean(),
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
          displayOrder: count,
          score: numeric.min(0).max(100),
          attemptedProblemCount: count,
          solvedCount: count,
          submissionCount: count,
          averageSolvedDifficulty: nullableNumber,
          rankOrder: z.number().int().min(1).max(6),
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
    difficultyStats: z.array(
      z.object({
        difficulty: nullableNumber,
        attemptedProblemCount: count,
        solvedCount: count,
      }),
    ),
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
  })
  .refine(
    (value) =>
      new Set(value.dimensions.map((d) => d.code)).size === 6 &&
      new Set(value.dimensions.map((d) => d.rankOrder)).size === 6 &&
      value.dimensions.find((d) => d.rankOrder === 1)?.code ===
        value.weakestDimension,
    "Invalid dimension identities or ranking",
  );
export const batchSchema = z.object({
  accountId: idSchema,
  batchId: uuidSchema,
  analysisSnapshotId: uuidSchema,
  mode: z.enum(modes),
  targetRating: numeric,
  targetDimension: z.enum(dimensionCodes).nullable(),
  algorithmVersion: z.string(),
  mappingVersion: z.string(),
  candidateCount: count,
  resultCount: count,
  recommendations: z.array(
    z.object({
      rank: z.number().int().positive(),
      problem: problemSchema,
      score: numeric.min(0).max(1),
      reasonCode: z.enum(reasonCodes),
      reason: z.string(),
      matchedDimension: z.enum(dimensionCodes).nullable(),
      solvedSinceGeneration: z.boolean(),
    }),
  ),
  generatedAt: instantSchema,
  stale: z.boolean(),
});
export const dashboardSchema = z.object({
  accountId: idSchema,
  account: accountSchema,
  sync: syncStatusSchema,
  analysis: analysisSchema.nullable(),
  recommendationBatch: batchSchema.nullable(),
  nextAction: z.enum([
    "SYNC",
    "WAIT_SYNC",
    "REBUILD_ANALYSIS",
    "GENERATE_RECOMMENDATIONS",
    "NONE",
  ]),
});
export const metaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: count,
  hasNext: z.boolean(),
});
export const envelope = <T>(schema: z.ZodType<T>) =>
  z.object({ data: schema, requestId: uuidSchema });
export const pageEnvelope = <T>(schema: z.ZodType<T>) =>
  z.object({ data: z.array(schema), meta: metaSchema, requestId: uuidSchema });
export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
  }),
  requestId: uuidSchema,
});
export const captchaSchema = z.object({
  challengeId: uuidSchema,
  imageData: z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/),
  expiresInSeconds: count,
});
export const emailCodeSchema = z.object({
  verificationId: uuidSchema,
  cooldownSeconds: count,
  expiresInSeconds: count,
});
export type Id = z.infer<typeof idSchema>;
export type UserDto = z.infer<typeof userSchema>;
export type OjAccountDto = z.infer<typeof accountSchema>;
export type SyncJobDto = z.infer<typeof jobSchema>;
export type SyncStatusDto = z.infer<typeof syncStatusSchema>;
export type AnalysisDto = z.infer<typeof analysisSchema>;
export type RecommendationBatchDto = z.infer<typeof batchSchema>;
export type ProblemDto = z.infer<typeof problemSchema>;
export type SubmissionDto = z.infer<typeof submissionSchema>;
export type DashboardDto = z.infer<typeof dashboardSchema>;
export type AnalysisWindow = (typeof windows)[number];
export type RecommendationMode = (typeof modes)[number];
export type PageMeta = z.infer<typeof metaSchema>;
export type PageResponse<T> = { data: T[]; meta: PageMeta; requestId: string };
