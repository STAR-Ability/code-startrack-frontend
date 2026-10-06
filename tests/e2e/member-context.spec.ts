import type { Locator, Page, Route } from "@playwright/test";
import { userSchema } from "@/lib/api/schemas";
import {
  personalReportSchema,
  teamMemberSchema,
  userSubmissionSchema,
} from "@/lib/api/v012-schemas";
import { formatTimestamp, translate, type Locale } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const ownerTeam = "00000000-0000-4000-8000-000000001001";
const joinedTeam = "00000000-0000-4000-8000-000000001002";
const peer = "00000000-0000-4000-8000-000000001101";
const viewerName = "Signed-in viewer";
const learnerName = "Viewed learner with an extended training display name";
const learnerHandle = "ViewedLearnerWithAnExtendedHandleWithoutSpaces";
const sourceHandle = "SourceAccountWithAnExtendedHandleWithoutSpaces";
const problemTitle =
  "A complete shared submission with a long problem title and source context";
const domains = [
  "basicTraining",
  "abilityProfile",
  "detailedSubmissions",
  "analysisReport",
] as const;
type Domain = (typeof domains)[number];
const grants: Record<string, readonly Domain[]> = {
  [ownerTeam]: ["basicTraining", "abilityProfile", "analysisReport"],
  [joinedTeam]: ["basicTraining", "detailedSubmissions"],
};
type AccessState = { domainRevoked: boolean; membershipDenied: boolean };

test.beforeEach(() => configureUpstream());

async function deny(route: Route, code: "PRIVACY_DENIED" | "TEAM_FORBIDDEN") {
  await route.fulfill({
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({
      error: { code, message: "Synthetic access withdrawal", details: {} },
      requestId: "00000000-0000-4000-8000-000000000900",
    }),
  });
}

async function prepareMemberRoutes(
  page: Page,
  state: AccessState = { domainRevoked: false, membershipDenied: false },
) {
  await page.route("**/api/v1/me", async (route) => {
    const response = await route.fetch();
    const payload = (await response.json()) as { data: unknown };
    const user = userSchema.parse(payload.data);
    await route.fulfill({
      response,
      json: { ...payload, data: { ...user, displayName: viewerName } },
    });
  });
  await page.route("**/api/v1/teams/*/members?*", async (route) => {
    const teamId = new URL(route.request().url()).pathname.split("/")[4];
    if (teamId === joinedTeam && state.membershipDenied)
      return deny(route, "TEAM_FORBIDDEN");
    const response = await route.fetch();
    const payload = (await response.json()) as { data: unknown };
    const members = teamMemberSchema.array().parse(payload.data);
    const data = members.map((member) =>
      member.user.publicId === peer
        ? {
            ...member,
            user: {
              ...member.user,
              displayName: learnerName,
              username: learnerHandle,
            },
            dataAccess: {
              ...member.dataAccess,
              ...(teamId === joinedTeam && state.domainRevoked
                ? { detailedSubmissions: false }
                : {}),
            },
          }
        : member,
    );
    await route.fulfill({ response, json: { ...payload, data } });
  });
  await page.route(
    `**/api/v1/teams/${joinedTeam}/members/${peer}/submissions?*`,
    async (route) => {
      if (state.domainRevoked) return deny(route, "PRIVACY_DENIED");
      const response = await route.fetch();
      const payload = (await response.json()) as { data: unknown };
      const items = userSubmissionSchema.array().parse(payload.data);
      const data = items.map((item, index) =>
        index === 0
          ? userSubmissionSchema.parse({
              ...item,
              sourceAccount: { ...item.sourceAccount, username: sourceHandle },
              submission: {
                ...item.submission,
                problem: { ...item.submission.problem, title: problemTitle },
              },
            })
          : item,
      );
      await route.fulfill({ response, json: { ...payload, data } });
    },
  );
}

function captureMemberReads(page: Page) {
  const reads: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.includes(`/members/${peer}/`)) reads.push(path);
  });
  return reads;
}

async function selectedReader(
  page: Page,
  reads: string[],
  teamId: string,
  resource: string,
  action: () => Promise<unknown>,
) {
  const path = `/api/v1/teams/${teamId}/members/${peer}/${resource}`;
  const start = reads.length;
  const loaded = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === path &&
      response.request().method() === "GET" &&
      response.status() === 200,
  );
  await action();
  const response = await loaded;
  expect(reads.slice(start)).toEqual([path]);
  return response;
}

async function keyboardActivate(page: Page, control: Locator) {
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press("Enter");
}

