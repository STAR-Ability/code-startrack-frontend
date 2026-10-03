import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("student sidebar groups and URL tasks remain usable after refresh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/teams");
  const nav = page.getByRole("navigation", { name: "训练工作区", exact: true });
  await expect(
    nav.getByRole("link", { name: "我的团队", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    nav.getByRole("link", { name: "教练主页", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "发现团队", exact: true }).click();
  await expect(page.getByLabel("团队名称或关键词")).toBeVisible();
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("团队名称或关键词")).toBeVisible();
  await nav.getByRole("button", { name: "团队协作", exact: true }).click();
  await expect(
    nav.getByRole("link", { name: "发现团队", exact: true }),
  ).toBeHidden();
  await nav
    .getByRole("button", { name: "团队协作", exact: true })
    .press("Enter");
  await expect(
    nav.getByRole("link", { name: "发现团队", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "收起侧栏", exact: true }).click();
  await nav.getByRole("link", { name: "通知中心", exact: true }).hover();
  await expect(page.locator('[data-slot="tooltip-content"]')).toContainText(
    "通知中心",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "展开侧栏", exact: true }),
  ).toBeVisible();
});

test("mobile Sheet closes after navigation, traps focus and retains coach alongside learning", async ({
  page,
}) => {
  await configureUpstream({ coach: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", {
    name: "移动端工作区导航",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "训练主页", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "教练主页", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "教练主页", exact: true }).click();
  await expect(page).toHaveURL("/coach");
  await expect(dialog).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
