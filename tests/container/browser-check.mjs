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
  await page.goto(`${origin}/dashboard`);
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
  assert.equal(
    (await context.request.get(`${origin}/api/training/profile`)).status(),
    404,
  );
  assert.equal((await context.request.get(`${origin}/healthz`)).status(), 200);
  assert.deepEqual(violations, []);
  assert.deepEqual(errors, []);
  console.log("V0.11 nginx/static-export/browser acceptance passed.");
} finally {
  await browser.close();
}
