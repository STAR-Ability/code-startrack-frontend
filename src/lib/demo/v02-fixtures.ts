import type {
  LanguageCapabilities,
  LearningProfile,
  LearningRecommendationBatch,
  PlatformProblemDetail,
  ProblemSummary,
  StaticAnalysisResult,
  SubmissionView,
} from "../api/v02-schemas";
import { demoAnalysis, demoUser, fixtureUuid } from "./fixtures.ts";

// Public synthetic evidence for previews and the isolated offline HTTP service.
export const v02SourceCode =
  '#include <iostream>\nint main() {\n  long long a, b;\n  std::cin >> a >> b;\n  std::cout << a + b << "\\n";\n}\n';
export const v02Instant = "2026-10-07T02:30:00Z";
export const v02Languages: LanguageCapabilities = {
  capabilityVersion: "a".repeat(64),
  languages: [
    {
      languageId: "cpp17",
      displayName: "GNU C++17",
      languageFamily: "C++",
      compilerVersion: "GCC 13.2.0",
      sourceFilename: "main.cpp",
      analysisSupported: true,
    },
    {
      languageId: "c11",
      displayName: "GNU C11",
      languageFamily: "C",
      compilerVersion: "GCC 13.2.0",
      sourceFilename: "main.c",
      analysisSupported: false,
    },
  ],
};

export const v02Problems: PlatformProblemDetail[] = [
  ["9007199254741993", "Sum of Two Integers", 800, "PUBLISHED"],
  ["9007199254741994", "Unique Values", null, "PUBLISHED"],
  ["9007199254741995", "Historical Counting", 1000, "WITHDRAWN"],
  ["9007199254741996", "Draft Graph Walk", null, "DRAFT"],
].map(([id, title, difficulty, status], index) => ({
  problemRef: {
    source: "PLATFORM",
    platform: "startrack",
    problemId: String(id),
    problemVersionId: fixtureUuid(2000 + index),
  },
  title: String(title),
  difficulty: typeof difficulty === "number" ? difficulty : null,
  difficultyScale: difficulty === null ? "UNRATED" : "PLATFORM_RATING",
  tags:
    index === 1 ? ["data structures", "implementation"] : ["implementation"],
  url: null,
  status: status as PlatformProblemDetail["status"],
  catalogVersion: "12",
  timeLimitMs: 1000,
  memoryLimitBytes: 268435456,
  languageIds: ["cpp17", "c11"],
  updatedAt: `2026-10-07T02:${String(30 - index).padStart(2, "0")}:00Z`,
  statement: {
    format: "MARKDOWN",
    content:
      index === 0
        ? "# Sum of Two Integers\n\nRead two integers and print their sum.\n\nFor example, `2 + 3 = 5`.\n\n**Constraint:** −10⁹ ≤ a, b ≤ 10⁹."
        : "# Unique Values\n\nRead **n** integers and count the distinct values.\n\nUse any correct method; samples do not describe hidden test coverage.",
    input:
      index === 0
        ? "Two integers a and b."
        : "An integer n, followed by n integers.",
    output:
      index === 0 ? "Print a + b." : "Print the number of distinct values.",
  },
  samples:
    index === 0
      ? [{ input: "2 3\n", output: "5\n" }]
      : [{ input: "4\n1 2 1 3\n", output: "3\n" }],
  license: {
    spdxId: "CC0-1.0",
    notice:
      "Synthetic test problem dedicated to the public domain. This fixture is not an imported upstream package.",
    sourceUrl: "https://github.com/oj-lab/problem-packages",
  },
}));

export const v02UnsafeStatement = `${v02Problems[0].statement.content}\n\n<script>alert('unsafe fixture')</script>\n\n[Unsafe link](javascript:alert(1))`;