async function expectContext(
  page: Page,
  locale: Locale,
  teamId: string,
  view: Domain,
  allowed = grants[teamId],
) {
  const context = page.locator("[data-member-context]");
  await expect(
    context.getByRole("heading", { name: learnerName, exact: true }),
  ).toBeVisible();
  await expect(context).toContainText(learnerHandle);
  await expect(context).not.toContainText(viewerName);
  await expect(context).toContainText(
    translate(locale, "v12.memberDomainContext", {
      domain: translate(locale, `v12.${view}`),
    }),
  );
  await expect(page.locator(".member-context-team")).toContainText(teamId);
  await expect(
    page.locator(".member-context-team").getByRole("link"),
  ).toHaveAttribute("href", `/teams/detail?teamId=${teamId}`);
  const nav = page.getByRole("navigation", {
    name: translate(locale, "v12.viewedMember"),
    exact: true,
  });
  await expect(nav.getByRole("link")).toHaveCount(allowed.length);
  for (const domain of domains) {
    const link = nav.getByRole("link", {
      name: translate(locale, `v12.${domain}`),
      exact: true,
    });
    if (allowed.includes(domain))
      await expect(link).toHaveAttribute(
        "href",
        `/teams/member?teamId=${teamId}&memberPublicId=${peer}&view=${domain}`,
      );
    else await expect(link).toHaveCount(0);
  }
  const current = nav.locator('[aria-current="page"]');
  if (allowed.includes(view))
    await expect(current).toHaveText(translate(locale, `v12.${view}`));
  else await expect(current).toHaveCount(0);
  return nav;
}

async function expectFits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.getByRole("main").evaluate((main) =>
        [main, ...main.querySelectorAll("*")]
          .filter((item): item is HTMLElement => item instanceof HTMLElement)
          .filter((item) => item.clientWidth > 0 && !item.closest(".sr-only"))
          .filter((item) => item.scrollWidth > item.clientWidth + 1)
          .map((item) => ({
            text: item.textContent,
            className: item.className,
            clientWidth: item.clientWidth,
            scrollWidth: item.scrollWidth,
          })),
      ),
    )
    .toEqual([]);
  await expect
    .poll(() =>
      page.getByRole("main").evaluate((main) => {
        const contained = (bounds: DOMRect, frame: DOMRect) =>
          bounds.left >= frame.left - 1 &&
          bounds.right <= frame.right + 1 &&
          bounds.top >= frame.top - 1 &&
          bounds.bottom <= frame.bottom + 1;
        const describe = (bounds: DOMRect) => ({
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
        });
        return [
          ...main.querySelectorAll<SVGSVGElement>(
            '.chart-frame[data-chart-state="ready"] .chart-surface svg',
          ),
        ].flatMap((svg) => {
          const frameElement = svg.closest(".chart-frame")!;
          const frame = frameElement.getBoundingClientRect();
          const ability =
            frameElement.getAttribute("data-chart-size") === "ability";
          const viewport = svg.getBoundingClientRect();
          const chart = svg.closest('[role="img"]')?.getAttribute("aria-label");
          const detail = (
            kind: string,
            bounds: DOMRect,
            text: string | null,
          ) => ({
            kind,
            chart,
            text,
            bounds: describe(bounds),
            viewport: describe(viewport),
            frame: describe(frame),
          });
          const viewportFailures = contained(viewport, frame)
            ? []
            : [detail("viewport", viewport, null)];
          const textFailures = [...svg.querySelectorAll("text")].flatMap(
            (text) => {
              const bounds = text.getBoundingClientRect();
              const style = getComputedStyle(text);
              if (
                !text.textContent?.trim() ||
                bounds.width === 0 ||
                bounds.height === 0 ||
                style.visibility !== "visible" ||
                style.display === "none"
              )
                return [];
              // Scroll legends deliberately clip off-canvas text; their SVG
              // viewport and every unclipped axis/radar label remain checked.
              if (
                !ability &&
                text.closest("[clip-path]") &&
                !contained(bounds, viewport)
              )
                return [];
              return contained(bounds, viewport) && contained(bounds, frame)
                ? []
                : [detail("text", bounds, text.textContent)];
            },
          );
          return [...viewportFailures, ...textFailures];
        });
      }),
    )
    .toEqual([]);
  const audit = await page.getByRole("main").evaluate((main) => ({
    viewportWidth: innerWidth,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    charts: [
      ...main.querySelectorAll<SVGSVGElement>(
        '.chart-frame[data-chart-state="ready"] .chart-surface svg',
      ),
    ].map((svg) => {
      const viewport = svg.getBoundingClientRect();
      const size = svg.closest(".chart-frame")!.getAttribute("data-chart-size");
      const labels = [...svg.querySelectorAll("text")].flatMap((text) => {
        const bounds = text.getBoundingClientRect();
        const style = getComputedStyle(text);
        if (
          !text.textContent?.trim() ||
          bounds.width === 0 ||
          bounds.height === 0 ||
          style.visibility !== "visible" ||
          style.display === "none"
        )
          return [];
        return [
          {
            text: text.textContent,
            excludedScrollLegend:
              size !== "ability" &&
              !!text.closest("[clip-path]") &&
              (bounds.left < viewport.left - 1 ||
                bounds.right > viewport.right + 1 ||
                bounds.top < viewport.top - 1 ||
                bounds.bottom > viewport.bottom + 1),
            bounds: bounds.toJSON(),
          },
        ];
      });
      return {
        chart: svg.closest('[role="img"]')?.getAttribute("aria-label"),
        size,
        measuredTextCount: labels.filter((label) => !label.excludedScrollLegend)
          .length,
        excludedScrollLegendCount: labels.filter(
          (label) => label.excludedScrollLegend,
        ).length,
        labels,
      };
    }),
  }));
  for (const radar of audit.charts.filter(
    (chart) => chart.size === "ability",
  )) {
    expect(radar.measuredTextCount).toBeGreaterThanOrEqual(6);
    expect(radar.excludedScrollLegendCount).toBe(0);
  }
  await test.info().attach("member-chart-geometry", {
    body: JSON.stringify(audit, null, 2),
    contentType: "application/json",
  });
}

