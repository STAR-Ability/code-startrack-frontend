import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
const owner = "00000000-0000-4000-8000-000000001001";
const member = "00000000-0000-4000-8000-000000001002";

test.beforeEach(() => configureUpstream());

test("team name is primary navigation; tasks survive refresh and do not share unrelated sections", async ({
  page,
}) => {
  await page.goto("/teams");
  await page.getByRole("link", { name: "算法研习社", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`teamId=${member}&tab=overview`));
  const nav = page.getByRole("navigation", { name: "团队工作区导航" });
  await expect(
    nav.getByRole("link", { name: "团队设置", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "数据可用性", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "团队成员", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "团队能力概览", exact: true }).click();
  await expect(page).toHaveURL(/tab=analysis/);
  await page.reload();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("团队能力概览");
  await expect(
    page.getByRole("heading", { name: "团队推荐", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/teams/detail?teamId=${member}&tab=settings`);
  await expect(
    page.getByText("无权访问此团队，请返回团队列表。", { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).filter(
      (call) =>
        call.path.includes(`/teams/${member}/`) &&
        /applications|invitations/.test(call.path),
    ),
  ).toHaveLength(0);
});

test("owner queues and danger zone stay team scoped; cancel is safe", async ({
  page,
}) => {
  await configureUpstream({ coach: true });
  await page.goto("/coach/teams?task=applications");
  await page.getByRole("link", { name: "星轨训练队", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`teamId=${owner}&tab=applications`));
  await expect(
    page.getByRole("button", { name: "通过", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "解散团队", exact: true }),
  ).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "团队工作区导航" });
  await nav.getByRole("link", { name: "团队设置", exact: true }).click();
  await page.getByRole("button", { name: "解散团队", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(
    (await upstreamCalls()).filter(
      (call) => call.method === "POST" && call.path.endsWith("/dissolve"),
    ),
  ).toHaveLength(0);
});
