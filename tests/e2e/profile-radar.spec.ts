import type { Page } from "@playwright/test";
import type { UserAnalysisDto } from "@/lib/api/v012-schemas";
import { translate, type Locale } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

function radarPlotError(element: HTMLElement, expectedScores: number[]) {
  const svg = element.querySelector("svg");
  if (!svg || !svg.getBoundingClientRect().width) return Infinity;
  type Point = { x: number; y: number };
  const polygons: Point[][] = [];
  const number = /[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi;
  for (const shape of svg.querySelectorAll<SVGGraphicsElement>(
    "path, polygon, polyline",
  )) {
    const path = shape.getAttribute("d");
    const parts = path
      ? (path.match(/M[^M]*/g) ?? [])
      : [shape.getAttribute("points") ?? ""];
    for (const part of parts) {
      // Only straight, closed polygons can represent the six-axis data.
      if (part.replace(/[MLZ]/g, "").replace(number, "").replace(/[\s,]/g, ""))
        continue;
      const coordinates = (part.match(number) ?? []).map(Number);
      if (coordinates.length % 2) continue;
      const points: Point[] = [];
      for (let index = 0; index < coordinates.length; index += 2)
        points.push({
          x: coordinates[index],
          y: coordinates[index + 1],
        });
      const first = points[0];
      const last = points.at(-1);
      if (!first || !last) continue;
      const repeatedEnd = Math.hypot(first.x - last.x, first.y - last.y) < 0.01;
      if (repeatedEnd) points.pop();
      if (
        points.length !== 6 ||
        (!repeatedEnd &&
          !part.endsWith("Z") &&
          shape.tagName.toLowerCase() !== "polygon")
      )
        continue;
      const matrix = shape.getCTM();
      polygons.push(
        points.map((point) => {
          const transformed = new DOMPoint(point.x, point.y);
          return matrix ? transformed.matrixTransform(matrix) : point;
        }),
      );
    }
  }
  const regularGrids = polygons
    .map((points) => {
      const center = {
        x: points.reduce((sum, point) => sum + point.x, 0) / 6,
        y: points.reduce((sum, point) => sum + point.y, 0) / 6,
      };
      const radii = points.map((point) =>
        Math.hypot(point.x - center.x, point.y - center.y),
      );
      const radius = Math.max(...radii);
      return { points, center, radii, radius };
    })
    .filter(
      ({ radii, radius }) =>
        radius > 1 && radius - Math.min(...radii) < radius * 0.02,
    )
    .sort((left, right) => right.radius - left.radius);
  const fullScale = regularGrids[0];
  if (!fullScale) return Infinity;
  return Math.min(
    ...polygons.map((points) => {
      const area = Math.abs(
        points.reduce((sum, point, index) => {
          const next = points[(index + 1) % 6];
          return sum + point.x * next.y - next.x * point.y;
        }, 0) / 2,
      );
      if (area <= 1) return Infinity;
      return Math.max(
        ...points.map((point, index) => {
          const axis = fullScale.points[index];
          const dx = axis.x - fullScale.center.x;
          const dy = axis.y - fullScale.center.y;
          const px = point.x - fullScale.center.x;
          const py = point.y - fullScale.center.y;
          const radiusSquared = dx * dx + dy * dy;
          const score = ((px * dx + py * dy) / radiusSquared) * 100;
          const offAxis = (Math.abs(px * dy - py * dx) / radiusSquared) * 100;
          return Math.max(Math.abs(score - expectedScores[index]), offAxis);
        }),
      );
    }),
  );
}

async function expectProfileRadar(
  page: Page,
  analysis: UserAnalysisDto,
  locale: Locale,
) {
  const ability = page.locator("[data-analysis-ability]");
  const radar = ability.getByRole("img", {
    name: translate(locale, "v.dimensions"),
    exact: true,
  });
  const dimensions = [...analysis.dimensions].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const scores = dimensions.map((dimension) => dimension.score);
  await expect(ability.locator("dl dd")).toHaveText(
    scores.map(
      (score) =>
        `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(score)} / 100`,
    ),
  );
  for (const dimension of dimensions) {
    const label = translate(locale, `data.dimension.${dimension.code}`);
    await expect(ability.locator("dt").filter({ hasText: label })).toHaveCount(
      1,
    );
    await expect
      .poll(async () =>
        (await radar.locator("svg text").allTextContents())
          .join("")
          .replace(/\s/g, ""),
      )
      .toContain(label.replace(/\s/g, ""));
  }
  await expect
    .poll(() => radar.evaluate(radarPlotError, scores), {
      message:
        "A nonzero six-vertex radar polygon must plot all six API scores",
    })
    .toBeLessThan(0.5);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}

test.beforeEach(() => configureUpstream());

test("delayed profile data plots exact six scores after window, locale and viewport changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 900 });
  const supplied = new Map<string, UserAnalysisDto>();
  let releaseRecent!: () => void;
  const recentResponse = new Promise<void>((resolve) => {
    releaseRecent = resolve;
  });
  let signalRecent!: () => void;
  const recentRequested = new Promise<void>((resolve) => {
    signalRecent = resolve;
  });
  await page.route("**/api/v1/me/analysis/latest?*", async (route) => {
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as { data: UserAnalysisDto };
    const window = new URL(route.request().url()).searchParams.get("window")!;
    const scores =
      window === "7D" ? [14, 26, 38, 50, 62, 74] : [23, 34, 45, 56, 67, 78];
    payload.data.algorithmVersion = "user-profile-v0.13.2";
    payload.data.overallScore =
      scores.reduce((sum, score) => sum + score, 0) / 6;
    const rankedDimensions = payload.data.dimensions
      .map((dimension) => ({
        ...dimension,
        score: scores[dimension.displayOrder - 1],
      }))
      .sort((left, right) => left.score - right.score);
    payload.data.weakestDimension = rankedDimensions[0].code;
    // A valid API array need not arrive in presentation order.
    payload.data.dimensions = rankedDimensions
      .map((dimension, index) => ({ ...dimension, rankOrder: index + 1 }))
      .reverse();
    supplied.set(window, payload.data);
    if (window === "7D") {
      signalRecent();
      await recentResponse;
    }
    await route.fulfill({ response, json: payload });
  });
  try {
    await page.goto("/profile");
    await expect.poll(() => supplied.has("ALL")).toBe(true);
    await expectProfileRadar(page, supplied.get("ALL")!, "zh-CN");
    await page.getByRole("button", { name: "近 7 天", exact: true }).click();
    await recentRequested;
    await expect(
      page.locator("[data-analysis-ability] [role=img]"),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 667 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    // Slow feedback must leave language controls usable while data is pending.
    await expect(
      page.locator('[data-slot="toast"][data-type="loading"]').first(),
    ).toBeVisible({ timeout: 12_000 });
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.evaluate(() => {
      document.documentElement.style.removeProperty("font-size");
    });
    releaseRecent();
    await expectProfileRadar(page, supplied.get("7D")!, "en");
    await page
      .getByRole("button", {
        name: translate("en", "v.window.ALL"),
        exact: true,
      })
      .click();
    await expectProfileRadar(page, supplied.get("ALL")!, "en");
    await page.getByRole("button", { name: "简体中文", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectProfileRadar(page, supplied.get("ALL")!, "zh-CN");
    await page.reload();
    await expectProfileRadar(page, supplied.get("ALL")!, "zh-CN");
    const radar = page.locator("[data-analysis-ability]").getByRole("img", {
      name: translate("zh-CN", "v.dimensions"),
      exact: true,
    });
    // Preserve axes and labels while removing the rendered series. A grid-only
    // chart must not satisfy the same geometry check as a populated profile.
    await radar.locator("svg").evaluate((svg) => {
      for (const mark of svg.querySelectorAll(
        'path[stroke-width="2.5"], path[fill^="url("], polygon, polyline',
      ))
        mark.remove();
    });
    expect(await radar.locator("svg text").count()).toBeGreaterThanOrEqual(6);
    expect(
      await radar
        .locator("svg path[stroke]")
        .evaluateAll((paths) =>
          paths.some(
            (path) => (path.getAttribute("d")?.match(/M/g)?.length ?? 0) > 3,
          ),
        ),
    ).toBe(true);
    const expectedScores = [...supplied.get("ALL")!.dimensions]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((dimension) => dimension.score);
    expect(
      await radar.evaluate(radarPlotError, expectedScores),
    ).toBeGreaterThan(1);
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  } finally {
    releaseRecent();
  }
});
