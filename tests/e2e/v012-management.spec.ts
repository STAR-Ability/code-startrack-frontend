import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
const owner = "00000000-0000-4000-8000-000000001001";
const peer = "00000000-0000-4000-8000-000000001101";
test.beforeEach(() => configureUpstream());

test("coach redemption refreshes additive roles and enables coach navigation", async ({
  page,
}) => {
  await page.goto("/coach");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "当前角色不允许此操作，请刷新身份。",
  );
  await page.goto("/security/coach");
  await page.getByLabel("教练邀请码", { exact: true }).fill("synthetic-code");
  await page
    .getByRole("button", { name: "兑换教练邀请码", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "教练主页", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "训练主页", exact: true }),
  ).toBeVisible();
  const reads = (await upstreamCalls()).filter(
    (call) => call.path === "/api/v1/me",
  );
  expect(reads.length).toBeGreaterThanOrEqual(2);
});

test("coach creates, edits, archives, activates and dissolves a team with exact confirmation", async ({
  page,
}) => {
  await configureUpstream({ coach: true });
  await page.goto("/coach/teams/create");
  await page.getByLabel("团队名称", { exact: true }).fill("新建训练队");
  await page.getByLabel("团队描述", { exact: true }).fill("共同训练");
  await page.getByRole("button", { name: "创建团队", exact: true }).click();
  await expect(page).toHaveURL(/\/teams\/detail\?teamId=/);
  await expect(
    page.getByRole("heading", { name: "新建训练队", exact: true }),
  ).toBeVisible();
  await page.getByLabel("团队名称", { exact: true }).fill("更新训练队");
  const edit = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "编辑团队", exact: true }),
  });
  await edit.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "更新训练队", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "归档团队", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存", exact: true })
    .click();
  await expect(page.getByText("已归档", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "邀请成员", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "恢复团队", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "邀请成员", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "解散团队", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("输入团队名称确认解散").fill("不匹配");
  await expect(
    dialog.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("输入团队名称确认解散").fill("更新训练队");
  await dialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("已解散", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "邀请成员", exact: true }),
  ).toHaveCount(0);
  expect(
    (await upstreamCalls()).find(
      (call) => call.method === "POST" && call.path === "/api/v1/teams",
    )?.body,
  ).toEqual({ name: "新建训练队", description: "共同训练", avatarUrl: null });
});

test("transfer withdraws coach batches and owner actions; member can then leave", async ({
  page,
}) => {
  await page.goto(`/teams/detail?teamId=${owner}`);
  await expect(page.locator('[data-team-audience="COACH"]')).toBeVisible();
  await page.getByRole("button", { name: "转让负责人", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "新负责人", exact: true })
    .selectOption(peer);
  await dialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByLabel("推荐可见范围")).toHaveCount(0);
  await expect(page.locator('[data-team-audience="COACH"]')).toHaveCount(0);
  await expect(page.locator('[data-team-audience="MEMBER"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "生成团队推荐", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "退出团队", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "退出团队", exact: true })
    .click();
  await page.goto("/teams");
  await expect(
    page.getByRole("heading", { name: "星轨训练队", exact: true }),
  ).toHaveCount(0);
});

test("team AI generation uses explicit audience, polls one job and preserves scope", async ({
  page,
}) => {
  await page.goto(`/teams/detail?teamId=${owner}`);
  await page.getByLabel("推荐可见范围").selectOption("MEMBER");
  await expect(page.locator('[data-team-audience="MEMBER"]')).toBeVisible();
  await page.getByRole("button", { name: "生成团队推荐", exact: true }).click();
  await expect(page.getByText("处理完成", { exact: false })).toBeVisible();
  const writes = (await upstreamCalls()).filter(
    (call) =>
      call.method === "POST" && call.path.endsWith("/recommendations/generate"),
  );
  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({ audience: "MEMBER", mode: "HYBRID" });
  await expect(page.locator('[data-team-audience="COACH"]')).toHaveCount(0);
});

test("report rate limits prevent duplicate submissions and keep the old report", async ({
  page,
}) => {
  await configureUpstream({ reportRateLimited: true });
  await page.goto("/analysis");
  const generate = page.getByRole("button", {
    name: "重新生成报告",
    exact: true,
  });
  await generate.click();
  await expect(generate).toBeDisabled();
  await expect(page.getByText(/秒后可重试/).first()).toBeVisible();
  await expect(
    page.getByText("你已经形成稳定的训练节奏。", { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).filter(
      (call) =>
        call.method === "POST" && call.path.endsWith("/me/reports/generate"),
    ),
  ).toHaveLength(1);
});
