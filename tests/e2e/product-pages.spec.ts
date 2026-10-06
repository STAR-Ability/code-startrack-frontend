import type { Page } from "@playwright/test";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
import { translate } from "../../src/lib/i18n/locale";
import { previewProblems } from "../../src/lib/demo/preview";

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
    // Chromium's bounding box can include subpixel rounding at the 50svh limit.
    expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(
      400 + 0.01,
    );
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

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: public process, examples, CTA rows and About badges stay readable with 200% text`, async ({
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
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await enlargeAndSettleText(page);

    const process = page.getByRole("region", {
      name: translate(locale, "landing.flowTitle"),
    });
    const steps = process.locator("ol > li");
    await expect(steps).toHaveCount(5);
    const journey = page.getByRole("region", {
      name: translate(locale, "landing.journeyTitle"),
    });
    const examples = journey.locator("ol > li");
    await expect(examples).toHaveCount(3);
    for (const example of [...(await steps.all()), ...(await examples.all())]) {
      const geometry = await example.evaluate((row) => {
        const marker = row.querySelector(".public-marker")!;
        const body = row.querySelector(".public-body")!;
        const markerBounds = marker.getBoundingClientRect();
        const bodyBounds = body.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(marker);
        const fragments = [...range.getClientRects()];
        return {
          oneVisualLine:
            fragments.length > 0 &&
            fragments.every(
              (fragment) =>
                Math.abs(fragment.top - fragments[0].top) <= 1 &&
                Math.abs(fragment.bottom - fragments[0].bottom) <= 1,
            ),
          markerContained:
            markerBounds.left >= 0 && markerBounds.right <= innerWidth,
          aligned: Math.abs(markerBounds.top - bodyBounds.top) <= 2,
          readableBody:
            bodyBounds.width >= row.getBoundingClientRect().width / 2,
          bodyContained: body.scrollWidth <= body.clientWidth,
          fragments: fragments.map((fragment) => fragment.toJSON()),
          markerBounds: markerBounds.toJSON(),
          bodyBounds: bodyBounds.toJSON(),
        };
      });
      expect(
        geometry,
        `Each ordinal stays on one visual line beside readable content: ${JSON.stringify(geometry)}`,
      ).toMatchObject({
        oneVisualLine: true,
        markerContained: true,
        aligned: true,
        readableBody: true,
        bodyContained: true,
      });
    }

    for (const [index, problem] of previewProblems.entries()) {
      const row = examples.nth(index);
      await expect(
        row.getByRole("heading", { name: problem.title }),
      ).toBeVisible();
      await expect(row).toContainText(
        translate(locale, "landing.day", { day: String(problem.day) }),
      );
      const trigger = row.getByRole("button", {
        name: problem.tags[0],
        exact: true,
      });
      await trigger.focus();
      await trigger.press("Enter");
      const details = page.getByRole("dialog", { name: problem.title });
      await expect(details).toBeVisible();
      await expect(details).toContainText(translate(locale, "landing.sample"));
      await expect(details).toContainText(
        `${problem.tags.join(" · ")} / ${problem.difficulty}`,
      );
      await page.keyboard.press("Escape");
      await expect(details).toBeHidden();
      await expect(trigger).toBeFocused();
    }
    const hero = page.locator(".brand-hero");
    const finalCta = page.getByRole("region", {
      name: translate(locale, "landing.ctaTitle"),
      exact: true,
    });
    const ctaRows = [
      hero
        .getByRole("link", {
          name: translate(locale, "nav.start"),
          exact: true,
        })
        .locator(".."),
      finalCta
        .getByRole("link", {
          name: translate(locale, "entry.openDemo"),
          exact: true,
        })
        .locator(".."),
    ];
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await enlargeAndSettleText(page);
      for (const row of ctaRows) {
        await expect(row.getByRole("link")).toHaveCount(2);
        await expect
          .poll(
            () =>
              row.evaluate((element) => {
                const bounds = element.getBoundingClientRect();
                const parent = element.parentElement!.getBoundingClientRect();
                return (
                  element.scrollWidth <= element.clientWidth + 1 &&
                  bounds.left >= parent.left - 1 &&
                  bounds.right <= parent.right + 1 &&
                  bounds.left >= 0 &&
                  bounds.right <= innerWidth
                );
              }),
            { message: `CTA row fits its content area at ${width}px` },
          )
          .toBe(true);
        for (const link of await row.getByRole("link").all()) {
          await expect(link).toBeVisible();
          await expect
            .poll(
              () =>
                link.evaluate((element) => {
                  const bounds = element.getBoundingClientRect();
                  const parent = element.parentElement!.getBoundingClientRect();
                  return (
                    element.scrollWidth <= element.clientWidth + 1 &&
                    element.scrollHeight <= element.clientHeight + 1 &&
                    bounds.left >= parent.left - 1 &&
                    bounds.right <= parent.right + 1
                  );
                }),
              { message: `Full CTA label fits its row at ${width}px` },
            )
            .toBe(true);
        }
      }
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/about");
    await enlargeAndSettleText(page);
    const roadmap = page.locator(".public-example-list > li");
    await expect(roadmap).toHaveCount(3);
    for (const [index, state] of (
      ["available", "available", "planned"] as const
    ).entries()) {
      const row = roadmap.nth(index);
      const badge = row.locator('[data-slot="badge"]');
      await expect(badge).toHaveCount(1);
      await expect(badge).toHaveText(translate(locale, `showcase.${state}`));
      await expect(badge).toBeVisible();
      await expect
        .poll(
          () =>
            badge.evaluate((element) => {
              const bounds = element.getBoundingClientRect();
              const row = element.parentElement!.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(element);
              return (
                element.scrollWidth <= element.clientWidth + 1 &&
                element.scrollHeight <= element.clientHeight + 1 &&
                bounds.left >= row.left - 1 &&
                bounds.right <= row.right + 1 &&
                [...range.getClientRects()].every(
                  (text) =>
                    text.left >= bounds.left - 1 &&
                    text.right <= bounds.right + 1 &&
                    text.top >= bounds.top - 1 &&
                    text.bottom <= bounds.bottom + 1,
                )
              );
            }),
          { message: "The full About status label fits its roadmap row" },
        )
        .toBe(true);
    }
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    expect(await upstreamCalls()).toEqual([]);
  });
}
