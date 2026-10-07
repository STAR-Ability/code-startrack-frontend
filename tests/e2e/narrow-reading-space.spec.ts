import type { BrowserContext, Locator, Page } from "@playwright/test";
import {
  analysisSchema,
  pageEnvelope,
  problemProgressSchema,
} from "@/lib/api/schemas";
import { coachDashboardSchema, teamBatchSchema } from "@/lib/api/v012-schemas";
import { demoAnalysis, demoBatch } from "@/lib/demo/fixtures";
import { translate, type Locale } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const origin = "http://127.0.0.1:3100";
const teamId = "00000000-0000-4000-8000-000000001001";
const tolerance = 0.5;

test.beforeEach(() =>
  configureUpstream({ scenario: "member-all", coach: true }),
);

async function prepare(
  page: Page,
  context: BrowserContext,
  locale: Locale,
  width = 320,
) {
  await context.addCookies([
    { name: "codestartrack_locale", value: locale, url: origin },
  ]);
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = "200%";
    await document.fonts.ready;
  });
}

async function expectContained(
  target: Locator,
  frame: Locator,
  { text = true, maxLines }: { text?: boolean; maxLines?: number } = {},
) {
  await expect(target).toBeVisible();
  await expect(frame).toBeVisible();
  const boundary = await frame.elementHandle();
  if (!boundary) throw new Error("Missing reading-space boundary");
  await expect
    .poll(async () => {
      const geometry = await target.evaluate((element, boundary) => {
        const bounds = (rect: DOMRect) => ({
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        });
        const texts: { text: string; rect: ReturnType<typeof bounds> }[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          if (
            !node.textContent?.trim() ||
            !parent ||
            parent.closest(".sr-only")
          )
            continue;
          const style = getComputedStyle(parent);
          if (style.display === "none" || style.visibility !== "visible")
            continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0 && rect.height > 0)
              texts.push({ text: node.textContent, rect: bounds(rect) });
          }
        }
        const icons =
          element instanceof SVGElement
            ? [element]
            : [...element.querySelectorAll("svg")];
        return {
          element: bounds(element.getBoundingClientRect()),
          frame: bounds(boundary.getBoundingClientRect()),
          texts,
          icons: icons.map((icon) => bounds(icon.getBoundingClientRect())),
          viewportWidth: innerWidth,
        };
      }, boundary);
      const inside = (
        rect: typeof geometry.element,
        bounds: typeof geometry.element,
      ) =>
        rect.left >= bounds.left - tolerance &&
        rect.right <= bounds.right + tolerance &&
        rect.top >= bounds.top - tolerance &&
        rect.bottom <= bounds.bottom + tolerance;
      const failures: unknown[] = [];
      if (
        !inside(geometry.element, geometry.frame) ||
        geometry.element.left < -tolerance ||
        geometry.element.right > geometry.viewportWidth + tolerance
      )
        failures.push({ kind: "element", geometry });
      if (text && geometry.texts.length === 0)
        failures.push({ kind: "missing rendered text", geometry });
      for (const item of geometry.texts)
        if (
          !inside(item.rect, geometry.element) ||
          !inside(item.rect, geometry.frame)
        )
          failures.push({ kind: "text", ...item, geometry });
      for (const icon of geometry.icons)
        if (!inside(icon, geometry.element) || !inside(icon, geometry.frame))
          failures.push({ kind: "icon", icon, geometry });
      if (maxLines !== undefined) {
        const lineTops: number[] = [];
        for (const { rect } of geometry.texts)
          if (!lineTops.some((top) => Math.abs(top - rect.top) <= tolerance))
            lineTops.push(rect.top);
        if (lineTops.length > maxLines)
          failures.push({ kind: "wrapped text", lineTops, maxLines, geometry });
      }
      return failures;
    })
    .toEqual([]);
  await boundary.dispose();
}

