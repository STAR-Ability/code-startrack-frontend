import { expect, test } from "vitest";
import { activitySeries, safeProblemUrl } from "./data";
import { demoAnalysis } from "@/lib/demo/fixtures";

test("fills natural days for display without modifying source or counting pending as failure", () => {
  const analysis = demoAnalysis(undefined, "7D");
  const original = structuredClone(analysis);
  const days = activitySeries(analysis);
  expect(days).toHaveLength(7);
  expect(days[0].date).toBe("2026-09-26");
  expect(days.at(-1)?.date).toBe("2026-10-02");
  expect(days[0].submissionCount).toBe(0);
  expect(days.reduce((n, d) => n + d.solvedCount, 0)).toBe(
    analysis.summary.solvedCount,
  );
  expect(analysis).toEqual(original);
});
test("empty evidence has no invented chart samples", () =>
  expect(activitySeries(demoAnalysis(undefined, "ALL", true))).toEqual([]));
test.each([
  null,
  "javascript:alert(1)",
  "data:text/html,x",
  "https://user:secret@example.com",
  " https://example.com",
])("disables unsafe or absent problem URL %s", (value) =>
  expect(safeProblemUrl(value)).toBeNull(),
);
test("uses the exact returned safe URL", () =>
  expect(safeProblemUrl("https://codeforces.com/problemset/problem/1/A")).toBe(
    "https://codeforces.com/problemset/problem/1/A",
  ));