for (const locale of ["zh-CN", "en"] as const) {
  test(`${locale}: viewed learner, authorized domains and submission provenance remain usable with enlarged mobile text`, async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await prepareMemberRoutes(page);
    const reads = captureMemberReads(page);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await selectedReader(page, reads, ownerTeam, "training/overview", () =>
        page.goto(
          `/teams/member?teamId=${ownerTeam}&memberPublicId=${peer}&view=basicTraining`,
        ),
      );
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      let nav = await expectContext(page, locale, ownerTeam, "basicTraining");
      await expect(
        page.getByRole("heading", {
          name: t("v12.basicTraining"),
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator('main [data-chart-state="ready"]')).toHaveCount(
        3,
      );
      await expectFits(page);

      await selectedReader(page, reads, ownerTeam, "profile", () =>
        keyboardActivate(
          page,
          nav.getByRole("link", { name: t("v12.abilityProfile"), exact: true }),
        ),
      );
      nav = await expectContext(page, locale, ownerTeam, "abilityProfile");
      await expect(
        page.locator(".member-ability-panel .analysis-dimension-row"),
      ).toHaveCount(6);
      await expect(
        page.locator('.member-ability-panel [data-chart-state="ready"]'),
      ).toHaveCount(1);
      await expectFits(page);

      const listed = await selectedReader(
        page,
        reads,
        ownerTeam,
        "reports",
        () =>
          keyboardActivate(
            page,
            nav.getByRole("link", {
              name: t("v12.analysisReport"),
              exact: true,
            }),
          ),
      );
      const reports = personalReportSchema
        .array()
        .parse(((await listed.json()) as { data: unknown }).data);
      await expectContext(page, locale, ownerTeam, "analysisReport");
      const firstReport = page.locator(".team-report-row").first();
      await expect(firstReport.locator("time")).toHaveAttribute(
        "datetime",
        reports[0].generatedAt,
      );
      await expectFits(page);
      const opened = await selectedReader(
        page,
        reads,
        ownerTeam,
        `reports/${reports[0].reportId}`,
        () =>
          keyboardActivate(
            page,
            firstReport.getByRole("button", {
              name: t("v12.open"),
              exact: true,
            }),
          ),
      );
      const report = personalReportSchema.parse(
        ((await opened.json()) as { data: unknown }).data,
      );
      await expect(
        page.locator(`[data-report-id="${report.reportId}"]`),
      ).toContainText(report.content.overview);
      await expectContext(page, locale, ownerTeam, "analysisReport");
      await expectFits(page);

      await selectedReader(page, reads, joinedTeam, "training/overview", () =>
        page.goto(
          `/teams/member?teamId=${joinedTeam}&memberPublicId=${peer}&view=basicTraining`,
        ),
      );
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      nav = await expectContext(page, locale, joinedTeam, "basicTraining");
      const submitted = await selectedReader(
        page,
        reads,
        joinedTeam,
        "submissions",
        () =>
          keyboardActivate(
            page,
            nav.getByRole("link", {
              name: t("v12.detailedSubmissions"),
              exact: true,
            }),
          ),
      );
      const items = userSubmissionSchema
        .array()
        .parse(((await submitted.json()) as { data: unknown }).data);
      const { submission, sourceAccount } = items[0];
      await expectContext(page, locale, joinedTeam, "detailedSubmissions");
      const rows = page.locator(".member-submission-list > li");
      await expect(rows).toHaveCount(items.length);
      const first = rows.first();
      await expect(first.getByRole("heading")).toHaveText(problemTitle);
      await expect(first).toContainText(
        submission.verdict === "PENDING" ? t("v.pending") : submission.verdict,
      );
      await expect(first).toHaveAttribute(
        "data-source-account-id",
        sourceAccount.accountId,
      );
      await expect(first).toContainText(
        `${sourceAccount.username} · ${sourceAccount.platform}`,
      );
      await expect(first.locator("time")).toHaveAttribute(
        "datetime",
        submission.submittedAt,
      );
      await expect(first.locator("time")).toHaveText(
        formatTimestamp(submission.submittedAt, locale),
      );
      await expect(first).toContainText(
        submission.programmingLanguage ?? t("v.unavailable"),
      );
      const disclosure = first.getByRole("button", {
        name: translate(locale, "v.submissionDetailsFor", {
          problem:
            submission.problem.title ?? submission.problem.externalProblemKey,
          id: submission.externalSubmissionId,
        }),
        exact: true,
      });
      await expectFits(page);
      await keyboardActivate(page, disclosure);
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      const ids = first.getByText(
        `ID: ${submission.submissionId} · CF: ${submission.externalSubmissionId}`,
        { exact: true },
      );
      await expect(ids).toBeVisible();
      await expect(
        first.getByText(
          `${t("v12.sourceAccount")}: ${sourceAccount.accountId}`,
          {
            exact: true,
          },
        ),
      ).toBeVisible();
      await expect(first.getByText(t("v.time"), { exact: true })).toBeVisible();
      await expect(
        first.getByText(t("v.memory"), { exact: true }),
      ).toBeVisible();
      await expectFits(page);
      await expect(disclosure).toBeFocused();
      await page.keyboard.press("Space");
      await expect(disclosure).toHaveAttribute("aria-expanded", "false");
      await expect(ids).not.toBeVisible();
      await expect(disclosure).toBeFocused();
    }
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });
}

