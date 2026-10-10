import { translate, type Locale } from "@/lib/i18n/locale";
import {
  teamAnalysisSchema,
  teamBatchSchema,
  type TeamAnalysisDto,
  type TeamRecommendationBatchDto,
} from "@/lib/api/v012-schemas";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const origin = "http://127.0.0.1:3100";
const teamId = "00000000-0000-4000-8000-000000001001";
const longTitle =
  "Following a long training trajectory through graphs, dynamic programming, and data structures with complete recommendation context";
const longKey = "supporting-problem-with-a-long-unbroken-source-identifier";
const longTag =
  "long-unbroken-backend-tag-for-responsive-recommendation-layout";
const primaryReason =
  "The backend supplied this first practice item to cover the team's current training direction. Its complete reason remains available across narrow and wide layouts.";

test.beforeEach(() => configureUpstream({ coach: true }));

for (const locale of ["en", "zh-CN"] as const satisfies readonly Locale[]) {
  test(`${locale}: team samples and a long three-item recommendation queue retain their supplied meaning`, async ({
    page,
    context,
  }) => {
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    await context.addCookies([
      { name: "codestartrack_locale", value: locale, url: origin },
    ]);

    await page.route(
      `${origin}/api/v1/teams/${teamId}/analysis/latest`,
      async (route) => {
        expect(route.request().method()).toBe("GET");
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        const payload = (await response.json()) as { data: TeamAnalysisDto };
        const source = teamAnalysisSchema.parse(payload.data);
        const data = teamAnalysisSchema.parse({
          ...source,
          memberCount: 12345,
          includedMemberCount: 12345,
          excludedMemberCount: 0,
          dimensions: source.dimensions.map((dimension) => ({
            ...dimension,
            score:
              dimension.code === source.weakestDimension ? 0 : dimension.score,
            memberSampleCount:
              dimension.code === source.weakestDimension ? 0 : 12345,
          })),
        });
        await route.fulfill({ response, json: { ...payload, data } });
      },
    );
    await page.goto(`/teams/detail?teamId=${teamId}&tab=analysis`);
    const zeroSamples = `${t("v12.dimensionSamples")}: 0`;
    const largeSamples = `${t("v12.dimensionSamples")}: 12,345`;
    await expect(page.getByText(zeroSamples, { exact: true })).toBeVisible();
    await expect(page.getByText(largeSamples, { exact: true })).toHaveCount(5);
    const zeroDimension = page.getByRole("definition").filter({
      has: page.getByText(zeroSamples, { exact: true }),
    });
    await expect(zeroDimension).toHaveCount(1);
    const zeroScore = zeroDimension.getByText("0 / 100", { exact: true });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(zeroScore).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }

    await page.route(
      `${origin}/api/v1/teams/${teamId}/recommendations/latest?*`,
      async (route) => {
        expect(route.request().method()).toBe("GET");
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        const payload = (await response.json()) as {
          data: TeamRecommendationBatchDto;
        };
        const source = teamBatchSchema.parse(payload.data);
        const item = source.recommendations[0];
        const data = teamBatchSchema.parse({
          ...source,
          candidateCount: 3,
          resultCount: 3,
          recommendations: [
            {
              ...item,
              rank: 7,
              score: 0.7345678901234567,
              reason: primaryReason,
              problem: {
                ...item.problem,
                title: longTitle,
                tags: [longTag, "graphs"],
                url: "https://codeforces.com/problemset/problem/1/A",
              },
            },
            {
              ...item,
              rank: 2,
              reason:
                "Second supplied reason with a complete supporting explanation.",
              problem: {
                ...item.problem,
                problemId: "9000002",
                title: null,
                externalProblemKey: longKey,
                tags: [longTag],
                difficulty: null,
                url: null,
              },
            },
            {
              ...item,
              rank: 1,
              score: 0,
              reason:
                "Third supplied reason remains last despite its numerical rank.",
              problem: {
                ...item.problem,
                problemId: "9000003",
                title: "Final supplied practice item",
                difficulty: 0,
                url: "https://codeforces.com/problemset/problem/1/C",
              },
            },
          ],
        });
        await route.fulfill({ response, json: { ...payload, data } });
      },
    );
    await page.goto(`/teams/detail?teamId=${teamId}&tab=recommendations`);
    const batch = page.locator('[data-team-audience="COACH"]');
    await expect(batch.locator("[data-recommendation-rank]")).toHaveCount(3);
    expect(
      await batch
        .locator("[data-recommendation-rank]")
        .evaluateAll((items) =>
          items.map((item) => item.getAttribute("data-recommendation-rank")),
        ),
    ).toEqual(["7", "2", "1"]);
    const primary = batch.locator('[data-variant="recommendation"]');
    await expect(
      primary.getByText(t("v12.primaryRecommendation")),
    ).toBeVisible();
    await expect(primary.getByRole("heading", { level: 3 })).toContainText(
      longTitle,
    );
    await expect(
      primary.getByText(primaryReason, { exact: true }),
    ).toBeVisible();
    await expect(primary.getByRole("definition").last()).toHaveText(
      "0.7345678901234567",
    );
    await expect(
      batch.getByRole("heading", { level: 4, name: new RegExp(longKey) }),
    ).toBeVisible();
    await expect(
      batch.getByText(t("v.unrated"), { exact: false }),
    ).toBeVisible();
    await expect(
      batch.getByRole("button", { name: t("recommendation.linkUnavailable") }),
    ).toBeDisabled();
    await expect(batch.locator('[data-recommendation-rank="1"]')).toContainText(
      `${t("v12.problemDifficulty")}: 0 · ${t("v12.recommendationScore")}: 0`,
    );
    const sources = batch.getByRole("link");
    await expect(sources).toHaveCount(2);
    for (const source of await sources.all()) {
      await expect(source).toHaveAttribute("target", "_blank");
      await expect(source).toHaveAttribute("rel", "noopener noreferrer");
      expect(new URL((await source.getAttribute("href"))!).origin).toBe(
        "https://codeforces.com",
      );
    }
    await primary.getByRole("link").focus();
    await expect(primary.getByRole("link")).toBeFocused();

    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          batch.evaluate((element) =>
            [element, ...element.querySelectorAll<HTMLElement>("*")]
              .filter(
                (item) => item.clientWidth > 0 && !item.closest(".sr-only"),
              )
              .filter((item) => item.scrollWidth > item.clientWidth + 1)
              .map((item) => ({
                tag: item.tagName,
                className: item.className,
                text: item.textContent,
                clientWidth: item.clientWidth,
                scrollWidth: item.scrollWidth,
                rect: item.getBoundingClientRect().toJSON(),
              })),
          ),
        )
        .toEqual([]);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      if (width === 320) {
        const scoreLabel = primary.getByText(t("v12.recommendationScore"), {
          exact: true,
        });
        const word = locale === "en" ? "Recommendation" : "推荐分数";
        expect(
          await scoreLabel.evaluate((element, word) => {
            const text = element.firstChild;
            if (!(text instanceof Text)) return 0;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, word.length);
            return [...range.getClientRects()].filter(
              (rect) => rect.width > 0 && rect.height > 0,
            ).length;
          }, word),
        ).toBe(1);
      }
    }
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}
