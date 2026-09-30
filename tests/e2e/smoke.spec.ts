import { expect, test } from "./fixtures";

test("serves the read-only entry without browser errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("码练星轨 | 只读 Demo");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /你的每一道代码，\s*都留下成长轨迹。/,
    }),
  ).toBeVisible();
  await expect(page.getByText("codeStartrack", { exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});
