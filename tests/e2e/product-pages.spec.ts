import type { Page } from "@playwright/test";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
import { translate } from "../../src/lib/i18n/locale";

test.beforeEach(() => configureUpstream());

async function enlargeAndSettleText(page: Page) {
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = "200%";
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  await expect(page.locator("html")).toHaveCSS("font-size", "32px");

  let previousHeight: number | undefined;
  let stableSamples = 0;
  await expect
    .poll(
      async () => {
        const height = await page
          .locator(".landing-header")
          .evaluate((element) => element.getBoundingClientRect().height);
        stableSamples = height === previousHeight ? stableSamples + 1 : 0;
        previousHeight = height;
        return stableSamples;
      },
      { intervals: [100] },
    )
    .toBeGreaterThanOrEqual(3);
}

test("public product pages have distinct content and never request learner data", async ({
  page,
}) => {
  for (const [route, heading] of [
    ["/product", "从一次提交"],
    ["/product/profile", "看见积累"],
    ["/product/recommendations", "把注意力"],
    ["/about", "每一小步"],
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      heading,
    );
    await page.setViewportSize({ width: 320, height: 800 });
    await enlargeAndSettleText(page);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
      heading,
    );
    await page.getByRole("button", { name: "简体中文", exact: true }).click();
  }
  expect(await upstreamCalls()).toEqual([]);
});

test("public navigation and illustrative recommendation controls remain keyboard accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "探索产品", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "探索产品" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "推荐题目", exact: true }).click();
  await expect(page).toHaveURL("/product/recommendations");
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "弱项训练", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("main")).toContainText("不生成真实推荐");
  expect(await upstreamCalls()).toEqual([]);
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".product-preview").hover();
  await expect
    .poll(() =>
      page
        .locator(".preview-cards")
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe("none");
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: public navigation preserves reading space and keyboard dismissal at 200% text`, async ({
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
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/product");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await enlargeAndSettleText(page);

    const header = page.locator(".landing-header");
    await expect
      .poll(() =>
        header.evaluate((element) => {
          return element.getBoundingClientRect().height <= innerHeight / 2;
        }),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    for (const label of ["auth.login", "nav.start"] as const) {
      const action = header.getByRole("link", {
        name: translate(locale, label),
        exact: true,
      });
      await action.focus();
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            element.scrollWidth <= element.clientWidth &&
            element.scrollHeight <= element.clientHeight &&
            bounds.left >= 0 &&
            bounds.right <= innerWidth
          );
        }),
      ).toBe(true);
    }
    await header.evaluate((element) => {
      scrollTo(0, Math.ceil(element.getBoundingClientRect().height));
    });
    await expect
      .poll(() =>
        header.evaluate((element) => element.getBoundingClientRect().bottom),
      )
      .toBeLessThanOrEqual(0);
    await page.evaluate(() => scrollTo(0, 0));

    const menuName = translate(locale, "showcase.menu");
    const trigger = page.getByRole("button", { name: menuName, exact: true });
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: menuName, exact: true });
    await expect(dialog).toBeVisible();
    expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(400);
    const links = dialog
      .getByRole("navigation", { name: menuName })
      .getByRole("link");
    await expect(links).toHaveCount(4);
    await links.last().scrollIntoViewIfNeeded();
    await expect(links.last()).toBeVisible();
    expect(
      await links.last().evaluate((element) => {
        const link = element.getBoundingClientRect();
        const navigation = element.closest("nav")!.getBoundingClientRect();
        return link.top >= navigation.top && link.bottom <= navigation.bottom;
      }),
    ).toBe(true);
    for (let index = 0; index < 6; index++) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() =>
          dialog.evaluate((element) =>
            element.contains(document.activeElement),
          ),
        )
        .toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await upstreamCalls()).toEqual([]);
  });
}

test("an open public menu closes on desktop resize and releases keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "探索产品", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "探索产品", exact: true });
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeHidden();
  const profile = page.locator(".landing-header").getByRole("link", {
    name: translate("zh-CN", "showcase.profile.label"),
    exact: true,
  });
  await profile.focus();
  await expect(profile).toBeFocused();
  await profile.press("Enter");
  await expect(page).toHaveURL("/product/profile");
  expect(await upstreamCalls()).toEqual([]);
});