test("revoked submission sharing removes cached evidence before membership denial withdraws learner context", async ({
  page,
}) => {
  const state: AccessState = { domainRevoked: false, membershipDenied: false };
  await prepareMemberRoutes(page, state);
  await page.goto(
    `/teams/member?teamId=${joinedTeam}&memberPublicId=${peer}&view=detailedSubmissions`,
  );
  await expect(
    page.locator(".member-submission-list > li").first(),
  ).toBeVisible();
  await expectContext(page, "zh-CN", joinedTeam, "detailedSubmissions");
  const refresh = page.getByRole("button", {
    name: translate("zh-CN", "interaction.refresh"),
    exact: true,
  });
  state.domainRevoked = true;
  await refresh.click();
  await expect(page.locator(".member-submission-list")).toHaveCount(0);
  await expectContext(page, "zh-CN", joinedTeam, "detailedSubmissions", [
    "basicTraining",
  ]);
  await expect(
    page
      .getByText(translate("zh-CN", "v12.PRIVATE_DENIED"), { exact: true })
      .first(),
  ).toBeVisible();
  const nav = page.getByRole("navigation", {
    name: translate("zh-CN", "v12.viewedMember"),
    exact: true,
  });
  await keyboardActivate(
    page,
    nav.getByRole("link", {
      name: translate("zh-CN", "v12.basicTraining"),
      exact: true,
    }),
  );
  await expect(
    page.getByRole("heading", {
      name: translate("zh-CN", "v12.basicTraining"),
      exact: true,
    }),
  ).toBeVisible();
  state.membershipDenied = true;
  await refresh.click();
  await expect(page).toHaveURL("/teams");
  await expect(page.locator("[data-member-context]")).toHaveCount(0);
  await expect(page.locator(".member-domain-navigation")).toHaveCount(0);
  await expect(page.locator(".member-submission-list")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: translate("zh-CN", "v12.basicTraining"),
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});
