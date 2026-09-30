// Synthetic data only; never copy a live learner response into this file.
export const profileFixture = {
  userId: 1,
  totalSolved: 0,
  averageDifficulty: 0,
  maxDifficulty: 0,
  recentActivity: { last_7_days: 0, last_30_days: 0 },
  updatedAt: "2026-01-02T03:04:05.123456789Z",
};

export const recommendationsFixture = {
  userId: 1,
  recommendations: [
    {
      problemId: 7,
      platform: "codeforces",
      externalProblemId: "synthetic-A",
      title: "",
      difficulty: null,
      tags: [],
      url: "https://example.invalid/problems/synthetic-A",
      reason: "Synthetic placeholder recommendation for tests.",
    },
  ],
  generatedAt: "2026-01-03T04:05:06+08:00",
};
