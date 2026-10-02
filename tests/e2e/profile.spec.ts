import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("analysis windows refetch exact DTO and history opens immutable snapshot", async ({
  page,
}) => {
  await page.goto("/analysis");
  await expect(
    page.getByRole("heading", { name: "六维能力 · 0–100" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "近 7 天", exact: true }).click();
  await expect
    .poll(async () =>
      (await upstreamCalls()).some((call) =>
        call.path.endsWith("/analysis/latest?window=7D"),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "查看快照", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "返回最新结果" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("数据已过期", { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).some((call) =>
      /\/analysis\/00000000-0000-4000-8000-000000000080/.test(call.path),
    ),
  ).toBe(true);
});
test("personal data exposes nullable Gym data, pending team submissions and MiB units", async ({
  page,
}) => {
  await page.goto("/data");
  await expect(
    page.getByRole("heading", { name: "做题记录", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "题目提交记录" }).last().click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toContainText("gym-demo-B");
  await expect(drawer).toContainText("等待判题");
  await expect(drawer).toContainText("Synthetic team");
  await expect(drawer).toContainText("1.00");
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "比赛与 Rating（当前页）", exact: true })
    .click();
  await expect(page.getByText("Synthetic contest")).toBeVisible();
});
