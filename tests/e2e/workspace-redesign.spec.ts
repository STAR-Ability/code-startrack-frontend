import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("zero-evidence portfolio keeps both account rows and its explicit empty state", async ({
  page,
}) => {
  await configureUpstream({ zero: true });
  await page.goto("/dashboard");
  const portfolio = page.getByRole("region", {
    name: "全部 CF 账号 · 训练汇总",
    exact: true,
  });
  await expect(portfolio).toHaveAttribute("data-state", "empty");
  await expect(portfolio.locator("[data-metric-panel] dd")).toHaveText([
    "2",
    "0",
    "0",
    "0",
  ]);
  await expect(portfolio.getByText("DemoAlpha", { exact: true })).toBeVisible();
  await expect(portfolio.getByText("DemoBeta", { exact: true })).toBeVisible();
  await expect(
    portfolio.getByText("当前无法加载数据，请检查网络或稍后重试", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("portfolio includes both bindings and stays stable when the training account changes", async ({
  page,
  isMobile,
}) => {
  await page.goto("/dashboard");
  const portfolio = page.getByRole("region", {
    name: "全部 CF 账号 · 训练汇总",
    exact: true,
  });
  const metrics = portfolio.locator("[data-metric-panel]");
  await expect(metrics.locator("dd")).toHaveText(["2", "8", "3", "3"]);
  await expect(portfolio.getByText("DemoAlpha", { exact: true })).toBeVisible();
  await expect(portfolio.getByText("DemoBeta", { exact: true })).toBeVisible();
  await expect(portfolio).toContainText("同一题在多个账号通过会重复计数");
  await expect(
    page.getByRole("heading", { name: "训练概览", exact: true }),
  ).toHaveCount(0);
  if (!isMobile) {
    const next = await page
      .locator('[data-slot="card"]')
      .filter({
        has: page.getByRole("heading", { name: "下一步", exact: true }),
      })
      .boundingBox();
    const recommended = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", {
        name: "#1 A Small Step",
        exact: true,
      }),
    });
    await expect(recommended).toBeVisible();
    expect((await recommended.boundingBox())!.x).toBeGreaterThan(
      next!.x + next!.width,
    );
  }
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await expect(metrics.locator("dd")).toHaveText(["2", "8", "3", "3"]);
  await portfolio.getByRole("button", { name: "查看数据" }).first().click();
  await expect(page).toHaveURL("/data");
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740993",
  );
  await expect(
    page.getByRole("heading", { name: "训练概览", exact: true }),
  ).toHaveCount(1);
  const hierarchy = await page.locator("main h2").allTextContents();
  expect(hierarchy.indexOf("训练概览")).toBeLessThan(
    hierarchy.indexOf("每日训练"),
  );
});

