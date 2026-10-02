import type {
  AnalysisDto,
  AnalysisWindow,
  OjAccountDto,
  RecommendationBatchDto,
  RecommendationMode,
  SyncJobDto,
  UserDto,
  ProblemDto,
  SubmissionDto,
} from "../api/schemas";

// Synthetic public Demo and test fixtures only. Never fall back to these in private queries.
export const fixtureUuid = (value: number) =>
  `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
export const demoUser: UserDto = {
  publicId: fixtureUuid(1),
  username: "demo_student",
  displayName: "Demo learner",
  email: "demo@example.invalid",
  avatarUrl: null,
  emailVerified: true,
  accountStatus: "ACTIVE",
  roles: ["STUDENT"],
  primaryRole: "STUDENT",
  locale: "zh-CN",
  timezone: "Asia/Shanghai",
};
export const demoAccounts: OjAccountDto[] = [
  "9007199254740993",
  "9007199254740995",
].map((accountId, index) => ({
  accountId,
  platform: "codeforces",
  username: index ? "DemoBeta" : "DemoAlpha",
  bindStatus: "ACTIVE",
  rating: index ? null : 1500,
  maxRating: index ? null : 1600,
  rank: null,
  maxRank: null,
  contribution: null,
  friendOfCount: null,
  firstName: null,
  lastName: null,
  country: null,
  city: null,
  organization: null,
  avatarUrl: null,
  titlePhotoUrl: null,
  registeredAt: null,
  lastOnlineAt: null,
  lastSyncedAt: "2026-10-02T02:30:00Z",
  lastSyncStatus: "SUCCESS",
  nextSyncAt: "2026-10-03T02:30:00Z",
  boundAt: index ? "2026-09-30T02:30:00Z" : "2026-10-01T02:30:00Z",
  unboundAt: null,
}));
export const demoUnbound: OjAccountDto = {
  ...demoAccounts[0],
  accountId: "9007199254740991",
  bindStatus: "UNBOUND",
  nextSyncAt: null,
  unboundAt: "2026-10-01T03:30:00Z",
};
export function demoAnalysis(
  accountId = demoAccounts[0].accountId,
  window: AnalysisWindow = "ALL",
  empty = false,
): AnalysisDto {
  const second = accountId === demoAccounts[1].accountId;
  const solved = empty ? 0 : second ? 1 : 2;
  const submissions = empty ? 0 : second ? 3 : 5;
  const failed = empty ? 0 : second ? 1 : 2;
  const pending = empty ? 0 : 1;
  const attempted = empty ? 0 : solved + 1;
  const codes = [
    "IMPLEMENTATION",
    "ALGORITHMS",
    "DATA_STRUCTURES",
    "DYNAMIC_PROGRAMMING",
    "GRAPHS",
    "MATH",
  ] as const;
  return {
    accountId,
    snapshotId: fixtureUuid(
      (second ? 20 : accountId === demoUnbound.accountId ? 30 : 10) +
        ["7D", "30D", "365D", "ALL"].indexOf(window),
    ),
    algorithmVersion: "demo-1",
    mappingVersion: "demo-1",
    timezone: "Asia/Shanghai",
    dataCutoffAt: "2026-10-02T02:30:00Z",
    sourceDataVersion: "1",
    createdAt: "2026-10-02T02:31:00Z",
    stale: false,
    window,
    period: {
      start:
        window === "ALL"
          ? null
          : (
              {
                "7D": "2026-09-25T16:00:00Z",
                "30D": "2026-09-02T16:00:00Z",
                "365D": "2025-10-02T16:00:00Z",
              } as const
            )[window],
      end: "2026-10-02T02:30:00Z",
    },
    summary: {
      attemptedProblemCount: attempted,
      solvedCount: solved,
      unsolvedProblemCount: empty ? 0 : 1,
      submissionCount: submissions,
      acceptedSubmissionCount: solved,
      failedSubmissionCount: failed,
      pendingSubmissionCount: pending,
      ratedSolvedCount: solved,
      unratedSolvedCount: 0,
      averageSolvedDifficulty: empty ? null : 1200,
      maxSolvedDifficulty: empty ? null : 1200,
      activeDays: empty ? 0 : 1,
    },
    currentRating: second ? null : 1500,
    maxRating: second ? null : 1600,
    overallScore: empty ? 0 : second ? 25 : 45,
    dimensions: codes.map((code, index) => ({
      code,
      name: [
        "Implementation",
        "Algorithms",
        "Data structures",
        "Dynamic programming",
        "Graphs",
        "Math",
      ][index],
      displayOrder: index + 1,
      score: empty ? 0 : 20 + index * 10,
      attemptedProblemCount: attempted,
      solvedCount: solved,
      submissionCount: submissions,
      averageSolvedDifficulty: empty ? null : 1200,
      rankOrder: index + 1,
    })),
    weakestDimension: "IMPLEMENTATION",
    tagStats: empty
      ? []
      : [
          {
            tag: "implementation",
            attemptedProblemCount: solved,
            solvedCount: solved,
            submissionCount: submissions - pending,
          },
        ],
    difficultyStats: empty
      ? []
      : [
          {
            difficulty: 1200,
            attemptedProblemCount: solved,
            solvedCount: solved,
          },
          { difficulty: null, attemptedProblemCount: 1, solvedCount: 0 },
        ],
    activityStats: empty
      ? []
      : [
          {
            date: "2026-10-01",
            submissionCount: submissions,
            acceptedSubmissionCount: solved,
            failedSubmissionCount: failed,
            pendingSubmissionCount: pending,
            solvedCount: solved,
          },
        ],
  };
}
export const demoProblem: ProblemDto = {
  problemId: "9007199254741993",
  platform: "codeforces" as const,
  externalProblemKey: "demo-A",
  title: "A Small Step",
  difficulty: 1200,
  points: null,
  tags: ["implementation"],
  solvedCount: 250,
  url: null,
  isGym: false,
  catalogSource: "CATALOG" as const,
};
export const demoGym: ProblemDto = {
  ...demoProblem,
  problemId: "9007199254741995",
  externalProblemKey: "gym-demo-B",
  solvedCount: null,
  title: null,
  difficulty: null,
  tags: [],
  isGym: true,
  catalogSource: "INFERRED" as const,
};
export function demoBatch(
  accountId = demoAccounts[0].accountId,
  mode: RecommendationMode = "HYBRID",
): RecommendationBatchDto {
  return {
    accountId,
    batchId: fixtureUuid(40 + ["LEVEL", "WEAKNESS", "HYBRID"].indexOf(mode)),
    analysisSnapshotId: demoAnalysis(accountId).snapshotId,
    mode,
    targetRating: 1200,
    targetDimension: mode === "WEAKNESS" ? "IMPLEMENTATION" : null,
    algorithmVersion: "demo-1",
    mappingVersion: "demo-1",
    candidateCount: 2,
    resultCount: 2,
    recommendations: [
      {
        rank: 1,
        problem: demoProblem,
        score: 0.8,
        reasonCode: "LEVEL_MATCH",
        reason: "这道题的难度与你当前训练水平接近。",
        matchedDimension: "IMPLEMENTATION",
        solvedSinceGeneration: false,
      },
      {
        rank: 2,
        problem: demoGym,
        score: 0.7,
        reasonCode: "DEFAULT_RECOMMENDATION",
        reason: "这道题适合作为下一道练习题。",
        matchedDimension: null,
        solvedSinceGeneration: false,
      },
    ],
    generatedAt: "2026-10-02T02:32:00Z",
    stale: false,
  };
}
export function demoJob(
  accountId = demoAccounts[0].accountId,
  status: SyncJobDto["status"] = "SUCCESS",
): SyncJobDto {
  return {
    jobId: fixtureUuid(60),
    accountId,
    scope: "ACCOUNT_FULL",
    triggerType: "MANUAL",
    status,
    stage:
      status === "QUEUED" ? null : status === "SUCCESS" ? "DONE" : "ANALYSIS",
    itemsFetched: status === "QUEUED" ? 0 : 5,
    itemsInserted: status === "QUEUED" ? 0 : 5,
    itemsUpdated: 0,
    errors:
      status === "PARTIAL"
        ? [
            {
              stage: "ANALYSIS",
              code: "ALGORITHM_UNAVAILABLE",
              message: "Synthetic analysis failure",
              retryable: true,
            },
          ]
        : [],
    requestedAt: "2026-10-02T02:29:00Z",
    startedAt: status === "QUEUED" ? null : "2026-10-02T02:29:01Z",
    finishedAt:
      status === "RUNNING" || status === "QUEUED"
        ? null
        : "2026-10-02T02:30:00Z",
  };
}

// Submission records, progress and summary describe the same synthetic dataset.
export const demoSecondProblem: ProblemDto = {
  ...demoProblem,
  problemId: "9007199254741997",
  externalProblemKey: "demo-C",
  title: "One More Step",
};
export const demoSolvedProblem: ProblemDto = {
  ...demoProblem,
  problemId: "9007199254741989",
  externalProblemKey: "demo-E",
  title: "First Practice",
};
export const demoCandidate: ProblemDto = {
  ...demoProblem,
  problemId: "9007199254741999",
  externalProblemKey: "demo-D",
  title: "A New Step",
};
export function demoSubmissions(
  accountId = demoAccounts[0].accountId,
): SubmissionDto[] {
  const second = accountId === demoAccounts[1].accountId;
  const records: [ProblemDto, SubmissionDto["verdict"]][] = second
    ? [
        [demoSecondProblem, "WRONG_ANSWER"],
        [demoSecondProblem, "ACCEPTED"],
        [demoGym, "PENDING"],
      ]
    : [
        [demoSolvedProblem, "WRONG_ANSWER"],
        [demoSolvedProblem, "ACCEPTED"],
        [demoSecondProblem, "WRONG_ANSWER"],
        [demoSecondProblem, "ACCEPTED"],
        [demoGym, "PENDING"],
      ];
  return records
    .map(([problem, verdict], index) => ({
      submissionId: [
        "9007199254742993",
        "9007199254742994",
        "9007199254742995",
        "9007199254742996",
        "9007199254742997",
      ][index],
      accountId,
      externalSubmissionId: [
        "9007199254743993",
        "9007199254743994",
        "9007199254743995",
        "9007199254743996",
        "9007199254743997",
      ][index],
      problem,
      verdict,
      verdictRaw:
        verdict === "PENDING" ? null : verdict === "ACCEPTED" ? "OK" : verdict,
      programmingLanguage: "GNU C++23",
      participantType: "CONTESTANT",
      memberHandles: problem.isGym
        ? ["DemoAlpha", "DemoBeta"]
        : [second ? "DemoBeta" : "DemoAlpha"],
      teamId: problem.isGym ? "1" : null,
      teamName: problem.isGym ? "Synthetic team" : null,
      testset: verdict === "PENDING" ? null : "TESTS",
      passedTestCount: verdict === "PENDING" ? null : 10,
      timeMs: verdict === "PENDING" ? null : 31,
      memoryBytes: 1048576,
      submittedAt:
        "2026-10-01T02:" + String(index * 5).padStart(2, "0") + ":00Z",
    }))
    .reverse();
}
