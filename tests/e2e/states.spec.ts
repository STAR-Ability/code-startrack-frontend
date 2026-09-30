import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream({}));

test("delayed reads show distinct states and issue only E1 then E2", async ({
  page,
}) => {
  await configureUpstream({ profile: "delay", recommendation: "delay" });
  await page.goto("/practice");
  await expect(page.getByText("正在加载训练画像…")).toBeVisible();
  await expect(page.getByText("画像加载成功后将显示推荐题目。")).toBeVisible();
  await expect(page.locator("dd")).toHaveCount(0);
  await expect
    .poll(async () => (await upstreamCalls()).map((call) => call.path))
    .toEqual(["/api/users/1/profile"]);
  await expect(page.getByText("正在加载推荐题目…")).toBeVisible();
  await expect(
    page.getByText(/训练画像已就绪|Your training profile is ready/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect((await upstreamCalls()).map((call) => call.path)).toEqual([
    "/api/users/1/profile",
    "/api/users/1/recommendations?limit=1",
  ]);
});

for (const operation of ["profile", "recommendation"] as const) {
  for (const mode of [
    "non-json-error",
    "invalid-json",
    "invalid-payload",
    "network",
    "timeout",
  ]) {
    test(`${operation} ${mode} stays a visible failure with scoped recovery`, async ({
      page,
      context,
    }) => {
      await context.addCookies([
        {
          name: "codestartrack_locale",
          value: "en",
          url: "http://127.0.0.1:3100",
        },
      ]);
      await configureUpstream({ [operation]: mode });
      await page.goto("/practice");
      const region = page.getByRole("region", {
        name:
          operation === "profile" ? "Training profile" : "Recommended problem",
      });
      await expect(
        region.getByRole("button", { name: `Retry ${operation}` }),
      ).toBeVisible({ timeout: 12_000 });
      await expect(region.getByRole("alert")).toContainText(
        mode === "timeout" ? "timed out" : "Could not load",
      );
      if (operation === "profile") {
        await expect(page.locator("dd")).toHaveCount(0);
        expect(await upstreamCalls()).toHaveLength(1);
      } else {
        await expect(
          page.getByText(/训练画像已就绪|Your training profile is ready/),
        ).toBeVisible();
        await expect(page.getByText(/early placeholders/)).toBeVisible();
        expect(await upstreamCalls()).toHaveLength(2);
      }
      expect(await page.locator("body").innerText()).not.toMatch(
        /127\.0\.0\.1|BACKEND_BASE_URL|account_not_found|private learner/,
      );
    });
  }
}

test("missing runtime configuration is an error without any upstream call", async ({
  page,
}) => {
  const response = await page.goto("http://127.0.0.1:3102/practice");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("button", { name: "重试加载画像" }),
  ).toBeVisible();
  await expect(page.locator("dd")).toHaveCount(0);
  const responseBody = await page.request.get(
    "http://127.0.0.1:3102/api/training/profile",
  );
  expect((await responseBody.json()).error.category).toBe("configuration");
  expect(
    (await (await fetch("http://127.0.0.1:3212/__control")).json()).calls,
  ).toEqual([]);
});

test("retry cannot duplicate an in-flight request", async ({ page }) => {
  await configureUpstream({ recommendation: "http-error" });
  await page.goto("/practice");
  const retry = page.getByRole("button", { name: "重试加载推荐" });
  await expect(retry).toBeVisible();
  await configureUpstream({ recommendation: "delay" }, true);
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(retry).toBeDisabled();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect((await upstreamCalls()).map((call) => call.path)).toEqual([
    "/api/users/1/profile",
    "/api/users/1/recommendations?limit=1",
    "/api/users/1/recommendations?limit=1",
  ]);
});

test("locale preference survives navigation and reload without additional reads on switching", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("link", { name: "View read-only demo" }).click();
  await expect(
    page.getByRole("link", { name: "Open on Codeforces" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Practice | codeStartrack");
  await page.getByRole("button", { name: "简体中文", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect(await upstreamCalls()).toHaveLength(2);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect(await upstreamCalls()).toHaveLength(4);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
