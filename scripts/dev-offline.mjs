import { spawn } from "node:child_process";
import { createMockBackend } from "../src/lib/mock/backend.mjs";

// Bind before starting Next: an occupied fixture port must fail, not be reused.
const backend = createMockBackend({
  scenario: process.env.MOCK_SCENARIO ?? "success",
});
await new Promise((resolve, reject) => {
  backend.once("error", reject);
  backend.listen(3210, "127.0.0.1", resolve);
});
function closeBackend() {
  backend.closeAllConnections();
  backend.close();
}

// Explicitly override .env.local; this preview must never select a live backend.
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, BACKEND_BASE_URL: "http://127.0.0.1:3210" },
  },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  closeBackend();
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  closeBackend();
  process.exitCode = code ?? 1;
});
