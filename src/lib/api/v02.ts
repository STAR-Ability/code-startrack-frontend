import { z } from "zod";
import { readData, readPage, queryString } from "./client";
import { ApiError } from "./errors";
import {
  idSchema,
  uuidSchema,
  windows,
  modes,
  type AnalysisWindow,
  type RecommendationMode,
} from "./schemas";
import {
  platformProblemSummarySchema,
  platformProblemDetailSchema,
  languageCapabilitiesSchema,
  submissionViewSchema,
  submissionSourceSchema,
  submissionAnalysisViewSchema,
  trainingRecordSchema,
  learningProfileSchema,
  learningProfileJobSchema,
  learningRecommendationBatchSchema,
  importJobSchema,
  createSubmissionSchema,
  createTrainingRecordSchema,
  generateRecommendationsSchema,
  importProblemsSchema,
  publishProblemSchema,
  withdrawProblemSchema,
  metadataVersionSchema,
  pagingSchema,
  problemFiltersSchema,
  submissionFiltersSchema,
  trainingFiltersSchema,
  recommendationFiltersSchema,
  recommendationSources,
  sourceByteLength,
  SOURCE_BYTE_LIMIT,
  problemVersionIdentity,
  problemIdentity,
  type CreateSubmissionInput,
  type CreateTrainingRecordInput,
  type GenerateRecommendationsInput,
  type ProblemFilters,
  type SubmissionFilters,
  type TrainingFilters,
  type RecommendationFilters,
  type RecommendationSource,
  type Paging,
  type PlatformProblemDetail,
} from "./v02-schemas";

function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new ApiError("INVALID_ARGUMENT", 400, null, {
      fields: z.flattenError(parsed.error).fieldErrors,
    });
  return parsed.data;
}
const id = (value: string) => input(idSchema, value);
const uuid = (value: string) => input(uuidSchema, value);
const write = (idempotencyKey: string, body?: unknown) => ({
  method: "POST" as const,
  idempotencyKey: uuid(idempotencyKey),
  ...(body !== undefined ? { body } : {}),
});
function assertProblem(
  value: PlatformProblemDetail,
  problemId: string,
  problemVersionId?: string,
) {
  if (
    value.problemRef.problemId !== problemId ||
    (problemVersionId && value.problemRef.problemVersionId !== problemVersionId)
  )
    throw new ApiError("INVALID_RESPONSE");
  return value;
}

