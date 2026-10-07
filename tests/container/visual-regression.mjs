// Runs reviewed production exports with an isolated, disposable Linux fixture.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, copyFile, writeFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const specName = "redesign-visual.spec.ts";

if (
  process.env.VISUAL_REGRESSION_PROBE === "1" &&
  process.argv.some((argument) => argument.startsWith("--update-snapshots"))
) {
  throw new Error("A structural probe cannot update reviewed baselines");
}

function command(binary, args, options = {}) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(binary, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code) => resolveCommand(code ?? 1));
  });
}

if (process.argv.includes("--inside")) {
  if (Number(process.versions.node.split(".")[0]) !== 24) {
    throw new Error(
      "The isolated fixture requires the project's Node24 engine",
    );
  }
  const root = await mkdtemp("/checks/visual-");
  const testDirectory = join(root, "tests/e2e");
  await mkdir(testDirectory, { recursive: true });
  await copyFile(`/repo/tests/e2e/${specName}`, join(testDirectory, specName));
  await copyFile(
    "/repo/tests/e2e/fixtures.ts",
    join(testDirectory, "fixtures.ts"),
  );
  const config = join(root, "playwright.config.ts");
  await writeFile(
    config,
    `import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "/evidence/results",
  snapshotPathTemplate: "/baselines/{arg}-{projectName}-{platform}{ext}",
  updateSnapshots: "none",
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "/evidence/report.json" }], ["html", { outputFolder: "/evidence/html", open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: { command: "node /repo/tests/gateway-server.mjs", cwd: "/repo", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 60000 },
});
`,
  );
  process.exitCode = await command(
    process.execPath,
    [
      "/checks/node_modules/playwright/cli.js",
      "test",
      "--config",
      config,
      ...process.argv.slice(2).filter((arg) => arg !== "--inside"),
    ],
    { cwd: root },
  );
} else {
  const image = process.env.VISUAL_REGRESSION_IMAGE;
  if (!image)
    throw new Error(
      "Set VISUAL_REGRESSION_IMAGE to the already-built Playwright1.63 test image",
    );
  const root = process.cwd();
  const baselineDirectory = resolve(root, `tests/e2e/${specName}-snapshots`);
  const evidenceDirectory = resolve(
    root,
    process.env.VISUAL_EVIDENCE_DIRECTORY ?? "test-results/visual/linux",
  );
  await mkdir(baselineDirectory, { recursive: true });
  await mkdir(evidenceDirectory, { recursive: true });
  const containerScript = `/repo/${relative(root, fileURLToPath(import.meta.url))}`;
  process.exitCode = await command("docker", [
    "run",
    "--rm",
    "--init",
    "--ipc=host",
    "--network=none",
    "--pull=never",
    "-v",
    `${root}:/repo:ro`,
    "-v",
    `${baselineDirectory}:/baselines`,
    "-v",
    `${evidenceDirectory}:/evidence`,
    ...(process.env.VISUAL_REGRESSION_PROBE === "1"
      ? ["-e", "VISUAL_REGRESSION_PROBE=1"]
      : []),
    image,
    "node",
    containerScript,
    "--inside",
    ...process.argv.slice(2),
  ]);
}
