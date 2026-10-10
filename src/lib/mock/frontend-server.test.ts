// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFrontendServer } from "../../../scripts/start.mjs";

const bodyLimit = 2 * 1024 * 1024;
const sourceCode = "  int main() { return 0; }  \n\n";
const sourcePolicies = [
  { id: "1", upstream: "private, no-store", expected: "private, no-store" },
  {
    id: "2",
    upstream: "private, no-cache, must-revalidate",
    expected: "private, no-cache, must-revalidate, no-store",
  },
  {
    id: "3",
    upstream:
      'private="Set-Cookie, Authorization", x-policy="avoid, no-store, reuse"',
    expected:
      'private="Set-Cookie, Authorization", x-policy="avoid, no-store, reuse", no-store',
  },
  { id: "4", upstream: "private, NO-STORE", expected: "private, NO-STORE" },
];
const calls: Array<{ path: string | undefined; size: number }> = [];
const upstream = createServer(async (request, response) => {
  let size = 0;
  const hash = createHash("sha256");
  for await (const chunk of request) {
    size += chunk.length;
    hash.update(chunk);
  }
  calls.push({ path: request.url, size });
  const sourcePolicy = sourcePolicies.find(
    ({ id }) => request.url === `/api/v1/submissions/${id}/source`,
  );
  if (sourcePolicy) {
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": sourcePolicy.upstream,
    });
    response.end(JSON.stringify({ sourceCode }));
    return;
  }
  if (request.url === "/api/v1/submissions/1/analysis") {
    response.writeHead(200, { "Content-Type": "application/octet-stream" });
    response.end(Buffer.alloc(32 * 1024 * 1024, "a"));
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      size,
      sha256: hash.digest("hex"),
      cookie: request.headers.cookie,
      origin: request.headers.origin,
    }),
  );
});

