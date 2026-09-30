import { expect, test } from "@playwright/test";

const upstream = "http://127.0.0.1:3210";
async function setMode(mode: string) {
  await fetch(`${upstream}/__control`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}
async function calls() {
  return (await (await fetch(`${upstream}/__control`)).json()).calls as {
    method: string;
    path: string;
  }[];
}

test.beforeEach(() => setMode("success"));

test("profile uses the actual gateway and locale changes preserve the loaded data", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByText("已通过题目", { exact: true })).toBeVisible();
  await expect(page.locator("dd")).toHaveText(["0", "0", "0", "0", "0"]);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page).toHaveTitle(
    "Training profile and recommendation | codeStartrack",
  );
  await expect(
    page.getByText("Solved problems", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  expect(await calls()).toEqual([
    expect.objectContaining({ method: "GET", path: "/api/users/1/profile" }),
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("profile 404 has no fake zeros or account recovery and retries only its GET", async ({
  page,
}) => {
  await setMode("http-error");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "重试加载画像" }),
  ).toBeVisible();
  await expect(page.locator("dd")).toHaveCount(0);
  expect(await calls()).toHaveLength(1);
  await setMode("success");
  await page.getByRole("button", { name: "重试加载画像" }).click();
  await expect(page.locator("dd")).toHaveCount(5);
  expect((await calls()).map((call) => call.path)).toEqual([
    "/api/users/1/profile",
  ]);
});
