import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("zero-evidence aggregate retains source accounts and an explicit empty state", async ({
  page,
}) => {
  await configureUpstream({ zero: true });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("main").getByText("暂无训练证据", { exact: true }).first(),
  ).toBeVisible();
  const ability = page.locator(".dashboard-ability");
  await expect(ability.locator(".metric-strip dd").first()).toHaveText("0");
  await expect(ability.locator(".metric-strip dd").last()).toHaveText("2");
  await expect(
    page.getByRole("button", { name: "重建个人画像", exact: true }),
  ).toBeEnabled();
  const sources = page.getByRole("button", {
    name: "查看账号来源",
    exact: true,
  });
  await expect(sources).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toBeHidden();
  await sources.focus();
  await sources.press("Enter");
  await expect(sources).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("DemoBeta", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "个人汇总画像", exact: true }),
  ).toHaveAttribute("data-state", "empty");
});

test("aggregate is backend-owned and independent of selected account preference", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "codestartrack.account.00000000-0000-4000-8000-000000000001",
      "9007199254740995",
    ),
  );
  await page.goto("/dashboard");
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await page.getByRole("button", { name: "查看账号来源", exact: true }).click();
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "个人汇总画像", exact: true })
      .locator("[data-metric-panel] dd")
      .first(),
  ).toHaveText("3");
  expect(
    (await upstreamCalls()).some(
      (call) =>
        call.path.includes("/oj-accounts/") &&
        call.path.includes("/training/overview"),
    ),
  ).toBe(false);
  await page.getByRole("main").getByText("DemoAlpha", { exact: true }).click();
  await expect(page).toHaveURL("/accounts");
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740993",
  );
});

test("failed aggregate read leaves teamwork available and retries without per-account aggregation", async ({
  page,
}) => {
  await configureUpstream({ errorPath: "/me/training/overview" });
  await page.goto("/dashboard");
  const region = page.getByRole("region", {
    name: "个人汇总画像",
    exact: true,
  });
  await expect(
    region
      .getByText("当前无法加载数据，请检查网络或稍后重试", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "我的团队", exact: true }),
  ).toBeVisible();
  await configureUpstream({ errorPath: null }, true);
  await region.getByRole("button", { name: "重试", exact: true }).click();
  await expect(region.locator("[data-metric-panel] dd").first()).toHaveText(
    "3",
  );
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
