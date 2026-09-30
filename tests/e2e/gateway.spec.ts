import { expect, test } from "@playwright/test";
import { request as httpRequest } from "node:http";
import { createHash } from "node:crypto";
import {
  readFile,
  readdir,
  mkdtemp,
  mkdir,
  writeFile,
  copyFile,
  symlink,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

type UpstreamCall = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
};

const frontend = "http://127.0.0.1:3100";
const secondFrontend = "http://127.0.0.1:3101";
const upstream = "http://127.0.0.1:3210";
const secondUpstream = "http://127.0.0.1:3211";
const routes = ["/api/training/profile", "/api/training/recommendation"];

async function control(
  origin: string,
  mode?: string,
): Promise<{ calls: UpstreamCall[] }> {
  // These requests are exclusively to the isolated local test fixture.
  const response = await fetch(
    `${origin}/__control`,
    mode
      ? {
          method: "POST",
          body: JSON.stringify({ mode }),
        }
      : undefined,
  );
  return response.json();
}

async function staticDigest(directory = ".next/static"): Promise<string> {
  const hash = createHash("sha256");
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const path = join(directory, entry.name);
    hash.update(entry.name);
    hash.update(
      entry.isDirectory() ? await staticDigest(path) : await readFile(path),
    );
  }
  return hash.digest("hex");
}

test.describe("actual Next.js GET gateway", () => {
  // Each case resets the shared synthetic upstream; never race its request log.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    await control(upstream, "success");
  });

  test("browser stays on Next.js; only exact GETs reach the upstream without CORS headers", async ({
    page,
  }) => {
    const requestedOrigins = new Set<string>();
    const assetBodies: Promise<string>[] = [];
    page.on("request", (request) =>
      requestedOrigins.add(new URL(request.url()).origin),
    );
    page.on("response", (response) => {
      if (
        ["document", "script", "stylesheet"].includes(
          response.request().resourceType(),
        )
      ) {
        assetBodies.push(response.text());
      }
    });
    await page.goto("/");
    const results = await page.evaluate(
      async (paths) =>
        Promise.all(
          paths.map(async (path) => {
            const response = await fetch(path, {
              headers: { Authorization: "private browser credential" },
              credentials: "include",
            });
            return {
              status: response.status,
              cache: response.headers.get("cache-control"),
              body: await response.json(),
            };
          }),
        ),
      routes,
    );
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(results.every((result) => result.cache === "no-store")).toBe(true);
    expect(results[0].body.totalSolved).toBe(0);
    expect(results[1].body.recommendations[0]).toMatchObject({
      title: "",
      difficulty: null,
      tags: [],
    });
    expect([...requestedOrigins]).toEqual([frontend]);
    const calls = (await control(upstream)).calls;
    expect(calls.map((call) => call.path).sort()).toEqual([
      "/api/users/1/profile",
      "/api/users/1/recommendations?limit=1",
    ]);
    for (const call of calls) {
      expect(call.method).toBe("GET");
      expect(call.body).toBe("");
      expect(call.headers.accept).toBe("application/json");
      expect(call.headers.authorization).toBeUndefined();
      expect(call.headers.cookie).toBeUndefined();
    }
    const delivered = [
      ...(await Promise.all(assetBodies)),
      JSON.stringify(results),
    ].join("\n");
    expect(delivered).not.toContain(upstream);
    expect(delivered).not.toContain("BACKEND_BASE_URL");
  });

  test("same built application uses two runtime origins without changing browser assets", async ({
    request,
  }) => {
    await control(secondUpstream, "success");
    const before = await staticDigest();
    const buildId = await readFile(".next/BUILD_ID", "utf8");
    await expect
      .poll(async () => {
        try {
          return (await request.get(`${secondFrontend}/`)).status();
        } catch {
          return 0;
        }
      })
      .toBe(200);
    for (const [origin, count] of [
      [frontend, 0],
      [secondFrontend, 1],
    ] as const) {
      const response = await request.get(`${origin}${routes[0]}`);
      expect((await response.json()).totalSolved).toBe(count);
    }
    expect((await control(upstream)).calls.map((call) => call.path)).toEqual([
      "/api/users/1/profile",
    ]);
    expect(
      (await control(secondUpstream)).calls.map((call) => call.path),
    ).toEqual(["/api/users/1/profile"]);
    expect(await staticDigest()).toBe(before);
    expect(await readFile(".next/BUILD_ID", "utf8")).toBe(buildId);
  });

  test("local method dispatch, including HEAD and OPTIONS, never calls upstream", async ({
    request,
  }) => {
    for (const route of routes) {
      for (const method of [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
      ]) {
        const response = await request.fetch(route, {
          method,
          maxRedirects: 0,
        });
        expect(response.status(), `${method} ${route}`).toBe(
          method === "OPTIONS" ? 204 : 405,
        );
      }
    }
    expect((await control(upstream)).calls).toEqual([]);
  });

  test("rejects arbitrary destination, identity, limit and override input before transport", async ({
    request,
  }) => {
    for (const route of routes) {
      for (const query of [
        "userId=2",
        "user_id=2",
        "limit=50",
        "url=http://127.0.0.1:3211",
        "path=/api/accounts",
        "method=POST",
        "_method=DELETE",
      ]) {
        expect((await request.get(`${route}?${query}`)).status()).toBe(400);
      }
      for (const header of [
        "x-http-method-override",
        "x-method-override",
        "x-http-method",
      ]) {
        expect(
          (
            await request.get(route, { headers: { [header]: "POST" } })
          ).status(),
        ).toBe(400);
      }
      // Node's low-level request can express GET bodies, unlike browser fetch.
      const status = await new Promise<number | undefined>(
        (resolve, reject) => {
          const outgoing = httpRequest(
            `${frontend}${route}`,
            { method: "GET", headers: { "Content-Length": "2" } },
            (response) => {
              response.resume();
              resolve(response.statusCode);
            },
          );
          outgoing.on("error", reject);
          outgoing.end("{}");
        },
      );
      expect(status).toBe(400);
    }
    expect((await control(upstream)).calls).toEqual([]);
  });

  test("forwards neither credentials nor arbitrary browser headers", async ({
    request,
  }) => {
    const response = await request.get(routes[0], {
      headers: {
        Cookie: "session=private",
        Authorization: "Bearer private",
        "X-Arbitrary": "private",
      },
    });
    expect(response.status()).toBe(200);
    const [call] = (await control(upstream)).calls;
    expect(call.headers.cookie).toBeUndefined();
    expect(call.headers.authorization).toBeUndefined();
    expect(call.headers["x-arbitrary"]).toBeUndefined();
  });

  test("empty recommendations remain empty", async ({ request }) => {
    await control(upstream, "empty");
    const response = await request.get(routes[1]);
    expect(response.status()).toBe(200);
    expect((await response.json()).recommendations).toEqual([]);
  });

  for (const [mode, status, category] of [
    ["http-error", 404, "http"],
    ["non-json-error", 404, "http"],
    ["redirect", 502, "http"],
    ["network", 502, "transport"],
    ["invalid-json", 502, "invalid_json"],
    ["invalid-payload", 502, "invalid_payload"],
    ["timeout", 504, "timeout"],
    ["body-timeout", 504, "timeout"],
  ] as const) {
    test(`normalizes ${mode} safely without retry or redirect`, async ({
      request,
    }) => {
      await control(upstream, mode);
      const response = await request.get(routes[0], { maxRedirects: 0 });
      expect(response.status()).toBe(status);
      const body = await response.json();
      expect(body.error).toMatchObject({
        operation: "profile",
        category,
        status,
      });
      expect(body.error.backendError).toBe(
        mode === "http-error" ? "account_not_found" : undefined,
      );
      expect(response.headers()["cache-control"]).toBe("no-store");
      expect(response.headers()["location"]).toBeUndefined();
      expect(response.headers()["set-cookie"]).toBeUndefined();
      expect(response.headers()["x-backend"]).toBeUndefined();
      expect(
        JSON.stringify({ body, headers: response.headers() }),
      ).not.toContain(upstream);
      expect(JSON.stringify(body)).not.toMatch(/private|stack|message/);
      expect((await control(upstream)).calls).toHaveLength(1);
    });
  }
});

