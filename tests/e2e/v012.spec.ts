import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
const owner = "00000000-0000-4000-8000-000000001001";
const joined = "00000000-0000-4000-8000-000000001002";
const peer = "00000000-0000-4000-8000-000000001101";
test.beforeEach(() => configureUpstream());
test("missing AI job stops its old progress without automatically creating another", async ({
  page,
}) => {
  let polls = 0;
  await page.route("**/api/v1/ai-jobs/*", async (route) => {
    polls++;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Synthetic job was removed",
          details: {},
        },
        requestId: "00000000-0000-4000-8000-000000009999",
      }),
    });
  });
  await page.goto("/analysis");
  const generate = page.getByRole("button", {
    name: "重新生成报告",
    exact: true,
  });
  await generate.click();
  await expect(
    page.getByText("RESOURCE_NOT_FOUND", { exact: false }).first(),
  ).toHaveCount(1);
  await expect(generate).toBeEnabled();
  await expect(page.getByText("处理中", { exact: false })).toHaveCount(0);
  await expect(
    page.getByText("你已经形成稳定的训练节奏。", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(3200);
  expect(polls).toBe(1);
  expect(
    (await upstreamCalls()).filter(
      (call) =>
        call.method === "POST" && call.path.endsWith("/me/reports/generate"),
    ),
  ).toHaveLength(1);
});
test("user aggregate sources stay available without a selected account", async ({
  page,
}) => {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "账号来源", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await expect(
    page.getByRole("main").getByText("最高当前 Rating", { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).some(
      (call) =>
        call.path.includes("/oj-accounts/") && call.path.includes("/analysis"),
    ),
  ).toBe(false);
});
test("no CF binding preserves team and notification panels", async ({
  page,
}) => {
  await configureUpstream({ noAccounts: true });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("main").getByText("绑定 Codeforces 账号", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "我的团队", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "星轨训练队 · 2", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "通知中心", exact: true }),
  ).toBeVisible();
});
test("historical report shows frozen numbers and caution, not current analysis", async ({
  page,
}) => {
  await page.goto("/analysis");
  const history = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "历史报告", exact: true }),
  });
  await history
    .getByRole("button", { name: "查看", exact: true })
    .last()
    .click();
  const report = page.locator(
    '[data-report-id="00000000-0000-4000-8000-000000001401"]',
  );
  await expect(report).toContainText("历史报告：当时尚无训练证据。");
  await expect(
    report.getByText("当时可用训练样本较少。", { exact: true }),
  ).toBeVisible();
  await report
    .getByRole("button", { name: "报告数据依据", exact: true })
    .click();
  await expect(
    report.locator("[data-metric-panel]").first().locator("dd").first(),
  ).toHaveText("0");
  expect(
    (await upstreamCalls()).some((call) =>
      call.path.endsWith("/me/reports/00000000-0000-4000-8000-000000001401"),
    ),
  ).toBe(true);
});
test("search application and cancellation follow returned statuses", async ({
  page,
}) => {
  await page.goto("/teams?tab=invitations");
  await page
    .locator("main article")
    .first()
    .getByRole("button", { name: "拒绝", exact: true })
    .click();
  await expect(page.locator("main article").first()).toContainText("已拒绝");
  await page.goto("/teams?tab=search");
  await page.getByLabel("团队名称或关键词").fill("开放");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await page.getByLabel("申请留言（可选）").fill("一起训练");
  await page.getByRole("button", { name: "申请加入", exact: true }).click();
  await expect(
    page.getByRole("main").getByText("申请待处理", { exact: true }),
  ).toBeVisible();
  await page.goto("/teams?tab=applications");
  const row = page.locator("main article").filter({
    has: page.getByRole("heading", { name: "开放训练营", exact: true }),
  });
  await row.getByRole("button", { name: "取消", exact: true }).click();
  await expect(row).toContainText("已取消");
  await expect(
    row.getByRole("button", { name: "取消", exact: true }),
  ).toBeDisabled();
});
test("invite acceptance refreshes joined teams and keeps recipient email redacted", async ({
  page,
}) => {
  await page.goto("/teams?tab=invitations");
  const row = page.locator("main article").first();
  await row.getByRole("button", { name: "接受", exact: true }).click();
  await expect(row).toContainText("已接受");
  await expect(
    row.getByRole("button", { name: "接受", exact: true }),
  ).toBeDisabled();
  await page.goto("/teams");
  await expect(
    page.getByRole("main").getByText("开放训练营", { exact: true }),
  ).toBeVisible();
});
test("coach is additive, owner approves and invites, member access is backend scoped", async ({
  page,
}) => {
  await configureUpstream({ coach: true });
  await page.goto("/coach");
  await expect(
    page.getByRole("heading", { name: "教练主页", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("main")).toBeVisible();
  await page.goto(`/teams/detail?teamId=${owner}&tab=applications`);
  await expect(
    page.getByRole("button", { name: "退出团队", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "通过", exact: true }).click();
  await page
    .getByRole("navigation", { name: "团队工作区导航" })
    .getByRole("link", { name: "团队成员", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "新成员", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "团队工作区导航" })
    .getByRole("link", { name: "团队邀请", exact: true })
    .click();
  await page.getByLabel("邀请邮箱").fill("new@example.test");
  await page.getByRole("button", { name: "邀请成员", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "new@example.test", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "团队工作区导航" })
    .getByRole("link", { name: "团队成员", exact: true })
    .click();
  const card = page.locator("main article").filter({
    has: page.getByRole("heading", { name: "训练伙伴", exact: true }),
  });
  await expect(
    card.getByRole("link", { name: "详细提交记录", exact: true }),
  ).toHaveCount(0);
  await card.getByRole("link", { name: "基础训练数据", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "基础训练数据", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "六维能力 · 0–100", exact: true }),
  ).toHaveCount(0);
});
test("ordinary members request only MEMBER recommendations and cannot manage", async ({
  page,
}) => {
  await page.goto(`/teams/detail?teamId=${joined}&tab=recommendations`);
  await expect(
    page.getByRole("heading", { name: "团队推荐", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("推荐可见范围")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "生成团队推荐", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "退出团队", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-team-audience="MEMBER"]')).toBeVisible();
  expect(
    (await upstreamCalls())
      .filter((call) => call.path.includes("/recommendations/"))
      .every((call) => !call.path.includes("COACH")),
  ).toBe(true);
});
test("no shared samples shows privacy explanations and no zero radar", async ({
  page,
}) => {
  await configureUpstream({ noSharing: true });
  await page.goto(`/teams/detail?teamId=${joined}&tab=analysis`);
  await expect(
    page.getByText("当前没有成员允许共享能力画像", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("当前没有成员开放基础训练数据", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "六维能力 · 0–100", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("缺少可用训练等级数据", { exact: true }).first(),
  ).toBeVisible();
});
test("privacy defaults remain private until explicitly saved", async ({
  page,
}) => {
  await page.goto("/privacy");
  for (const name of [
    "基础训练数据",
    "能力画像",
    "详细提交记录",
    "个人分析报告",
  ])
    await expect(
      page.getByRole("combobox", { name, exact: true }),
    ).toContainText("仅自己");
  await page.getByRole("combobox", { name: "能力画像", exact: true }).click();
  await page
    .getByRole("option", { name: "共享团队负责人/教练", exact: true })
    .click();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "能力画像", exact: true }),
  ).toContainText("共享团队负责人/教练");
  expect(
    (await upstreamCalls()).find(
      (call) => call.method === "PATCH" && call.path.endsWith("/me/privacy"),
    )?.body,
  ).toEqual({
    basicTraining: "PRIVATE",
    abilityProfile: "TEAM_COACH",
    detailedSubmissions: "PRIVATE",
    analysisReport: "PRIVATE",
  });
});
test("structured notifications mark read and route to final API state", async ({
  page,
}) => {
  await page.goto("/notifications");
  await page.getByRole("button", { name: "全部已读", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "标记已读", exact: true }),
  ).toHaveCount(0);
  await page
    .locator("main article")
    .first()
    .getByRole("link", { name: "查看", exact: true })
    .click();
  await expect(page).toHaveURL("/teams?tab=invitations");
  await expect(
    page.getByRole("button", { name: "接受", exact: true }).first(),
  ).toBeVisible();
});
test("report AI failure retains previous result and cooldown prevents duplicate creates", async ({
  page,
}) => {
  await configureUpstream({ aiFailed: true });
  await page.goto("/analysis");
  await page.getByRole("button", { name: "重新生成报告", exact: true }).click();
  await expect(
    page.getByText("任务失败，已有历史结果仍可查看。", { exact: false }),
  ).toBeVisible();
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
test("member permission revocation withdraws cached content", async ({
  page,
}) => {
  await page.goto(
    `/teams/member?teamId=${owner}&memberPublicId=${peer}&view=basicTraining`,
  );
  await expect(
    page.getByRole("heading", { name: "基础训练数据", exact: true }),
  ).toBeVisible();
  await configureUpstream({ privacyDenied: true }, true);
  await page.getByRole("button", { name: "刷新数据", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "基础训练数据", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("成员未向你开放此数据", { exact: true }).first(),
  ).toBeVisible();
});
