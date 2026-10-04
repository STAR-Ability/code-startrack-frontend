import type { Locator, Page } from "@playwright/test";
import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

const shells = [
  { name: "public", route: "/", selector: ".brand-surface", layers: 2 },
  {
    name: "workspace",
    route: "/dashboard",
    selector: ".workspace-surface",
    layers: 2,
  },
  {
    name: "authentication",
    route: "/register",
    selector: ".auth-shell",
    layers: 1,
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
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(heading).toBeVisible();
      await noHorizontalOverflow(page);

      const before = await backgroundGeometry(surface, shell.layers);
      for (const layer of before.layers) {
        expect(layer.position).toBe("fixed");
        expect(layer.pointerEvents).toBe("none");
        expect(layer.content).not.toBe("none");
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

      const contentBefore = await heading.boundingBox();
      expect(contentBefore).not.toBeNull();
      await page.evaluate(() => window.scrollTo(0, 240));
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(80);
      const scrollY = await page.evaluate(() => window.scrollY);
      const contentAfter = await heading.boundingBox();
      expect(contentAfter).not.toBeNull();
      expect(contentBefore!.y - contentAfter!.y).toBeCloseTo(scrollY, 0);
      expect(await backgroundGeometry(surface, shell.layers)).toEqual(before);
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

async function backgroundGeometry(surface: Locator, layerCount: number) {
  return surface.evaluate((element, count) => {
    const layers = ["::before", "::after"].slice(0, count).map((pseudo) => {
      const style = getComputedStyle(element, pseudo);
      return {
        position: style.position,
        pointerEvents: style.pointerEvents,
        content: style.content,
        top: style.top,
        right: style.right,
        bottom: style.bottom,
        left: style.left,
        width: style.width,
        height: style.height,
        transform: style.transform,
        animationName: style.animationName,
        backgroundImage: style.backgroundImage,
        backgroundPosition: style.backgroundPosition,
        backgroundSize: style.backgroundSize,
        maskImage: style.maskImage,
      };
    });
    const containingBlocks: string[] = [];
    for (
      let ancestor: Element | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor);
      if (
        style.transform !== "none" ||
        style.translate !== "none" ||
        style.rotate !== "none" ||
        style.scale !== "none" ||
        style.perspective !== "none" ||
        style.filter !== "none" ||
        style.backdropFilter !== "none" ||
        /(?:layout|paint|strict|content)/.test(style.contain) ||
        /(?:transform|perspective|filter)/.test(style.willChange) ||
        style.contentVisibility === "auto"
      )
        containingBlocks.push(ancestor.tagName);
    }
    return {
      layers,
      containingBlocks,
      viewport: {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      },
    };
  }, layerCount);
}
