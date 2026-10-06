import {
  test as base,
  expect,
  type ElementHandle,
  type Locator,
  type Page,
} from "@playwright/test";

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
      expect(unexpected, "Overlay stories must remain offline").toEqual([]);
      expect(errors, "Browser errors in overlay stories").toEqual([]);
    },
    { auto: true },
  ],
});

async function openStory(page: Page, story: string) {
  await page.goto(
    `/iframe.html?id=primitives-overlaymotion--${story}&viewMode=story&globals=locale:en`,
  );
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
}

async function settled(popup: Locator) {
  await expect
    .poll(() =>
      popup.evaluate(
        (element) =>
          getComputedStyle(element).opacity === "1" &&
          element
            .getAnimations()
            .every((animation) => animation.playState === "finished"),
      ),
    )
    .toBe(true);
}

async function interruptClose(
  trigger: ElementHandle<HTMLElement | SVGElement>,
  popup: Locator,
  close: "escape" | "toggle",
) {
  await settled(popup);
  const popupElement = await popup.elementHandle();
  if (!popupElement)
    throw new Error("Popup must be mounted before interruption");
  // Native dispatch avoids Playwright waiting out the exit before it can click
  // a trigger beneath a modal. Frame observations prove a real exit is active.
  const observation = await trigger.evaluate(
    async (button, { popup, close }) => {
      if (!(popup instanceof HTMLElement))
        throw new Error("Popup is not an element");
      if (close === "escape") {
        (document.activeElement ?? popup).dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true,
            cancelable: true,
          }),
        );
      } else {
        button.dispatchEvent(
          new MouseEvent("click", { bubbles: true, detail: 1 }),
        );
      }
      let exiting = false;
      for (let frame = 0; frame < 4; frame++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        exiting =
          popup.hasAttribute("data-ending-style") &&
          popup
            .getAnimations()
            .some((animation) => animation.playState === "running");
        if (exiting || !popup.isConnected) break;
      }
      const retained = popup.isConnected;
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      return { exiting, retained };
    },
    { popup: popupElement, close },
  );
  expect(
    observation,
    "Close must be interrupted while its popup is retained",
  ).toEqual({
    exiting: true,
    retained: true,
  });
  await settled(popup);
  expect(await popupElement.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  await popupElement.dispose();
}

async function expectNoMotion(popup: Locator) {
  const durations = await popup.evaluate((element) => {
    const style = getComputedStyle(element);
    return [
      ...style.transitionDuration.split(","),
      ...style.animationDuration.split(","),
    ].map((duration) => Number.parseFloat(duration));
  });
  expect(durations.every((duration) => duration <= 0.001)).toBe(true);
}

