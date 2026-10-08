// @vitest-environment node
import { createHash } from "node:crypto";
import { createServer, request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
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

async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeAll(async () => {
  frontend = createFrontendServer({ upstream: await listen(upstream) });
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
