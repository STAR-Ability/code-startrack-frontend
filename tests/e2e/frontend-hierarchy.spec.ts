import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("recommendations preserve rank and distinguish supplied ability coverage from missing data", async ({
  page,
}) => {
  await page.goto("/practice");
  const recommendations = page.getByRole("region", {
    name: "为你推荐",
    exact: true,
  });
  const primary = recommendations.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "#1 A Small Step", exact: true }),
  });
  await expect(primary).toBeVisible();
  await expect(primary).toContainText("基础实现");
  await expect(primary).toContainText("这道题的难度与你当前训练水平接近。");
  await expect(primary).toContainText("1200");
  await expect(primary).toContainText("implementation");
  await expect(primary).toContainText("Codeforces");
  const secondary = recommendations.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "#2 gym-demo-B", exact: true }),
  });
  await expect(secondary).toBeVisible();
  await expect(secondary).toContainText("未评级");
  await expect(secondary).toContainText("Gym");
  await expect(secondary).not.toContainText("基础实现");
  await expect(
    primary.getByRole("button", { name: "题目链接暂不可用", exact: true }),
  ).toBeDisabled();
  expect(
    (await upstreamCalls()).filter((call) => call.method === "POST"),
  ).toHaveLength(0);
});

test("dashboard shows activity once and keeps full ability analysis reachable", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "查看账号来源", exact: true }).click();
  await expect(main.getByText("DemoAlpha", { exact: true })).toBeVisible();
  const nextProblem = main.getByRole("link", {
    name: "选择下一道题",
    exact: true,
  });
  await expect(nextProblem).toHaveAttribute("href", "/practice");
  await expect(nextProblem).toBeVisible();
  const direction = main.getByRole("heading", {
    name: "把画像，转化为下一次练习。",
    exact: true,
  });
  const activityHeading = main.getByRole("heading", {
    name: "每日训练",
    exact: true,
  });
  await expect(direction).toBeVisible();
  await expect(activityHeading).toBeVisible();
  expect((await direction.boundingBox())!.y).toBeLessThan(
    (await activityHeading.boundingBox())!.y,
  );
  await expect(
    main.getByRole("img", { name: "每日训练", exact: true }),
  ).toBeVisible();
  await expect(main.getByRole("img", { name: /.+/ })).toHaveCount(1);
  await expect(
    main.getByRole("heading", { name: "我的团队", exact: true }),
  ).toBeVisible();
  const profile = main.locator('a[href="/profile"]').first();
  await expect(profile).toBeVisible();
  await profile.click();
  await expect(page).toHaveURL("/profile");
  await expect(
    page.getByRole("img", { name: "六维能力 · 0–100", exact: true }),
  ).toBeVisible();
});

test("report conclusions precede keyboard-accessible frozen evidence and current analysis", async ({
  page,
}) => {
  await page.goto("/analysis");
  const report = page.locator("[data-report-id]");
  await expect(
    report.getByText("你已经形成稳定的训练节奏。", { exact: true }),
  ).toBeVisible();
  await expect(report.getByRole("img")).toHaveCount(0);
  const evidence = report.getByRole("button", {
    name: "报告数据依据",
    exact: true,
  });
  await expect(evidence).toHaveAttribute("aria-expanded", "false");
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(evidence).toHaveAttribute("aria-expanded", "true");
  await expect(
    report.locator("[data-metric-panel]").first().locator("dd").first(),
  ).toHaveText("45");
  await expect(
    report.getByRole("img", { name: "六维能力 · 0–100", exact: true }),
  ).toBeVisible();
  await evidence.click();
  await expect(report.getByRole("img")).toHaveCount(0);
  const current = page.getByRole("button", {
    name: "当前汇总画像数据",
    exact: true,
  });
  await current.focus();
  await page.keyboard.press("Enter");
  await expect(current).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("img", { name: "每日训练", exact: true }),
  ).toBeVisible();
  await expect(report.getByRole("img")).toHaveCount(0);
  expect(
    (await upstreamCalls()).filter((call) => call.method === "POST"),
  ).toHaveLength(0);
});

test("dashboard failed profile reads do not claim missing training evidence", async ({
  page,
}) => {
  const endpoint = "**/api/v1/me/analysis/latest?window=ALL";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "SERVICE_UNAVAILABLE",
        message: "Unavailable",
        data: null,
      }),
    }),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "重试", exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator("[data-dashboard-direction]")).toHaveCount(0);
  await expect(
    page.getByText(
      "查看来源账号与同步状态，积累训练记录后再选择适合自己的练习。",
      { exact: true },
    ),
  ).toHaveCount(0);
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "重试", exact: true }).first().click();
  await expect(
    page.getByRole("link", { name: "选择下一道题", exact: true }),
  ).toBeVisible();
});
