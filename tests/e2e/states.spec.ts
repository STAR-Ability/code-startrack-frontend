import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("null analysis, zero evidence and stale results are distinct", async ({
  page,
}) => {
  await configureUpstream({ noAnalysis: true });
  await page.goto("/accounts/profile");
  await expect(page.getByText("尚未生成分析")).toBeVisible();
  await configureUpstream({ zero: true, stale: true });
  await page.reload();
  await expect(page.getByText("暂无训练证据")).toBeVisible();
  await expect(page.getByText("数据已过期", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "六维能力 · 0–100" }),
  ).toBeVisible();
});
test("account-mismatched response is discarded", async ({ page }) => {
  await configureUpstream({ mismatch: true });
  await page.goto("/accounts/profile");
  await expect(page.getByText("内容暂未加载", { exact: true })).toBeVisible();
  await expect(page.getByText("ACCOUNT_MISMATCH")).not.toBeVisible();
  await page.getByText("查看问题详情", { exact: true }).click();
  await expect(page.getByText("ACCOUNT_MISMATCH")).toBeVisible();
  await expect(page.getByRole("heading", { name: "能力摘要" })).toBeVisible();
  await expect(
    page.getByRole("main").locator("dd").filter({ hasText: /^0$/ }),
  ).toHaveCount(4);
});
test("sync task polls to PARTIAL, preserves data and offers analysis rebuild", async ({
  page,
}) => {
  await configureUpstream({ partial: true, nextAction: "SYNC" });
  await page.goto("/accounts/profile");
  await page
    .getByRole("button", { name: "同步数据", exact: true })
    .first()
    .click();
  await expect(page.getByText("部分完成", { exact: true })).toBeVisible({
    timeout: 12_000,
  });
  await expect(page.locator('[data-slot="alert"]')).toContainText([
    "部分阶段未完成",
    "ALGORITHM_UNAVAILABLE",
  ]);
  await expect(
    page.getByRole("button", { name: "重建画像", exact: true }),
  ).toBeEnabled();
  const before = (await upstreamCalls()).filter((call) =>
    call.path.includes("/sync-jobs/"),
  ).length;
  await page.waitForTimeout(3500);
  expect(
    (await upstreamCalls()).filter((call) => call.path.includes("/sync-jobs/"))
      .length,
  ).toBe(before);
});
test("429 cooldown prevents repeated sync writes", async ({ page }) => {
  await configureUpstream({ rateLimit: true });
  await page.goto("/accounts/profile");
  const sync = page.getByRole("button", { name: "同步数据", exact: true });
  await sync.click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "SYNC_RATE_LIMITED",
  );
  await expect(sync).toBeDisabled();
  await expect(sync).toBeEnabled({ timeout: 4000 });
  expect(
    (await upstreamCalls()).filter((call) => call.method === "POST"),
  ).toHaveLength(1);
});
test("logout clears private data while workspace shells remain accessible", async ({
  page,
}) => {
  await page.goto("/security");
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/profile");
  await expect(page).toHaveURL("/profile");
  await expect(
    page.getByText("请登录查看更多数据", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
});
