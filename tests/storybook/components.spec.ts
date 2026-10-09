import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";

const index = JSON.parse(
  readFileSync("storybook-static/index.json", "utf8"),
) as {
  entries: Record<string, { id: string; type: string; title: string }>;
};
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story",
);

const test = base.extend<{ isolatedStory: void }>({
  isolatedStory: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const unexpected: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (
          url.origin !== "http://127.0.0.1:6007" ||
          url.pathname.startsWith("/api/")
        ) {
          unexpected.push(
            `${route.request().method()} ${url.origin}${url.pathname}`,
          );
          return route.abort();
        }
        return route.continue();
      });
      await use();
      expect(
        unexpected,
        "Stories must never call a backend or external resource",
      ).toEqual([]);
      expect(errors, "Browser errors in the static Storybook").toEqual([]);
    },
    { auto: true },
  ],
});

for (const story of stories) {
  test(`renders ${story.id} without overflow or network dependencies`, async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await expect(page.locator("#storybook-root > *").first()).toBeVisible();
    await expect(page.locator(".sb-errordisplay")).not.toBeVisible();
    await page.waitForLoadState("networkidle");
    for (const chart of await page.locator("[data-palette]").all())
      await expect(chart.locator("svg")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
}

test("dialog traps focus, scrolls and returns focus after Escape", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=primitives-dialog--scrollable&viewMode=story",
  );
  const trigger = page.getByRole("button", { name: "Review changes" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
  }
  const bounds = await dialog.boundingBox();
  // Chromium can round transformed bounds slightly above the CSS height limit.
  const subpixelTolerance = 0.001;
  expect(bounds!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height - 32 + subpixelTolerance,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

for (const dismissal of ["Escape", "keyboard close"] as const) {
  test(`toast queue promotes one notification and restores focus after ${dismissal}`, async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=workspace-feedback--toast-queue&viewMode=story&globals=locale:en",
    );
    const trigger = page.getByRole("button", {
      name: "Add three notifications",
    });
    const toasts = page.locator('[data-slot="toast"]');
    const activeToast = page.locator(
      '[data-slot="toast"]:not([data-limited]):not([data-ending-style])',
    );
    const limitedToasts = page.locator('[data-slot="toast"][data-limited]');

    await trigger.click();
    await expect(trigger).toBeFocused();
    await expect(toasts).toHaveCount(3);
    await page.keyboard.press("F6");
    await page.keyboard.press("Tab");

    const keys =
      dismissal === "Escape"
        ? ["Escape", "Escape", "Escape"]
        : ["Enter", "Space", "Enter"];
    for (let index = 0; index < keys.length; index++) {
      const title = `Notification ${3 - index}`;
      await expect(activeToast).toHaveCount(1);
      await expect(activeToast.locator('[data-slot="toast-title"]')).toHaveText(
        title,
      );
      await expect(activeToast).toBeFocused();
      await expect(limitedToasts).toHaveCount(2 - index);
      for (const limited of await limitedToasts.all()) {
        await expect(limited).toHaveAttribute("inert", "");
        await expect(limited).toHaveCSS("opacity", "0");
      }

      if (dismissal === "keyboard close") {
        await page.keyboard.press("Tab");
        await expect(
          activeToast.locator('[data-slot="toast-close"]'),
        ).toBeFocused();
      }
      await page.keyboard.press(keys[index]);
      await expect(toasts.filter({ hasText: title })).not.toBeAttached();
    }

    await expect(toasts).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("long notification scrolls and its action remains keyboard accessible at 200% text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto(
    "/iframe.html?id=workspace-feedback--toast-queue&viewMode=story&globals=locale:en",
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const trigger = page.getByRole("button", { name: "Add a long notification" });
  await trigger.click();
  const notification = page.locator(
    '[data-slot="toast"]:not([data-limited]):not([data-ending-style])',
  );
  const message = notification.locator('[data-slot="toast-message"]');
  const close = notification.locator('[data-slot="toast-close"]');
  const action = notification.getByRole("button", {
    name: "Confirm notification",
  });

  await expect(notification).toBeVisible();
  await expect(close).toBeInViewport({ ratio: 1 });
  await expect(message).toHaveAttribute("tabindex", "0");
  await expect(message).toHaveAttribute("data-base-ui-swipe-ignore", "");
  await expect
    .poll(() =>
      notification.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.left >= 0 &&
          bounds.top >= 0 &&
          bounds.right <= innerWidth &&
          bounds.bottom <= innerHeight
        );
      }),
    )
    .toBe(true);
  expect((await message.boundingBox())!.width).toBeGreaterThan(
    page.viewportSize()!.width / 2,
  );

  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  await expect(notification).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(message).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => message.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  await expect(action).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Notification action completed locally." }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(notification).not.toBeAttached();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

for (const story of stories.filter((story) => story.id.endsWith("--default"))) {
  test(`accessibility addon passes ${story.id}`, async ({ page, isMobile }) => {
    // Keep Storybook's addon panel visible; the Mobile story constrains its canvas.
    await page.setViewportSize({ width: 1440, height: 900 });
    const id = isMobile ? story.id.replace(/--default$/, "--mobile") : story.id;
    await page.goto(`/?path=/story/${id}`);
    await page.getByRole("tab", { name: /Accessibility/ }).click();
    await expect(
      page.getByText("No accessibility violations found.", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });
}

test("form validation and password reveal stay local", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-form--validation&viewMode=story");
  await page.getByRole("button", { name: "Validate locally" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Email", { exact: true }).fill("demo@example.invalid");
  await page.getByRole("button", { name: "Validate locally" }).click();
  await expect(
    page.getByText("Valid input. No request was sent."),
  ).toBeVisible();
  await page.goto(
    "/iframe.html?id=primitives-form--password&viewMode=story&globals=locale:en",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
});

test("sidebar and mode picker support real interaction", async ({
  page,
  isMobile,
}) => {
  await page.goto(
    "/iframe.html?id=primitives-sidebar--default&viewMode=story&globals=locale:en",
  );
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  if (isMobile) {
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else {
    await expect(
      page.locator('[data-slot="sidebar"][data-state]'),
    ).toHaveAttribute("data-state", "collapsed");
    await page.keyboard.press("Control+b");
    await expect(
      page.locator('[data-slot="sidebar"][data-state]'),
    ).toHaveAttribute("data-state", "expanded");
  }
  await page.goto(
    "/iframe.html?id=workspace-practicemode--default&viewMode=story",
  );
  const weak = page.getByRole("button", { name: "弱项训练", exact: true });
  await weak.click();
  await expect(weak).toHaveAttribute("aria-pressed", "true");
  await weak.click();
  await expect(weak).toHaveAttribute("aria-pressed", "true");
});

test("native hover, reduced motion and disabled actions", async ({
  page,
  isMobile,
}) => {
  await page.goto("/iframe.html?id=primitives-card--hover&viewMode=story");
  const card = page.locator('[data-slot="card"]');
  if (!isMobile) {
    await card.hover();
    await expect
      .poll(() =>
        card.evaluate((element) => getComputedStyle(element).translate),
      )
      .toBe("0px -4px");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.hover();
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).translate))
    .toBe("none");
  await page.goto(
    "/iframe.html?id=workspace-recommendation--disabled&viewMode=story",
  );
  await expect(page.locator("#storybook-root button")).toBeDisabled();
});

test("dark chart and English profile resolve their theme and locale", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=workspace-chart--default&viewMode=story&globals=theme:dark;locale:en",
  );
  await expect(page.locator("html")).toHaveClass(/dark/);
  const chart = page.locator("[data-palette]");
  await expect(chart.locator("svg")).toBeVisible();
  const primary = await chart.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--info").trim(),
  );
  expect(await chart.locator("svg").innerHTML()).toContain(primary);
  await page.goto(
    "/iframe.html?id=workspace-profile--default&viewMode=story&globals=locale:en",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Overall score", { exact: true })).toBeVisible();
});

test("autodocs load real component controls", async ({ page }) => {
  await page.goto("/iframe.html?id=primitives-button--docs&viewMode=docs");
  await expect(
    page.getByRole("heading", { name: "Button", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("variant", { exact: true }).first(),
  ).toBeVisible();
});
