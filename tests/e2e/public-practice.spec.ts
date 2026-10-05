import type { Route } from "@playwright/test";
import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const failure = (route: Route, code: string, status: number) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({
      error: { code, message: "Synthetic failure", details: {} },
      requestId: "00000000-0000-4000-8000-000000000900",
    }),
  });

test.beforeEach(() => configureUpstream());

test("visitors browse practice modes and navigate without private account reads", async ({
  page,
  isMobile,
}) => {
  await configureUpstream({ loggedOut: true });
  await page.goto("/practice");
  await expect(page).toHaveURL("/practice");
  await expect(
    page.getByText("请登录查看更多数据", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "为你推荐", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "推荐历史", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await expect(
    page.getByText("围绕相对薄弱的知识点，进行更有针对性的练习。"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "生成推荐", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /A Small Step/ })).toHaveCount(
    0,
  );
  expect(
    (await upstreamCalls()).filter((call) => call.path.includes("oj-accounts")),
  ).toHaveLength(0);
  if (isMobile)
    await page
      .getByRole("button", { name: "移动端工作区导航", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "训练工作区", exact: true })
    .getByRole("link", { name: "能力画像", exact: true })
    .click();
  await expect(page).toHaveURL("/profile");
  await expect(
    page.getByText("请登录查看更多数据", { exact: true }),
  ).toBeVisible();
  if (isMobile) await expect(page.getByRole("dialog")).toBeHidden();
  expect(
    (await upstreamCalls()).filter((call) => call.path.includes("oj-accounts")),
  ).toHaveLength(0);
});

for (const status of [404, 503]) {
  test(`failed session ${status} keeps practice browsable with login and recovery`, async ({
    page,
  }) => {
    await page.route("**/api/v1/me", (route) =>
      failure(
        route,
        status === 404 ? "RESOURCE_NOT_FOUND" : "INTERNAL_ERROR",
        status,
      ),
    );
    await page.goto("/practice");
    await expect(
      page.getByRole("heading", { name: "下一道题，下一步成长。" }),
    ).toBeVisible();
    await expect(
      page.getByText("请登录查看更多数据", { exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "推荐历史", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "重试", exact: true }),
    ).toBeEnabled();
    await expect(page.getByText("内容暂未加载", { exact: true })).toHaveCount(
      0,
    );
    expect(
      (await upstreamCalls()).filter((call) =>
        call.path.includes("oj-accounts"),
      ),
    ).toHaveLength(0);
    await page.unroute("**/api/v1/me");
    await page.getByRole("button", { name: "重试", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /A Small Step/ }),
    ).toBeVisible();
  });
}

test("slow account list leaves the introduction and modes interactive and recovers", async ({
  page,
}) => {
  await page.clock.install();
  let confirmSession!: () => void;
  const checkingSession = new Promise<void>((resolve) => {
    confirmSession = resolve;
  });
  await page.route("**/api/v1/me", async (route) => {
    await checkingSession;
    await route.continue();
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/oj-accounts?*", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/practice");
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await page.getByRole("button", { name: "难度匹配", exact: true }).click();
  await expect(
    page.getByText("从与你当前水平相近的题目开始，稳步积累解题经验。"),
  ).toBeVisible();
  confirmSession();
  await expect(page.getByLabel("当前 Codeforces 账号")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "难度匹配", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.clock.fastForward(8500);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(1);
  release();
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "难度匹配", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(600);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
});

test("failed accounts keep placeholders and offer recovery", async ({
  page,
}) => {
  await page.route("**/api/v1/oj-accounts?*", (route) =>
    failure(route, "RESOURCE_NOT_FOUND", 404),
  );
  await page.goto("/practice");
  await expect(page.getByText("暂无数据", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "下一道题，下一步成长。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "重试", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/oj-accounts?*");
  await page.route("**/api/v1/oj-accounts?*", (route) =>
    failure(route, "INTERNAL_ERROR", 503),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "重试", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText("暂无数据", { exact: true })).toBeVisible();
  await page.unroute("**/api/v1/oj-accounts?*");
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
});

test("missing recommendations remain errors while successful empty history stays empty", async ({
  page,
}) => {
  await page.route("**/recommendations/latest?*", (route) =>
    failure(route, "RESOURCE_NOT_FOUND", 404),
  );
  await page.route("**/recommendations/history?*", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({
      json: {
        ...body,
        data: [],
        meta: { ...body.meta, total: 0, hasNext: false },
      },
    });
  });
  await page.goto("/practice");
  const recommendation = page.getByRole("region", {
    name: translate("zh-CN", "practice.forYou"),
    exact: true,
  });
  await expect(
    recommendation.getByText("内容暂未加载", { exact: true }),
  ).toBeVisible();
  await expect(
    recommendation.getByText("当前无法加载数据，请检查网络或稍后重试", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    recommendation.getByText("暂无数据", { exact: true }),
  ).toHaveCount(0);
  await expect(
    recommendation.getByRole("button", { name: "重试", exact: true }),
  ).toBeEnabled();
  const history = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "推荐历史", exact: true }),
  });
  await expect(history.getByText("暂无数据", { exact: true })).toBeVisible();
  await expect(history.getByText("暂无记录", { exact: true })).toBeVisible();
  await expect(history.getByText("内容暂未加载", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "生成推荐", exact: true }),
  ).toBeEnabled();
});

