import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const portable = fileURLToPath(new URL("../.tools/gh/bin/gh", import.meta.url));
const result = spawnSync(
  existsSync(portable) ? portable : "gh",
  process.argv.slice(2),
  {
    stdio: "inherit",
  },
);
if (result.error) {
  console.error(
    "GitHub CLI is unavailable. See docs/development/codex-cli.md.",
  );
}
process.exitCode = result.status ?? 1;
