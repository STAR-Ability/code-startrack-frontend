import type { AnalysisDto, AnalysisWindow, OjAccountDto } from "./schemas";

/** Presentation totals only: problem counts are account occurrences, never a unified profile. */
export function portfolioTotals(
  accounts: OjAccountDto[],
  analyses: AnalysisDto[],
  window: AnalysisWindow,
) {
  const owned = new Set(
    accounts.filter((a) => a.bindStatus !== "UNBOUND").map((a) => a.accountId),
  );
  const unique = new Map(
    analyses
      .filter((a) => owned.has(a.accountId) && a.window === window)
      .map((a) => [a.accountId, a]),
  );
  const values = [...unique.values()];
  return {
    accountCount: owned.size,
    analysedCount: values.length,
    staleCount: values.filter((a) => a.stale).length,
    submissionCount: values.reduce((n, a) => n + a.summary.submissionCount, 0),
    acceptedSubmissionCount: values.reduce(
      (n, a) => n + a.summary.acceptedSubmissionCount,
      0,
    ),
    solvedOccurrences: values.reduce((n, a) => n + a.summary.solvedCount, 0),
  };
}

/** Limit multi-account read fan-out; queued reads can be cancelled before network work. */
export function createReadQueue(limit = 4) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async function read<T>(
    signal: AbortSignal,
    operation: () => Promise<T>,
  ) {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        const index = waiting.indexOf(start);
        if (index >= 0) waiting.splice(index, 1);
        reject(new DOMException("Read cancelled", "AbortError"));
      };
      const start = () => {
        signal.removeEventListener("abort", abort);
        active++;
        resolve();
      };
      if (signal.aborted) return abort();
      if (active < limit) start();
      else {
        waiting.push(start);
        signal.addEventListener("abort", abort, { once: true });
      }
    });
    try {
      signal.throwIfAborted();
      return await operation();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}
