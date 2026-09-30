import { expect, test } from "./fixtures";

const upstream = "http://127.0.0.1:3210";
async function setMode(recommendation: string, preserveCalls = false) {
  await fetch(`${upstream}/__control`, {
    method: "POST",
    body: JSON.stringify({ operations: { recommendation }, preserveCalls }),
  });
}
async function paths() {
  const { calls } = await (await fetch(`${upstream}/__control`)).json();
  return calls.map((call: { path: string }) => call.path);
}
test.beforeEach(() => setMode("success"));

test("renders a source link without prefetch and opens it only on explicit activation", async ({
  page,
  context,
}) => {
  let externalRequests = 0;
  await context.route("https://example.invalid/**", async (route) => {
    externalRequests++;
    await route.fulfill({
      contentType: "text/html",
      body: "<title>Synthetic problem</title>",
    });
  });
  await page.goto("/practice");
  const link = page.getByRole("link", { name: "在 Codeforces 打开题目" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAccessibleDescription("将在新标签页打开");
  await expect(page.getByText(/当前推荐为早期占位结果/)).toBeVisible();
  expect(externalRequests).toBe(0);
  const popupPromise = context.waitForEvent("page");
  await link.click();
  const popup = await popupPromise;
  await expect(popup).toHaveTitle("Synthetic problem");
  expect(externalRequests).toBe(1);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
  expect(await paths()).toEqual([
    "/api/users/1/profile",
    "/api/users/1/recommendations?limit=1",
  ]);
});

test("recommendation failure retains the profile and retries E2 alone", async ({
  page,
}) => {
  await setMode("http-error");
  await page.goto("/practice");
  await expect(
    page.getByRole("button", { name: "重试加载推荐" }),
  ).toBeVisible();
  await expect(page.getByText("训练画像已就绪")).toBeVisible();
  await setMode("success", true);
  await page.getByRole("button", { name: "重试加载推荐" }).click();
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toBeVisible();
  expect(await paths()).toEqual([
    "/api/users/1/profile",
    "/api/users/1/recommendations?limit=1",
    "/api/users/1/recommendations?limit=1",
  ]);
});

test("empty and invalid-link recommendations remain distinct from errors", async ({
  page,
}) => {
  await setMode("empty");
  await page.goto("/practice");
  await expect(page.getByText("暂时没有可展示的推荐题目。")).toBeVisible();
  await expect(page.getByRole("button", { name: "重试加载推荐" })).toHaveCount(
    0,
  );
  await setMode("invalid-url");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "synthetic-A" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "题目链接暂不可用" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "在 Codeforces 打开题目" }),
  ).toHaveCount(0);
});