/** Additive V0.2 public API. Legacy CF/account/team clients keep their own contracts. */
export const v02 = {
  problems: (filters: ProblemFilters = {}, signal?: AbortSignal) =>
    readPage(
      `/platform-problems${queryString({ status: "PUBLISHED", ...input(problemFiltersSchema, filters) })}`,
      platformProblemSummarySchema,
      signal,
      undefined,
      { status: "PUBLISHED" },
    ),
  problem: async (problemId: string, signal?: AbortSignal) => {
    const problem = id(problemId);
    return assertProblem(
      await readData(
        `/platform-problems/${problem}`,
        platformProblemDetailSchema,
        { signal },
      ),
      problem,
    );
  },
  problemVersion: async (
    problemId: string,
    versionId: string,
    signal?: AbortSignal,
  ) => {
    const problem = id(problemId),
      version = uuid(versionId);
    return assertProblem(
      await readData(
        `/platform-problems/${problem}/versions/${version}`,
        platformProblemDetailSchema,
        { signal },
      ),
      problem,
      version,
    );
  },
  languages: (signal?: AbortSignal) =>
    readData("/judge-languages", languageCapabilitiesSchema, { signal }),
  createSubmission: async (
    body: CreateSubmissionInput,
    idempotencyKey: string,
  ) => {
    if (
      typeof body.sourceCode === "string" &&
      sourceByteLength(body.sourceCode) > SOURCE_BYTE_LIMIT
    )
      throw new ApiError("SOURCE_TOO_LARGE", 413);
    const parsed = input(createSubmissionSchema, body);
    const result = await readData(
      "/submissions",
      submissionViewSchema,
      write(idempotencyKey, parsed),
    );
    if (
      problemVersionIdentity(result.problem.problemRef) !==
        problemVersionIdentity(parsed.problemRef) ||
      result.languageId !== parsed.languageId
    )
      throw new ApiError("INVALID_RESPONSE");
    return result;
  },
  submissions: (filters: SubmissionFilters = {}, signal?: AbortSignal) =>
    readPage(
      `/submissions${queryString(input(submissionFiltersSchema, filters))}`,
      submissionViewSchema,
      signal,
    ),
  submission: (submissionId: string, signal?: AbortSignal) =>
    readData(
      `/submissions/${id(submissionId)}`,
      submissionViewSchema,
      { signal },
      undefined,
      { submissionId },
    ),
  submissionSource: (submissionId: string, signal?: AbortSignal) =>
    readData(
      `/submissions/${id(submissionId)}/source`,
      submissionSourceSchema,
      { signal },
      undefined,
      { submissionId },
    ),
  submissionAnalysis: async (submissionId: string, signal?: AbortSignal) => {
    const value = await readData(
      `/submissions/${id(submissionId)}/analysis`,
      submissionAnalysisViewSchema,
      { signal },
    );
    if (value.result && value.result.submissionId !== submissionId)
      throw new ApiError("INVALID_RESPONSE");
    return value;
  },
  retryAnalysis: async (submissionId: string, idempotencyKey: string) => {
    const result = await readData(
      `/submissions/${id(submissionId)}/analysis/retry`,
      submissionAnalysisViewSchema,
      write(idempotencyKey),
    );
    if (result.result && result.result.submissionId !== submissionId)
      throw new ApiError("INVALID_RESPONSE");
    return result;
  },
  createTrainingRecord: async (
    body: CreateTrainingRecordInput,
    idempotencyKey: string,
  ) => {
    const parsed = input(createTrainingRecordSchema, body);
    const result = await readData(
      "/me/training-records",
      trainingRecordSchema,
      write(idempotencyKey, parsed),
    );
    if (
      problemIdentity(result.problem.problemRef) !==
      problemIdentity(parsed.problemRef)
    )
      throw new ApiError("INVALID_RESPONSE");
    return result;
  },
  trainingRecords: (filters: TrainingFilters = {}, signal?: AbortSignal) =>
    readPage(
      `/me/training-records${queryString(input(trainingFiltersSchema, filters))}`,
      trainingRecordSchema,
      signal,
    ),
  trainingRecord: (trainingRecordId: string, signal?: AbortSignal) =>
    readData(
      `/me/training-records/${uuid(trainingRecordId)}`,
      trainingRecordSchema,
      { signal },
      undefined,
      { trainingRecordId },
    ),
  learningProfile: (
    publicId: string,
    window: AnalysisWindow = "ALL",
    signal?: AbortSignal,
  ) =>
    readData(
      `/me/learning-profile/latest${queryString({ window: input(z.enum(windows), window) })}`,
      learningProfileSchema.nullable(),
      { signal },
      undefined,
      { publicId: uuid(publicId), window },
    ),
  learningHistory: (
    publicId: string,
    window: AnalysisWindow,
    paging: Paging = {},
    signal?: AbortSignal,
  ) =>
    readPage(
      `/me/learning-profile/history${queryString({ window: input(z.enum(windows), window), ...input(pagingSchema, paging) })}`,
      learningProfileSchema,
      signal,
      undefined,
      { publicId: uuid(publicId), window },
    ),
  learningSnapshot: (
    publicId: string,
    snapshotId: string,
    signal?: AbortSignal,
  ) =>
    readData(
      `/me/learning-profile/${uuid(snapshotId)}`,
      learningProfileSchema,
      { signal },
      undefined,
      { publicId: uuid(publicId), snapshotId },
    ),
  rebuildProfile: (idempotencyKey: string) =>
    readData(
      "/me/learning-profile/rebuild",
      learningProfileJobSchema,
      write(idempotencyKey),
    ),
  profileJob: (jobId: string, signal?: AbortSignal) =>
    readData(
      `/learning-profile-jobs/${uuid(jobId)}`,
      learningProfileJobSchema,
      { signal },
      undefined,
      { jobId },
    ),
  generateRecommendations: async (
    body: GenerateRecommendationsInput,
    idempotencyKey: string,
  ) => {
    const parsed = input(generateRecommendationsSchema, body);
    const result = await readData(
      "/me/recommendations/generate",
      learningRecommendationBatchSchema,
      write(idempotencyKey, parsed),
      undefined,
      { source: parsed.source ?? "ALL", mode: parsed.mode ?? "HYBRID" },
    );
    if (result.resultCount > (parsed.limit ?? 10))
      throw new ApiError("INVALID_RESPONSE");
    return result;
  },
  recommendations: (
    source: RecommendationSource = "ALL",
    mode: RecommendationMode = "HYBRID",
    signal?: AbortSignal,
  ) =>
    readData(
      `/me/recommendations/latest${queryString({ source: input(z.enum(recommendationSources), source), mode: input(z.enum(modes), mode) })}`,
      learningRecommendationBatchSchema.nullable(),
      { signal },
      undefined,
      { source, mode },
    ),
  recommendationHistory: (
    filters: RecommendationFilters = {},
    signal?: AbortSignal,
  ) =>
    readPage(
      `/me/recommendations/history${queryString(input(recommendationFiltersSchema, filters))}`,
      learningRecommendationBatchSchema,
      signal,
    ),
  recommendationBatch: (batchId: string, signal?: AbortSignal) =>
    readData(
      `/me/recommendations/${uuid(batchId)}`,
      learningRecommendationBatchSchema,
      { signal },
      undefined,
      { batchId },
    ),
  importProblems: (
    body: z.infer<typeof importProblemsSchema>,
    idempotencyKey: string,
  ) =>
    readData(
      "/admin/problem-imports",
      importJobSchema,
      write(idempotencyKey, input(importProblemsSchema, body)),
    ),
  importJob: (importJobId: string, signal?: AbortSignal) =>
    readData(
      `/admin/problem-imports/${uuid(importJobId)}`,
      importJobSchema,
      { signal },
      undefined,
      { importJobId },
    ),
  publishProblem: async (
    problemId: string,
    body: z.infer<typeof publishProblemSchema>,
    idempotencyKey: string,
  ) => {
    const parsed = input(publishProblemSchema, body);
    return assertProblem(
      await readData(
        `/admin/platform-problems/${id(problemId)}/publish`,
        platformProblemDetailSchema,
        write(idempotencyKey, parsed),
      ),
      problemId,
      parsed.problemVersionId,
    );
  },
  withdrawProblem: (
    problemId: string,
    body: z.infer<typeof withdrawProblemSchema>,
    idempotencyKey: string,
  ) =>
    readData(
      `/admin/platform-problems/${id(problemId)}/withdraw`,
      z.object({
        problemId: idSchema,
        status: z.literal("WITHDRAWN"),
        catalogVersion: idSchema,
      }),
      write(idempotencyKey, input(withdrawProblemSchema, body)),
      undefined,
      { problemId },
    ),
  metadataVersion: async (
    problemId: string,
    body: z.infer<typeof metadataVersionSchema>,
    idempotencyKey: string,
  ) =>
    assertProblem(
      await readData(
        `/admin/platform-problems/${id(problemId)}/metadata-versions`,
        platformProblemDetailSchema,
        write(idempotencyKey, input(metadataVersionSchema, body)),
      ),
      problemId,
    ),
};

export const v02Api = v02;
