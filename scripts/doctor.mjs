import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url)),
);
let failures = 0;
function check(label, command, args, required = true) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 30_000,
  });
  const ok = result.status === 0;
  console.log(
    `${ok ? "PASS" : required ? "FAIL" : "NOTE"} ${label}: ${(result.stdout || result.stderr || result.error?.message || "unavailable").trim()}`,
  );
  if (!ok && required) failures++;
  return result.stdout?.trim();
}
console.log(
  `Platform ${process.platform}/${process.arch}; Node ${process.version}; required ${pkg.engines.node}`,
);
if (Number(process.versions.node.split(".")[0]) !== 24) failures++;
const pnpmVersion = check(`pnpm (expected ${pkg.packageManager})`, "pnpm", [
  "--version",
]);
if (pnpmVersion !== pkg.packageManager.split("@")[1]) {
  console.error("FAIL pnpm version does not match packageManager");
  failures++;
}
check("Git", "git", ["--version"]);
check("Codex", "codex", ["--version"]);
check("Codex login", "codex", ["login", "status"]);
check("Project MCP discovery (not a connection test)", "codex", [
  "mcp",
  "list",
]);
check("GitHub CLI", process.execPath, ["scripts/gh.mjs", "--version"], false);
check(
  "GitHub authentication (manual)",
  process.execPath,
  ["scripts/gh.mjs", "auth", "status"],
  false,
);
const browser = chromium.executablePath();
console.log(
  `${existsSync(browser) ? "PASS" : "FAIL"} Playwright Chromium binary: ${browser}`,
);
if (!existsSync(browser)) failures++;
for (const entry of readdirSync(".agents/skills", { withFileTypes: true })) {
  if (
    entry.isDirectory() &&
    existsSync(`.agents/skills/${entry.name}/SKILL.md`)
  ) {
    console.log(
      `SKILL .agents/skills/${entry.name}/SKILL.md (restart Codex after changes)`,
    );
  }
}
console.log(
  "Browser launch, MCP connections and actual Skill discovery require the smoke checks documented in docs/development/codex-cli.md.",
);
process.exitCode = failures ? 1 : 0;