test("one failed portfolio read preserves the other account and retries the full coverage", async ({
  page,
}) => {
  await configureUpstream({
    errorPath: "/oj-accounts/9007199254740995/training/overview",
  });
  await page.goto("/dashboard");
  const portfolio = page.getByRole("region", {
    name: "全部 CF 账号 · 训练汇总",
    exact: true,
  });
  await expect(portfolio.locator("[data-metric-panel] dd")).toHaveText([
    "2",
    "5",
    "2",
    "2",
  ]);
  await expect(portfolio).toContainText("已读取 1 / 2 个账号的训练快照");
  await expect(
    portfolio.getByText("数据加载失败", { exact: true }),
  ).toBeVisible();
  await expect(
    portfolio
      .getByText("当前无法加载数据，请检查网络或稍后重试", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await configureUpstream({ errorPath: null }, true);
  await portfolio.getByRole("button", { name: "重试", exact: true }).click();
  await expect(portfolio.locator("[data-metric-panel] dd")).toHaveText([
    "2",
    "8",
    "3",
    "3",
  ]);
  await expect(portfolio).toContainText("已读取 2 / 2 个账号的训练快照");
});

test("desktop sidebar collapses to labeled icons, restores preference and supports keyboard", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mobile retains the compact bottom navigation");
  await page.goto("/dashboard");
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  const gap = sidebar.locator('[data-slot="sidebar-gap"]');
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await expect.poll(async () => (await gap.boundingBox())?.width).toBe(240);
  await page.getByRole("button", { name: "收起侧栏", exact: true }).click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await expect.poll(async () => (await gap.boundingBox())?.width).toBe(68);
  expect(
    (await sidebar
      .getByRole("link", { name: "首页", exact: true })
      .boundingBox())!.height,
  ).toBeLessThanOrEqual(48);
  expect(
    (await sidebar
      .getByRole("link", { name: "首页", exact: true })
      .boundingBox())!.y,
  ).toBeLessThan(24);
  const profile = sidebar.getByRole("link", { name: "能力画像", exact: true });
  await expect(profile).toBeVisible();
  await profile.hover();
  // Base UI 1.8 supplies a visual tooltip; the link owns its accessible name.
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveText(
    "能力画像",
  );
  await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible();
  await page.reload();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await expect.poll(async () => (await gap.boundingBox())?.width).toBe(240);
});

test("account security overview contains action links and password verification has no extra wire fields", async ({
  page,
}) => {
  await page.goto("/security");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "账号与安全",
  );
  await expect(page.locator("main input")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "修改邮箱", exact: true }),
  ).toHaveAttribute("href", "/security/email");
  await page.getByRole("link", { name: "修改密码", exact: true }).click();
  await expect(page).toHaveURL("/security/password");
  await expect(
    page.getByText("修改后所有设备需要重新登录", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await page.getByLabel("当前密码", { exact: true }).fill("synthetic-password");
  await page
    .getByLabel("新密码", { exact: true })
    .fill("synthetic-new-password");
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("different-password");
  await page.getByRole("button", { name: "修改密码", exact: true }).click();
  await expect(
    page.getByText("两次输入的新密码不一致。", { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).some(
      (call) => call.path === "/api/v1/me/password/change",
    ),
  ).toBe(false);
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("synthetic-new-password");
  await page.getByRole("button", { name: "修改密码", exact: true }).click();
  await expect(page).toHaveURL("/login");
  expect(
    (await upstreamCalls()).find(
      (call) => call.path === "/api/v1/me/password/change",
    )?.body,
  ).toEqual({
    currentPassword: "synthetic-password",
    newPassword: "synthetic-new-password",
  });
});

test("separate email page verifies both mailboxes and revokes the session", async ({
  page,
}) => {
  await page.goto("/security/email");
  await page.getByLabel("密码", { exact: true }).fill("synthetic-password");
  await page.getByLabel("新邮箱", { exact: true }).fill("NEW@example.invalid");
  const captchas = page.getByRole("textbox", {
    name: "图形验证码",
    exact: true,
  });
  await captchas.first().fill("abcd");
  await page
    .getByRole("button", { name: "发送邮箱验证码", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("验证码已发送，请在有效期内输入。", { exact: true }),
  ).toHaveCount(1);
  await captchas.nth(1).fill("abcd");
  await page
    .getByRole("button", { name: "发送邮箱验证码", exact: true })
    .click();
  await expect(
    page.getByText("验证码已发送，请在有效期内输入。", { exact: true }),
  ).toHaveCount(2);
  await page.getByLabel("当前邮箱验证码", { exact: true }).fill("123456");
  await page.getByLabel("新邮箱验证码", { exact: true }).fill("654321");
  await page.getByRole("button", { name: "修改邮箱", exact: true }).click();
  await expect(page).toHaveURL("/login");
  const calls = await upstreamCalls();
  const codes = calls.filter(
    (call) => call.path === "/api/v1/auth/email-codes",
  );
  expect(codes.map((call) => call.body?.purpose)).toEqual([
    "EMAIL_CHANGE_OLD",
    "EMAIL_CHANGE_NEW",
  ]);
  expect(
    calls.find((call) => call.path === "/api/v1/me/email/change")?.body,
  ).toEqual({
    password: "synthetic-password",
    oldEmail: codes[0].body?.email,
    newEmail: "new@example.invalid",
    oldEmailCode: "123456",
    newEmailCode: "654321",
    oldVerificationId: "00000000-0000-4000-8000-000000000101",
    newVerificationId: "00000000-0000-4000-8000-000000000101",
  });
});
