import type {
  SubmissionView,
  StaticAnalysisResult,
  SubmissionAnalysisView,
} from "@/lib/api/v02-schemas";

export function exampleSubmission(
  overrides: Partial<SubmissionView> = {},
): SubmissionView {
  return {
    submissionId: "90071992547409939999",
    problem: {
      problemRef: {
        source: "PLATFORM",
        platform: "startrack",
        problemId: "101",
        problemVersionId: "20000000-0000-4000-8000-000000000001",
      },
      title: "A platform problem",
      difficulty: null,
      difficultyScale: "UNRATED",
      tags: [],
      url: null,
    },
    languageId: "cpp17",
    judgeTaskId: "30000000-0000-4000-8000-000000000001",
    judgeStatus: "COMPLETED",
    judgeRevision: 8,
    judgeResult: {
      verdict: "AC",
      timeMs: 0,
      memoryBytes: 1048576,
      passedTestCount: 8,
      totalTestCount: 8,
      score: null,
      compileLog: null,
      diagnosticCode: null,
      judgedAt: "2026-10-07T02:30:00Z",
    },
    judgeError: null,
    analysisId: "40000000-0000-4000-8000-000000000001",
    analysisStatus: "PARTIAL",
    analysisRevision: 5,
    analysisError: null,
    submittedAt: "2026-10-07T02:29:00Z",
    updatedAt: "2026-10-07T02:30:00Z",
    ...overrides,
  };
}

export function exampleAnalysisResult(): StaticAnalysisResult {
  return {
    schemaVersion: "0.2.0",
    analysisId: "40000000-0000-4000-8000-000000000001",
    submissionId: "90071992547409939999",
    sourceSha256: "a".repeat(64),
    languageId: "cpp17",
    toolchainVersion: "toolchain-0.2",
    resultHash: "b".repeat(64),
    metrics: {
      sourceLines: 20,
      functionCount: 2,
      maxCyclomaticComplexity: 5,
      meanCyclomaticComplexity: 3.5,
      duplicateLines: 0,
      maintainabilityIndex: null,
    },
    findings: [
      {
        findingId: "risk-1",
        tool: "clang-tidy",
        ruleId: "bugprone-branch-clone",
        severity: "WARNING",
        category: "BUG_RISK",
        message: "Check this repeated branch.",
        file: "main.cpp",
        startLine: 1,
        endLine: 3,
        column: 2,
      },
    ],
    tools: [
      {
        tool: "Lizard",
        version: "1.17",
        configSha256: "c".repeat(64),
        status: "SUCCEEDED",
        durationMs: 20,
        error: null,
      },
      {
        tool: "Infer",
        version: "1.2",
        configSha256: "d".repeat(64),
        status: "FAILED",
        durationMs: 30,
        error: {
          code: "TOOL_TIMEOUT",
          message: "Infer timed out.",
          retryable: true,
        },
      },
      {
        tool: "CPD",
        version: "7.0",
        configSha256: "e".repeat(64),
        status: "SKIPPED",
        durationMs: 0,
        error: {
          code: "TOOL_UNSUPPORTED",
          message: "Tool unavailable for this language.",
          retryable: false,
        },
      },
    ],
    reproducibility: {
      imageDigest: "sha256:" + "f".repeat(64),
      configSha256: "c".repeat(64),
      sourceSha256: "a".repeat(64),
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

export function exampleAnalysis(
  overrides: Partial<SubmissionAnalysisView> = {},
): SubmissionAnalysisView {
  return {
    analysisId: "40000000-0000-4000-8000-000000000001",
    status: "PARTIAL",
    revision: 5,
    result: exampleAnalysisResult(),
    error: null,
    ...overrides,
  };
}
