import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("slow captcha keeps input focus and shows one top notification until it resolves", async ({
  page,
}) => {
  await page.clock.install();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/auth/captcha", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/login");
  const captcha = page.getByRole("textbox", {
    name: "图形验证码",
    exact: true,
  });
  const account = page.getByLabel("用户名或邮箱");
  await expect(captcha).toBeDisabled();
  await expect(
    page.locator('.captcha-frame [data-slot="spinner"]'),
  ).toBeVisible();
  await account.fill("still_typing");
  await page.clock.fastForward(7000);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  await page.clock.fastForward(1500);
  const notice = page.locator('[data-slot="toast"]');
  await expect(notice).toHaveCount(1);
  await expect(notice).toContainText("加载比平时久一点");
  await expect(account).toBeFocused();
  expect((await notice.boundingBox())!.y).toBeLessThan(80);
  release();
  await expect(captcha).toBeEnabled();
  await page.clock.runFor(600);
  await expect(notice).toHaveCount(0);
  await expect(account).toHaveValue("still_typing");
});

test("failed captcha stops spinning, hides diagnostics and can be retried", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/api/v1/auth/captcha", async (route) => {
    if (failed) return route.continue();
    failed = true;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Synthetic failure",
          details: {},
        },
        requestId: "00000000-0000-4000-8000-000000000900",
      }),
    });
  });
  await page.goto("/login");
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "这次操作还没完成",
  );
  await expect(
    page.locator('.captcha-frame [data-slot="spinner"]'),
  ).toHaveCount(0);
  await expect(page.getByText(/INTERNAL_ERROR/)).not.toBeVisible();
  await page.getByText("查看问题详情", { exact: true }).click();
  await expect(page.getByText(/INTERNAL_ERROR/)).toBeVisible();
  await page.getByRole("button", { name: "刷新图形验证码" }).click();
  await expect(
    page.getByRole("textbox", { name: "图形验证码", exact: true }),
  ).toBeEnabled();
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
});

test("password visibility and reduced motion work on the redesigned login", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  const submit = page.getByRole("button", { name: "登录", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByLabel("用户名或邮箱")).toBeFocused();
  const password = page.getByLabel("密码", { exact: true });
  await password.fill("synthetic-password");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "显示密码", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "隐藏密码", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  expect(
    await page
      .locator(".auth-form-enter")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await expect(page.getByRole("link", { name: "忘记密码？" })).toHaveAttribute(
    "href",
    "/reset-password",
  );
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: blank login accounts recover locally while preserving password and CAPTCHA security`, async ({
    page,
    context,
  }) => {
    await configureUpstream({ loggedOut: true });
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    let captchaRequests = 0;
    const loginRequests: { method: string; body: unknown }[] = [];
    await page.route("**/api/v1/auth/captcha", async (route) => {
      captchaRequests += 1;
      await route.continue();
    });
    await page.route("**/api/v1/auth/login", async (route) => {
      loginRequests.push({
        method: route.request().method(),
        body: route.request().postDataJSON(),
      });
      if (loginRequests.length !== 1) return route.continue();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "Synthetic login failure",
            details: {},
          },
          requestId: "00000000-0000-4000-8000-000000000900",
        }),
      });
    });
    await page.goto("/login");
    const account = page.getByLabel(translate(locale, "v.account"), {
      exact: true,
    });
    const password = page.getByLabel(translate(locale, "v.password"), {
      exact: true,
    });
    const captcha = page.getByRole("textbox", {
      name: translate(locale, "v.captcha"),
      exact: true,
    });
    const submit = page.getByRole("button", {
      name: translate(locale, "auth.login"),
      exact: true,
    });
    const operationAlert = page.locator("form").getByRole("alert");
    const toasts = page.locator('[data-slot="toast"]');
    const rawPassword = " p ";
    await expect(captcha).toBeEnabled();
    await expect.poll(() => captchaRequests).toBe(1);
    await account.fill("   ");
    await password.fill(rawPassword);
    await captcha.fill("abcd");
    await submit.click();

    async function expectLocalRecovery(
      expectedCaptchaRequests: number,
      expectedLoginRequests: number,
    ) {
      await expect(account).toHaveAttribute("aria-invalid", "true");
      await expect(account).toBeFocused();
      await expect(account).toHaveAccessibleDescription(
        translate(locale, "ui.accountRequired"),
      );
      await expect(
        page.getByText(translate(locale, "ui.accountRequired"), {
          exact: true,
        }),
      ).toBeVisible();
      await expect.poll(() => captchaRequests).toBe(expectedCaptchaRequests);
      await expect(captcha).toBeEnabled();
      await expect(captcha).toHaveValue("");
      await expect(account).toHaveValue("   ");
      await expect(password).toHaveValue(rawPassword);
      await expect(operationAlert).toHaveCount(0);
      await expect(toasts).toHaveCount(0);
      expect(loginRequests).toHaveLength(expectedLoginRequests);
    }

    await expectLocalRecovery(2, 0);
    await account.fill("  demo_student  ");
    await captcha.fill("abcd");
    await submit.click();
    await expect(operationAlert).toContainText(
      translate(locale, "ui.connectionHint"),
    );
    await expect(toasts).toHaveCount(1);
    await expect(toasts).toContainText(translate(locale, "ui.errorTitle"));
    await expect(account).toHaveAttribute("aria-invalid", "false");
    await expect.poll(() => captchaRequests).toBe(3);
    await expect(captcha).toBeEnabled();
    await expect(captcha).toHaveValue("");
    const expectedLogin = {
      method: "POST",
      body: {
        account: "demo_student",
        password: rawPassword,
        captchaChallengeId: "00000000-0000-4000-8000-000000000100",
        captchaAnswer: "abcd",
      },
    };
    expect(loginRequests).toEqual([expectedLogin]);

    await account.fill("   ");
    await captcha.fill("abcd");
    await submit.click();
    await expectLocalRecovery(4, 1);
    const recoveryPassword = " synthetic-demo-password ";
    await password.fill(recoveryPassword);
    await account.fill("  demo_student  ");
    await captcha.fill("abcd");
    await submit.click();
    await expect(page).toHaveURL("/dashboard");
    expect(loginRequests).toEqual([
      expectedLogin,
      {
        ...expectedLogin,
        body: { ...expectedLogin.body, password: recoveryPassword },
      },
    ]);
  });
}

test("a slow account query is dismissed on switch and never becomes another account's notice", async ({
  page,
}) => {
  await page.clock.install();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/v1/oj-accounts/9007199254740993/analysis/latest?window=ALL",
    async (route) => {
      await held;
      await route.continue();
    },
  );
  await page.goto("/accounts/profile");
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740993",
  );
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await page.clock.fastForward(8500);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(1);
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await page.clock.runFor(600);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "能力摘要" })).toBeVisible();
  release();
  await page.clock.runFor(1000);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
});
