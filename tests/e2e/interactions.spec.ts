import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("refresh preserves content, blocks repeated clicks and reads only active account queries", async ({
  page,
}) => {
  await page.goto("/practice");
  const refresh = page.getByRole("button", { name: "刷新数据", exact: true });
  await expect(refresh).toBeEnabled();
  // Warm another account's cache first; it must not be refreshed in the background.
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await expect(refresh).toBeEnabled();
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740993");
  await expect(refresh).toBeEnabled();
  const before = (await upstreamCalls()).length;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reads = 0;
  await page.route(
    "**/9007199254740993/recommendations/latest?mode=HYBRID",
    async (route) => {
      reads++;
      await held;
      await route.continue();
    },
  );
  await refresh.click();
  await expect(refresh).toHaveAttribute("aria-busy", "true");
  await expect(refresh.locator('[data-slot="spinner"]')).toBeVisible();
  await expect(refresh).toBeDisabled();
  await expect
    .poll(() =>
      refresh.evaluate((element) => getComputedStyle(element).translate),
    )
    .toBe("none");
  await refresh.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  release();
  await expect(refresh).toBeEnabled();
  await expect(page.locator('[data-slot="toast-title"]')).toHaveText("已更新");
  expect(reads).toBe(1);
  const calls = (await upstreamCalls()).slice(before);
  expect(calls.every((call) => call.method === "GET")).toBe(true);
  expect(calls.some((call) => call.path.includes("9007199254740995"))).toBe(
    false,
  );
  expect(
    calls
      .filter((call) => call.path.includes("/9007199254740993/"))
      .map((call) => call.path.split("/9007199254740993/")[1]),
  ).toEqual(
    expect.arrayContaining([
      "recommendations/latest?mode=HYBRID",
      "sync-status",
    ]),
  );
});

test("failed refresh retains data and its details disclosure supports keyboard open and close", async ({
  page,
}) => {
  await page.goto("/practice");
  const refresh = page.getByRole("button", { name: "刷新数据", exact: true });
  await expect(refresh).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await page.route("**/recommendations/latest?*", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: "INTERNAL_ERROR",
          message: "Synthetic failure",
          details: {},
        },
        requestId: "00000000-0000-4000-8000-000000000900",
      },
    }),
  );
  await refresh.click();
  await expect(
    page.getByRole("button", { name: "重试", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="toast-title"]').filter({ hasText: "已更新" }),
  ).toHaveCount(0);
  const details = page.getByRole("button", {
    name: "查看问题详情",
    exact: true,
  });
  await expect(page.getByText(/INTERNAL_ERROR/)).not.toBeVisible();
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/INTERNAL_ERROR/)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(details).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(/INTERNAL_ERROR/)).not.toBeVisible();
  await expect(details).toBeFocused();
});

test("switching accounts dismisses old refresh feedback and never announces old success", async ({
  page,
}) => {
  await page.goto("/practice");
  const refresh = page.getByRole("button", { name: "刷新数据", exact: true });
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await expect(refresh).toBeEnabled();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/9007199254740993/recommendations/latest?mode=HYBRID",
    async (route) => {
      await held;
      await route.continue();
    },
  );
  await refresh.click();
  await expect(refresh).toBeDisabled();
  await page
    .getByLabel("当前 Codeforces 账号")
    .selectOption("9007199254740995");
  await expect(refresh).toBeEnabled();
  release();
  await expect(
    page.locator('[data-slot="toast-title"]').filter({ hasText: "已更新" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    "9007199254740995",
  );
  await expect(
    page.getByRole("main").getByText("DemoAlpha", { exact: true }),
  ).toHaveCount(0);
});

test("controls provide local hover, press, focus and tooltip feedback without moving passive surfaces", async ({
  page,
  isMobile,
}) => {
  await page.goto("/login");
  const submit = page.getByRole("button", { name: "登录", exact: true });
  await expect(submit).toBeEnabled();
  const account = page.getByLabel("用户名或邮箱");
  await account.focus();
  await expect
    .poll(() =>
      account
        .locator("..")
        .evaluate((element) => getComputedStyle(element).boxShadow),
    )
    .not.toBe("none");
  const visibility = page.getByRole("button", {
    name: "显示密码",
    exact: true,
  });
  await visibility.focus();
  // Base UI 1.8 tooltips are supplementary visual labels; the trigger owns its accessible name.
  const tooltip = page.locator('[data-slot="tooltip-content"]');
  await expect(tooltip).toHaveText("显示密码");
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
  if (!isMobile) {
    const card = page.locator('[data-slot="card"]').first();
    await visibility.blur();
    await page.mouse.move(0, 0);
    const restingShadow = await card.evaluate(
      (element) => getComputedStyle(element).boxShadow,
    );
    await card.hover({ position: { x: 8, y: 8 } });
    await expect
      .poll(() =>
        card.evaluate((element) => getComputedStyle(element).boxShadow),
      )
      .toBe(restingShadow);
    const restingColor = await submit.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await submit.hover();
    await expect
      .poll(() =>
        submit.evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe(restingColor);
    const hoverColor = await submit.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await expect
      .poll(() =>
        submit.evaluate((element) => getComputedStyle(element).translate),
      )
      .toBe("none");
    await page.mouse.down();
    await expect
      .poll(() => submit.evaluate((element) => getComputedStyle(element).scale))
      .toBe("none");
    await expect
      .poll(() =>
        submit.evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe(hoverColor);
    await page.mouse.up();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await submit.hover();
  expect(
    await submit.evaluate((element) => getComputedStyle(element).translate),
  ).toBe("none");
  expect(
    await submit.evaluate((element) =>
      parseFloat(getComputedStyle(element).transitionDuration),
    ),
  ).toBeLessThanOrEqual(0.001);
  expect(
    await page
      .locator(".auth-form-enter")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await expect(submit).toBeEnabled();
});
