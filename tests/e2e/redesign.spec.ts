import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream({ recommendation: "rich" }));

test("profile and practice share data without mixing their content or repeating reads", async ({
  page,
}) => {
  await page.goto("/profile");
  await expect(page.locator("dd")).toHaveCount(5);
  await expect(page.getByRole("region", { name: "推荐题目" })).toHaveCount(0);
  expect((await upstreamCalls()).map((call) => call.path)).toEqual([
    "/api/users/1/profile",
  ]);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "写题训练", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Synthetic practice problem" }),
  ).toBeVisible();
  await expect(page.locator("dd")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "写题训练", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "查看训练画像" }).click();
  await expect(page.locator("dd")).toHaveCount(5);
  expect((await upstreamCalls()).map((call) => call.path)).toEqual([
    "/api/users/1/profile",
    "/api/users/1/recommendations?limit=1",
  ]);
  await page.getByRole("button", { name: "关于已连接账号" }).click();
  await expect(
    page.getByText(/画像更新时间不代表账号最近同步时间/),
  ).toBeVisible();
});

for (const route of ["/", "/profile", "/practice"]) {
  test(`optional login on ${route} is honest, keyboard dismissible and collects no credentials`, async ({
    page,
  }) => {
    await page.goto(route);
    const login = page.getByRole("button", { name: "登录", exact: true });
    await login.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("账号登录与注册暂未开放");
    await expect(dialog.locator("input, form")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(login).toBeFocused();
    await login.click();
    await dialog.getByRole("button", { name: "关闭弹窗" }).click();
    await expect(dialog).toBeHidden();
    if (route === "/") expect(await upstreamCalls()).toEqual([]);
  });
}

test("preview and journey work by keyboard with no learner reads and keep animations enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const preview = page.getByRole("button", { name: "查看推荐示意" });
  await preview.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-slot=popover-content]")).toContainText(
    "交互示意",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-slot=popover-content]")).toHaveCount(0);
  const milestone = page.getByRole("button", { name: "graphs", exact: true });
  await milestone.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-slot=popover-content]")).toContainText(
    "A Path Through the Graph",
  );
  await page.keyboard.press("Escape");
  expect(
    await page
      .locator(".marquee-track")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe((page.viewportSize()?.width ?? 0) >= 640 ? "marquee-drift" : "none");
  expect(
    await page
      .locator(".preview-cards")
      .evaluate((el) => getComputedStyle(el).transform),
  ).not.toBe("none");
  await expect(page.locator(".orbit-path")).toHaveCSS(
    "animation-name",
    "draw-path",
  );
  expect(
    await preview.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).not.toBe("0s");
  const productPreview = page.locator("#product-preview");
  await productPreview.dispatchEvent("pointermove", {
    pointerType: "mouse",
    clientX: 0,
    clientY: 0,
  });
  expect(
    await productPreview.evaluate((el) =>
      el.style.getPropertyValue("--tilt-x"),
    ),
  ).not.toBe("");
  await productPreview.dispatchEvent("pointerout", { pointerType: "mouse" });
  expect(
    await productPreview.evaluate((el) =>
      el.style.getPropertyValue("--tilt-x"),
    ),
  ).toBe("");
  const section = page.locator(".landing-section").first();
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-revealed", "true");
  await expect(section).toHaveCSS("animation-name", "section-enter");
  expect(await upstreamCalls()).toEqual([]);
});

test("legacy dashboard redirects to the focused practice route", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/practice");
  await expect(
    page.getByRole("heading", { name: "今天练什么？" }),
  ).toBeVisible();
});
