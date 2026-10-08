// Disposable container acceptance; only synthetic backend data is accessible.
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
const origin = "http://frontend";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const violations = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== origin ||
      (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/v1/"))
    ) {
      violations.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route, heading] of [
      ["/product", "从一次提交"],
      ["/product/profile", "看见积累"],
      ["/product/recommendations", "把注意力"],
      ["/about", "每一小步"],
    ]) {
      await page.goto(`${origin}${route}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        heading,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflows at ${width}px`,
      );
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/dashboard`);
  await expect(
    page.getByRole("heading", { name: "账号来源", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await page.goto(`${origin}/practice`);
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740993",
  );
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await expect(page.getByRole("main")).toContainText("DemoBeta");
  const login = await context.request.post(`${origin}/api/v1/auth/login`, {
    headers: { Origin: origin },
    data: {
      account: "demo_student",
      password: "synthetic-password",
      captchaChallengeId: "00000000-0000-4000-8000-000000000100",
      captchaAnswer: "test",
    },
  });
  assert.equal(login.status(), 200);
  assert.match(login.headers()["set-cookie"], /HttpOnly/);
  await context.request.get(`${origin}/api/v1/me`);
  const { calls } = await (await fetch("http://backend:8081/__control")).json();
  assert.equal(
    calls.find((call) => call.path === "/api/v1/auth/login").headers.origin,
    origin,
  );
  assert.match(calls.at(-1).headers.cookie, /cst_session=synthetic/);
  assert.equal(calls.at(-1).headers["x-forwarded-proto"], "http");
  // Emulate the existing TLS ingress without changing backend cookie settings.
  const secureLogin = await fetch("http://secure-frontend/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://acm.qlluck.com",
      "X-Forwarded-Proto": "https",
    },
    body: JSON.stringify({
      account: "demo_student",
      password: "synthetic-password",
      captchaChallengeId: "00000000-0000-4000-8000-000000000100",
      captchaAnswer: "test",
    }),
  });
  assert.equal(secureLogin.status, 200);
  assert.match(secureLogin.headers.get("set-cookie"), /; secure/i);
  assert.match(secureLogin.headers.get("set-cookie"), /; httponly/i);
  assert.match(secureLogin.headers.get("set-cookie"), /; samesite=lax/i);
  const secureCalls = await (
    await fetch("http://backend:8081/__control")
  ).json();
  assert.equal(
    secureCalls.calls.at(-1).headers.origin,
    "https://acm.qlluck.com",
  );
  assert.equal(secureCalls.calls.at(-1).headers["x-forwarded-proto"], "https");
  assert.match(login.headers()["cache-control"], /no-store/);
  assert.equal(
    (await context.request.get(`${origin}/api/training/profile`)).status(),
    404,
  );
  assert.equal((await context.request.get(`${origin}/healthz`)).status(), 200);
  const bodyLimit = 2 * 1024 * 1024;
  // The deliberately incomplete login remains a backend 400 at the proxy limit.
  const atLimit = await context.request.post(`${origin}/api/v1/auth/login`, {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: "{}".padEnd(bodyLimit, " "),
  });
  assert.equal(atLimit.status(), 400);
  const aboveLimit = await context.request.post(`${origin}/api/v1/auth/login`, {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: "{}".padEnd(bodyLimit + 1, " "),
  });
  assert.equal(aboveLimit.status(), 413);

  // Prove the shipped nginx routes support platform training without a CF binding.
  const reset = await fetch("http://backend:8081/__control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: "v02-new-learner" }),
  });
  assert.equal(reset.status, 200);
  const platformLogin = await context.request.post(
    `${origin}/api/v1/auth/login`,
    {
      headers: { Origin: origin },
      data: {
        account: "demo_student",
        password: "synthetic-password",
        captchaChallengeId: "00000000-0000-4000-8000-000000000100",
        captchaAnswer: "test",
      },
    },
  );
  assert.equal(platformLogin.status(), 200);
  assert.equal((await platformLogin.json()).data.requiresOjBinding, true);
  assert.equal(
    (await context.request.get(`${origin}/api/v1/me`)).status(),
    200,
  );
  const accounts = await context.request.get(`${origin}/api/v1/oj-accounts`);
  assert.equal((await accounts.json()).meta.total, 0);
  await page.goto(`${origin}/problems`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("平台题库");
  await page
    .getByRole("link", { name: /Sum of Two Integers/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/problems\/detail\?problemId=/);
  const source =
    '  // UTF-8 原样保留\n#include <iostream>\nint main() { long long a, b; std::cin >> a >> b; std::cout << a + b << "\\n"; }\n  ';
  await page.getByRole("textbox", { name: "源码", exact: true }).fill(source);
  await page.getByLabel("编译语言", { exact: true }).selectOption("cpp17");
  const accepted = page.waitForResponse(
    (reply) =>
      new URL(reply.url()).pathname === "/api/v1/submissions" &&
      reply.request().method() === "POST",
  );
  await page.getByRole("button", { name: "提交判题", exact: true }).click();
  const submissionResponse = await accepted;
  assert.equal(submissionResponse.status(), 202);
  assert.equal(submissionResponse.request().postDataJSON().sourceCode, source);
  const { submissionId } = (await submissionResponse.json()).data;
  await expect(page).toHaveURL(
    new RegExp(`/submissions/detail\\?submissionId=${submissionId}`),
  );
  await expect(page.getByText("AC · 通过", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Lizard", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  const privateSource = await context.request.get(
    `${origin}/api/v1/submissions/${submissionId}/source`,
  );
  assert.equal((await privateSource.json()).data.sourceCode, source);
  assert.match(privateSource.headers()["cache-control"], /private.*no-store/);
  const records = await context.request.get(
    `${origin}/api/v1/me/training-records?source=PLATFORM`,
  );
  assert.equal(
    (await records.json()).data.find(
      (record) => record.lastSubmissionId === submissionId,
    ).status,
    "COMPLETED",
  );
  await page.goto(`${origin}/training`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("训练记录");
  await expect(page.getByRole("main")).toContainText("已通过");
  await page.goto(`${origin}/learning-profile`);
  await expect(
    page.getByRole("heading", { name: "学习数据来源", exact: true }),
  ).toBeVisible();
  await page.goto(`${origin}/learning-recommendations`);
  const generated = page.waitForResponse(
    (reply) =>
      new URL(reply.url()).pathname === "/api/v1/me/recommendations/generate" &&
      reply.request().method() === "POST",
  );
  await page.getByRole("button", { name: "生成推荐", exact: true }).click();
  const batchResponse = await generated;
  assert.equal(batchResponse.status(), 201);
  assert.ok((await batchResponse.json()).data.resultCount > 0);
  await expect(
    page.getByRole("heading", { name: "推荐批次", exact: true }),
  ).toBeVisible();
  assert.deepEqual(violations, []);
  assert.deepEqual(errors, []);
  console.log("V0.12/V0.2 nginx/static-export/browser acceptance passed.");
} finally {
  await browser.close();
}
