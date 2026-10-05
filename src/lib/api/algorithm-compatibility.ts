// Audited against the deployed Backend constants and Algorithm /health capability list.
// Unlisted versions remain renderable after structural validation.
const knownVersions = {
  "account-profile": ["profile-v0.11.1", "profile-v0.13.0", "profile-v0.13.1"],
  "user-profile": [
    "user-profile-v0.12.1",
    "user-profile-v0.13.0",
    "user-profile-v0.13.1",
  ],
  "team-profile": ["team-profile-v0.12.1"],
  "account-recommendation": ["recommend-v0.11.1", "recommend-v0.12.0"],
  "team-recommendation": ["team-recommend-v0.12.1"],
  "personal-report": ["personal-report-v0.12.1"],
} satisfies Record<string, readonly string[]>;

export type AlgorithmFamily = keyof typeof knownVersions;
export type AlgorithmCompatibility = "known" | "unknown";

export function classifyAlgorithmVersion(
  version: string,
  family: AlgorithmFamily,
): AlgorithmCompatibility {
  const versions: readonly string[] = knownVersions[family];
  return versions.includes(version) ? "known" : "unknown";
}