test("a missing cached record disappears and session expiry removes all private panels", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/practice");
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await page.route("**/recommendations/latest?mode=HYBRID", (route) =>
    failure(route, "RESOURCE_NOT_FOUND", 404),
  );
  // Re-observe a stale cached mode to exercise failure after prior success.
  await page.clock.fastForward(31_000);
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  const refreshed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/recommendations/latest?mode=HYBRID") &&
      response.status() === 404,
  );
  await page.getByRole("button", { name: "综合推荐", exact: true }).click();
  await refreshed;
  await page.clock.runFor(200);
  const recommendation = page.getByRole("region", {
    name: translate("zh-CN", "practice.forYou"),
    exact: true,
  });
  await expect(
    recommendation.getByText("内容暂未加载", { exact: true }),
  ).toBeVisible();
  await expect(
    recommendation.getByText("暂无数据", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /A Small Step/ })).toHaveCount(
    0,
  );
  const snapshot = page.getByRole("button", {
    name: "查看生成时的画像",
    exact: true,
  });
  await expect(snapshot).toHaveCount(0);
  await page.unroute("**/recommendations/latest?mode=HYBRID");
  await recommendation
    .getByRole("button", { name: "重试", exact: true })
    .click();
  await page.clock.runFor(200);
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await expect(snapshot).toBeEnabled();
  await configureUpstream({ loggedOut: true });
  const expired = page.waitForResponse(
    (response) =>
      response.url().endsWith("/recommendations/latest?mode=LEVEL") &&
      response.status() === 401,
  );
  await page.getByRole("button", { name: "难度匹配", exact: true }).click();
  await expired;
  await page.clock.runFor(200);
  await expect(
    page.getByText("请登录查看更多数据", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /A Small Step/ })).toHaveCount(
    0,
  );
  await expect(snapshot).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "查看批次", exact: true }),
  ).toHaveCount(0);
  await expect(recommendation).toHaveCount(0);
  await expect(page).toHaveURL("/practice");
});

test("guest practice fits narrow screens and respects reduced motion", async ({
  page,
  context,
}) => {
  await configureUpstream({ loggedOut: true });
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: "http://127.0.0.1:3100" },
  ]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/practice");
  await expect(
    page.getByText("Log in to see more data", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Picked for you", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recommendation history", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const loginPrompt = page.locator('[data-slot="empty"]').filter({
    has: page.getByText("Log in to see more data", { exact: true }),
  });
  const login = loginPrompt.getByRole("link", {
    name: translate("en", "auth.login"),
    exact: true,
  });
  const demo = loginPrompt.getByRole("link", {
    name: translate("en", "ui.exploreDemo"),
    exact: true,
  });
  await expect(login).toHaveAttribute("href", "/login");
  await expect(demo).toHaveAttribute("href", "/demo");
  for (const target of [
    loginPrompt,
    loginPrompt.locator('[data-slot="empty-header"]'),
    loginPrompt.locator('[data-slot="empty-content"]'),
    login,
    demo,
  ]) {
    await expect(target).toBeVisible();
    await expect
      .poll(
        () =>
          target.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        {
          message: "Guest guidance and its actions fit at 320px with 200% text",
        },
      )
      .toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const navigationTrigger = page.getByRole("button", {
    name: "Mobile workspace navigation",
    exact: true,
  });
  expect(
    await navigationTrigger.evaluate(
      (element) => element.closest("header")!.getBoundingClientRect().height,
    ),
  ).toBeLessThan(800 / 3);
  await navigationTrigger.click();
  const navigation = page.getByRole("dialog");
  await expect(navigation).toBeVisible();
  expect((await navigation.boundingBox())!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  await expect(navigation).toBeHidden();
  await expect(navigationTrigger).toBeFocused();
  for (const item of await page
    .locator('[data-slot="toggle-group-item"]')
    .all()) {
    expect(
      await item.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
  }
  expect(
    await page
      .locator(".practice-intro")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page
    .getByRole("button", { name: "Weakness practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Weakness practice", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("account resolution does not erase a user-level security form", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/oj-accounts?*", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/security/password");
  const current = page.getByLabel("当前密码", { exact: true });
  const next = page.getByLabel("新密码", { exact: true });
  await current.fill("synthetic-password");
  await next.fill("synthetic-new-password");
  release();
  await expect
    .poll(async () =>
      (await upstreamCalls()).some((call) =>
        call.path.startsWith("/api/v1/oj-accounts?"),
      ),
    )
    .toBe(true);
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveCount(0);
  await expect(current).toHaveValue("synthetic-password");
  await expect(next).toHaveValue("synthetic-new-password");
});

test("a successful null recommendation is empty, not an unavailable service", async ({
  page,
}) => {
  await page.route("**/recommendations/latest?*", (route) =>
    route.fulfill({
      json: { data: null, requestId: "00000000-0000-4000-8000-000000000900" },
    }),
  );
  await page.goto("/practice");
  await expect(page.getByText("暂无数据", { exact: true })).toBeVisible();
  await expect(page.getByText("尚未生成推荐", { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "生成推荐", exact: true }),
  ).toBeEnabled();
});

test("a missing sync job stops its old progress indicator and offers retry", async ({
  page,
}) => {
  await page.route("**/sync-jobs/*", (route) =>
    failure(route, "SYNC_JOB_NOT_FOUND", 404),
  );
  await page.goto("/practice");
  await page.getByRole("button", { name: "同步数据", exact: true }).click();
  await expect(
    page
      .getByText("当前无法加载数据，请检查网络或稍后重试", { exact: true })
      .first(),
  ).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("正在同步，完成后自动刷新")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "同步数据", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "重试", exact: true }),
  ).toBeVisible();
});
