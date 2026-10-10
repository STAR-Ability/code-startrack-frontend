import { fixtureUuid } from "../src/lib/demo/fixtures";
import {
  v02ExternalProblem,
  v02Instant,
  v02ProblemSummary,
  v02Problems,
  v02RecommendationBatch,
} from "../src/lib/demo/v02-fixtures";
import {
  createTrainingRecordSchema,
  generateRecommendationsSchema,
  problemIdentity,
  recommendationSources,
  type LearningRecommendationBatch,
  type TrainingRecord,
} from "../src/lib/api/v02-schemas";
import { modes, uuidSchema } from "../src/lib/api/schemas";

type StoryRequest = {
  path: string;
  method: string;
  body: unknown;
  query: Record<string, unknown>;
  headers: Headers;
  data: (value: unknown, status?: number) => void;
  paginated: (items: unknown[]) => void;
  error: (code: string, status: number) => void;
};

// Browser-only presentation fixtures. The offline HTTP backend owns judge/sync flows.
export function createV02StoryHandler(config: Record<string, unknown>) {
  let sequence = 4900;
  const nextId = () => fixtureUuid(sequence++);
  const records: TrainingRecord[] = [];
  const batches: LearningRecommendationBatch[] = [];
  const replay = new Map<string, { params: string; value: unknown }>();
  const makeBatch = (
    source: LearningRecommendationBatch["source"],
    mode: LearningRecommendationBatch["mode"],
    limit = 50,
  ) => {
    const batch = v02RecommendationBatch(source, mode);
    if (mode === "LEVEL")
      batch.recommendations = batch.recommendations.filter(
        (item) => item.problem.difficultyScale === "CF_RATING",
      );
    if (config.emptyCandidates) batch.recommendations = [];
    batch.candidateCount = batch.recommendations.length;
    batch.recommendations = batch.recommendations
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    batch.resultCount = batch.recommendations.length;
    batch.stale = !!config.stale;
    return batch;
  };
  if (!config.v02NoBatch)
    for (const source of recommendationSources)
      for (const mode of modes) batches.push(makeBatch(source, mode));

  const makeRecord = (
    problem: TrainingRecord["problem"],
    recommendationBatchId: string | null = null,
  ): TrainingRecord => ({
    trainingRecordId: nextId(),
    problem: v02ProblemSummary(problem),
    status: "PLANNED",
    recommendationBatchId,
    firstSubmittedAt: null,
    lastSubmittedAt: null,
    attemptCount: 0,
    acceptedSubmissionCount: 0,
    lastSubmissionId: null,
    completedAt: null,
    createdAt: v02Instant,
    updatedAt: v02Instant,
  });
  if (!config.v02EmptyTraining && !config.zero)
    [v02Problems[1], v02Problems[2]].forEach((problem, index) => {
      records.push({
        ...makeRecord(problem),
        status: index ? "COMPLETED" : "IN_PROGRESS",
        firstSubmittedAt: v02Instant,
        lastSubmittedAt: v02Instant,
        attemptCount: 1,
        acceptedSubmissionCount: index,
        lastSubmissionId: `900719925474800${index + 1}`,
        completedAt: index ? v02Instant : null,
      });
    });

  return (request: StoryRequest) => {
    const { path, method, query, data, paginated, error } = request;
    const write = (create: () => unknown, status: () => number) => {
      const key = request.headers.get("Idempotency-Key");
      if (!uuidSchema.safeParse(key).success) {
        error("INVALID_ARGUMENT", 400);
        return;
      }
      const operation = `${path}:${key}`;
      const params = JSON.stringify(request.body);
      const previous = replay.get(operation);
      if (previous) {
        if (previous.params !== params) error("IDEMPOTENCY_CONFLICT", 409);
        else data(structuredClone(previous.value), 200);
        return;
      }
      const value = create();
      if (value === undefined) return;
      replay.set(operation, { params, value: structuredClone(value) });
      data(value, status());
    };
    if (path === "/me/recommendations/generate" && method === "POST") {
      write(
        () => {
          if (config.v02NoProfile || config.stale) {
            error("PROFILE_NOT_READY", 409);
            return;
          }
          const input = generateRecommendationsSchema.parse(request.body);
          const batch = makeBatch(
            input.source ?? "ALL",
            input.mode ?? "HYBRID",
            input.limit ?? 10,
          );
          batch.batchId = nextId();
          batch.generatedAt = new Date(
            Date.parse(v02Instant) + sequence * 1000,
          ).toISOString();
          batches.unshift(batch);
          return batch;
        },
        () => 201,
      );
    } else if (path === "/me/recommendations/latest") {
      data(
        batches.find(
          (batch) => batch.source === query.source && batch.mode === query.mode,
        ) ?? null,
      );
    } else if (path === "/me/recommendations/history") {
      paginated(
        batches.filter(
          (batch) =>
            (!query.source || batch.source === query.source) &&
            (!query.mode || batch.mode === query.mode),
        ),
      );
    } else if (path.startsWith("/me/recommendations/")) {
      const batch = batches.find((item) => item.batchId === path.split("/")[3]);
      if (batch) data(batch);
      else error("RESOURCE_NOT_FOUND", 404);
    } else if (path === "/me/training-records" && method === "POST") {
      let existing = false;
      write(
        () => {
          const input = createTrainingRecordSchema.parse(request.body);
          const batch = input.recommendationBatchId
            ? batches.find(
                (item) => item.batchId === input.recommendationBatchId,
              )
            : undefined;
          const problem = [...v02Problems, v02ExternalProblem].find(
            (item) =>
              problemIdentity(item.problemRef) ===
              problemIdentity(input.problemRef),
          );
          if (
            !problem ||
            (input.recommendationBatchId &&
              !batch?.recommendations.some(
                (item) =>
                  problemIdentity(item.problem.problemRef) ===
                  problemIdentity(input.problemRef),
              ))
          ) {
            error("RESOURCE_NOT_FOUND", 404);
            return;
          }
          const record = records.find(
            (item) =>
              problemIdentity(item.problem.problemRef) ===
              problemIdentity(input.problemRef),
          );
          if (record) {
            existing = true;
            record.recommendationBatchId ??=
              input.recommendationBatchId ?? null;
            return record;
          }
          const created = makeRecord(
            problem,
            input.recommendationBatchId ?? null,
          );
          records.unshift(created);
          return created;
        },
        () => (existing ? 200 : 201),
      );
    } else if (path === "/me/training-records") {
      paginated(
        records.filter(
          (record) =>
            (!query.source ||
              record.problem.problemRef.source === query.source) &&
            (!query.status || record.status === query.status) &&
            (!query.from ||
              (record.lastSubmittedAt &&
                Date.parse(record.lastSubmittedAt) >=
                  Date.parse(String(query.from)))) &&
            (!query.to ||
              (record.lastSubmittedAt &&
                Date.parse(record.lastSubmittedAt) <
                  Date.parse(String(query.to)))),
        ),
      );
    } else if (path.startsWith("/me/training-records/")) {
      const record = records.find(
        (item) => item.trainingRecordId === path.split("/")[3],
      );
      if (record) data(record);
      else error("TRAINING_RECORD_NOT_FOUND", 404);
    } else return false;
    return true;
  };
}
