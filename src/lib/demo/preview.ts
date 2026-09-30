// Illustrative landing-only fixtures. Never used by the gateway or learner queries.
export const previewProfile = {
  solved: 156,
  averageDifficulty: 1420,
  recentActivity: 24,
};
export const previewProblems = [
  {
    id: "01",
    title: "Two Sum",
    difficulty: 800,
    tags: ["implementation", "math"],
    day: 1,
  },
  {
    id: "02",
    title: "A Path Through the Graph",
    difficulty: 1200,
    tags: ["graphs", "dfs"],
    day: 8,
  },
  {
    id: "03",
    title: "One More Possibility",
    difficulty: 1600,
    tags: ["dp", "greedy"],
    day: 15,
  },
] as const;
