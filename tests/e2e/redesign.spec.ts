import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("account switch cancels old reads and never displays a late Alpha response in Beta", async ({
  page,
}) => {
  await configureUpstream({ delayAlpha: true, paginateAccounts: true });
  await page.goto("/data");
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await expect(page.getByRole("main")).toContainText("DemoBeta");
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("main").locator("dd").first()).toHaveText("2");
  await page.waitForTimeout(1700);
  await expect(page.getByRole("main").locator("dd").first()).toHaveText("2");
  await page.reload();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740995",
  );
  expect(
    (await upstreamCalls()).some((call) => call.path.includes("page=2")),
  ).toBe(true);
});
test("no binding shows guidance, binds exact DTO and selects the new string ID", async ({
  page,
}) => {
  await configureUpstream({ noAccounts: true });
  await page.goto("/dashboard");
  await expect(page.getByRole("main")).toContainText("绑定 Codeforces 账号");
  expect(
    (await upstreamCalls()).some((call) =>
      /oj-accounts\/[^?]+\/dashboard/.test(call.path),
    ),
  ).toBe(false);
  await page
    .getByRole("main")
    .getByRole("link", { name: "平台账号", exact: true })
    .first()
    .click();
  await page.getByLabel("Codeforces handle").fill("NewDemo");
  await page.getByRole("button", { name: "绑定账号", exact: true }).click();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740997",
  );
  expect(
    (await upstreamCalls()).find(
      (call) => call.path === "/api/v1/oj-accounts" && call.method === "POST",
    )?.body,
  ).toEqual({ platform: "codeforces", username: "NewDemo" });
});
test("unbinding selects another account while history stays separate and read-only", async ({
  page,
}) => {
  await page.goto("/accounts");
  const alpha = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "DemoAlpha", exact: true }),
  });
  await alpha.getByRole("button", { name: "解绑", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "确认", exact: true })
    .click();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740995",
  );
  await page.getByLabel("查看已解绑历史").check();
  const historical = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "9007199254740991" });
  await historical.getByRole("button", { name: "查看此账号" }).click();
  await expect(page.getByRole("main")).toContainText("已解绑 · 只读历史");
  await expect(
    page.getByRole("button", { name: "同步数据", exact: true }),
  ).toHaveCount(0);
});
