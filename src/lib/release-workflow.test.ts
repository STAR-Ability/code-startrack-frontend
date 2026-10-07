// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const image = "ghcr.example.invalid/example/code-startrack-frontend";
const version = "v0.0.0-release-test";
const commit = "a".repeat(40);
const digest = `sha256:${"b".repeat(64)}`;
const versionRef = `${image}:${version}`;
const commitRef = `${image}:sha-${commit}`;
const latestRef = `${image}:latest`;
const descriptor = JSON.stringify({ Descriptor: { digest } });

type StubResult = { status: number; stdout?: string; stderr?: string };
type FixtureConfig = {
  versionLookup: StubResult;
  commitLookup: StubResult;
  versionManifest: StubResult;
  commitManifest: StubResult;
  failure?: "build" | "container" | "commit" | "version" | "latest";
};
type Call = { command: string; args: string[]; containerImage: string | null };

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}
function stubResponse(result: StubResult) {
  return `printf '%s' ${shellQuote(result.stdout ?? "")}
printf '%s' ${shellQuote(result.stderr ?? "")} >&2
exit ${result.status}`;
}

const workflow = readFileSync(
  new URL("../../.github/workflows/release.yml", import.meta.url),
  "utf8",
);
const stepHeading = "      - name: Build and publish immutable main image\n";
const stepStart = workflow.indexOf(stepHeading);
const stepEnd = workflow.indexOf("\n      - ", stepStart + stepHeading.length);
const runHeading = "        run: |\n";
const runStart = workflow.indexOf(runHeading, stepStart);
if (stepStart < 0 || runStart < 0 || stepEnd < runStart) {
  throw new Error("Cannot locate the production publication shell step.");
}
const publicationShell = workflow
  .slice(runStart + runHeading.length, stepEnd)
  .split("\n")
  .map((line) => {
    if (!line.trim()) return "";
    if (!line.startsWith("          ")) {
      throw new Error("Unexpected publication shell indentation.");
    }
    return line.slice(10);
  })
  .join("\n");

function runPublication(overrides: Partial<FixtureConfig> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "codestartrack-release-test-"));
  const bin = join(directory, "bin");
  const callLog = join(directory, "calls.bin");
  const summaryPath = join(directory, "summary.md");
  const config: FixtureConfig = {
    versionLookup: { status: 1, stderr: "manifest unknown\n" },
    commitLookup: { status: 1, stderr: "manifest unknown\n" },
    versionManifest: { status: 0, stdout: descriptor },
    commitManifest: { status: 0, stdout: descriptor },
    ...overrides,
  };
  try {
    mkdirSync(bin);
    symlinkSync(process.execPath, join(bin, "node"));
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ version: version.slice(1) }),
    );
    const stub = `#!/bin/bash
set -euo pipefail
command="\${0##*/}"
printf '%s\\0' "$command" "$#" "\${CONTAINER_TEST_IMAGE-}" "$@" >> "$RELEASE_TEST_CALL_LOG"
if [[ "$command" == "pnpm" && "$#" == 1 && "$1" == "test:container" ]]; then
  exit ${config.failure === "container" ? 1 : 0}
fi
if [[ "$command" == "docker" && "\${1-}" == "manifest" && "\${2-}" == "inspect" ]]; then
  case "\${@: -1}" in
    ${shellQuote(versionRef)})
      if [[ "\${3-}" == "--verbose" ]]; then
        ${stubResponse(config.versionManifest)}
      else
        ${stubResponse(config.versionLookup)}
      fi ;;
    ${shellQuote(commitRef)})
      if [[ "\${3-}" == "--verbose" ]]; then
        ${stubResponse(config.commitManifest)}
      else
        ${stubResponse(config.commitLookup)}
      fi ;;
    *) exit 99 ;;
  esac
fi
if [[ "$command" == "docker" && "\${1-}" == "build" ]]; then
  exit ${config.failure === "build" ? 1 : 0}
fi
if [[ "$command" == "docker" && "$#" == 2 && "$1" == "push" ]]; then
  case "$2" in
    ${shellQuote(versionRef)}) exit ${config.failure === "version" ? 1 : 0} ;;
    ${shellQuote(commitRef)}) exit ${config.failure === "commit" ? 1 : 0} ;;
    ${shellQuote(latestRef)}) exit ${config.failure === "latest" ? 1 : 0} ;;
    *) exit 99 ;;
  esac
fi
printf '%s' 'Unexpected isolated release command.' >&2
exit 99
`;
    for (const command of ["docker", "pnpm"]) {
      writeFileSync(join(bin, command), stub, { mode: 0o700 });
    }
    const result = spawnSync(
      "/bin/bash",
      ["--noprofile", "--norc", "-c", publicationShell],
      {
        cwd: directory,
        // No inherited credentials or fallback to real Docker/pnpm binaries.
        env: {
          PATH: bin,
          NODE_ENV: "test",
          LC_ALL: "C",
          IMAGE: image,
          GITHUB_SHA: commit,
          GITHUB_SERVER_URL: "https://github.example.invalid",
          GITHUB_REPOSITORY: "example/code-startrack-frontend",
          GITHUB_STEP_SUMMARY: summaryPath,
          RELEASE_TEST_CALL_LOG: callLog,
        },
        encoding: "utf8",
        timeout: 10_000,
      },
    );
    const fields = existsSync(callLog)
      ? readFileSync(callLog, "utf8").split("\0").slice(0, -1)
      : [];
    const calls: Call[] = [];
    for (let offset = 0; offset < fields.length;) {
      const command = fields[offset++];
      const argumentCount = Number(fields[offset++]);
      const containerImage = fields[offset++] || null;
      const args = fields.slice(offset, offset + argumentCount);
      offset += argumentCount;
      calls.push({ command, args, containerImage });
    }
    const summary = existsSync(summaryPath)
      ? readFileSync(summaryPath, "utf8")
      : "";
    return { ...result, calls, summary };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const successfulCommands = [
  ["docker", "manifest", "inspect", versionRef],
  ["docker", "manifest", "inspect", commitRef],
  ["docker", "build"],
  ["pnpm", "test:container"],
  ["docker", "push", commitRef],
  ["docker", "push", versionRef],
  ["docker", "manifest", "inspect", "--verbose", versionRef],
  ["docker", "manifest", "inspect", "--verbose", commitRef],
  ["docker", "push", latestRef],
];
function commands(calls: Call[]) {
  return calls.map(({ command, args }) => [
    command,
    ...(args[0] === "build" ? ["build"] : args),
  ]);
}
function expectStopped(result: ReturnType<typeof runPublication>) {
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.summary).toBe("");
}

