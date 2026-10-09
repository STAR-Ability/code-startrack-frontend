import type { Locator, Page } from "@playwright/test";
import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

const shells = [
  { name: "public", route: "/", selector: ".brand-surface" },
  {
    name: "workspace",
    route: "/dashboard",
    selector: ".workspace-surface",
  },
  {
    name: "authentication",
    route: "/register",
    selector: ".auth-shell",
  },
] as const;

for (const shell of shells) {
  test(`${shell.name} background stays in the viewport while content scrolls`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(shell.route);
    const surface = page.locator(shell.selector);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(surface).toBeVisible();

    for (const width of [320, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 480 });
      await scrollAndSettle(page, 0);
      await expect(heading).toBeVisible();
      await noHorizontalOverflow(page);

      const backdrop = page.locator(".geometric-background");
      const before = await backgroundGeometry(backdrop);
      for (const layer of before.layers) {
        expect(layer.position).toBe("fixed");
        expect(layer.pointerEvents).toBe("none");
        expect(layer.top).toBe("0px");
        expect(layer.right).toBe("0px");
        expect(layer.bottom).toBe("0px");
        expect(layer.left).toBe("0px");
        expect(parseFloat(layer.width)).toBeCloseTo(before.viewport.width, 0);
        expect(parseFloat(layer.height)).toBeCloseTo(before.viewport.height, 0);
        expect(layer.transform).toBe("none");
        expect(layer.animationName).toBe("none");
      }
      // A transformed/contained ancestor would make fixed decoration scroll
      // with that ancestor despite retaining its computed `position: fixed`.
      expect(before.containingBlocks).toEqual([]);

      const contentBefore = await contentGeometry(heading);
      await scrollAndSettle(page, 240);
      const contentAfter = await contentGeometry(heading);
      const scrollDelta = contentAfter.scrollY - contentBefore.scrollY;
      expect(scrollDelta).toBeGreaterThan(80);
      expect(contentBefore.y - contentAfter.y).toBeCloseTo(scrollDelta, 0);
      expect(await backgroundGeometry(backdrop)).toEqual(before);
      await noHorizontalOverflow(page);
    }
  });
}

test("fixed workspace decoration leaves keyboard controls and dialogs interactive", async ({
  page,
}) => {
  await page.goto("/practice");
  const snapshot = page.getByRole("button", {
    name: "查看生成时的画像",
    exact: true,
  });
  await expect(snapshot).toBeEnabled();
  await snapshot.scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(80);
  expect(
    await snapshot.evaluate((element) => element.tabIndex),
  ).toBeGreaterThanOrEqual(0);
  await snapshot.focus();
  await expect(snapshot).toBeFocused();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", {
    name: "查看生成时的画像",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "六维能力 · 0–100", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(snapshot).toBeFocused();

  await snapshot.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await noHorizontalOverflow(page);
});

async function noHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) <= window.innerWidth,
      ),
    )
    .toBe(true);
}

async function scrollAndSettle(page: Page, top: number) {
  await page.evaluate(async (scrollTop) => {
    await document.fonts.ready;
    window.scrollTo({ left: 0, top: scrollTop, behavior: "instant" });
    // Let viewport reflow and scrolling render before geometry is sampled.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }, top);
}

async function contentGeometry(heading: Locator) {
  return heading.evaluate((element) => {
    // A separate boundingBox call can observe a different scroll frame.
    const bounds = element.getBoundingClientRect();
    return { y: bounds.y, scrollY: window.scrollY };
  });
}

async function backgroundGeometry(backdrop: Locator) {
  return backdrop.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const layers = [
      {
        position: style.position,
        pointerEvents: style.pointerEvents,
        top: style.top,
        right: style.right,
        bottom: style.bottom,
        left: style.left,
        width: style.width,
        height: style.height,
        transform: style.transform,
        animationName: style.animationName,
        backgroundImage: style.backgroundImage,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      },
    ];
    const containingBlocks: string[] = [];
    for (
      let ancestor: Element | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (
        ancestorStyle.transform !== "none" ||
        ancestorStyle.translate !== "none" ||
        ancestorStyle.rotate !== "none" ||
        ancestorStyle.scale !== "none" ||
        ancestorStyle.perspective !== "none" ||
        ancestorStyle.filter !== "none" ||
        ancestorStyle.backdropFilter !== "none" ||
        /(?:layout|paint|strict|content)/.test(ancestorStyle.contain) ||
        /(?:transform|perspective|filter)/.test(ancestorStyle.willChange) ||
        ancestorStyle.contentVisibility === "auto"
      )
        containingBlocks.push(ancestor.tagName);
    }
    return {
      layers,
      containingBlocks,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  });
}

test("page categories have distinct static compositions behind accessible content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const compositions: string[] = [];
  for (const [route, category] of [
    ["/", "public"],
    ["/dashboard", "overview"],
    ["/profile", "insight"],
    ["/problems", "training"],
    ["/teams", "collaboration"],
    ["/security", "account"],
    ["/register", "auth"],
  ]) {
    await page.goto(route);
    const backdrop = page.locator(".geometric-background");
    await expect(backdrop).toHaveAttribute("data-category", category);
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    await expect(backdrop.locator("svg")).toHaveCount(4);
    const composition = await backdrop.evaluate((element) => {
      const orbit = element.querySelector(".geometry-orbits")!;
      const shape = element.querySelector(".geometry-shape")!;
      const orbitBounds = orbit.getBoundingClientRect();
      const shapeBounds = shape.getBoundingClientRect();
      return JSON.stringify({
        orbit: [orbitBounds.x, orbitBounds.y, orbitBounds.width],
        shape: [shapeBounds.x, shapeBounds.y, shapeBounds.width],
        stroke: getComputedStyle(orbit).stroke,
      });
    });
    compositions.push(composition);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(new Set(compositions).size).toBe(compositions.length);
});
