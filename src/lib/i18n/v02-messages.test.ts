import { expect, test } from "vitest";
import { v02CommonZh, v02CommonEn } from "./v02-common-messages";
import { v02ProblemsZh, v02ProblemsEn } from "./v02-problems-messages";
import { v02SubmissionsZh, v02SubmissionsEn } from "./v02-submissions-messages";
import { v02LearningZh, v02LearningEn } from "./v02-learning-messages";

test.each([
  ["zh-CN", [v02CommonZh, v02ProblemsZh, v02SubmissionsZh, v02LearningZh]],
  ["en", [v02CommonEn, v02ProblemsEn, v02SubmissionsEn, v02LearningEn]],
] as const)(
  "V0.2 %s copy preserves each feature's distinct field meaning",
  (_locale, dictionaries) => {
    const owners = new Set<string>();
    for (const dictionary of dictionaries)
      for (const key of Object.keys(dictionary)) {
        expect(owners.has(key), `Duplicate localized field: ${key}`).toBe(
          false,
        );
        owners.add(key);
      }
  },
);
