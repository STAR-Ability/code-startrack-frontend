import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("anonymous workspace offers real captcha login and returns to the workspace", async ({
  page,
}) => {
  await configureUpstream({ loggedOut: true });
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByText("请登录查看更多数据", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "登录", exact: true })
    .click();
  await expect(page).toHaveURL("/login");
  await page.getByLabel("用户名或邮箱").fill("demo_student");
  await page.getByLabel("密码", { exact: true }).fill("synthetic-password");
  await page
    .getByRole("textbox", { name: "图形验证码", exact: true })
    .fill("abcd");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toBeVisible();
  const login = (await upstreamCalls()).find(
    (call) => call.path === "/api/v1/auth/login",
  );
  expect(login?.body).toEqual({
    account: "demo_student",
    password: "synthetic-password",
    captchaChallengeId: "00000000-0000-4000-8000-000000000100",
    captchaAnswer: "abcd",
  });
});
test("guests cannot load account data", async ({ page }) => {
  await configureUpstream({ guest: true });
  await page.goto("/dashboard");
  await expect(
    page.getByText("个人训练工作区需要有效的学生账号"),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).filter((call) => call.path.includes("oj-accounts")),
  ).toHaveLength(0);
});

test("registration uses email verification with the exact contract and resets the captcha", async ({
  page,
}) => {
  await configureUpstream({ loggedOut: true });
  await page.goto("/register");
  await page.getByLabel("用户名", { exact: true }).fill("new_student");
  await page.getByLabel("邮箱", { exact: true }).fill("new@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("synthetic-password");
  await page
    .getByRole("textbox", { name: "图形验证码", exact: true })
    .fill("abcd");
  await page
    .getByRole("button", { name: "发送邮箱验证码", exact: true })
    .click();
  await expect(
    page.getByText("验证码已发送，请在有效期内输入。"),
  ).toBeVisible();
  await page.getByLabel("邮箱验证码", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "注册", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  const calls = await upstreamCalls();
  expect(
    calls.find((call) => call.path === "/api/v1/auth/email-codes")?.body
      ?.purpose,
  ).toBe("REGISTER");
  expect(
    calls.find((call) => call.path === "/api/v1/auth/register")?.body,
  ).toEqual({
    username: "new_student",
    email: "new@example.invalid",
    password: "synthetic-password",
    verificationId: "00000000-0000-4000-8000-000000000101",
    emailCode: "123456",
  });
});
test("password change revokes local identity and returns to login", async ({
  page,
}) => {
  await page.goto("/security/password");
  await page.getByLabel("当前密码", { exact: true }).fill("synthetic-password");
  await page
    .getByLabel("新密码", { exact: true })
    .fill("synthetic-new-password");
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