describe("static frontend private source cache policy", () => {
  for (const { id, upstream, expected } of sourcePolicies) {
    it(`preserves upstream ${upstream} and ensures no-store without changing source`, async () => {
      const path = `/api/v1/submissions/${id}/source`;
      const response = await fetch(`${base}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe(expected);
      expect(await response.json()).toEqual({ sourceCode });
      expect(calls).toEqual([{ path, size: 0 }]);
    });
  }
});
let frontend: Server;
let base: string;
let directory: string;
const notFoundPage = "<h1>Exported page not found</h1>";

async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "codestartrack-export-"));
  for (const [path, content] of [
    ["index.html", "<h1>Home</h1>"],
    ["404.html", notFoundPage],
    ["dashboard.html", "<h1>Dashboard</h1>"],
    ["dashboard/payload.txt", "App Router payload"],
    ["problems/detail.html", "<h1>Problem detail</h1>"],
    ["problems/detail/payload.txt", "Nested App Router payload"],
    ["docs/index.html", "<h1>Directory index</h1>"],
    ["_next/static/chunks/app.js", "console.log('static fixture');"],
    ["styles.css", "body { margin: 0; }"],
    ["without-404/index.html", "<h1>Home without custom 404</h1>"],
  ]) {
    const file = join(directory, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  frontend = createFrontendServer({
    upstream: await listen(upstream),
    directory,
  });
  base = await listen(frontend);
});
beforeEach(() => {
  calls.length = 0;
});
afterAll(async () => {
  for (const server of [frontend, upstream]) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  await rm(directory, { recursive: true, force: true });
});

describe("static frontend exported-page routing", () => {
  it.each([
    ["/", "Home"],
    ["/dashboard?accountId=42", "Dashboard"],
    ["/problems/detail?problemId=42&source=PLATFORM", "Problem detail"],
    ["/docs/", "Directory index"],
  ])("serves the exported page at %s", async (route, heading) => {
    const response = await fetch(`${base}${route}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toBe(`<h1>${heading}</h1>`);
    expect(calls).toEqual([]);
  });

  it("serves the App Router payload file beside a page", async () => {
    const response = await fetch(`${base}/dashboard/payload.txt`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe("App Router payload");
  });

  it.each([
    ["/dashboard/", "?accountId=42&filter=a%2Fb", "Dashboard"],
    ["/problems/detail/", "?problemId=42&source=PLATFORM", "Problem detail"],
  ])(
    "canonicalizes %s without losing the query",
    async (route, query, heading) => {
      const url = `${base}${route}${query}`;
      const response = await fetch(url, { redirect: "manual" });
      const canonical = `${route.slice(0, -1)}${query}`;
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(canonical);
      const followed = await fetch(url);
      expect(followed.status).toBe(200);
      expect(followed.url).toBe(`${base}${canonical}`);
      expect(await followed.text()).toBe(`<h1>${heading}</h1>`);
      expect(calls).toEqual([]);
    },
  );

  it("keeps raw repeated-slash canonical redirects on the frontend origin", async () => {
    // fetch normalizes this target before sending; retain the raw HTTP path.
    const response = await new Promise<{
      status: number | undefined;
      location: string | undefined;
    }>((resolve, reject) => {
      const outgoing = httpRequest(
        base,
        { path: "/x/..//problems/detail/?problemId=42" },
        (incoming) => {
          incoming.resume();
          incoming.on("end", () =>
            resolve({
              status: incoming.statusCode,
              location: incoming.headers.location,
            }),
          );
        },
      );
      outgoing.on("error", reject);
      outgoing.end();
    });
    expect(response.status).toBe(308);
    expect(response.location).toBe("/problems/detail?problemId=42");
    expect(new URL(response.location ?? "", base).origin).toBe(base);
    expect(calls).toEqual([]);
  });

  it.each([
    "/missing-page",
    "/missing-page/",
    "/dashboard/unexported-child",
    "/missing.css",
    "/missing.txt",
  ])("returns the exported 404 with HTTP 404 at %s", async (route) => {
    const response = await fetch(`${base}${route}`, { redirect: "manual" });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe(notFoundPage);
    expect(calls).toEqual([]);
  });

  it("serves static assets and returns 404 for missing Next assets", async () => {
    const stylesheet = await fetch(`${base}/styles.css`);
    expect(stylesheet.status).toBe(200);
    expect(stylesheet.headers.get("content-type")).toBe("text/css");
    expect(await stylesheet.text()).toBe("body { margin: 0; }");
    const asset = await fetch(`${base}/_next/static/chunks/app.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("content-type")).toBe("text/javascript");
    expect(asset.headers.get("cache-control")).toContain("immutable");
    expect(await asset.text()).toBe("console.log('static fixture');");
    const missing = await fetch(`${base}/_next/static/chunks/missing.js`);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("");
  });

  it("keeps HEAD status and content type while omitting page bodies", async () => {
    const page = await fetch(`${base}/dashboard`, { method: "HEAD" });
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(await page.text()).toBe("");
    const missing = await fetch(`${base}/missing-page`, { method: "HEAD" });
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("text/html");
    expect(await missing.text()).toBe("");
  });

  it("returns 404 when the export has no custom 404 page", async () => {
    const server = createFrontendServer({
      directory: join(directory, "without-404"),
    });
    try {
      const response = await fetch(`${await listen(server)}/missing-page`);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("");
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("keeps versioned API slash/query forwarding and obsolete API rejection", async () => {
    const path = "/api/v1/me/?page=1&filter=a%2Fb";
    const api = await fetch(`${base}${path}`, { redirect: "manual" });
    expect(api.status).toBe(200);
    await api.json();
    expect(calls).toEqual([{ path, size: 0 }]);
    calls.length = 0;
    const obsolete = await fetch(`${base}/api/training/profile/`);
    expect(obsolete.status).toBe(404);
    expect(await obsolete.text()).toBe("");
    expect(calls).toEqual([]);
  });
});

function chunkedBody(chunks: Buffer[]) {
  return new Promise<number | undefined>((resolve, reject) => {
    const outgoing = httpRequest(
      new URL("/api/v1/echo", base),
      { method: "POST", headers: { "Transfer-Encoding": "chunked" } },
      (incoming) => {
        incoming.resume();
        incoming.on("end", () => resolve(incoming.statusCode));
      },
    );
    outgoing.on("error", reject);
    for (const chunk of chunks) outgoing.write(chunk);
    outgoing.end();
  });
}

describe("static frontend API body budget", () => {
  it("forwards a body at the 2 MiB boundary unchanged with Cookie and Origin", async () => {
    const body = Buffer.alloc(bodyLimit, "x");
    const response = await fetch(`${base}/api/v1/echo`, {
      method: "POST",
      headers: { Cookie: "cst_session=synthetic", Origin: base },
      body,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      size: bodyLimit,
      sha256: createHash("sha256").update(body).digest("hex"),
      cookie: "cst_session=synthetic",
      origin: base,
    });
    expect(calls).toEqual([{ path: "/api/v1/echo", size: bodyLimit }]);
  });

  it("rejects a declared oversized body without dispatching an upstream write", async () => {
    const response = await fetch(`${base}/api/v1/echo`, {
      method: "POST",
      body: Buffer.alloc(bodyLimit + 1),
    });
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await response.text();
    expect(calls).toEqual([]);
  });

  it("enforces the byte budget for chunked bodies before dispatch", async () => {
    expect(await chunkedBody([Buffer.alloc(bodyLimit)])).toBe(200);
    calls.length = 0;
    expect(await chunkedBody([Buffer.alloc(bodyLimit), Buffer.from("x")])).toBe(
      413,
    );
    expect(calls).toEqual([]);
  });

  it("streams a 32 MiB analysis GET response without applying the write limit", async () => {
    const response = await fetch(`${base}/api/v1/submissions/1/analysis`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.arrayBuffer()).byteLength).toBe(32 * 1024 * 1024);
    expect(calls).toEqual([
      { path: "/api/v1/submissions/1/analysis", size: 0 },
    ]);
  });
});
