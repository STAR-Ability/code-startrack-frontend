import { existsSync } from "node:fs";
import { createServer, request } from "node:http";
import { createMockBackend } from "../mock-backend.mjs";

// The shared Mock API deliberately permits loopback only. Keep that guard and
// expose a relay solely inside the test Compose project's internal network.
if (!existsSync("/.dockerenv")) {
  throw new Error("The container fixture relay must run inside Docker");
}
await new Promise((resolve, reject) => {
  createMockBackend().once("error", reject).listen(3210, "127.0.0.1", resolve);
});
createServer((incoming, outgoing) => {
  const upstream = request(
    {
      hostname: "127.0.0.1",
      port: 3210,
      path: incoming.url,
      method: incoming.method,
      headers: incoming.headers,
    },
    (response) => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    },
  );
  upstream.on("error", () => {
    outgoing.writeHead(502);
    outgoing.end();
  });
  incoming.pipe(upstream);
}).listen(8081, "0.0.0.0");
