import type {
  DifficultyScale,
  LearningDifficultyStat,
  LearningProfileJob,
  ProblemSummary,
} from "@/lib/api/v02-schemas";
import { ApiError } from "@/lib/api/errors";

export function isLearningProfileJobPending(
  jobId: string | null,
  job: LearningProfileJob | undefined,
  error: unknown,
) {
  if (
    !jobId ||
    (error instanceof ApiError && [401, 403, 404].includes(error.status))
  )
    return false;
  return !job || job.status === "QUEUED" || job.status === "RUNNING";
}

export function learningProblemHref(problem: ProblemSummary): string | null {
  const ref = problem.problemRef;
  if (ref.source === "PLATFORM") {
    const params = new URLSearchParams({
      problemId: ref.problemId,
      problemVersionId: ref.problemVersionId,
    });
    return `/problems/detail?${params}`;
  }
  if (!problem.url) return null;
  try {
    const url = new URL(problem.url);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ["codeforces.com", "www.codeforces.com"].includes(url.hostname) &&
      !url.port
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function groupLearningDifficulty(stats: LearningDifficultyStat[]) {
  const scales: DifficultyScale[] = ["CF_RATING", "PLATFORM_RATING", "UNRATED"];
  return scales
    .map((scale) => ({
      scale,
      buckets: stats
        .filter((stat) => stat.difficultyScale === scale)
        .sort((a, b) => (a.difficulty ?? -1) - (b.difficulty ?? -1)),
    }))
    .filter((group) => group.buckets.length > 0);
}

export function utcDateBoundary(date: string): string | undefined {
  return date ? `${date}T00:00:00Z` : undefined;
}
