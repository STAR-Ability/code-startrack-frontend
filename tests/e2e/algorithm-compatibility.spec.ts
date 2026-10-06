import type { Page } from "@playwright/test";
import type { AnalysisDto, RecommendationBatchDto } from "@/lib/api/schemas";
import type {
  PersonalReportDto,
  TeamAnalysisDto,
  TeamRecommendationBatchDto,
  UserAnalysisDto,
} from "@/lib/api/v012-schemas";
import { translate } from "@/lib/i18n/locale";
import { fixtureUuid } from "@/lib/demo/fixtures";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const apiOrigin = "http://127.0.0.1:3100/api/v1";
const teamId = fixtureUuid(1001);
const dimensionsLabel = translate("zh-CN", "v.dimensions");
const unknownNotice = '[data-algorithm-compatibility="unknown"]';

async function rewriteMockData<T>(
  page: Page,
  url: string,
  update: (data: T) => T,
) {
  await page.route(`${apiOrigin}${url}`, async (route) => {
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as { data: T };
    await route.fulfill({
      response,
      json: { ...payload, data: update(payload.data) },
    });
  });
}

async function expectReadOnly() {
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
}

async function expectUsableProfile(page: Page, score: number) {
  const main = page.getByRole("main");
  const metric = main.locator("[data-metric-panel] dl > div").filter({
    has: page.getByText(translate("zh-CN", "v.overallScore"), {
      exact: true,
    }),
  });
  await expect(metric.getByRole("definition")).toHaveText(
    new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(score),
  );
  await expect(
    main.getByRole("img", { name: dimensionsLabel, exact: true }),
  ).toBeVisible();
  await expect(
    main.getByText(translate("zh-CN", "ui.unavailableTitle"), { exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByText(translate("zh-CN", "v12.sourcePending"), { exact: true }),
  ).toHaveCount(0);
}

test.beforeEach(() => configureUpstream());

for (const version of ["0.13.1", "0.13.2", "1.0.0"]) {
  test(`a structurally valid user profile ${version} keeps its supplied analysis visible`, async ({
    page,
  }) => {
    const algorithmVersion = `user-profile-v${version}`;
    await rewriteMockData<UserAnalysisDto>(
      page,
      "/me/analysis/latest?window=ALL",
      (data) => ({ ...data, algorithmVersion }),
    );
    const loaded = page.waitForResponse(
      `${apiOrigin}/me/analysis/latest?window=ALL`,
    );
    await page.goto("/profile");
    const { data } = (await (await loaded).json()) as { data: UserAnalysisDto };
    await expectUsableProfile(page, data.overallScore);
    for (const account of data.ratingAccounts)
      await expect(
        page.getByRole("main").getByRole("link", {
          name: account.username,
          exact: true,
        }),
      ).toHaveAttribute("href", "/accounts");
    if (version === "0.13.1") {
      await expect(page.getByRole("main").locator(unknownNotice)).toHaveCount(
        0,
      );
    } else {
      await expect(page.getByRole("main").locator(unknownNotice)).toBeVisible();
    }
    await expectReadOnly();
  });
}

test("a future account profile keeps the selected account and six-dimensional evidence", async ({
  page,
}) => {
  await rewriteMockData<AnalysisDto>(
    page,
    "/oj-accounts/*/analysis/latest?window=ALL",
    (data) => ({ ...data, algorithmVersion: "profile-v0.13.2" }),
  );
  const loaded = page.waitForResponse((response) =>
    response.url().endsWith("/analysis/latest?window=ALL"),
  );
  await page.goto("/accounts/profile");
  const { data } = (await (await loaded).json()) as { data: AnalysisDto };
  await expectUsableProfile(page, data.overallScore);
  await expect(page.getByLabel("当前 Codeforces 账号")).toHaveValue(
    data.accountId,
  );
  await expect(page.getByRole("main").locator(unknownNotice)).toBeVisible();
  await expectReadOnly();
});

test("a future team profile keeps authorized member counts and ability evidence", async ({
  page,
}) => {
  await rewriteMockData<TeamAnalysisDto>(
    page,
    `/teams/${teamId}/analysis/latest`,
    (data) => ({ ...data, algorithmVersion: "team-profile-v0.13.2" }),
  );
  const loaded = page.waitForResponse(
    `${apiOrigin}/teams/${teamId}/analysis/latest`,
  );
  await page.goto(`/teams/detail?teamId=${teamId}&tab=analysis`);
  const { data } = (await (await loaded).json()) as { data: TeamAnalysisDto };
  await expectUsableProfile(page, data.overallScore);
  const included = page
    .getByRole("main")
    .locator("[data-metric-panel] dl > div")
    .filter({
      has: page.getByText(translate("zh-CN", "v12.included"), {
        exact: true,
      }),
    });
  await expect(included.getByRole("definition")).toHaveText(
    `${data.includedMemberCount} / ${data.memberCount}`,
  );
  await expect(page.getByRole("main").locator(unknownNotice)).toBeVisible();
  await expectReadOnly();
});

test("future account recommendation metadata preserves backend rank and generation controls", async ({
  page,
}) => {
  await rewriteMockData<RecommendationBatchDto>(
    page,
    "/oj-accounts/*/recommendations/latest?mode=HYBRID",
    (data) => ({ ...data, algorithmVersion: "recommend-v0.13.2" }),
  );
  const loaded = page.waitForResponse((response) =>
    response.url().endsWith("/recommendations/latest?mode=HYBRID"),
  );
  await page.goto("/practice");
  const { data } = (await (await loaded).json()) as {
    data: RecommendationBatchDto;
  };
  for (const item of data.recommendations)
    await expect(
      page.getByRole("heading", {
        name: `#${item.rank} ${item.problem.title ?? item.problem.externalProblemKey}`,
        exact: true,
      }),
    ).toBeVisible();
  await expect(
    page.getByRole("button", { name: translate("zh-CN", "v.generate") }),
  ).toBeEnabled();
  await expect(page.getByRole("main").locator(unknownNotice)).toBeVisible();
  await expectReadOnly();
});

test("a malformed account recommendation keeps its error separate from an empty candidate pool", async ({
  page,
}) => {
  await rewriteMockData<RecommendationBatchDto>(
    page,
    "/oj-accounts/*/recommendations/latest?mode=HYBRID",
    (data) => ({
      ...data,
      algorithmVersion: "recommend-v0.13.2",
      candidateCount: -1,
    }),
  );
  await page.goto("/practice");
  const recommendations = page.getByRole("region", {
    name: translate("zh-CN", "practice.forYou"),
    exact: true,
  });
  const failure = recommendations.locator('[data-state="error"]');
  await expect(failure).toBeVisible();
  await expect(
    failure.getByText(translate("zh-CN", "ui.invalidResponseTitle"), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    recommendations.getByText(translate("zh-CN", "v.noBatch"), {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    recommendations.getByText(translate("zh-CN", "v.noCandidates"), {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    recommendations.locator("[data-recommendation-rank]"),
  ).toHaveCount(0);
  await expect(recommendations.locator(unknownNotice)).toHaveCount(0);
  await expect(
    failure.getByRole("button", {
      name: translate("zh-CN", "v.retry"),
      exact: true,
    }),
  ).toBeEnabled();
  await expectReadOnly();
});

test("future team recommendation metadata preserves audience and supplied problems", async ({
  page,
}) => {
  await rewriteMockData<TeamRecommendationBatchDto>(
    page,
    `/teams/${teamId}/recommendations/latest?*`,
    (data) => ({ ...data, algorithmVersion: "team-recommend-v0.13.2" }),
  );
  const loaded = page.waitForResponse((response) =>
    response
      .url()
      .startsWith(`${apiOrigin}/teams/${teamId}/recommendations/latest?`),
  );
  await page.goto(`/teams/detail?teamId=${teamId}&tab=recommendations`);
  const { data } = (await (await loaded).json()) as {
    data: TeamRecommendationBatchDto;
  };
  const batch = page.locator(`[data-team-audience="${data.audience}"]`);
  await expect(batch).toBeVisible();
  for (const item of data.recommendations) {
    await expect(
      batch.getByRole("heading", {
        name: `#${item.rank} ${item.problem.title ?? item.problem.externalProblemKey}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(batch.getByText(item.reason, { exact: true })).toBeVisible();
  }
  await expect(batch.locator(unknownNotice)).toBeVisible();
  await expectReadOnly();
});

test("a future report version preserves its conclusions and frozen profile evidence", async ({
  page,
}) => {
  await rewriteMockData<PersonalReportDto>(
    page,
    "/me/reports/latest",
    (data) => ({
      ...data,
      reportVersion: "personal-report-v0.13.2",
    }),
  );
  const loaded = page.waitForResponse(`${apiOrigin}/me/reports/latest`);
  await page.goto("/analysis");
  const { data } = (await (await loaded).json()) as { data: PersonalReportDto };
  const report = page.locator(`[data-report-id="${data.reportId}"]`);
  await expect(
    report.getByText(data.content.overview, { exact: true }),
  ).toBeVisible();
  await expect(report.locator(unknownNotice)).toBeVisible();
  const evidence = report.getByRole("button", {
    name: translate("zh-CN", "v12.reportEvidence"),
    exact: true,
  });
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(evidence).toHaveAttribute("aria-expanded", "true");
  await expect(
    report.getByRole("img", { name: dimensionsLabel, exact: true }),
  ).toBeVisible();
  await expectReadOnly();
});

test("a malformed 200 analysis response is an error and retry restores valid evidence", async ({
  page,
}) => {
  let malformed = true;
  await rewriteMockData<UserAnalysisDto>(
    page,
    "/me/analysis/latest?window=ALL",
    (data) => ({
      ...data,
      algorithmVersion: "user-profile-v0.13.2",
      dimensions: malformed ? [] : data.dimensions,
    }),
  );
  await page.goto("/profile");
  const main = page.getByRole("main");
  const failure = main.locator('[data-state="error"]');
  await expect(failure).toBeVisible();
  await expect(
    main.getByRole("img", { name: dimensionsLabel, exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByText(translate("zh-CN", "v12.sourcePending"), { exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByText(translate("zh-CN", "v.noAnalysis"), { exact: true }),
  ).toHaveCount(0);
  await expect(main.locator(unknownNotice)).toHaveCount(0);
  await failure
    .getByRole("button", { name: translate("zh-CN", "ui.details") })
    .click();
  await expect(
    failure.getByText("INVALID_RESPONSE", { exact: true }),
  ).toBeVisible();
  malformed = false;
  const restored = page.waitForResponse(
    `${apiOrigin}/me/analysis/latest?window=ALL`,
  );
  await failure
    .getByRole("button", { name: translate("zh-CN", "v.retry"), exact: true })
    .click();
  const { data } = (await (await restored).json()) as { data: UserAnalysisDto };
  await expectUsableProfile(page, data.overallScore);
  await expect(main.locator('[data-state="error"]')).toHaveCount(0);
  await expect(main.locator(unknownNotice)).toBeVisible();
  await expectReadOnly();
});

for (const status of [200, 503]) {
  test(`a failed report read (${status}) keeps current analysis usable without claiming no report exists`, async ({
    page,
  }) => {
    await page.route(`${apiOrigin}/me/reports/latest`, async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as {
        data: PersonalReportDto;
        requestId: string;
      };
      await route.fulfill({
        response,
        status,
        json:
          status === 200
            ? {
                ...payload,
                data: {
                  ...payload.data,
                  reportVersion: "personal-report-v0.13.2",
                  profileSnapshot: {
                    ...payload.data.profileSnapshot,
                    dimensions: [],
                  },
                },
              }
            : {
                error: {
                  code: "INTERNAL_ERROR",
                  message: "Synthetic failure",
                  details: {},
                },
                requestId: payload.requestId,
              },
      });
    });
    const currentAnalysis = page.waitForResponse(
      `${apiOrigin}/me/analysis/latest?window=ALL`,
    );
    await page.goto("/analysis");
    const { data } = (await (await currentAnalysis).json()) as {
      data: UserAnalysisDto;
    };
    const main = page.getByRole("main");
    const failure = main.locator('[data-state="error"]');
    await expect(failure).toBeVisible();
    await expect(
      main.getByText(translate("zh-CN", "v12.noReport"), { exact: true }),
    ).toHaveCount(0);
    await expect(main.locator("[data-report-id]")).toHaveCount(0);
    await expect(main.locator(unknownNotice)).toHaveCount(0);
    await expect(
      failure.getByRole("button", {
        name: translate("zh-CN", "v.retry"),
        exact: true,
      }),
    ).toBeEnabled();
    if (status === 200) {
      await expect(
        failure.getByText(translate("zh-CN", "ui.invalidResponseTitle"), {
          exact: true,
        }),
      ).toBeVisible();
      await failure
        .getByRole("button", { name: translate("zh-CN", "ui.details") })
        .click();
      await expect(
        failure.getByText("INVALID_RESPONSE", { exact: true }),
      ).toBeVisible();
    }
    await main
      .getByRole("button", {
        name: translate("zh-CN", "v12.currentEvidence"),
        exact: true,
      })
      .click();
    await expect(
      main.getByRole("img", { name: dimensionsLabel, exact: true }),
    ).toBeVisible();
    await expect(
      main
        .locator("[data-metric-panel]")
        .first()
        .getByRole("definition")
        .first(),
    ).toHaveText(
      new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(
        data.overallScore,
      ),
    );
    await expectReadOnly();
  });
}

test("an expired session removes already displayed future-version profile data", async ({
  page,
}) => {
  await rewriteMockData<UserAnalysisDto>(
    page,
    "/me/analysis/latest?window=ALL",
    (data) => ({ ...data, algorithmVersion: "user-profile-v0.13.2" }),
  );
  await page.goto("/profile");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("link", { name: "DemoAlpha", exact: true }),
  ).toBeVisible();
  await expect(main.locator(unknownNotice)).toBeVisible();
  await configureUpstream({ loggedOut: true }, true);
  const expired = page.waitForResponse(
    (response) =>
      response.url() === `${apiOrigin}/me/analysis/latest?window=7D` &&
      response.status() === 401,
  );
  await page
    .getByRole("button", {
      name: translate("zh-CN", "v.window.7D"),
      exact: true,
    })
    .click();
  await expired;
  await expect(
    main.getByText("请登录查看更多数据", { exact: true }),
  ).toBeVisible();
  await expect(
    main.getByRole("link", { name: "DemoAlpha", exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByRole("img", { name: dimensionsLabel, exact: true }),
  ).toHaveCount(0);
  await expect(main.locator(unknownNotice)).toHaveCount(0);
  await expect(page).toHaveURL("/profile");
  await expectReadOnly();
});
