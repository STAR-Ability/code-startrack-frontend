import type {
  PersonalReportDto,
  TeamInvitationDto,
  TeamSummaryDto,
  UserAnalysisDto,
} from "../../src/lib/api/v012-schemas";
import type { SubmissionDto } from "../../src/lib/api/schemas";
import { formatTimestamp, translate } from "../../src/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

for (const state of ["missing", "failed"] as const) {
  test(`mobile team tasks preserve long ${state} analysis states and keyboard navigation`, async ({
    page,
    context,
  }) => {
    await configureUpstream({ coach: true });
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: "en",
        url: "http://127.0.0.1:3100",
      },
    ]);
    const teamId = "00000000-0000-4000-8000-000000001001";
    await page.route(`**/api/v1/teams/${teamId}/analysis/latest`, (route) =>
      route.fulfill({
        status: state === "missing" ? 200 : 503,
        json:
          state === "missing"
            ? { data: null, requestId: "00000000-0000-4000-8000-000000000900" }
            : {
                error: {
                  code: "ALGORITHM_UNAVAILABLE",
                  message: "Synthetic failure",
                  details: {},
                },
                requestId: "00000000-0000-4000-8000-000000000900",
              },
      }),
    );
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/teams/detail?teamId=${teamId}`);
    const tasks = page.locator(".workspace-task-tile");
    await expect(tasks).toHaveCount(4);
    const analysis = tasks.filter({
      has: page.getByText(translate("en", "v12.teamAnalysis"), { exact: true }),
    });
    await expect(analysis.locator("strong")).toHaveText(
      translate(
        "en",
        state === "missing" ? "v12.noTeamAnalysis" : "v12.unavailableState",
      ),
    );
    for (const fontSize of ["100%", "200%"]) {
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = size;
      }, fontSize);
      for (const task of await tasks.all()) {
        await expect(task).toBeVisible();
        for (const element of [
          task,
          task.locator("span"),
          task.locator("strong"),
        ]) {
          await expect
            .poll(() =>
              element.evaluate(
                (node) => node.scrollWidth <= node.clientWidth + 1,
              ),
            )
            .toBe(true);
        }
      }
    }
    await analysis.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`/teams/detail?teamId=${teamId}&tab=analysis`);
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}

test("the labeled history filter supports keyboard and label activation using account-scoped reads", async ({
  page,
}) => {
  await page.clock.install();
  const initialHistory = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/recommendations/history") &&
      url.searchParams.get("mode") === "HYBRID"
    );
  });
  await page.goto("/practice");
  await initialHistory;
  const allModes = page.getByRole("checkbox", {
    name: "所有模式",
    exact: true,
  });
  await expect(allModes).not.toBeChecked();
  await allModes.focus();
  await expect(allModes).toBeFocused();

  const unfiltered = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/recommendations/history") &&
      !url.searchParams.has("mode")
    );
  });
  await page.keyboard.press("Space");
  const allResponse = await unfiltered;
  await expect(allModes).toBeChecked();
  expect(allResponse.request().method()).toBe("GET");
  expect(new URL(allResponse.url()).searchParams.get("page")).toBe("1");

  // Expire the initial mode's cache so returning through its label exercises
  // the filtered request rather than only reading a fresh cached response.
  await page.clock.fastForward(31_000);
  const filtered = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/recommendations/history") &&
      url.searchParams.get("mode") === "HYBRID"
    );
  });
  await page.getByText("所有模式", { exact: true }).click();
  const modeResponse = await filtered;
  await expect(allModes).not.toBeChecked();
  expect(modeResponse.request().method()).toBe("GET");
  expect(new URL(modeResponse.url()).searchParams.get("page")).toBe("1");
  const historyCalls = (await upstreamCalls()).filter((call) =>
    call.path.includes("/recommendations/history"),
  );
  expect(historyCalls.length).toBeGreaterThanOrEqual(3);
  expect(
    historyCalls.every((call) =>
      /^\/api\/v1\/oj-accounts\/[^/]+\/recommendations\/history\?/.test(
        call.path,
      ),
    ),
  ).toBe(true);
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`dashboard destinations and the supplied report timestamp remain clear in ${locale}`, async ({
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
    const latestReport = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/me/reports/latest",
    );
    await page.goto("/dashboard");
    const report = (
      (await (await latestReport).json()) as { data: PersonalReportDto }
    ).data;
    const main = page.getByRole("main");
    for (const [key, href] of [
      ["v12.openProfile", "/profile"],
      ["v12.openReport", "/analysis"],
      ["v12.openTeams", "/teams"],
      ["v12.openInvitations", "/teams?tab=invitations"],
      ["v12.openNotifications", "/notifications"],
    ] as const) {
      await expect(
        main.getByRole("link", { name: translate(locale, key), exact: true }),
      ).toHaveAttribute("href", href);
    }
    const reportTime = main.locator(`time[datetime="${report.generatedAt}"]`);
    await expect(reportTime).toHaveText(
      formatTimestamp(report.generatedAt, locale),
    );
    await expect(reportTime).not.toHaveText(report.generatedAt);
    await expect(reportTime).toContainText("UTC");
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });

  test(`submission instants and frozen report periods retain readable ${locale} UTC times`, async ({
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
    await page.goto("/data");
    const loadedSubmissions = page.waitForResponse((response) =>
      /\/api\/v1\/oj-accounts\/[^/]+\/submissions$/.test(
        new URL(response.url()).pathname,
      ),
    );
    const submissionsTab = page
      .getByRole("main")
      .getByRole("group", {
        name: translate(locale, "v.data"),
        exact: true,
      })
      .getByRole("button", {
        name: translate(locale, "v.submissions"),
        exact: true,
      });
    await submissionsTab.click();
    await expect(submissionsTab).toHaveAttribute("aria-pressed", "true");
    const submissions = (
      (await (await loadedSubmissions).json()) as { data: SubmissionDto[] }
    ).data;
    expect(submissions.length).toBeGreaterThan(0);
    for (const submission of submissions) {
      const time = page
        .getByRole("main")
        .locator(`time[datetime="${submission.submittedAt}"]`)
        .first();
      await expect(time).toHaveText(
        formatTimestamp(submission.submittedAt, locale),
      );
      await expect(time).not.toHaveText(submission.submittedAt);
      await expect(time).toContainText("UTC");
    }

    const loadedReport = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/me/reports/latest",
    );
    await page.goto("/analysis");
    const report = (
      (await (await loadedReport).json()) as { data: PersonalReportDto }
    ).data;
    const presentation = page.locator(`[data-report-id="${report.reportId}"]`);
    await presentation
      .getByRole("button", {
        name: translate(locale, "v12.reportEvidence"),
        exact: true,
      })
      .click();
    const period = presentation
      .getByRole("region", { name: translate(locale, "v12.recentTraining") })
      .locator("p")
      .first();
    await expect(period.locator("time")).toHaveCount(2);
    for (const instant of Object.values(report.recentTrainingSnapshot.period)) {
      const time = period.locator(`time[datetime="${instant}"]`);
      await expect(time).toHaveText(formatTimestamp(instant, locale));
      await expect(time).not.toHaveText(instant);
      await expect(time).toContainText("UTC");
    }
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}

test("a missing aggregate profile keeps contextual recovery and unknown values readable at 320px with enlarged English text", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: "http://127.0.0.1:3100" },
  ]);
  await page.route("**/api/v1/me/analysis/latest?*", (route) =>
    route.fulfill({
      json: { data: null, requestId: "00000000-0000-4000-8000-000000000900" },
    }),
  );
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/profile");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const main = page.getByRole("main");
  const guidance = main.getByText(translate("en", "v12.sourcePending"), {
    exact: true,
  });
  const recovery = main.getByRole("link", {
    name: "Platform accounts",
    exact: true,
  });
  const recoveryContent = main
    .locator('[data-slot="card"]')
    .filter({
      has: page.getByText(translate("en", "v12.sourcePending"), {
        exact: true,
      }),
    })
    .locator('[data-slot="card-content"]');
  await expect(guidance).toHaveCount(1);
  await expect(
    main.getByText("No analysis generated yet", { exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByText("No training evidence yet", { exact: true }),
  ).toHaveCount(0);
  await expect(recovery).toHaveAttribute("href", "/accounts");
  for (const target of [
    recoveryContent,
    recoveryContent.locator('[data-slot="empty"]'),
    recoveryContent.locator('[data-slot="empty-header"]'),
    guidance,
    recovery,
  ]) {
    await expect(target).toBeVisible();
    await expect
      .poll(
        () =>
          target.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        {
          message: "Contextual guidance and its action fit their local surface",
        },
      )
      .toBe(true);
  }
  await expect(
    main.getByRole("img", { name: "Six dimensions · 0–100", exact: true }),
  ).toHaveCount(0);
  const metricValues = main.getByRole("definition");
  await expect(metricValues.first()).toBeVisible();
  for (const value of await metricValues.all()) {
    await expect(value).toHaveText("Unavailable");
    expect(
      await value.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) <=
          innerWidth + 1,
      ),
    )
    .toBe(true);
  await recovery.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/accounts");
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});

test("dashboard preserves full supplied source, team and inviter names at responsive widths", async ({
  page,
}) => {
  const username = "LongCodeforcesHandle2026";
  const teamName = "ExtendedTrainingTeamNameWithoutSpaces".repeat(2);
  const inviterName = "TrainingPartnerWithAnExtendedDisplayName";
  await page.route("**/api/v1/me/analysis/latest?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { data: UserAnalysisDto };
    body.data.ratingAccounts[0].username = username;
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/v1/teams/mine?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { data: TeamSummaryDto[] };
    body.data[0].name = teamName;
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/v1/me/team-invitations?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { data: TeamInvitationDto[] };
    body.data[0].team.name = teamName;
    body.data[0].inviter.displayName = inviterName;
    await route.fulfill({ response, json: body });
  });
  await page.goto("/dashboard");
  const main = page.getByRole("main");
  const invitations = main.locator("section").filter({
    has: page.getByRole("heading", { name: "团队邀请", exact: true }),
  });
  const inviter = invitations.getByText(inviterName);
  await expect(
    main.getByRole("link", { name: username, exact: true }),
  ).toHaveAttribute("href", "/accounts");
  await expect(
    main.getByRole("link", { name: new RegExp(teamName) }),
  ).toHaveAttribute("href", /^\/teams\/detail\?teamId=/);
  await expect(inviter).toHaveText(
    `${translate("zh-CN", "v12.invitedBy")}: ${inviterName}`,
  );

  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const fontSize of width < 400 ? ["100%", "200%"] : ["100%"]) {
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = size;
      }, fontSize);
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                Math.max(
                  document.documentElement.scrollWidth,
                  document.body.scrollWidth,
                ) <=
                innerWidth + 1,
            ),
          { message: `Dashboard fits ${width}px with ${fontSize} text` },
        )
        .toBe(true);
      await expect(
        main.getByRole("link", { name: username, exact: true }),
      ).toBeVisible();
      await expect(inviter).toBeVisible();
    }
  }
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});