async function expectNumericTokensOnOneLine(
  target: Locator,
  expectedTokens: string[],
) {
  await expect
    .poll(async () => {
      const tokens = await target.evaluate((element) => {
        const result: {
          text: string;
          characters: { top: number; bottom: number }[][];
        }[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          if (!parent || parent.closest(".sr-only")) continue;
          const style = getComputedStyle(parent);
          if (style.display === "none" || style.visibility !== "visible")
            continue;
          for (const match of (node.textContent ?? "").matchAll(
            /\d+(?:[.,]\d+)*/g,
          )) {
            const characters: { top: number; bottom: number }[][] = [];
            for (let index = 0; index < match[0].length; index++) {
              const range = document.createRange();
              range.setStart(node, match.index + index);
              range.setEnd(node, match.index + index + 1);
              characters.push(
                [...range.getClientRects()]
                  .filter((rect) => rect.width > 0 && rect.height > 0)
                  .map((rect) => ({ top: rect.top, bottom: rect.bottom })),
              );
            }
            result.push({ text: match[0], characters });
          }
        }
        return result;
      });
      const broken = tokens.filter(({ characters }) => {
        if (characters.some((rectangles) => rectangles.length !== 1))
          return true;
        const first = characters[0][0];
        return characters.some(
          ([rect]) =>
            Math.abs(rect.top - first.top) > tolerance ||
            Math.abs(rect.bottom - first.bottom) > tolerance,
        );
      });
      return { tokens: tokens.map(({ text }) => text), broken };
    })
    .toEqual({ tokens: expectedTokens, broken: [] });
}

async function expectReadOnly() {
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
}

