import { expect, test } from "@playwright/test";

test("entry navigates by keyboard without account actions, prefetch or non-GET traffic", async ({
  page,
  context,
}) => {
  await fetch("http://127.0.0.1:3210/__control", {
    method: "POST",
    body: JSON.stringify({ mode: "success" }),
  });
  const violations: string[] = [];
  const apiReads: string[] = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3100" || request.method() !== "GET") {
      violations.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/")) apiReads.push(url.pathname);
    await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
  await expect(
    page.getByText("当前演示仅供查看，暂不开放账号绑定与同步。"),
  ).toBeVisible();
  const open = page.getByRole("link", { name: "查看只读 Demo" });
  await open.hover();
  await open.focus();
  expect(apiReads).toEqual([]);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect(apiReads).toEqual([
    "/api/training/profile",
    "/api/training/recommendation",
  ]);
  await page.getByRole("link", { name: "返回首页" }).click();
  await expect(open).toBeVisible();
  expect(apiReads).toHaveLength(2);
  expect(violations).toEqual([]);
});
