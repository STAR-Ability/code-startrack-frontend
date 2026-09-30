import type { Page } from "@playwright/test";
import { test, expect, configureUpstream } from "./fixtures";

for (const locale of ["zh-CN", "en"]) {
  test(`${locale} keyboard, narrow-screen content and text zoom stay usable`, async ({
    page,
    context,
  }, testInfo) => {
    await configureUpstream({ recommendation: "rich" });
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
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await page.screenshot({
      path: testInfo.outputPath(`entry-${locale}.png`),
      fullPage: true,
    });
    const viewport = page.viewportSize()!;
    await checkTextZoom(page);
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    await page
      .getByRole("link", {
        name: locale === "en" ? "View read-only demo" : "查看只读 Demo",
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Synthetic practice problem" }),
    ).toBeVisible();
    const external = page.getByRole("link", {
      name: locale === "en" ? "Open on Codeforces" : "在 Codeforces 打开题目",
    });
    await external.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(external).toBeFocused();
    await expect
      .poll(() =>
        external.evaluate((element) => getComputedStyle(element).boxShadow),
      )
      .toContain("rgb(37, 99, 235)");
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${locale}.png`),
      fullPage: true,
    });
    await checkTextZoom(page);
  });
}

async function checkTextZoom(page: Page) {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const textScale of ["100%", "200%"]) {
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = scale;
    }, textScale);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const clipped = await page
      .locator("h1, h2, h3, p, a, [data-slot=badge]")
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            if (style.position === "absolute" || !rect.width || rect.width <= 1)
              return false;
            return (
              rect.right > innerWidth + 1 ||
              rect.left < -1 ||
              (element.clientWidth > 0 &&
                element.scrollWidth > element.clientWidth + 1)
            );
          })
          .map((element) => element.textContent),
      );
    expect(clipped, `Clipped content at ${textScale}`).toEqual([]);
  }
}