export function v02ProblemSummary(problem: ProblemSummary): ProblemSummary {
  return {
    problemRef: structuredClone(problem.problemRef),
    title: problem.title,
    difficulty: problem.difficulty,
    difficultyScale: problem.difficultyScale,
    tags: [...problem.tags],
    url: problem.url,
  };
}

// Deliberately overlaps the first local ID to exercise owner namespaces.
export const v02ExternalProblem: ProblemSummary = {
  problemRef: {
    source: "EXTERNAL",
    platform: "codeforces",
    problemId: v02Problems[0].problemRef.problemId,
    problemVersionId: null,
  },
  title: "A Small Step",
  difficulty: 1200,
  difficultyScale: "CF_RATING",
  tags: ["implementation"],
  url: "https://codeforces.com/problemset/problem/4/A",
};

export function v02Submission(
  submissionId = "9007199254748001",
  options: Partial<SubmissionView> = {},
): SubmissionView {
  return {
    submissionId,
    problem: v02ProblemSummary(v02Problems[0]),
    languageId: "cpp17",
    judgeTaskId: fixtureUuid(2100),
    judgeStatus: "COMPLETED",
    judgeRevision: 4,
    judgeResult: {
      verdict: "AC",
      timeMs: 12,
      memoryBytes: 1048576,
      passedTestCount: 12,
      totalTestCount: 12,
      score: null,
      compileLog: null,
      diagnosticCode: null,
      judgedAt: v02Instant,
    },
    judgeError: null,
    analysisId: fixtureUuid(2200),
    analysisStatus: "SUCCEEDED",
    analysisRevision: 3,
    analysisError: null,
    submittedAt: "2026-10-07T02:25:00Z",
    updatedAt: v02Instant,
    ...options,
  };
}

export function v02Analysis(
  submissionId = "9007199254748001",
  analysisId = fixtureUuid(2200),
  partial = false,
): StaticAnalysisResult {
  return {
    schemaVersion: "0.2.0",
    analysisId,
    submissionId,
    sourceSha256: "b".repeat(64),
    languageId: "cpp17",
    toolchainVersion: "static-v0.2.1",
    resultHash: "c".repeat(64),
    metrics: {
      sourceLines: 7,
      functionCount: 1,
      maxCyclomaticComplexity: 1,
      meanCyclomaticComplexity: 1,
      duplicateLines: partial ? null : 0,
      maintainabilityIndex: null,
    },
    findings: [
      {
        findingId: "synthetic-clang-tidy-1",
        tool: "clang-tidy",
        ruleId: "readability-identifier-length",
        severity: "WARNING",
        category: "STYLE",
        message: "Consider a descriptive variable name.",
        file: "main.cpp",
        startLine: 3,
        endLine: 3,
        column: 13,
      },
    ],
    tools: ["Lizard", "clang-tidy", "Infer", "CPD"].map((tool) => ({
      tool,
      version: tool === "Lizard" ? "1.17.10" : "synthetic-1.0",
      configSha256: "d".repeat(64),
      status: partial && tool === "CPD" ? "FAILED" : "SUCCEEDED",
      durationMs: 25,
      error:
        partial && tool === "CPD"
          ? {
              code: "TOOL_TIMEOUT",
              message: "Synthetic CPD timeout",
              retryable: true,
            }
          : null,
    })),
    reproducibility: {
      imageDigest: `sha256:${"e".repeat(64)}`,
      configSha256: "d".repeat(64),
      sourceSha256: "b".repeat(64),
    },
    synthesis: {
      status: "NOT_REQUESTED",
      provider: null,
      model: null,
      promptVersion: null,
      content: null,
      error: null,
    },
  };
}

