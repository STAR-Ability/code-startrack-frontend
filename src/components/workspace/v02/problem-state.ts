import {
  SOURCE_BYTE_LIMIT,
  sourceByteLength,
  type LanguageCapability,
  type PlatformProblemDetail,
} from "@/lib/api/v02-schemas";

export { SOURCE_BYTE_LIMIT };
export const sourceByteCount = sourceByteLength;

export function sourceValidation(source: string) {
  if (!source.trim()) return "blank" as const;
  if (sourceByteCount(source) > SOURCE_BYTE_LIMIT) return "large" as const;
  return null;
}

export function problemHref(
  problemId: string,
  problemVersionId?: string | null,
) {
  const params = new URLSearchParams({ problemId });
  if (problemVersionId) params.set("problemVersionId", problemVersionId);
  return `/problems/detail?${params}`;
}

export function problemLanguages(
  problem: PlatformProblemDetail,
  languages: LanguageCapability[],
) {
  return languages.filter((language) =>
    problem.languageIds.includes(language.languageId),
  );
}

export function problemDraftKey(
  publicId: string,
  problem: PlatformProblemDetail,
  languageId: string,
) {
  const ref = problem.problemRef;
  return [
    "private",
    publicId,
    "v02",
    "source-draft",
    ref.source,
    ref.platform,
    ref.problemId,
    ref.problemVersionId,
    languageId,
  ] as const;
}

export type ProblemFilterValues = {
  q: string;
  tag: string;
  minDifficulty: string;
  maxDifficulty: string;
};
export const emptyProblemFilters: ProblemFilterValues = {
  q: "",
  tag: "",
  minDifficulty: "",
  maxDifficulty: "",
};

export function parseProblemFilters(values: ProblemFilterValues) {
  const q = values.q.trim();
  const tag = values.tag;
  if (q.length > 100) return { error: "keyword" as const };
  if (tag.length > 128) return { error: "tag" as const };
  const positiveInteger = (text: string) =>
    !text || (/^[1-9]\d*$/.test(text) && Number.isSafeInteger(Number(text)));
  if (
    !positiveInteger(values.minDifficulty) ||
    !positiveInteger(values.maxDifficulty)
  )
    return { error: "difficulty" as const };
  const minDifficulty = values.minDifficulty
    ? Number(values.minDifficulty)
    : undefined;
  const maxDifficulty = values.maxDifficulty
    ? Number(values.maxDifficulty)
    : undefined;
  if (
    minDifficulty !== undefined &&
    maxDifficulty !== undefined &&
    minDifficulty > maxDifficulty
  )
    return { error: "difficulty" as const };
  return {
    filters: {
      q: q || undefined,
      tag: tag || undefined,
      minDifficulty,
      maxDifficulty,
      status: "PUBLISHED" as const,
    },
  };
}
