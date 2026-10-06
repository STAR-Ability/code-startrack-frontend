import type { Locator, Page } from "@playwright/test";
import { notificationSchema } from "@/lib/api/v012-schemas";
import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

const layouts = [
  { width: 1440, text: "100%" },
  { width: 768, text: "100%" },
  { width: 390, text: "100%" },
  { width: 320, text: "100%" },
  { width: 390, text: "200%" },
  { width: 320, text: "200%" },
] as const;

async function settleLayout(page: Page, width: number, text: string) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(async (fontSize) => {
    document.documentElement.style.fontSize = fontSize;
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, text);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}

async function expectReadableWidth(locator: Locator, label: string) {
  await expect
    .poll(
      () =>
        locator.evaluate((element) => {
          const style = getComputedStyle(element);
          return (
            (element.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight)) /
            parseFloat(style.fontSize)
          );
        }),
      { message: `${label} must have useful text width` },
    )
    .toBeGreaterThanOrEqual(4);
}

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: account binding keeps a readable header and usable form body at every layout`, async ({
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
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/accounts");
    const card = page.locator(".accounts-bind-form");
    const heading = card.getByRole("heading", {
      name: translate(locale, "v.bind"),
      exact: true,
    });
    const description = card.getByText(translate(locale, "v.bindingNote"), {
      exact: true,
    });
    const input = card.getByRole("textbox", {
      name: translate(locale, "v.handle"),
      exact: true,
    });
    const submit = card.getByRole("button", {
      name: translate(locale, "v.bind"),
      exact: true,
    });
    await expect(input).toBeEnabled();

    for (const { width, text } of layouts) {
      await settleLayout(page, width, text);
      await expect(heading).toBeVisible();
      await expect(description).toBeVisible();
      await expect(submit).toBeVisible();
      for (const [locator, label] of [
        [card.locator('[data-slot="card-header"]'), "Binding header"],
        [card.locator('[data-slot="card-content"]'), "Binding form body"],
        [heading, "Binding heading"],
        [description, "Binding guidance"],
      ] as const) {
        await expectReadableWidth(locator, `${label} (${width}px, ${text})`);
      }
      await expect
        .poll(() =>
          input.evaluate((element) => {
            const style = getComputedStyle(element);
            return (
              element.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight)
            );
          }),
        )
        .toBeGreaterThanOrEqual(80);
      await expect
        .poll(() =>
          card.evaluate((element) => {
            const cardBounds = element.getBoundingClientRect();
            return Array.from(
              element.querySelectorAll(
                '[data-slot="card-header"], [data-slot="card-content"], h2, input, button',
              ),
            ).every((child) => {
              const bounds = child.getBoundingClientRect();
              return (
                bounds.left >= cardBounds.left - 0.5 &&
                bounds.right <= cardBounds.right + 0.5 &&
                bounds.top >= cardBounds.top - 0.5 &&
                bounds.bottom <= cardBounds.bottom + 0.5
              );
            });
          }),
        )
        .toBe(true);
      await input.focus();
      await expect(input).toBeFocused();
      await input.fill("preview_handle");
      await expect(input).toHaveValue("preview_handle");
      await input.fill("");
    }
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });

  test(`${locale}: unread notification icons, badges and complete body remain contained at every layout`, async ({
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
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === "/api/v1/notifications" &&
        result.ok(),
    );
    await page.goto("/notifications");
    const supplied = notificationSchema
      .array()
      .parse((await (await response).json()).data);
    const unread = supplied.find((notification) => !notification.read)!;
    expect(unread).toBeDefined();
    const row = page.locator('.notification-row[data-read="false"]').filter({
      has: page.getByRole("heading", { name: unread.title, exact: true }),
    });
    const title = row.locator(".notification-title");
    const body = row.locator(".notification-body");
    const icon = row.locator(".notification-icon");
    const badge = row.locator('.notification-heading [data-slot="badge"]');
    await expect(body).toHaveText(unread.body);

    for (const { width, text } of layouts) {
      await settleLayout(page, width, text);
      await expect(title).toHaveText(unread.title);
      await expect(body).toBeVisible();
      await expect(icon).toBeVisible();
      await expect(badge).toHaveText(translate(locale, "v12.unread"));
      await expect(badge).toBeVisible();
      await expectReadableWidth(
        body,
        `Notification body (${width}px, ${text})`,
      );
      await expect
        .poll(
          () =>
            row.evaluate((element) => {
              const rowBounds = element.getBoundingClientRect();
              const selectors = [
                ".notification-icon",
                ".notification-title",
                '.notification-heading [data-slot="badge"]',
                ".notification-body",
                ".notification-time",
                ".notification-actions a",
                ".notification-actions button",
              ];
              return selectors.flatMap((selector) => {
                const child = element.querySelector(selector)!;
                const bounds = child.getBoundingClientRect();
                const rectangles = [bounds];
                if (child.textContent?.trim()) {
                  const range = document.createRange();
                  range.selectNodeContents(child);
                  rectangles.push(...range.getClientRects());
                }
                return rectangles.some(
                  (rect) =>
                    rect.width > 0 &&
                    (rect.left < rowBounds.left - 0.5 ||
                      rect.right > rowBounds.right + 0.5 ||
                      rect.top < rowBounds.top - 0.5 ||
                      rect.bottom > rowBounds.bottom + 0.5),
                )
                  ? [selector]
                  : [];
              });
            }),
          { message: `Notification children fit at ${width}px (${text})` },
        )
        .toEqual([]);
      expect(
        await row.evaluate((element) => {
          const iconBounds = element
            .querySelector(".notification-icon")!
            .getBoundingClientRect();
          return [".notification-title", ".notification-body"].every(
            (selector) => {
              const bounds = element
                .querySelector(selector)!
                .getBoundingClientRect();
              const width = Math.max(
                0,
                Math.min(bounds.right, iconBounds.right) -
                  Math.max(bounds.left, iconBounds.left),
              );
              const height = Math.max(
                0,
                Math.min(bounds.bottom, iconBounds.bottom) -
                  Math.max(bounds.top, iconBounds.top),
              );
              return width * height <= 0.5;
            },
          );
        }),
      ).toBe(true);
      const markRead = row.getByRole("button", {
        name: translate(locale, "v12.read"),
        exact: true,
      });
      await markRead.focus();
      await expect(markRead).toBeFocused();
    }
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}
