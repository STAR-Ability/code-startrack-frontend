import type { UserAnalysisDto } from "../../src/lib/api/v012-schemas";
import { formatNumber, translate } from "../../src/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: dashboard keeps the next action and supplied summaries in the first desktop viewport`, async ({
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
    const overviewResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/me/training/overview?window=30D") &&
        response.status() === 200,
    );
    const analysisResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/me/analysis/latest?window=ALL") &&
        response.status() === 200,
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    const overview = (
      (await (await overviewResponse).json()) as {
        data: UserAnalysisDto;
      }
    ).data;
    const analysis = (
      (await (await analysisResponse).json()) as {
        data: UserAnalysisDto;
      }
    ).data;
    const main = page.getByRole("main");
    const ability = main.locator(".dashboard-ability");
    const activity = main.locator(".dashboard-activity");
    await expect(ability.locator(".metric-strip dd").first()).toHaveText(
      formatNumber(analysis.overallScore, locale, 2),
    );
    await expect(ability.locator(".metric-strip dd").last()).toHaveText(
      formatNumber(analysis.sourceAccountCount, locale),
    );
    await expect(activity.locator(".metric-strip dd").first()).toHaveText(
      formatNumber(overview.summary.attemptedProblemCount, locale),
    );
    const chart = activity.getByRole("img", {
      name: translate(locale, "v.activityStats"),
      exact: true,
    });
    await expect(chart.locator("svg")).toBeVisible();

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      await expect(
        main.getByRole("link", {
          name: translate(locale, "dashboard.openPractice"),
          exact: true,
        }),
      ).toBeInViewport({ ratio: 1 });
      await expect(ability.locator(".metric-strip")).toBeInViewport({
        ratio: 1,
      });
      await expect(activity.locator(".metric-strip")).toBeInViewport({
        ratio: 1,
      });
      const height = (await chart.boundingBox())!.height;
      expect(height).toBeGreaterThanOrEqual(220);
      expect(height).toBeLessThanOrEqual(260);
    }

    const details = main.getByRole("button", {
      name: translate(locale, "dashboard.activityDetails"),
      exact: true,
    });
    await expect(details).toHaveAttribute("aria-expanded", "false");
    await details.focus();
    await details.press("Enter");
    await expect(details).toHaveAttribute("aria-expanded", "true");
    for (const [label, field] of [
      ["v.unsolved", "unsolvedProblemCount"],
      ["v.accepted", "acceptedSubmissionCount"],
      ["v.failed", "failedSubmissionCount"],
      ["v.pendingCount", "pendingSubmissionCount"],
      ["profile.averageDifficulty", "averageSolvedDifficulty"],
      ["profile.maxDifficulty", "maxSolvedDifficulty"],
      ["v.ratedSolved", "ratedSolvedCount"],
      ["v.unratedSolved", "unratedSolvedCount"],
    ] as const) {
      const row = activity
        .locator(".dashboard-secondary-metrics > div")
        .filter({
          has: page.getByText(translate(locale, label), { exact: true }),
        });
      const value = overview.summary[field];
      await expect(row.locator("dd")).toHaveText(
        value === null
          ? translate(locale, "v.unavailable")
          : formatNumber(value, locale, 2),
      );
    }
    await expect(
      main.getByRole("button", {
        name: translate(locale, "v12.rebuild"),
        exact: true,
      }),
    ).toBeEnabled();
    const sources = main.getByRole("button", {
      name: translate(locale, "dashboard.sourcesDetails"),
      exact: true,
    });
    await expect(sources).toHaveAttribute("aria-expanded", "false");
    await sources.focus();
    await sources.press("Enter");
    await expect(sources).toHaveAttribute("aria-expanded", "true");
    for (const source of analysis.ratingAccounts) {
      await expect(
        main.getByRole("link", { name: source.username, exact: true }),
      ).toHaveAttribute("href", "/accounts");
    }
    expect(
      (await upstreamCalls()).filter((call) => call.method === "POST"),
    ).toHaveLength(0);
  });
}
