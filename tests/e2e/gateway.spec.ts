import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
import { request as httpRequest } from "node:http";
test.beforeEach(() => configureUpstream());
test("static proxy enforces a 2 MiB request budget before upstream dispatch", async ({
  request,
}) => {
  const bodyLimit = 2 * 1024 * 1024;
  const atLimit = await request.post("/api/v1/auth/login", {
    headers: {
      Origin: "http://127.0.0.1:3100",
      "Content-Type": "application/json",
    },
    data: "{}".padEnd(bodyLimit, " "),
  });
  expect(atLimit.status()).toBe(400);
  const acceptedCalls = await upstreamCalls();
  expect(acceptedCalls.at(-1)?.path).toBe("/api/v1/auth/login");
  const aboveLimit = await request.post("/api/v1/auth/login", {
    headers: { "Content-Type": "application/json" },
    data: "{}".padEnd(bodyLimit + 1, " "),
  });
  expect(aboveLimit.status()).toBe(413);
  expect((await upstreamCalls()).length).toBe(acceptedCalls.length);
});
test("static proxy preserves v1 paths, session cookie, Origin and Set-Cookie", async ({
  request,
}) => {
  const origin = "http://127.0.0.1:3100";
  const login = await request.post("/api/v1/auth/login", {
    headers: { Origin: origin },
    data: {
      account: "demo_student",
      password: "synthetic-password",
      captchaChallengeId: "00000000-0000-4000-8000-000000000100",
      captchaAnswer: "test",
    },
  });
  expect(login.status()).toBe(200);
  expect(login.headers()["set-cookie"]).toContain("HttpOnly");
  await request.get("/api/v1/me");
  const calls = await upstreamCalls();
  expect(calls[0].headers.origin).toBe(origin);
  expect(calls[1].headers.cookie).toContain("cst_session=synthetic");
  expect((await request.get("/api/training/profile")).status()).toBe(404);
  expect((await request.get("/healthz")).status()).toBe(200);
  expect((await upstreamCalls()).length).toBe(2);

  // An absolute-form HTTP request must still use the configured backend.
  const status = await new Promise<number | undefined>((resolve, reject) => {
    const outgoing = httpRequest(
      {
        hostname: "127.0.0.1",
        port: 3100,
        path: "http://untrusted.invalid/api/v1/me",
      },
      (incoming) => {
        incoming.resume();
        incoming.on("end", () => resolve(incoming.statusCode));
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
  expect(status).toBe(200);
  expect((await upstreamCalls()).length).toBe(3);
});
