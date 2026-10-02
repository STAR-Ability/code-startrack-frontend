// Server-only scenarios. Never select synthetic data from a failed live request.
export const mockScenarios = {
  success: {},
  visitor: { loggedOut: true },
  "no-accounts": { noAccounts: true },
  empty: { emptyRecords: true, zero: true, emptyCandidates: true },
  "not-generated": { noAnalysis: true, noBatch: true },
  stale: { stale: true },
  partial: { partial: true, nextAction: "SYNC" },
  running: { keepRunning: true, nextAction: "SYNC" },
  invalid: { invalid: true },
  completed: { completed: true },
  error: { failReads: true },
  slow: { delayMs: 1500 },
};

export function scenarioConfig(name) {
  if (!Object.hasOwn(mockScenarios, name))
    throw new Error(`Unknown Mock scenario: ${name}`);
  return structuredClone(mockScenarios[name]);
}