for (const kind of ["dialog", "sheet", "popover"] as const) {
  test(`${kind} preserves one interactive popup through an interrupted close`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openStory(page, kind);
    const trigger = page.getByRole("button", {
      name: `Open ${kind}`,
      exact: true,
    });
    const popup = page.getByRole("dialog");
    const triggerElement = await trigger.elementHandle();
    if (!triggerElement) throw new Error("Overlay trigger must be mounted");
    await trigger.click();
    await expect(popup).toBeVisible();
    const draft = popup.getByLabel("Draft note");
    await draft.fill("Draft retained through reversal");
    await interruptClose(
      triggerElement,
      popup,
      kind === "popover" ? "toggle" : "escape",
    );
    await triggerElement.dispose();
    await expect(popup).toHaveCount(1);
    await expect(draft).toHaveValue("Draft retained through reversal");
    if (kind !== "popover") {
      for (let index = 0; index < 5; index++) {
        await page.keyboard.press("Tab");
        await expect
          .poll(() =>
            popup.evaluate((element) =>
              element.contains(document.activeElement),
            ),
          )
          .toBe(true);
      }
    }
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`${kind} remains usable with reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStory(page, kind);
    const trigger = page.getByRole("button", {
      name: `Open ${kind}`,
      exact: true,
    });
    await trigger.click();
    const popup = page.getByRole("dialog");
    await expect(popup).toBeVisible();
    await settled(popup);
    await expectNoMotion(popup);
    await popup.getByLabel("Draft note").fill("Reduced motion draft");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("popover Escape can reopen immediately and returns useful focus", async ({
  page,
}) => {
  await openStory(page, "popover");
  const trigger = page.getByRole("button", {
    name: "Open popover",
    exact: true,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await trigger.dispatchEvent("click", { detail: 1 });
  const popup = page.getByRole("dialog");
  await expect(popup).toHaveCount(1);
  await settled(popup);
  await popup.getByLabel("Draft note").fill("Reopened after Escape");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("disclosure preserves its draft through reversal and releases closed descendants", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openStory(page, "collapsible");
  const trigger = page.getByRole("button", { name: "Show training details" });
  const draft = page.getByLabel("Draft note");
  const triggerElement = await trigger.elementHandle();
  if (!triggerElement) throw new Error("Disclosure trigger must be mounted");
  await expect(draft).toHaveCount(0);
  await trigger.click();
  await draft.fill("Keep this lazily mounted draft");
  const panel = page.locator('[data-slot="collapsible-content"]');
  await interruptClose(triggerElement, panel, "toggle");
  await triggerElement.dispose();
  await expect(draft).toHaveValue("Keep this lazily mounted draft");
  await expect(panel).toHaveCount(1);
  await trigger.click();
  await expect(panel).toHaveCount(0);
  await expect(draft).toHaveCount(0);
  await trigger.click();
  await expect(draft).toHaveValue("Review the next training session");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectNoMotion(panel);
  await trigger.click();
  await expect(panel).toHaveCount(0);
});

for (const story of ["select-aligned", "select-anchored"]) {
  test(`${story} preserves keyboard selection and form value`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openStory(page, story);
    const trigger = page.getByRole("combobox", { name: "Training focus" });
    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("listbox")).toBeVisible();
    const popup = page.locator('[data-slot="select-content"]');
    await settled(popup);
    await expect(popup).not.toHaveAttribute("data-starting-style", "");
    const motion = await popup.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        side: element.getAttribute("data-side"),
        translate: style.translate,
        properties: style.transitionProperty
          .split(",")
          .map((property) => property.trim()),
      };
    });
    if (motion.side === "none") {
      await expectNoMotion(popup);
      expect(
        motion.translate === "none" ||
          motion.translate
            .split(" ")
            .every((value) => Number.parseFloat(value) === 0),
      ).toBe(true);
    } else {
      expect(motion.properties).toContain("opacity");
      expect(motion.properties).toContain("translate");
    }
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("option", { name: "Graph algorithms" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    const unavailable = page.getByRole("option", {
      name: "Unavailable practice",
    });
    await expect(unavailable).toBeFocused();
    await expect(unavailable).toBeDisabled();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.locator('input[name="trainingFocus"]')).toHaveValue(
      "balanced",
    );
    await expect(trigger).toContainText("Balanced training");
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("option", { name: "Dynamic programming" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).not.toBeVisible();
    await expect(trigger).toContainText("Dynamic programming");
    await expect(page.locator('input[name="trainingFocus"]')).toHaveValue(
      "dynamic",
    );
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).not.toBeVisible();
    await expect(trigger).toContainText("Dynamic programming");
    await expect(trigger).toBeFocused();
  });
}

test("menu keyboard opens instantly and activates its focused action", async ({
  page,
}) => {
  await openStory(page, "menu");
  const trigger = page.getByRole("button", { name: "Training actions" });
  await trigger.focus();
  await page.keyboard.press("Space");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveAttribute("data-starting-style", "");
  await expectNoMotion(menu);
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitem", { name: "Review analysis" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: /^Analysis selected$/ }),
  ).toHaveText("Analysis selected");
  await expect(trigger).toBeFocused();
});

test("tooltip keyboard focus is instant and Escape leaves the control usable", async ({
  page,
}) => {
  await openStory(page, "tooltip");
  const trigger = page.getByRole("button", {
    name: "Training help",
    exact: true,
  });
  await trigger.focus();
  const tooltip = page.locator('[data-slot="tooltip-content"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Review the next recommended problem.");
  await expect(tooltip).not.toHaveAttribute("data-starting-style", "");
  await expectNoMotion(tooltip);
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Next control" }),
  ).toBeFocused();
  await expect(tooltip).toHaveCount(0);
});