for (const locale of ["zh-CN", "en"] as const) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  test(`${locale}: public previews keep icons, badges, recommendation titles and six scores readable at 320px and 200% text`, async ({
    page,
    context,
  }) => {
    await prepare(page, context, locale);
    await visit(page, "/");
    const profile = page.locator(".preview-profile");
    const header = profile.locator('[data-slot="card-header"]');
    const icon = header.locator("svg").first();
    await expectContained(icon, icon.locator(".."), { text: false });
    await expectContained(icon.locator(".."), header, { text: false });
    const profileBadge = header.getByText(t("profile.identity"), {
      exact: true,
    });
    await expect(profileBadge).toHaveText(t("profile.identity"));
    await expectContained(profileBadge, header, { maxLines: 3 });

    await visit(page, "/demo");
    const first = page.locator('[data-recommendation-rank="1"]');
    await expect(first).toHaveCount(1);
    const recommendation = demoBatch().recommendations[0];
    const title = first.locator(".recommendation-heading > span").last();
    await expect(title).toHaveText(
      recommendation.problem.title ?? recommendation.problem.externalProblemKey,
    );
    await expectContained(title, first.locator('[data-slot="card-header"]'), {
      maxLines: 3,
    });
    const source = first
      .locator('[data-slot="badge"]')
      .filter({ hasText: /^Codeforces$/ });
    await expect(source).toHaveText("Codeforces");
    await expectContained(source, first.locator('[data-slot="card-header"]'), {
      maxLines: 1,
    });
    const ordered = [...demoAnalysis().dimensions].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );
    const dimensions = page.locator(
      "[data-analysis-ability] .analysis-dimension-row",
    );
    await expect(dimensions).toHaveCount(6);
    for (const [index, dimension] of ordered.entries()) {
      const row = dimensions.nth(index);
      await expect(row).toHaveAttribute("data-dimension-code", dimension.code);
      const score = row.locator("dd").first();
      const formattedScore = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
      }).format(dimension.score);
      await expect(score).toHaveText(`${formattedScore} / 100`);
      await expectContained(score, row, { maxLines: 2 });
      await expectNumericTokensOnOneLine(score, [formattedScore, "100"]);
    }
    await expectReadOnly();
  });

  test(`${locale}: problem and account-history actions keep their complete labels within narrow reading space`, async ({
    page,
    context,
  }) => {
    await prepare(page, context, locale);
    await visit(page, "/data");
    const submissions = page
      .getByRole("main")
      .getByRole("button", { name: t("v.problemSubmissions"), exact: true });
    await expect(submissions.first()).toBeVisible();
    for (const action of await submissions.all()) {
      await expect(action).toHaveText(t("v.problemSubmissions"));
      await expect(action).toBeEnabled();
      await expectContained(action, action.locator(".."), { maxLines: 3 });
    }
    await submissions.first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(submissions.first()).toBeFocused();

    const historyLoaded = page.waitForResponse((response) =>
      /\/api\/v1\/oj-accounts\/[^/]+\/analysis\/history$/.test(
        new URL(response.url()).pathname,
      ),
    );
    await visit(page, "/accounts/analysis");
    const history = analysisSchema
      .array()
      .parse(((await (await historyLoaded).json()) as { data: unknown }).data);
    expect(history.length).toBeGreaterThan(0);
    const snapshots = page
      .getByRole("main")
      .getByRole("button", { name: t("v.snapshot"), exact: true });
    await expect(snapshots).toHaveCount(history.length);
    for (const action of await snapshots.all()) {
      await expect(action).toHaveText(t("v.snapshot"));
      await expect(action).toBeEnabled();
      await expectContained(action, action.locator(".."), { maxLines: 3 });
    }
    const selected = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith(
        `/analysis/${history[0].snapshotId}`,
      ),
    );
    await snapshots.first().focus();
    await page.keyboard.press("Enter");
    const snapshot = analysisSchema.parse(
      ((await (await selected).json()) as { data: unknown }).data,
    );
    expect(snapshot.snapshotId).toBe(history[0].snapshotId);
    await expect(
      page.getByRole("button", { name: t("v.latest"), exact: true }),
    ).toBeVisible();
    await expectReadOnly();
  });

  test(`${locale}: tablet problem filters retain useful field widths, complete labels and keyboard read semantics at 768px and 200% text`, async ({
    page,
    context,
  }) => {
    await prepare(page, context, locale, 768);
    const initialLoaded = page.waitForResponse((response) =>
      /\/api\/v1\/oj-accounts\/[^/]+\/problems$/.test(
        new URL(response.url()).pathname,
      ),
    );
    await visit(page, "/data");
    const initial = await initialLoaded;
    const accountPath = new URL(initial.url()).pathname;
    const card = page
      .getByRole("main")
      .locator('[data-slot="card"]')
      .filter({
        has: page.getByRole("heading", { name: t("v.problems"), exact: true }),
      });
    const group = card.locator(".problem-filter-fields");
    const form = group.locator("..");
    const fields = group.locator('[data-slot="field"]');
    await expect(fields).toHaveCount(3);
    const inputs = [
      form.getByLabel(t("v.tag"), { exact: true }),
      form.getByLabel(t("v.minDifficulty"), { exact: true }),
      form.getByLabel(t("v.maxDifficulty"), { exact: true }),
    ];
    const labels = ["v.tag", "v.minDifficulty", "v.maxDifficulty"] as const;
    for (const [index, input] of inputs.entries()) {
      const field = fields.nth(index);
      const label = field.locator("label");
      await expect(input).toBeEnabled();
      await expect(input).toHaveAccessibleName(t(labels[index]));
      await expect(label).toHaveText(t(labels[index]));
      await expect
        .poll(() =>
          input.evaluate((element) => element.getBoundingClientRect().width),
        )
        .toBeGreaterThanOrEqual(160);
      for (const frame of [field, form, card]) {
        await expectContained(label, frame);
        await expectContained(input, frame, { text: false });
      }
    }
    const apply = form.getByRole("button", {
      name: t("v.filter"),
      exact: true,
    });
    await expect(apply).toHaveText(t("v.filter"));
    await expect(apply).toBeEnabled();
    for (const frame of [group, form, card])
      await expectContained(apply, frame);
    await expectContained(group, form);
    await expectContained(form, card);
    const controls = group.locator('input, button[type="submit"]');
    await expect(controls).toHaveCount(4);
    await expect
      .poll(() =>
        controls.evaluateAll((elements, tolerance) => {
          const rectangles = elements.map((element) => ({
            name: element.getAttribute("name") ?? element.textContent,
            bounds: element.getBoundingClientRect(),
          }));
          const overlaps: unknown[] = [];
          for (let left = 0; left < rectangles.length; left++) {
            for (let right = left + 1; right < rectangles.length; right++) {
              const a = rectangles[left];
              const b = rectangles[right];
              if (
                Math.min(a.bounds.right, b.bounds.right) -
                  Math.max(a.bounds.left, b.bounds.left) >
                  tolerance &&
                Math.min(a.bounds.bottom, b.bounds.bottom) -
                  Math.max(a.bounds.top, b.bounds.top) >
                  tolerance
              )
                overlaps.push([a.name, b.name]);
            }
          }
          return overlaps;
        }, tolerance),
      )
      .toEqual([]);

    await inputs[0].fill("implementation");
    await inputs[1].fill("1000");
    await inputs[2].fill("1500");
    await inputs[0].focus();
    for (const next of [inputs[1], inputs[2], apply]) {
      await page.keyboard.press("Tab");
      await expect(next).toBeFocused();
    }
    const applied = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === accountPath &&
        url.searchParams.get("tag") === "implementation"
      );
    });
    await page.keyboard.press("Enter");
    const response = await applied;
    expect(response.request().method()).toBe("GET");
    expect(response.status()).toBe(200);
    const parameters = new URL(response.url()).searchParams;
    expect(parameters.get("minDifficulty")).toBe("1000");
    expect(parameters.get("maxDifficulty")).toBe("1500");
    expect(parameters.get("status")).toBe("ALL");
    expect(parameters.get("page")).toBe("1");
    const result = pageEnvelope(problemProgressSchema).parse(
      await response.json(),
    );
    expect(result.meta.page).toBe(1);
    expect(result.data.length).toBeGreaterThan(0);
    for (const item of result.data) {
      expect(item.problem.tags).toContain("implementation");
      expect(item.problem.difficulty).toBeGreaterThanOrEqual(1000);
      expect(item.problem.difficulty).toBeLessThanOrEqual(1500);
    }
    await expectReadOnly();
  });

  test(`${locale}: team recommendation values and unavailable action, plus coach unread badges, remain complete at 320px and 200% text`, async ({
    page,
    context,
  }) => {
    await prepare(page, context, locale);
    const batchLoaded = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === `/api/v1/teams/${teamId}/recommendations/latest` &&
        url.searchParams.get("audience") === "COACH"
      );
    });
    await visit(page, `/teams/detail?teamId=${teamId}&tab=recommendations`);
    const batch = teamBatchSchema.parse(
      ((await (await batchLoaded).json()) as { data: unknown }).data,
    );
    expect(batch.audience).toBe("COACH");
    expect(batch.recommendations[0].problem.difficulty).toBe(1200);
    expect(batch.recommendations[0].score).toBe(0.8);
    expect(batch.recommendations[0].problem.url).toBeNull();
    const first = page.locator(
      '[data-team-audience="COACH"] [data-recommendation-rank="1"]',
    );
    for (const [label, value] of [
      ["v12.problemDifficulty", 1200],
      ["v12.recommendationScore", 0.8],
    ] as const) {
      const fact = first
        .locator(".recommendation-facts > div")
        .filter({ has: page.getByText(t(label), { exact: true }) });
      const number = fact.locator("dd");
      await expect(number).toHaveText(
        new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(
          value,
        ),
      );
      await expectContained(number, fact, { maxLines: 1 });
    }
    const unavailable = first.getByRole("button", {
      name: t("recommendation.linkUnavailable"),
      exact: true,
    });
    await expect(unavailable).toBeDisabled();
    await expect(unavailable).toHaveText(t("recommendation.linkUnavailable"));
    await expectContained(
      unavailable,
      first.locator('[data-slot="card-footer"]'),
      { maxLines: 3 },
    );

    const coachLoaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/coach/dashboard",
    );
    await visit(page, "/coach");
    const coach = coachDashboardSchema.parse(
      ((await (await coachLoaded).json()) as { data: unknown }).data,
    );
    const unreadCount = coach.recentNotifications.filter(
      (item) => !item.read,
    ).length;
    expect(unreadCount).toBeGreaterThan(0);
    const badges = page.locator(
      '.coach-notification-queue article[data-read="false"] [data-slot="badge"]',
    );
    await expect(badges).toHaveCount(unreadCount);
    for (const badge of await badges.all()) {
      await expect(badge).toHaveText(t("v12.unread"));
      await expectContained(badge, badge.locator(".."), { maxLines: 3 });
    }
    await expectReadOnly();
  });
}
