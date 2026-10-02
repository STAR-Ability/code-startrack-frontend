// Offline only: no environment file can select a real backend.
import { createFrontendServer } from "../scripts/start.mjs";
import { createMockBackend } from "../src/lib/mock/backend.mjs";
const backend = createMockBackend({
  scenario: process.env.MOCK_SCENARIO ?? "success",
});
const frontend = createFrontendServer({ upstream: "http://127.0.0.1:3210" });
await new Promise((resolve, reject) => {
  backend.once("error", reject);
  backend.listen(3210, "127.0.0.1", resolve);
});
try {
  await new Promise((resolve, reject) => {
    frontend.once("error", reject);
    frontend.listen(3100, "127.0.0.1", resolve);
  });
} catch (error) {
  backend.close();
  throw error;
}
console.log(
  `Mock preview: http://127.0.0.1:3100 (${process.env.MOCK_SCENARIO ?? "success"})`,
);
function stop() {
  for (const server of [frontend, backend]) {
    server.closeAllConnections();
    server.close();
  }
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