describe("production image publication shell", () => {
  it("accepts two explicitly absent tags and publishes latest only after matching valid digests", () => {
    const result = runPublication();
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(commands(result.calls)).toEqual(successfulCommands);
    expect(result.calls[2].args).toEqual([
      "build",
      "--pull",
      "--label",
      "org.opencontainers.image.source=https://github.example.invalid/example/code-startrack-frontend",
      "--label",
      `org.opencontainers.image.revision=${commit}`,
      "--label",
      `org.opencontainers.image.version=${version}`,
      "--tag",
      versionRef,
      "--tag",
      commitRef,
      "--tag",
      latestRef,
      ".",
    ]);
    expect(result.calls[3].containerImage).toBe(versionRef);
    expect(result.summary).toBe(
      `Published ${versionRef}, ${commitRef} and ${latestRef}\nDigest: ${image}@${digest}\nSource commit: ${commit}\n`,
    );
  });

  it.each(["versionLookup", "commitLookup"] as const)(
    "refuses an existing %s before building or pushing",
    (lookup) => {
      const result = runPublication({ [lookup]: { status: 0, stdout: "{}" } });
      expectStopped(result);
      expect(commands(result.calls)).toEqual(
        successfulCommands.slice(0, lookup === "versionLookup" ? 1 : 2),
      );
      expect(result.stderr).toContain("already exists");
    },
  );

  it.each(
    (["versionLookup", "commitLookup"] as const).flatMap((lookup) =>
      [
        { status: 1, stderr: "unauthorized: authentication required\n" },
        { status: 1, stderr: "dial tcp: network unreachable\n" },
        { status: 1, stderr: "manifest unknown\nunauthorized\n" },
        { status: 1, stderr: "no such manifest\n" },
        { status: 1 },
        { status: 1, stdout: "manifest unknown\n" },
      ].map((outcome) => ({ lookup, outcome })),
    ),
  )("fails closed for uncertain $lookup: $outcome", ({ lookup, outcome }) => {
    const result = runPublication({ [lookup]: outcome });
    expectStopped(result);
    expect(commands(result.calls)).toEqual(
      successfulCommands.slice(0, lookup === "versionLookup" ? 1 : 2),
    );
    expect(result.stderr).toContain("Cannot confirm");
  });

  it.each([
    { failure: "build", count: 3 },
    { failure: "container", count: 4 },
    { failure: "commit", count: 5 },
    { failure: "version", count: 6 },
    { failure: "latest", count: 9 },
  ] as const)("stops after a $failure failure", ({ failure, count }) => {
    const result = runPublication({ failure });
    expectStopped(result);
    expect(commands(result.calls)).toEqual(successfulCommands.slice(0, count));
  });

  it.each(
    (["versionManifest", "commitManifest"] as const).flatMap((manifest) =>
      [
        "not JSON",
        "null",
        "{}",
        JSON.stringify({ Descriptor: { digest: null } }),
        JSON.stringify({ Descriptor: { digest: `sha256:${"B".repeat(64)}` } }),
        JSON.stringify({ Descriptor: { digest: `sha256:${"b".repeat(63)}` } }),
        JSON.stringify({ Descriptor: { digest: `sha512:${"b".repeat(64)}` } }),
      ].map((stdout) => ({ manifest, stdout })),
    ),
  )(
    "rejects an invalid $manifest descriptor: $stdout",
    ({ manifest, stdout }) => {
      const result = runPublication({ [manifest]: { status: 0, stdout } });
      expectStopped(result);
      expect(commands(result.calls)).toEqual(
        successfulCommands.slice(0, manifest === "versionManifest" ? 7 : 8),
      );
      expect(result.stderr).toMatch(
        /invalid (manifest descriptor|image digest)/,
      );
    },
  );

  it.each(["versionManifest", "commitManifest"] as const)(
    "rejects a failed %s command even when its output is a valid digest",
    (manifest) => {
      const result = runPublication({
        [manifest]: { status: 1, stdout: descriptor },
      });
      expectStopped(result);
      expect(commands(result.calls)).toEqual(
        successfulCommands.slice(0, manifest === "versionManifest" ? 7 : 8),
      );
    },
  );

  it("refuses different valid version and commit digests before advancing latest", () => {
    const result = runPublication({
      commitManifest: {
        status: 0,
        stdout: JSON.stringify({
          Descriptor: { digest: `sha256:${"c".repeat(64)}` },
        }),
      },
    });
    expectStopped(result);
    expect(commands(result.calls)).toEqual(successfulCommands.slice(0, 8));
    expect(result.stderr).toContain("different digests");
  });
});
