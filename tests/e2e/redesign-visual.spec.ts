import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import type { Locator, Page, Response, TestInfo } from "@playwright/test";
import type { UserAnalysisDto } from "../../src/lib/api/v012-schemas";
import type { RecommendationBatchDto } from "../../src/lib/api/schemas";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const frozenInstant = "2026-10-04T12:00:00Z";
const id = (value: number) =>
  `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const dimensions = [
  ["IMPLEMENTATION", "Implementation", 20],
  ["ALGORITHMS", "Algorithms", 30],
  ["DATA_STRUCTURES", "Data structures", 40],
  ["DYNAMIC_PROGRAMMING", "Dynamic programming", 50],
  ["GRAPHS", "Graphs", 60],
  ["MATH", "Math", 70],
] as const;
const captureOptions = {
  animations: "disabled" as const,
  caret: "hide" as const,
  scale: "css" as const,
};
const comparisonOptions = { threshold: 0.15, maxDiffPixels: 30 };
const screenshotOptions = { ...captureOptions, ...comparisonOptions };

test.use({
  locale: "en-US",
  timezoneId: "Asia/Shanghai",
  colorScheme: "light",
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});

test.beforeEach(async ({ context, page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "These compositions have explicit viewports and platform baselines.",
  );
  if (process.env.VISUAL_REGRESSION_PROBE === "1") {
    expect(
      ["all", "changed"],
      "A structural probe must compare without updating reviewed baselines",
    ).not.toContain(testInfo.config.updateSnapshots);
  }
  await configureUpstream();
  await context.addCookies([
    {
      name: "codestartrack_locale",
      value: "en",
      url: "http://127.0.0.1:3100",
    },
  ]);
  // Keep timers/rAF running so queries, fonts and charts can settle normally.
  await page.clock.setFixedTime(new Date(frozenInstant));
  // Let the production font load before ECharts measures any API-derived labels.
  await page.route(
    /^http:\/\/127\.0\.0\.1:3100\/api\/v1\/me\/(analysis\/latest|training\/overview)\?/,
    async (route) => {
      const response = await route.fetch({ maxRedirects: 0 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await document.fonts.load(
          `16px ${getComputedStyle(document.body).fontFamily}`,
        );
      });
      await route.fulfill({ response });
    },
  );
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === "chromium")
    await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  if (testInfo.project.name !== "chromium") return;
  expect(
    (await upstreamCalls()).filter(
      (call) =>
        !["GET", "HEAD"].includes(call.method) &&
        !(call.method === "POST" && call.path === "/api/v1/auth/captcha"),
    ),
    "Visual capture must not mutate learner data",
  ).toEqual([]);
});

function responseFor(page: Page, suffix: string) {
  return page.waitForResponse(
    (response) => response.url().endsWith(suffix) && response.status() === 200,
  );
}

function requireReviewedBaseline(testInfo: TestInfo, name: string) {
  if (["all", "changed"].includes(testInfo.config.updateSnapshots)) return;
  expect(
    existsSync(testInfo.snapshotPath(name)),
    "A reviewed baseline is required; generate it explicitly with --update-snapshots",
  ).toBe(true);
}

async function suppliedAnalysis(response: Response, window: "ALL" | "30D") {
  const { data } = (await response.json()) as { data: UserAnalysisDto };
  expect(response.headers()["x-codestartrack-mock"]).toBe("true");
  expect(data).toMatchObject({
    publicId: id(1),
    snapshotId: id(window === "ALL" ? 1303 : 1301),
    window,
    timezone: "Asia/Shanghai",
    dataCutoffAt: "2026-10-02T02:30:00Z",
    createdAt: "2026-10-02T02:31:00Z",
    stale: false,
    algorithmVersion: "user-profile-v0.13.1",
    overallScore: 45,
    currentRating: 1500,
    maxRating: 1600,
    sourceAccountCount: 2,
    sourceAccountIds: ["9007199254740993", "9007199254740995"],
    weakestDimension: "IMPLEMENTATION",
    summary: {
      attemptedProblemCount: 3,
      solvedCount: 2,
      submissionCount: 5,
      activeDays: 1,
    },
  });
  expect(
    data.dimensions.map((item) => [item.code, item.score, item.displayOrder]),
  ).toEqual(
    dimensions.map(([code, , score], index) => [code, score, index + 1]),
  );
  expect(data.activityStats).toEqual([
    {
      date: "2026-10-01",
      submissionCount: 5,
      acceptedSubmissionCount: 2,
      failedSubmissionCount: 2,
      pendingSubmissionCount: 1,
      solvedCount: 2,
    },
  ]);
  return data;
}

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

async function settle(page: Page, region: Locator) {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(region.locator('[data-slot="skeleton"]:visible')).toHaveCount(0);
  await expect(region.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  for (const chart of await region.locator("[data-chart-state]").all()) {
    await expect(chart).toHaveAttribute("data-chart-state", "ready");
    await expect(chart.locator("svg")).toBeVisible();
    expect(await chart.locator("svg path").count()).toBeGreaterThan(0);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load(
      `16px ${getComputedStyle(document.body).fontFamily}`,
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  expect(
    await page.evaluate(() =>
      [...document.fonts].some(
        (font) => font.family.includes("Geist") && font.status === "loaded",
      ),
    ),
    "The production Geist font must have loaded",
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.mouse.move(0, 0);
}

async function evidence(
  page: Page,
  region: Locator,
  testInfo: TestInfo,
  fixture: Record<string, unknown>,
) {
  await testInfo.attach("visual-state.json", {
    contentType: "application/json",
    body: Buffer.from(
      JSON.stringify(
        {
          route: new URL(page.url()).pathname,
          viewport: page.viewportSize(),
          frozenInstant,
          fixture,
          region: await region.boundingBox(),
          browser: await page.evaluate(() => ({
            now: new Date().toISOString(),
            rootFontSize: getComputedStyle(document.documentElement).fontSize,
            fontFamily: getComputedStyle(document.body).fontFamily,
            fonts: [...document.fonts].map(({ family, status }) => ({
              family,
              status,
            })),
            reducedMotion: matchMedia("(prefers-reduced-motion: reduce)")
              .matches,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })),
        },
        null,
        2,
      ),
    ),
  });
}

test("dashboard overview retains action, supplied metrics and activity chart", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const overviewResponse = responseFor(
    page,
    "/me/training/overview?window=30D",
  );
  const abilityResponse = responseFor(page, "/me/analysis/latest?window=ALL");
  await page.goto("/dashboard");
  const overview = await suppliedAnalysis(await overviewResponse, "30D");
  const ability = await suppliedAnalysis(await abilityResponse, "ALL");
  const primary = page.locator(".dashboard-primary-grid");
  const activity = page.locator(".dashboard-activity");
  await expect(primary.locator(".metric-strip dd")).toHaveText([
    "45",
    "1,500",
    "1,600",
    "2",
  ]);
  await expect(activity.locator(".metric-strip dd")).toHaveText([
    "3",
    "2",
    "5",
    "1",
  ]);
  await expect(
    primary.getByRole("link", {
      name: "Choose your next problem",
      exact: true,
    }),
  ).toHaveAttribute("href", "/practice");
  await expect(
    activity.getByRole("img", { name: "Daily practice", exact: true }),
  ).toBeVisible();
  await expect(
    primary.locator('time[datetime="2026-10-02T02:30:00Z"]'),
  ).toHaveCount(1);
  await expect(
    activity.locator('time[datetime="2026-10-02T02:30:00Z"]'),
  ).toHaveCount(1);
  await settle(page, page.getByRole("main"));
  await evidence(page, primary, testInfo, {
    abilitySnapshotId: ability.snapshotId,
    overviewSnapshotId: overview.snapshotId,
    dataCutoffAt: ability.dataCutoffAt,
  });
  const boxes = [await primary.boundingBox(), await activity.boundingBox()];
  expect(boxes.every(Boolean)).toBe(true);
  const bounds = boxes.map((box) => box!);
  const x = Math.floor(Math.min(...bounds.map((box) => box.x)));
  const y = Math.floor(Math.min(...bounds.map((box) => box.y)));
  const right = Math.ceil(Math.max(...bounds.map((box) => box.x + box.width)));
  const bottom = Math.ceil(
    Math.max(...bounds.map((box) => box.y + box.height)),
  );
  requireReviewedBaseline(testInfo, "dashboard-overview.png");
  // A manual probe verifies that the committed comparator rejects a real layout change.
  if (process.env.VISUAL_REGRESSION_PROBE === "1") {
    await primary.evaluate((element) => {
      (element as HTMLElement).style.paddingBlockStart = "48px";
    });
  }
  await expect(
    await page.screenshot({
      ...captureOptions,
      fullPage: true,
      clip: { x, y, width: right - x, height: bottom - y },
    }),
  ).toMatchSnapshot("dashboard-overview.png", comparisonOptions);
});

test("mobile first recommendation preserves decision and disabled destination", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = responseFor(page, "/recommendations/latest?mode=HYBRID");
  await page.goto("/practice");
  const { data: batch } = (await (await response).json()) as {
    data: RecommendationBatchDto;
  };
  expect(batch).toMatchObject({
    accountId: "9007199254740993",
    batchId: id(42),
    analysisSnapshotId: id(13),
    mode: "HYBRID",
    targetRating: 1200,
    candidateCount: 2,
    resultCount: 2,
    generatedAt: "2026-10-02T02:32:00Z",
    stale: false,
  });
  expect(batch.recommendations[0]).toMatchObject({
    rank: 1,
    score: 0.8,
    reasonCode: "LEVEL_MATCH",
    matchedDimension: "IMPLEMENTATION",
    solvedSinceGeneration: false,
    problem: {
      problemId: "9007199254741993",
      externalProblemKey: "demo-A",
      title: "A Small Step",
      difficulty: 1200,
      tags: ["implementation"],
      solvedCount: 250,
      url: null,
      isGym: false,
      catalogSource: "CATALOG",
    },
  });
  const first = page.locator('[data-recommendation-rank="1"]');
  await expect(
    first.getByRole("heading", { name: "#1 A Small Step", exact: true }),
  ).toBeVisible();
  await expect(first.locator(".recommendation-facts dd")).toHaveText([
    "1200",
    "1200",
  ]);
  await expect(
    first.getByRole("button", {
      name: "Problem link unavailable",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(first.locator(".recommendation-reason")).toContainText(
    "Implementation",
  );
  await expect(first).toContainText("250");
  await expect(
    first.getByText("implementation", { exact: true }),
  ).toBeVisible();
  await settle(page, first);
  await evidence(page, first, testInfo, {
    batchId: batch.batchId,
    generatedAt: batch.generatedAt,
    analysisSnapshotId: batch.analysisSnapshotId,
  });
  requireReviewedBaseline(testInfo, "practice-first-recommendation.png");
  await expect(first).toHaveScreenshot(
    "practice-first-recommendation.png",
    screenshotOptions,
  );
});

test("profile ability retains six exact scores and chart beside evidence rows", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = responseFor(page, "/me/analysis/latest?window=ALL");
  await page.goto("/profile");
  const analysis = await suppliedAnalysis(await response, "ALL");
  const ability = page.locator("[data-analysis-ability]");
  await expect(ability.locator(".analysis-dimension-list dd")).toHaveText(
    dimensions.map(([, , score]) => `${score} / 100`),
  );
  await expect(ability.locator('[data-weakest="true"]')).toHaveAttribute(
    "data-dimension-code",
    "IMPLEMENTATION",
  );
  await expect(
    ability.getByRole("img", { name: "Six dimensions · 0–100", exact: true }),
  ).toBeVisible();
  for (const [code, label] of dimensions) {
    await expect(
      ability.locator(`[data-dimension-code="${code}"] dt`),
    ).toContainText(label);
    await expect
      .poll(async () =>
        (await ability.locator("svg text").allTextContents())
          .join("")
          .replace(/\s/g, ""),
      )
      .toContain(label.replace(/\s/g, ""));
  }
  await settle(page, ability);
  const radar = ability.getByRole("img", {
    name: "Six dimensions · 0–100",
    exact: true,
  });
  await expect
    .poll(() =>
      radar.evaluate(
        radarPlotError,
        dimensions.map(([, , score]) => score),
      ),
    )
    .toBeLessThan(0.5);
  await evidence(page, ability, testInfo, {
    snapshotId: analysis.snapshotId,
    dataCutoffAt: analysis.dataCutoffAt,
    scores: dimensions.map(([code, , score]) => ({ code, score })),
  });
  requireReviewedBaseline(testInfo, "profile-ability.png");
  await expect(ability).toHaveScreenshot(
    "profile-ability.png",
    screenshotOptions,
  );
});

test("large-text login retains a usable fixed composition", async ({
  page,
}, testInfo) => {
  await configureUpstream({ loggedOut: true });
  await page.setViewportSize({ width: 1280, height: 1000 });
  const response = responseFor(page, "/auth/captcha");
  await page.goto("/login");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).fontSize),
    )
    .toBe("32px");
  const { data: captcha } = (await (await response).json()) as {
    data: { challengeId: string; imageData: string; expiresInSeconds: number };
  };
  expect(captcha.challengeId).toBe(id(100));
  expect(captcha.expiresInSeconds).toBe(180);
  expect(captcha.imageData).toMatch(/^data:image\/png;base64,/);
  expect(createHash("sha256").update(captcha.imageData).digest("hex")).toBe(
    "14b7549bf7ba2ab3d214b1f942fda3c69881d2ea94a0e0c25c1587b32f825dc1",
  );
  const shell = page.locator(".auth-shell");
  await expect(page.locator(".auth-story")).toBeHidden();
  for (const label of ["Username or email", "Password", "Captcha"]) {
    const input = page.getByLabel(label, { exact: true });
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("");
  }
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".captcha-frame")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const image = page.getByRole("img", { name: "Captcha", exact: true });
  await expect(image).toHaveAttribute("src", captcha.imageData);
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  expect(
    await image.evaluate((element) => ({
      width: (element as HTMLImageElement).naturalWidth,
      height: (element as HTMLImageElement).naturalHeight,
    })),
  ).toEqual({ width: 116, height: 44 });
  await settle(page, shell);
  await evidence(page, shell, testInfo, {
    challengeId: captcha.challengeId,
    expiresInSeconds: captcha.expiresInSeconds,
  });
  requireReviewedBaseline(testInfo, "login-large-text.png");
  await expect(shell).toHaveScreenshot(
    "login-large-text.png",
    screenshotOptions,
  );
});
