import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { clearSession } from "@/components/training/query-provider";
import { v02Languages, v02Problems } from "@/lib/demo/v02-fixtures";
import { fixtureUuid } from "@/lib/demo/fixtures";
import { keys } from "@/lib/query/keys";
import {
  emptyProblemFilters,
  parseProblemFilters,
  problemDraftKey,
  problemHref,
  problemLanguages,
  SOURCE_BYTE_LIMIT,
  sourceByteCount,
  sourceValidation,
} from "./problem-state";

describe("problem attempt contract", () => {
  it("counts UTF-8 bytes rather than characters and accepts the exact limit", () => {
    const boundary = "练".repeat(87_381) + "a";
    expect(sourceByteCount(boundary)).toBe(SOURCE_BYTE_LIMIT);
    expect(sourceValidation(boundary)).toBeNull();
    expect(sourceValidation(boundary + "a")).toBe("large");
    expect(sourceValidation(" \n\t")).toBe("blank");
    expect(sourceValidation("  int main() {}\n")).toBeNull();
  });

  it("requires the actual intersection of problem and executable languages", () => {
    const problem = { ...v02Problems[0], languageIds: ["c11", "python3"] };
    expect(
      problemLanguages(problem, v02Languages.languages).map(
        (language) => language.languageId,
      ),
    ).toEqual(["c11"]);
    expect(problemLanguages(problem, [])).toEqual([]);
  });

  it("uses public identity, owner namespace, fixed version, and language for memory drafts", () => {
    const problem = v02Problems[0];
    const key = problemDraftKey("user-a", problem, "cpp17");
    expect(problemDraftKey("user-b", problem, "cpp17")).not.toEqual(key);
    expect(problemDraftKey("user-a", problem, "c11")).not.toEqual(key);
    expect(
      problemDraftKey(
        "user-a",
        {
          ...problem,
          problemRef: {
            ...problem.problemRef,
            problemVersionId: fixtureUuid(2999),
          },
        },
        "cpp17",
      ),
    ).not.toEqual(key);
    const client = new QueryClient();
    client.setQueryData(key, "private source");
    clearSession(client);
    expect(client.getQueryData(key)).toBeUndefined();
    expect(client.getQueryData(keys.session)).toBeNull();
  });

  it("preserves arbitrary-length decimal IDs in query-based static routes", () => {
    const problem = v02Problems[0];
    expect(
      problemHref(
        problem.problemRef.problemId,
        problem.problemRef.problemVersionId,
      ),
    ).toBe(
      `/problems/detail?problemId=${problem.problemRef.problemId}&problemVersionId=${problem.problemRef.problemVersionId}`,
    );
  });

  it("validates filters with API bounds and keeps exact tags", () => {
    expect(
      parseProblemFilters({
        ...emptyProblemFilters,
        q: "  sum  ",
        tag: " dynamic programming ",
        minDifficulty: "800",
        maxDifficulty: "1000",
      }).filters,
    ).toEqual({
      q: "sum",
      tag: " dynamic programming ",
      minDifficulty: 800,
      maxDifficulty: 1000,
      status: "PUBLISHED",
    });
    expect(
      parseProblemFilters({ ...emptyProblemFilters, q: "a".repeat(101) }).error,
    ).toBe("keyword");
    expect(
      parseProblemFilters({ ...emptyProblemFilters, tag: "a".repeat(129) })
        .error,
    ).toBe("tag");
    for (const minimum of ["0", "1.5", "-1", "2e3", "9007199254740993"])
      expect(
        parseProblemFilters({ ...emptyProblemFilters, minDifficulty: minimum })
          .error,
      ).toBe("difficulty");
    expect(
      parseProblemFilters({
        ...emptyProblemFilters,
        minDifficulty: "900",
        maxDifficulty: "800",
      }).error,
    ).toBe("difficulty");
  });
});
