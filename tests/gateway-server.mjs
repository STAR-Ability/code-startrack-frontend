// Offline only: no environment file can select a real backend.
import { createFrontendServer } from "../scripts/start.mjs";
import { createMockBackend } from "./mock-backend.mjs";
const backend = createMockBackend();
const frontend = createFrontendServer({ upstream: "http://127.0.0.1:3210" });
backend.listen(3210, "127.0.0.1");
frontend.listen(3100, "127.0.0.1");
function stop() {
  for (const server of [frontend, backend]) {
    server.closeAllConnections();
    server.close();
  }
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
