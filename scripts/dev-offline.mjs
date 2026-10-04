import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createMockBackend } from "../src/lib/mock/backend.mjs";

export async function startMockDevelopment({
  args = process.argv.slice(2),
  env = process.env,
} = {}) {
  const rawPort = env.MOCK_PORT ?? "0";
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port > 65535)
    throw new Error("MOCK_PORT must be an integer from 0 to 65535.");

  const scenario = env.MOCK_SCENARIO ?? "success";
  const backend = createMockBackend({ scenario });
  // Each dev process owns a new fixture. Never reuse another preview's state.
  try {
    await new Promise((resolve, reject) => {
      backend.once("error", reject);
      backend.listen(port, "127.0.0.1", resolve);
    });
  } catch (error) {
    if (error.code === "EADDRINUSE")
      throw new Error(
        `Mock fixture port ${port} is already in use. Stop that fixture or unset MOCK_PORT to select a free port.`,
      );
    throw error;
  }
  const origin = `http://127.0.0.1:${backend.address().port}`;
  console.log(`Mock fixture: ${origin}/__control (${scenario})`);

  // Explicitly override .env.local; this preview must never select a live backend.
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      ...args,
    ],
    { stdio: "inherit", env: { ...env, BACKEND_BASE_URL: origin } },
  );
  const signals = new Map(
    ["SIGINT", "SIGTERM"].map((signal) => [signal, () => child.kill(signal)]),
  );
  for (const [signal, handler] of signals) process.on(signal, handler);
  let closed = false;
  function cleanup() {
    if (closed) return;
    closed = true;
    for (const [signal, handler] of signals) process.off(signal, handler);
    backend.closeAllConnections();
    backend.close();
  }
  const done = new Promise((resolve) => {
    child.once("error", (error) => {
      cleanup();
      console.error(error.message);
      resolve(1);
    });
    child.once("exit", (code, signal) => {
      cleanup();
      resolve(code ?? (signal ? 0 : 1));
    });
  });
  return { backend, child, origin, done };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { done } = await startMockDevelopment();
    process.exitCode = await done;
  } catch (error) {
    console.error(`Unable to start Mock development: ${error.message}`);
    process.exitCode = 1;
  }
}
