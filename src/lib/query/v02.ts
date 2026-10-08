import { ApiError } from "@/lib/api/errors";
import { createIdempotencyKey } from "./idempotency-key";
import type {
  ProblemRef,
  SubmissionView,
  SubmissionAnalysisView,
  LearningProfileJob,
  LearningProfile,
} from "@/lib/api/v02-schemas";

export const v02Keys = {
  all: (publicId: string) => ["private", publicId, "v02"] as const,
  resource: (publicId: string, resource: string, params: object = {}) =>
    ["private", publicId, "v02", resource, params] as const,
  problem: (publicId: string, ref: ProblemRef) =>
    [
      "private",
      publicId,
      "v02",
      "problem",
      ref.source,
      ref.platform,
      ref.problemId,
      ref.problemVersionId,
    ] as const,
};
export function deniedV02(error: unknown) {
  return error instanceof ApiError && [401, 403, 404].includes(error.status);
}
const backoff = (failures: number) =>
  Math.min(30000, 3000 * 2 ** Math.min(failures, 5));
export function judgePollDelay(
  submission: SubmissionView | undefined,
  failures = 0,
  error: unknown = null,
): number | false {
  if (deniedV02(error)) return false;
  if (
    submission?.judgeStatus === "FAILED" &&
    submission.judgeTaskId === null &&
    submission.judgeError?.retryable
  )
    return 30000;
  if (
    submission &&
    ["COMPLETED", "FAILED", "CANCELLED"].includes(submission.judgeStatus)
  )
    return false;
  return backoff(failures);
}
export function analysisPollDelay(
  analysis: SubmissionAnalysisView | undefined,
  failures = 0,
  error: unknown = null,
  submission?: SubmissionView,
): number | false {
  if (deniedV02(error)) return false;
  if (
    analysis &&
    ["SUCCEEDED", "PARTIAL", "FAILED", "SKIPPED"].includes(analysis.status)
  )
    return false;
  if (
    analysis?.status === "NOT_REQUESTED" &&
    submission &&
    ["FAILED", "CANCELLED"].includes(submission.judgeStatus) &&
    judgePollDelay(submission) === false
  )
    return false;
  return backoff(failures);
}
export function profilePollDelay(
  job: LearningProfileJob | undefined,
  failures = 0,
  error: unknown = null,
): number | false {
  if (deniedV02(error) || (job && ["SUCCEEDED", "FAILED"].includes(job.status)))
    return false;
  return backoff(failures);
}
export function latestProfilePollDelay(
  profile: LearningProfile | null | undefined,
  failures = 0,
  error: unknown = null,
): number | false {
  if (deniedV02(error) || (error instanceof ApiError && error.status === 400))
    return false;
  if (error) return backoff(failures);
  return profile?.stale ? backoff(failures) : false;
}
export const PROFILE_RECONCILIATION_MS = 60000;
/** Local deadlines describe a read attempt, never a backend job or computed profile state. */
export class V02LatestProfilePolling {
  private startedAt: number | null = null;
  private sourceChangedAt: number | undefined;
  private manuallyRetriedSource: number | undefined;
  reset(now = Date.now(), sourceChangedAt?: number) {
    this.startedAt = now;
    this.manuallyRetriedSource = sourceChangedAt;
    if (sourceChangedAt !== undefined) this.sourceChangedAt = sourceChangedAt;
  }
  delay(
    profile: LearningProfile | null | undefined,
    failures: number,
    error: unknown,
    sourceChangedAt?: number,
    now = Date.now(),
  ): number | false {
    if (deniedV02(error) || (error instanceof ApiError && error.status === 400))
      return false;
    const recentSourceUpdate =
      sourceChangedAt !== undefined &&
      now - sourceChangedAt < PROFILE_RECONCILIATION_MS;
    const manualSourceRead =
      sourceChangedAt !== undefined &&
      sourceChangedAt === this.manuallyRetriedSource &&
      this.startedAt !== null &&
      now - this.startedAt < PROFILE_RECONCILIATION_MS;
    const sourceUpdatePending = recentSourceUpdate || manualSourceRead;
    if (recentSourceUpdate && sourceChangedAt !== this.sourceChangedAt) {
      this.sourceChangedAt = sourceChangedAt;
      this.startedAt = sourceChangedAt;
    }
    if (
      !profile?.stale &&
      !error &&
      !(profile === null && sourceUpdatePending)
    ) {
      this.startedAt = null;
      return false;
    }
    this.startedAt ??= now;
    if (now - this.startedAt >= PROFILE_RECONCILIATION_MS) return false;
    return profile === null && sourceUpdatePending
      ? backoff(failures)
      : latestProfilePollDelay(profile, failures, error);
  }
}

