import type { AnalysisDto } from "@/lib/api/schemas";
import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("absent profile evidence has no zero scores, while a real zero snapshot retains its meaning", async ({
  page,
}) => {
  await configureUpstream({ noAnalysis: true });
  await page.goto("/accounts/profile");
  const main = page.getByRole("main");
  await expect(
    main.getByText("尚未生成分析", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    main.getByRole("img", { name: "六维能力 · 0–100", exact: true }),
  ).toHaveCount(0);
  await expect(main.locator("dd").filter({ hasText: /^0$/ })).toHaveCount(0);
  await expect(main.getByText(/^0\s*\/\s*100$/)).toHaveCount(0);

  await configureUpstream({ zero: true });
  await page.reload();
  await expect(main.getByText("暂无训练证据", { exact: true })).toBeVisible();
  await expect(
    main.getByRole("img", { name: "六维能力 · 0–100", exact: true }),
  ).toBeVisible();
  await expect(
    main
      .locator("[data-analysis-ability]")
      .getByRole("definition")
      .filter({ hasText: /^0\s*\/\s*100$/ }),
  ).toHaveCount(6);
  await expect(
    main.locator("[data-metric-panel] dd").filter({ hasText: /^0$/ }).first(),
  ).toBeVisible();
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: activity values can be read with the keyboard without chart hover`, async ({
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
    const response = page.waitForResponse(
      (result) =>
        result.url().endsWith("/me/training/overview?window=30D") &&
        result.ok(),
    );
    await page.goto("/dashboard");
    const { data } = (await (await response).json()) as { data: AnalysisDto };
    const labels = {
      activity: translate(locale, "v.activityStats"),
      disclosure: translate(locale, "metrics.chartValues"),
      submissions: translate(locale, "v.submissions"),
      solved: translate(locale, "v.solved"),
      pending: translate(locale, "v.pendingCount"),
    };
    const activity = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", { name: labels.activity, exact: true }),
    });
    const disclosure = activity.getByRole("button", {
      name: labels.disclosure,
      exact: true,
    });
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await disclosure.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    for (const day of data.activityStats) {
      const row = activity.locator("dl > div").filter({
        has: page.locator(`time[datetime="${day.date}"]`),
      });
      await expect(row).toBeVisible();
      await expect(row).toContainText(
        `${labels.submissions}: ${day.submissionCount}`,
      );
      await expect(row).toContainText(`${labels.solved}: ${day.solvedCount}`);
      await expect(row).toContainText(
        `${labels.pending}: ${day.pendingSubmissionCount}`,
      );
    }
    await disclosure.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(
      activity.getByText(data.activityStats[0].date, { exact: true }),
    ).not.toBeVisible();
  });
}
