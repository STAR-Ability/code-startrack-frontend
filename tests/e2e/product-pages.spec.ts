import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("public product pages have distinct content and never request learner data", async ({
  page,
}) => {
  for (const [route, heading] of [
    ["/product", "从一次提交"],
    ["/product/profile", "看见积累"],
    ["/product/recommendations", "把注意力"],
    ["/about", "每一小步"],
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      heading,
    );
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
      heading,
    );
    await page.getByRole("button", { name: "简体中文", exact: true }).click();
  }
  expect(await upstreamCalls()).toEqual([]);
});

test("public navigation and illustrative recommendation controls remain keyboard accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("summary").filter({ hasText: "探索产品" }).click();
  const nav = page.getByRole("navigation", { name: "探索产品" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "推荐题目", exact: true }).click();
  await expect(page).toHaveURL("/product/recommendations");
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "弱项训练", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("main")).toContainText("不生成真实推荐");
  expect(await upstreamCalls()).toEqual([]);
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".product-preview").hover();
  await expect
    .poll(() =>
      page
        .locator(".preview-cards")
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe("none");
});