/** Revision numbers only order responses from the same task. */
export function acceptAnalysis(
  previous: SubmissionAnalysisView | undefined,
  incoming: SubmissionAnalysisView,
) {
  return previous &&
    previous.analysisId === incoming.analysisId &&
    previous.revision > incoming.revision
    ? previous
    : incoming;
}
/** A current endpoint can reveal a new task before the submission projection refreshes. */
export class V02AnalysisTasks {
  private currentId: string | null = null;
  private readonly retired = new Set<string>();
  private latest: SubmissionAnalysisView | undefined;
  project(analysisId: string | null) {
    if (
      !analysisId ||
      analysisId === this.currentId ||
      this.retired.has(analysisId)
    )
      return;
    if (this.currentId) this.retired.add(this.currentId);
    this.currentId = analysisId;
    this.latest = undefined;
  }
  accept(incoming: SubmissionAnalysisView, previous?: SubmissionAnalysisView) {
    if (
      (incoming.analysisId && this.retired.has(incoming.analysisId)) ||
      (!incoming.analysisId && this.currentId)
    ) {
      if (this.latest) return this.latest;
      throw new ApiError("STALE_TASK_RESPONSE");
    }
    this.project(incoming.analysisId);
    if (!this.latest && previous?.analysisId === incoming.analysisId)
      this.latest = previous;
    this.latest = acceptAnalysis(this.latest, incoming);
    return this.latest;
  }
}
export function acceptSubmission(
  previous: SubmissionView | undefined,
  incoming: SubmissionView,
) {
  if (!previous || previous.submissionId !== incoming.submissionId)
    return incoming;
  if (
    (previous.judgeTaskId === incoming.judgeTaskId &&
      previous.judgeRevision > incoming.judgeRevision) ||
    (previous.analysisId === incoming.analysisId &&
      previous.analysisRevision > incoming.analysisRevision)
  )
    return previous;
  return incoming;
}
export function isUncertainWrite(error: unknown) {
  return (
    !(error instanceof ApiError) ||
    error.status >= 500 ||
    error.status === 429 ||
    [
      "TIMEOUT",
      "NETWORK_ERROR",
      "REQUEST_IN_PROGRESS",
      "INVALID_RESPONSE",
    ].includes(error.code)
  );
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

/** In-memory operation keys expire after known outcomes; uncertain retries retain their key. */
export class V02OperationKeys {
  private readonly operations = new Map<
    string,
    { signature: string; key: string }
  >();
  key(publicId: string, operation: string, variables: unknown) {
    const scope = JSON.stringify([publicId, operation]);
    const signature = JSON.stringify(canonical(variables)) ?? "null";
    const existing = this.operations.get(scope);
    if (existing && existing.signature === signature) return existing.key;
    const key = createIdempotencyKey();
    this.operations.set(scope, { signature, key });
    return key;
  }
  finish(
    publicId: string,
    operation: string,
    variables: unknown,
    error?: unknown,
  ) {
    const scope = JSON.stringify([publicId, operation]);
    if (
      (error === undefined || !isUncertainWrite(error)) &&
      this.operations.get(scope)?.signature ===
        (JSON.stringify(canonical(variables)) ?? "null")
    )
      this.operations.delete(scope);
  }
  clear() {
    this.operations.clear();
  }
}
