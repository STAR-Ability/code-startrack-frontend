import { describe, expect, it } from "vitest";
import { demoAccounts, demoAnalysis, demoUnbound } from "@/lib/demo/fixtures";
import { createReadQueue, portfolioTotals } from "./portfolio";

describe("portfolio presentation", () => {
  it("sums account occurrences without inventing deduplicated problems or merged scores", () => {
    const result = portfolioTotals(
      demoAccounts,
      [demoAnalysis(), demoAnalysis(demoAccounts[1].accountId)],
      "ALL",
    );
    expect(result).toMatchObject({
      accountCount: 2,
      analysedCount: 2,
      submissionCount: 8,
      acceptedSubmissionCount: 3,
      solvedOccurrences: 3,
    });
    expect(result).not.toHaveProperty("overallScore");
    expect(result).not.toHaveProperty("currentRating");
  });
  it("excludes unbound history, wrong windows, foreign accounts and duplicate snapshots", () => {
    const a = demoAnalysis();
    const totals = portfolioTotals(
      [...demoAccounts, demoUnbound],
      [
        a,
        a,
        demoAnalysis(demoUnbound.accountId),
        { ...a, window: "7D" },
        { ...a, accountId: "42" },
      ],
      "ALL",
    );
    expect(totals).toMatchObject({
      accountCount: 2,
      analysedCount: 1,
      submissionCount: 5,
    });
  });
  it("keeps zero/partial coverage explicit and records stale snapshots", () => {
    expect(portfolioTotals(demoAccounts, [], "ALL")).toMatchObject({
      analysedCount: 0,
      submissionCount: 0,
    });
    expect(
      portfolioTotals(demoAccounts, [{ ...demoAnalysis(), stale: true }], "ALL")
        .staleCount,
    ).toBe(1);
  });
  it("bounds concurrency and cancels queued work before executing it", async () => {
    const read = createReadQueue(1);
    const cancelled = new AbortController();
    const signal = new AbortController().signal;
    let finish!: () => void;
    const first = read(
      signal,
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await Promise.resolve();
    let ran = false;
    const second = read(cancelled.signal, async () => {
      ran = true;
    });
    const rejected = expect(second).rejects.toMatchObject({
      name: "AbortError",
    });
    cancelled.abort();
    await rejected;
    finish();
    await first;
    expect(ran).toBe(false);
    expect(await read(signal, async () => 7)).toBe(7);
  });
});
