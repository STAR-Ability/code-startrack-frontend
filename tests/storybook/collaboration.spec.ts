import { test, expect } from "@playwright/test";

test("offline application approval removes the pending record without network requests", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/**", (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto(
    "/iframe.html?id=workspace-collaboration--applications&viewMode=story",
  );
  await page.getByRole("button", { name: "通过", exact: true }).click();
  await expect(page.getByText("无待处理申请", { exact: true })).toBeVisible();
  expect(requests).toEqual([]);
});

test("privacy Select supports keyboard and saves through the shared Mock state machine", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=workspace-collaboration--privacy-settings&viewMode=story",
  );
  const select = page.getByRole("combobox", { name: "能力画像", exact: true });
  await select.click();
  await page.getByRole("option", { name: "仅自己", exact: true }).waitFor();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(select).toContainText("共享团队负责人/教练");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(select).toContainText("共享团队负责人/教练");
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
});

test("danger confirmation can be cancelled and confines keyboard focus", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=workspace-collaboration--settings&viewMode=story",
  );
  await page.getByRole("button", { name: "解散团队", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }
  await expect(
    dialog.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toBeHidden();
});
