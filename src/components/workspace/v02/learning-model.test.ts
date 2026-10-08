import { describe, expect, it } from "vitest";
import { v02ExternalProblem, v02Problems } from "@/lib/demo/v02-fixtures";
import {
  groupLearningDifficulty,
  learningProblemHref,
  utcDateBoundary,
} from "./learning-model";

describe("learning evidence identities", () => {
  it("preserves platform versions while overlapping external IDs use their original URL", () => {
    const platform = v02Problems[0];
    expect(v02ExternalProblem.problemRef.problemId).toBe(
      platform.problemRef.problemId,
    );
    const local = new URL(
      learningProblemHref(platform)!,
      "https://app.example",
    );
    expect(local.pathname).toBe("/problems/detail");
    expect(local.searchParams.get("problemId")).toBe(
      platform.problemRef.problemId,
    );
    expect(local.searchParams.get("problemVersionId")).toBe(
      platform.problemRef.problemVersionId,
    );
    expect(learningProblemHref(v02ExternalProblem)).toBe(
      v02ExternalProblem.url,
    );
  });

  it.each([
    null,
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "http://codeforces.com/problemset/problem/4/A",
    "https://attacker.example/",
    "https://codeforces.com.attacker.example/",
    "https://user:secret@codeforces.com/",
    "https://codeforces.com:444/",
  ])("rejects unsafe external navigation %s", (url) => {
    expect(learningProblemHref({ ...v02ExternalProblem, url })).toBeNull();
  });

  it("keeps equal values in different difficulty scales in separate immutable groups", () => {
    const stats = [
      {
        difficultyScale: "PLATFORM_RATING" as const,
        difficulty: 1200,
        attemptedProblemCount: 8,
        solvedCount: 3,
      },
      {
        difficultyScale: "CF_RATING" as const,
        difficulty: 1200,
        attemptedProblemCount: 2,
        solvedCount: 1,
      },
      {
        difficultyScale: "UNRATED" as const,
        difficulty: null,
        attemptedProblemCount: 4,
        solvedCount: 0,
      },
    ];
    const before = structuredClone(stats);
    const grouped = groupLearningDifficulty(stats);
    expect(grouped.map((item) => item.scale)).toEqual([
      "CF_RATING",
      "PLATFORM_RATING",
      "UNRATED",
    ]);
    expect(
      grouped.map((item) => item.buckets[0].attemptedProblemCount),
    ).toEqual([2, 8, 4]);
    expect(stats).toEqual(before);
  });

  it("creates explicit UTC date boundaries and leaves missing bounds omitted", () => {
    expect(utcDateBoundary("2026-10-08")).toBe("2026-10-08T00:00:00Z");
    expect(utcDateBoundary("")).toBeUndefined();
  });
});
