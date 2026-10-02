import { useSyncExternalStore } from "react";

// Transport provenance is separate from DTOs: no synthetic fields in API data.
let mock = false;
const listeners = new Set<() => void>();
export function recordDataSource(isMock: boolean) {
  if (mock === isMock) return;
  mock = isMock;
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useMockMode() {
  return useSyncExternalStore(
    subscribe,
    () => mock,
    () => false,
  );
}

export type DataState = "loading" | "success" | "empty" | "error" | "mock";
export type DataQuery = {
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  data: unknown;
  refetch: () => unknown;
};
export function isEmptyData(data: unknown): boolean {
  if (data === undefined || data === null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data !== "object") return false;
  if ("data" in data && Array.isArray(data.data)) return data.data.length === 0;
  if ("recommendations" in data && Array.isArray(data.recommendations))
    return data.recommendations.length === 0;
  if (
    "summary" in data &&
    data.summary &&
    typeof data.summary === "object" &&
    "submissionCount" in data.summary
  )
    return data.summary.submissionCount === 0;
  return false;
}
export function dataState(
  query: DataQuery,
  isMock: boolean,
  empty = isEmptyData(query.data),
): DataState {
  if (query.isFetching) return "loading";
  if (query.error) return "error";
  if (query.data === undefined || query.data === null || empty) return "empty";
  return isMock ? "mock" : "success";
}

// UI defaults only; never cache them as an analysis snapshot or successful API result.
export const emptySummary = {
  attemptedProblemCount: 0,
  solvedCount: 0,
  unsolvedProblemCount: 0,
  submissionCount: 0,
  acceptedSubmissionCount: 0,
  failedSubmissionCount: 0,
  pendingSubmissionCount: 0,
  ratedSolvedCount: 0,
  unratedSolvedCount: 0,
  averageSolvedDifficulty: null,
  maxSolvedDifficulty: null,
  activeDays: 0,
};
