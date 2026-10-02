import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("public landing and local Demo never fetch a learner", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("码练星轨 | 编程训练");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "你的每一道代码",
  );
  await page.getByRole("link", { name: "查看只读 Demo", exact: true }).click();
  await expect(page).toHaveURL("/demo");
  await expect(
    page.getByText("示例数据 · 本地合成数据，不访问任何真实账号"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  expect(await upstreamCalls()).toEqual([]);
});
