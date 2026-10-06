import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());

for (const [route, resource, headings] of [
  [
    "/data",
    "/training/overview",
    ["训练概览", "知识标签", "难度分布", "每日训练", "做题记录"],
  ],
  ["/accounts/profile", "/analysis/latest", ["能力摘要", "六维能力 · 0–100"]],
  [
    "/accounts/analysis",
    "/analysis/latest",
    ["画像指标", "六维能力 · 0–100", "分析历史"],
  ],
] as const) {
  test(`first failure preserves ${route} cards and retry restores actual data`, async ({
    page,
  }) => {
    await configureUpstream({ errorResource: resource });
    await page.goto(route);
    for (const name of headings)
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    await expect(
      page
        .getByText("当前无法加载数据，请检查网络或稍后重试", { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: headings[0], exact: true }),
    ).toHaveAttribute("aria-busy", "false");
    for (const name of headings)
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    const overview = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", {
        name: headings[0],
        exact: true,
      }),
    });
    await expect(overview.locator("dd").filter({ hasText: /^0$/ })).toHaveCount(
      0,
    );
    const snapshotCharts =
      route === "/data"
        ? ["每日训练", "知识标签", "难度分布"]
        : ["六维能力 · 0–100"];
    for (const name of snapshotCharts)
      await expect(
        page.getByRole("main").getByRole("img", { name, exact: true }),
      ).toHaveCount(0);
    if (route === "/accounts/analysis")
      await expect(
        page.getByRole("img", { name: "分数趋势（当前页）", exact: true }),
      ).toBeVisible();
    await expect(overview).toContainText("暂无");
    await configureUpstream({ errorResource: null }, true);
    await page
      .getByRole("button", { name: "重试", exact: true })
      .first()
      .click();
    await expect(overview.locator("dd").filter({ hasText: /^5$/ })).toHaveCount(
      1,
    );
    await expect(
      page.locator('section[data-state="mock"]').first(),
    ).toBeVisible();
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}

test("failed lists preserve filters, error recovery, pagination and unrelated statistics", async ({
  page,
}) => {
  await configureUpstream({ errorResource: "/problems" });
  await page.goto("/data");
  await expect(
    page.getByRole("heading", { name: "做题记录", exact: true }),
  ).toBeVisible();
  const records = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "做题记录", exact: true }),
  });
  await expect(records.locator('[data-state="error"]')).toBeVisible();
  await expect(records.getByText("暂无记录", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "应用筛选", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "分页" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "训练概览", exact: true }),
  ).toBeVisible();
  await configureUpstream({ errorResource: null }, true);
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(page.getByText("gym-demo-B", { exact: true })).toBeVisible();
  for (const [resource, tab] of [
    ["/submissions", "提交次数"],
    ["/rating-changes", "比赛与 Rating（当前页）"],
  ]) {
    await configureUpstream({ errorResource: resource }, true);
    await page.getByRole("button", { name: tab, exact: true }).click();
    const panel = page
      .locator(resource === "/submissions" ? "section" : '[data-slot="card"]')
      .filter({ has: page.getByRole("heading", { name: tab, exact: true }) });
    await expect(
      panel
        .getByText("当前无法加载数据，请检查网络或稍后重试", { exact: true })
        .first(),
    ).toBeVisible();
    await expect(panel.getByText("暂无记录", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "分页" })).toBeVisible();
  }
});

test("a complete backend outage keeps safe workspace structures without invented identity", async ({
  page,
}) => {
  await configureUpstream({ failReads: true });
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "六维能力 · 0–100" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "能力摘要" })).toBeVisible();
  await expect(
    page
      .getByText("当前无法加载数据，请检查网络或稍后重试", { exact: true })
      .first(),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).every((call) => call.path === "/api/v1/me"),
  ).toBe(true);
  await configureUpstream({ failReads: false }, true);
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
});

test("account details and roles use the two previously unused reads and recover independently", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page
    .getByRole("button", { name: "账号详情", exact: true })
    .first()
    .click();
  await expect(page.getByText("1600", { exact: true })).toBeVisible();
  expect(
    (await upstreamCalls()).some(
      (call) => call.path === "/api/v1/oj-accounts/9007199254740993",
    ),
  ).toBe(true);
  await configureUpstream({ errorPath: "/me/roles" }, true);
  await page.goto("/security");
  await expect(page.getByRole("heading", { name: "身份与角色" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "修改密码", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  await configureUpstream({ errorPath: null }, true);
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(
    page.getByText("Student · STUDENT", { exact: true }),
  ).toBeVisible();
});

test("slow reads retain card skeletons and empty successes are not errors", async ({
  page,
}) => {
  await configureUpstream({ delayMs: 600, zero: true, emptyRecords: true });
  await page.goto("/data");
  await expect(page.getByRole("heading", { name: "训练概览" })).toBeVisible();
  await expect(page.getByText("暂无训练证据", { exact: true })).toBeVisible();
  await expect(
    page.getByText("当前无法加载数据，请检查网络或稍后重试"),
  ).toHaveCount(0);
  await expect(
    page.getByText("Mock 模式 · 示例数据", { exact: true }),
  ).toBeVisible();
});
