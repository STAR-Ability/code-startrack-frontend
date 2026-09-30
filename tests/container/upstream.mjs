import { createServer } from "node:http";
import { profileFixture, recommendationsFixture } from "../api-fixtures.mts";

let calls = [];
let failed = false;
createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/__control") {
    if (request.method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const settings = JSON.parse(body);
      calls = [];
      failed = settings.failed ?? false;
    }
    response.end(JSON.stringify({ calls }));
    return;
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  calls.push({ method: request.method, path: request.url, body });
  if (
    request.method !== "GET" ||
    body ||
    !["/api/users/1/profile", "/api/users/1/recommendations?limit=1"].includes(
      request.url,
    )
  ) {
    console.error("Unexpected container upstream request");
    response.writeHead(405).end();
    return;
  }
  if (failed) {
    response.writeHead(503).end(
      JSON.stringify({
        error: "unknown_failure",
        message: "private http://fixture-a:8080 http://fixture-b:8080",
      }),
    );
    return;
  }
  response.end(
    JSON.stringify(
      request.url.endsWith("/profile")
        ? { ...profileFixture, totalSolved: Number(process.env.SOLVED_COUNT) }
        : recommendationsFixture,
    ),
  );
}).listen(8080, "0.0.0.0");
