// Offline integration harness only. Every Next process gets an explicit local
// upstream; an ignored local .env file can never select the live backend here.
import { createServer } from "node:http";
import { spawn } from "node:child_process";

import { profileFixture, recommendationsFixture } from "./api-fixtures.mts";

const children = [];
const upstreams = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  for (const server of upstreams) {
    server.closeAllConnections();
    server.close();
  }
  process.exitCode = code;
  const deadline = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
  }, 3_000);
  deadline.unref();
}

process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());

try {
  for (const [index, upstreamPort] of [3210, 3211].entries()) {
    let mode = "success";
    let calls = [];
    const origin = `http://127.0.0.1:${upstreamPort}`;
    const server = createServer(async (request, response) => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      response.setHeader("Content-Type", "application/json");
      // Test control stays outside the Next app and its forwarded request log.
      if (request.url === "/__control") {
        if (request.method === "POST") {
          mode = JSON.parse(body).mode;
          calls = [];
        }
        response.end(JSON.stringify({ mode, calls }));
        return;
      }
      calls.push({
        method: request.method,
        path: request.url,
        headers: request.headers,
        body,
      });
      if (request.method !== "GET") {
        response.writeHead(405).end();
        return;
      }
      if (mode === "network") {
        request.socket.destroy();
        return;
      }
      if (mode === "timeout") return;
      if (mode === "body-timeout") {
        response.write('{"userId":');
        return;
      }
      if (mode === "redirect") {
        response.writeHead(307, { Location: `${origin}/must-not-follow` });
        response.end(
          JSON.stringify({ error: "unrecognized_error", message: origin }),
        );
        return;
      }
      if (mode === "http-error" || mode === "non-json-error") {
        response.writeHead(404, {
          "Set-Cookie": "private=value",
          "X-Backend": origin,
        });
        response.end(
          mode === "http-error"
            ? JSON.stringify({
                error: "account_not_found",
                message: `private learner at ${origin}`,
              })
            : `private HTML from ${origin}`,
        );
        return;
      }
      if (mode === "invalid-json") {
        response.end("not JSON");
        return;
      }
      if (request.url === "/api/users/1/profile") {
        response.end(
          JSON.stringify({
            ...profileFixture,
            totalSolved: index,
            ...(mode === "invalid-payload" ? { userId: 2 } : {}),
          }),
        );
      } else if (request.url === "/api/users/1/recommendations?limit=1") {
        response.end(
          JSON.stringify({
            ...recommendationsFixture,
            ...(mode === "empty" ? { recommendations: [] } : {}),
          }),
        );
      } else {
        response.writeHead(404).end();
      }
    });
    upstreams.push(server);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(upstreamPort, "127.0.0.1", resolve);
    });
    const child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(3100 + index),
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "production",
          BACKEND_BASE_URL: origin,
        },
      },
    );
    children.push(child);
    child.on("error", () => stop(1));
    child.on("exit", (code) => {
      if (!stopping) stop(code || 1);
    });
  }
} catch (error) {
  console.error("Local gateway test harness could not start:", error.message);
  stop(1);
}