test("Next.js refuses a Client Component importing the private backend client", async () => {
  test.setTimeout(60_000);
  // Isolated throwaway app: never modify the user's routes or production build.
  const directory = await mkdtemp(
    join(tmpdir(), "codestartrack-server-boundary-"),
  );
  try {
    await mkdir(join(directory, "app"));
    await mkdir(join(directory, "api"));
    await symlink(
      join(process.cwd(), "node_modules"),
      join(directory, "node_modules"),
      "dir",
    );
    await writeFile(
      join(directory, "package.json"),
      '{"name":"server-boundary-probe","private":true}',
    );
    await writeFile(
      join(directory, "app/layout.tsx"),
      "export default function Layout({children}:{children:React.ReactNode}) { return <html><body>{children}</body></html>; }",
    );
    await writeFile(
      join(directory, "app/page.tsx"),
      '"use client";\nimport {getTrainingProfile} from "../api/client.server";\nexport default function Probe() { return <button onClick={() => void getTrainingProfile()}>probe</button>; }',
    );
    for (const file of await readdir("src/lib/api")) {
      if (file.endsWith(".ts") && !file.includes(".test.")) {
        await copyFile(join("src/lib/api", file), join(directory, "api", file));
      }
    }
    const result = await new Promise<{ code: number | null; output: string }>(
      (resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            join(process.cwd(), "node_modules/next/dist/bin/next"),
            "build",
            "--webpack",
          ],
          {
            cwd: directory,
            env: {
              ...process.env,
              NODE_ENV: "production",
              BACKEND_BASE_URL: "",
              NEXT_TELEMETRY_DISABLED: "1",
            },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
        let output = "";
        child.stdout.on("data", (chunk) => {
          output += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
          output += String(chunk);
        });
        const timeout = setTimeout(() => child.kill("SIGKILL"), 45_000);
        child.on("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        child.on("close", (code) => {
          clearTimeout(timeout);
          resolve({ code, output });
        });
      },
    );
    expect(result.code, result.output).not.toBe(0);
    expect(result.output).toMatch(/server-only/);
    expect(result.output).toMatch(/only available in Server Components/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