export function v02LearningProfile(
  window: LearningProfile["window"] = "ALL",
  empty = false,
): LearningProfile {
  const previous = demoAnalysis(undefined, window, empty);
  return {
    window,
    currentRating: previous.currentRating,
    maxRating: previous.maxRating,
    overallScore: previous.overallScore,
    dimensions: previous.dimensions,
    weakestDimension: previous.weakestDimension,
    tagStats: previous.tagStats,
    activityStats: previous.activityStats,
    stale: false,
    publicId: demoUser.publicId,
    snapshotId: fixtureUuid(
      2300 + ["7D", "30D", "365D", "ALL"].indexOf(window),
    ),
    profileJobId: fixtureUuid(2310),
    sourceFingerprint: "f".repeat(64),
    algorithmVersion: "learning-profile-v0.2.1",
    mappingVersion: "mapping-v0.11.1",
    timezone: "Asia/Shanghai",
    dataCutoffAt: v02Instant,
    createdAt: v02Instant,
    period: {
      start:
        window === "ALL"
          ? null
          : {
              "7D": "2026-09-30T16:00:00Z",
              "30D": "2026-09-07T16:00:00Z",
              "365D": "2025-10-07T16:00:00Z",
            }[window],
      end: v02Instant,
    },
    difficultyStats: empty
      ? []
      : [
          {
            difficulty: 1200,
            difficultyScale: "CF_RATING",
            attemptedProblemCount: 1,
            solvedCount: 1,
          },
          {
            difficulty: 800,
            difficultyScale: "PLATFORM_RATING",
            attemptedProblemCount: 1,
            solvedCount: 1,
          },
          {
            difficulty: null,
            difficultyScale: "UNRATED",
            attemptedProblemCount: 1,
            solvedCount: 0,
          },
        ],
    summary: {
      ...previous.summary,
      ratedSolvedCount: empty ? 0 : 1,
      unratedSolvedCount: empty ? 0 : 1,
    },
    sources: {
      platformSubmissionCount: empty ? 0 : 2,
      externalSubmissionCount: empty ? 0 : 3,
      codeAnalysisCount: empty ? 0 : 1,
      sourceAccountIds: [],
    },
    codeQuality: {
      analyzedSubmissionCount: empty ? 0 : 1,
      warningCount: empty ? 0 : 1,
      errorCount: 0,
      maxCyclomaticComplexity: empty ? null : 1,
    },
  };
}

export function v02RecommendationBatch(
  source: LearningRecommendationBatch["source"] = "ALL",
  mode: LearningRecommendationBatch["mode"] = "HYBRID",
): LearningRecommendationBatch {
  const problems: ProblemSummary[] = [
    v02ProblemSummary(v02Problems[0]),
    v02ExternalProblem,
    v02ProblemSummary(v02Problems[1]),
  ].filter(
    (problem) => source === "ALL" || problem.problemRef.source === source,
  );
  return {
    batchId: fixtureUuid(
      2400 +
        ["ALL", "PLATFORM", "EXTERNAL"].indexOf(source) * 3 +
        ["LEVEL", "WEAKNESS", "HYBRID"].indexOf(mode),
    ),
    analysisSnapshotId: v02LearningProfile().snapshotId,
    sourceFingerprint: "f".repeat(64),
    source,
    mode,
    algorithmVersion: "learning-recommend-v0.2.1",
    mappingVersion: "mapping-v0.11.1",
    candidateCount: problems.length,
    resultCount: problems.length,
    recommendations: problems.map((problem, index) => ({
      rank: index + 1,
      problem,
      score: 0.95 - index * 0.1,
      reasonCode:
        problem.difficultyScale === "UNRATED"
          ? "DEFAULT_RECOMMENDATION"
          : mode === "WEAKNESS"
            ? "WEAK_DIMENSION_MATCH"
            : "BALANCED_PRACTICE",
      reason:
        problem.difficultyScale === "CF_RATING"
          ? "Practice implementation at a comparable CF rating."
          : "Platform difficulty is a separate scale; selected for implementation practice.",
      matchedDimension: "IMPLEMENTATION",
      solvedSinceGeneration: false,
    })),
    generatedAt: v02Instant,
    stale: false,
  };
}
