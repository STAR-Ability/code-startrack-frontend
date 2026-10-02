import type { Page } from "@playwright/test";
import { test, expect, configureUpstream } from "./fixtures";
test.beforeEach(() => configureUpstream());
for (const locale of ["zh-CN", "en"]) {
  test(`${locale}: keyboard entry, workspace and forms fit narrow screens and text zoom`, async ({
    page,
    context,
  }, info) => {
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", {
      name: locale === "en" ? "Skip to main content" : "跳至主要内容",
    });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await narrow(page);
    for (const route of [
      "/dashboard",
      "/profile",
      "/practice",
      "/accounts",
      "/login",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (route !== "/login") {
        // Measure the populated workspace as well as its initial shell.
        await expect(
          page.getByRole("button", {
            name: locale === "en" ? "Refresh data" : "刷新数据",
            exact: true,
          }),
        ).toBeEnabled();
      }
      await narrow(page);
    }
    await page.screenshot({
      path: info.outputPath(`login-${locale}.png`),
      fullPage: true,
    });
  });
}
async function narrow(page: Page) {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const scale of ["100%", "200%"]) {
    await page.evaluate((value) => {
      document.documentElement.style.fontSize = value;
    }, scale);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
}
