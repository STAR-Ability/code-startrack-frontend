import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("student sidebar groups and URL tasks remain usable after refresh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/teams");
  const nav = page.getByRole("navigation", { name: "训练工作区", exact: true });
  await expect(
    nav.getByRole("link", { name: "我的团队", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    nav.getByRole("link", { name: "教练主页", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "发现团队", exact: true }).click();
  await expect(page.getByLabel("团队名称或关键词")).toBeVisible();
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("团队名称或关键词")).toBeVisible();
  await nav.getByRole("button", { name: "团队协作", exact: true }).click();
  await expect(
    nav.getByRole("link", { name: "发现团队", exact: true }),
  ).toBeHidden();
  await nav
    .getByRole("button", { name: "团队协作", exact: true })
    .press("Enter");
  await expect(
    nav.getByRole("link", { name: "发现团队", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "收起侧栏", exact: true }).click();
  await nav.getByRole("link", { name: "通知中心", exact: true }).hover();
  await expect(page.locator('[data-slot="tooltip-content"]')).toContainText(
    "通知中心",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "展开侧栏", exact: true }),
  ).toBeVisible();
});

for (const [locale, labels] of [
  [
    "zh-CN",
    {
      navigation: "训练工作区",
      learning: "概览与学习",
      teams: "团队协作",
      settings: "个人设置",
      discover: "发现团队",
      practice: "写题训练",
      collapse: "收起侧栏",
      expand: "展开侧栏",
    },
  ],
  [
    "en",
    {
      navigation: "Your workspace",
      learning: "Overview & learning",
      teams: "Teams & collaboration",
      settings: "Personal settings",
      discover: "Discover teams",
      practice: "Practice",
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
    },
  ],
] as const) {
  test(`${locale}: sidebar choices survive query and route navigation plus collapse`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/teams");
    const nav = page.getByRole("navigation", {
      name: labels.navigation,
      exact: true,
    });
    const group = (name: string) =>
      nav.getByRole("button", { name, exact: true });
    await group(labels.settings).click();
    await expect(group(labels.settings)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await nav.getByRole("link", { name: labels.discover, exact: true }).click();
    await expect(page).toHaveURL(/\/teams\?tab=search$/);
    await expect(group(labels.settings)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await group(labels.teams).click();
    await nav.getByRole("link", { name: labels.practice, exact: true }).click();
    await expect(page).toHaveURL("/practice");
    await expect(group(labels.teams)).toHaveAttribute("aria-expanded", "false");
    await expect(group(labels.settings)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(group(labels.learning)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page
      .getByRole("button", { name: labels.collapse, exact: true })
      .click();
    await page
      .getByRole("button", { name: labels.expand, exact: true })
      .click();
    await expect(group(labels.teams)).toHaveAttribute("aria-expanded", "false");
    await expect(group(labels.settings)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test(`${locale}: tablet text enlargement preserves content width and compact navigation`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/privacy");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).fontSize,
        ),
      )
      .toBe("32px");
    const sidebar = page.locator('[data-slot="sidebar-container"]');
    await expect
      .poll(async () => Math.round((await sidebar.boundingBox())!.width))
      .toBe(240);
    await expect
      .poll(() =>
        sidebar.locator(".sidebar-brand .brand-link").evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const frame = element
            .closest('[data-slot="sidebar-container"]')!
            .getBoundingClientRect();
          return (
            bounds.left >= frame.left &&
            bounds.right <= frame.right &&
            element.scrollWidth <= element.clientWidth &&
            element.scrollHeight <= element.clientHeight
          );
        }),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.locator("#main-content").evaluate((element) => {
          const style = getComputedStyle(element);
          return (
            element.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
          );
        }),
      )
      .toBeGreaterThanOrEqual(400);
    const privacyLabels = page.locator(
      '#main-content [data-slot="field-label"]',
    );
    await expect(privacyLabels).toHaveCount(4);
    for (const label of await privacyLabels.all()) {
      await expect
        .poll(() =>
          label.evaluate((element) => {
            const field = element.closest<HTMLElement>('[data-slot="field"]')!;
            const style = getComputedStyle(field);
            return (
              field.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight)
            );
          }),
        )
        .toBeGreaterThanOrEqual(180);
      await expect
        .poll(() =>
          label.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const field = element.closest<HTMLElement>('[data-slot="field"]')!;
            const frame = field.getBoundingClientRect();
            const style = getComputedStyle(field);
            return (
              element.scrollWidth <= element.clientWidth &&
              bounds.left >= frame.left + parseFloat(style.paddingLeft) - 1 &&
              bounds.right <= frame.right - parseFloat(style.paddingRight) + 1
            );
          }),
        )
        .toBe(true);
    }
    const privacyChoices = page.locator("#main-content [role=combobox]");
    await expect(privacyChoices).toHaveCount(4);
    for (const choice of await privacyChoices.all()) {
      await expect
        .poll(() =>
          choice.evaluate((element) => {
            const value = element.querySelector('[data-slot="select-value"]')!;
            return value.getBoundingClientRect().width;
          }),
        )
        .toBeGreaterThanOrEqual(180);
    }
    await page
      .getByRole("button", { name: labels.collapse, exact: true })
      .click();
    await expect
      .poll(async () => Math.round((await sidebar.boundingBox())!.width))
      .toBe(68);
    const links = sidebar.locator('[data-slot="sidebar-menu-button"]');
    for (const link of await links.all()) {
      await expect
        .poll(async () => {
          const bounds = (await link.boundingBox())!;
          return [Math.round(bounds.width), Math.round(bounds.height)];
        })
        .toEqual([40, 40]);
    }
    await expect
      .poll(() =>
        sidebar.locator('[data-slot="sidebar-content"]').evaluate((element) => {
          const nav = element.querySelector("nav")!;
          return (
            element.scrollHeight <=
            Math.max(element.clientHeight, nav.offsetHeight) + 2
          );
        }),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`${locale}: coach settings entry reveals the active link while group and query choices retain pane position`, async ({
    page,
    context,
  }) => {
    await configureUpstream({ coach: true });
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.setViewportSize({ width: 1280, height: 720 });
    const nav = page.getByRole("navigation", {
      name: labels.navigation,
      exact: true,
    });
    const pane = page.locator('[data-slot="sidebar-content"]');
    for (const route of ["/privacy", "/security"]) {
      await page.goto(route);
      await expect(nav.locator('[data-slot="sidebar-group"]')).toHaveCount(5);
      const active = nav.locator('a[aria-current="page"]');
      await expect(active).toHaveAttribute("href", route);
      await expect
        .poll(() =>
          active.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const container = element.closest<HTMLElement>(
              '[data-slot="sidebar-content"]',
            )!;
            const top = container.getBoundingClientRect().top;
            return (
              bounds.top >= top - 1 &&
              bounds.bottom <= top + container.clientHeight + 1
            );
          }),
        )
        .toBe(true);
      await expect(active).not.toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }

    await page.goto("/teams");
    await expect(nav.locator('[data-slot="sidebar-group"]')).toHaveCount(5);
    const settings = nav.getByRole("button", {
      name: labels.settings,
      exact: true,
    });
    await settings.click();
    await expect(settings).toHaveAttribute("aria-expanded", "false");
    await expect(
      nav
        .locator('[data-slot="sidebar-group"]')
        .last()
        .locator('[data-slot="collapsible-content"]'),
    ).toBeHidden();
    const savedScroll = await pane.evaluate((element) => {
      element.scrollTop = 24;
      return element.scrollTop;
    });
    expect(savedScroll).toBeGreaterThan(0);
    await nav.getByRole("link", { name: labels.discover, exact: true }).click();
    await expect(page).toHaveURL(/\/teams\?tab=search$/);
    await expect(settings).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(() => pane.evaluate((element) => element.scrollTop))
      .toBeCloseTo(savedScroll, 0);

    await page
      .locator('[data-slot="sidebar-footer"] a[href="/security"]')
      .click();
    await expect(page).toHaveURL("/security");
    await expect(settings).toHaveAttribute("aria-expanded", "false");
    await expect(nav.locator('a[aria-current="page"]')).toBeHidden();
    await expect
      .poll(() => pane.evaluate((element) => element.scrollTop))
      .toBeCloseTo(savedScroll, 0);
  });
}

test("mobile Sheet closes after navigation, traps focus and retains coach alongside learning", async ({
  page,
}) => {
  await configureUpstream({ coach: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", {
    name: "移动端工作区导航",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "训练主页", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "教练主页", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("link", { name: "训练主页", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  const settings = dialog.getByRole("button", {
    name: "个人设置",
    exact: true,
  });
  await settings.click();
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await dialog.getByRole("link", { name: "教练主页", exact: true }).click();
  await expect(page).toHaveURL("/coach");
  await expect(dialog).toBeHidden();
  await trigger.click();
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
