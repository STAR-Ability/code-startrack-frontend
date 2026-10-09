import type { Page } from "@playwright/test";
import { envelope, pageEnvelope } from "../../src/lib/api/schemas";
import {
  learningProfileSchema,
  learningRecommendationBatchSchema,
  submissionViewSchema,
  trainingRecordSchema,
  SOURCE_BYTE_LIMIT,
} from "../../src/lib/api/v02-schemas";
import { v02Problems, v02SourceCode } from "../../src/lib/demo/v02-fixtures";
import {
  v02ProblemsEn,
  v02ProblemsZh,
} from "../../src/lib/i18n/v02-problems-messages";
import {
  v02LearningEn,
  v02LearningZh,
} from "../../src/lib/i18n/v02-learning-messages";
import {
  v02SubmissionsEn,
  v02SubmissionsZh,
} from "../../src/lib/i18n/v02-submissions-messages";
import { translate } from "../../src/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const origin = "http://127.0.0.1:3100";
const detail = `/problems/detail?problemId=${v02Problems[0].problemRef.problemId}`;
const copy = (locale: "en" | "zh-CN") =>
  locale === "en"
    ? { ...v02ProblemsEn, ...v02LearningEn, ...v02SubmissionsEn }
    : { ...v02ProblemsZh, ...v02LearningZh, ...v02SubmissionsZh };

test.beforeEach(() => configureUpstream());

test("V0.2: malicious statement bytes are served but cannot execute in the production renderer", async ({
  page,
}) => {
  await configureUpstream({ scenario: "v02-unsafe-statement" });
  const response = await page.request.get(
    `/api/v1/platform-problems/${v02Problems[0].problemRef.problemId}`,
  );
  expect(response.ok()).toBe(true);
  const payload = await response.text();
  expect(payload).toContain("<script>alert('unsafe fixture')</script>");
  expect(payload).toContain("javascript:alert(1)");
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto(detail);
  await expect(
    page
      .getByRole("heading", { name: "Sum of Two Integers", exact: true })
      .first(),
  ).toBeVisible();
  const statement = page.locator("article");
  await expect(
    statement.getByText("Unsafe link", { exact: true }),
  ).toBeVisible();
  await expect(statement.locator("script")).toHaveCount(0);
  await expect(statement.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(dialogs).toEqual([]);
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`V0.2 ${locale}: new learner completes login → editor → judge → analysis → training → profile → recommendations`, async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);
    const c = copy(locale);
    await configureUpstream({ scenario: "v02-new-learner", loggedOut: true });
    await context.addCookies([
      { name: "codestartrack_locale", value: locale, url: origin },
    ]);
    await page.goto("/login");
    await page
      .getByLabel(translate(locale, "v.account"), { exact: true })
      .fill("demo_student");
    await page
      .getByLabel(translate(locale, "v.password"), { exact: true })
      .fill("synthetic-password");
    await page
      .getByRole("textbox", {
        name: translate(locale, "v.captcha"),
        exact: true,
      })
      .fill("abcd");
    await page
      .getByRole("button", {
        name: translate(locale, "auth.login"),
        exact: true,
      })
      .click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/problems");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      c["v02.problems"],
    );
    await page
      .getByRole("link", { name: /Sum of Two Integers/ })
      .first()
      .click();
    await expect(
      page
        .getByRole("heading", { name: "Sum of Two Integers", exact: true })
        .first(),
    ).toBeVisible();
    await expect(page.locator("article script")).toHaveCount(0);
    await expect(page.locator('article a[href^="javascript:"]')).toHaveCount(0);
    const editor = page.getByRole("textbox", {
      name: c["v02.problem.sourceCode"],
      exact: true,
    });
    const source = `  // 保留空白与 UTF-8\n${v02SourceCode}\n  `;
    await editor.fill(source);
    await page
      .getByLabel(c["v02.problem.language"], { exact: true })
      .selectOption("cpp17");
    const accepted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/submissions" &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: c["v02.problem.submit"], exact: true })
      .click();
    const submitted = envelope(submissionViewSchema).parse(
      await (await accepted).json(),
    ).data;
    await expect(page).toHaveURL(/\/problems\/detail\?problemId=/);
    const inlineResult = page.getByRole("tabpanel", {
      name: c["v02.problem.results"],
      exact: true,
    });
    await expect(
      inlineResult.getByText(`AC · ${c["v02.verdict.AC"]}`, { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(editor).toHaveText(source, { useInnerText: true });
    expect(
      (await upstreamCalls()).filter((call) =>
        call.path.endsWith(`/${submitted.submissionId}/source`),
      ),
    ).toHaveLength(0);
    await inlineResult
      .getByRole("link", { name: c["v02.openSubmission"], exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(
        `/submissions/detail\\?submissionId=${submitted.submissionId}`,
      ),
    );
    await expect(
      page.getByText(`AC · ${c["v02.verdict.AC"]}`, { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Lizard", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(c["v02.synthesisNotRequested"], { exact: true }),
    ).toBeVisible();
    await page.getByText(c["v02.reproducibility"], { exact: true }).click();
    await expect(
      page.getByText("static-v0.2.1", { exact: true }),
    ).toBeVisible();
    expect(
      (await upstreamCalls()).filter((call) =>
        call.path.endsWith(`/${submitted.submissionId}/source`),
      ),
    ).toHaveLength(0);
    await page
      .getByRole("button", { name: c["v02.showSource"], exact: true })
      .click();
    const privateSource = page.getByLabel(c["v02.source"], { exact: true });
    await expect(privateSource).toBeVisible();
    expect(await privateSource.textContent()).toBe(source);
    await page
      .getByRole("button", { name: c["v02.hideSource"], exact: true })
      .click();
    await expect(privateSource).toHaveCount(0);
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain(source);
    const records = pageEnvelope(trainingRecordSchema).parse(
      await (
        await page.request.get("/api/v1/me/training-records?source=PLATFORM")
      ).json(),
    );
    const record = records.data.find(
      (item) => item.lastSubmissionId === submitted.submissionId,
    )!;
    expect(record.status).toBe("COMPLETED");
    await page.goto(
      `/training/detail?trainingRecordId=${record.trainingRecordId}`,
    );
    await expect(
      page.getByText(c["v02.status.COMPLETED"], { exact: true }),
    ).toBeVisible();
    await page.goto("/learning-profile");
    await expect(
      page.getByRole("heading", { name: c["v02.sources"], exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: c["v02.codeQuality"], exact: true }),
    ).toBeVisible();
    await page.goto("/learning-recommendations");
    const generated = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v1/me/recommendations/generate" &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: c["v02.generate"], exact: true })
      .click();
    const batch = envelope(learningRecommendationBatchSchema).parse(
      await (await generated).json(),
    ).data;
    expect(batch.resultCount).toBeGreaterThan(0);
    await expect(
      page.getByRole("button", { name: c["v02.plan"], exact: true }).first(),
    ).toBeEnabled();
    const writes = (await upstreamCalls()).filter(
      (call) => call.method === "POST",
    );
    const submissionWrites = writes.filter(
      (call) => call.path === "/api/v1/submissions",
    );
    expect(submissionWrites).toHaveLength(1);
    expect(submissionWrites[0].body?.sourceCode).toBe(source);
    expect(submissionWrites[0].body?.problemRef).toEqual(
      v02Problems[0].problemRef,
    );
    expect(submissionWrites[0].headers["idempotency-key"]).toMatch(
      /^[a-f0-9-]{36}$/,
    );
    expect(writes.some((call) => call.path === "/api/v1/oj-accounts")).toBe(
      false,
    );
  });

  test(`V0.2 ${locale}: all new workspaces fit desktop, laptop, tablet, mobile and 200% text`, async ({
    page,
    context,
  }, info) => {
    test.setTimeout(60_000);
    await context.addCookies([
      { name: "codestartrack_locale", value: locale, url: origin },
    ]);
    for (const path of [
      "/problems",
      detail,
      "/submissions",
      "/submissions/detail?submissionId=9007199254748001",
      "/training",
      "/learning-profile",
      "/learning-recommendations",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
      for (const width of [1440, 1280, 820, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await fits(page);
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await fits(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
    }
    await page.screenshot({
      path: info.outputPath(`v02-recommendations-${locale}-320.png`),
      fullPage: true,
    });
  });
}

test("V0.2: changed problem version preserves editor source and starts a new operation only after explicit refresh", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await configureUpstream({ v02VersionConflict: true });
  const c = copy("en");
  await page.goto(detail);
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  const source = ` // version recovery\n${v02SourceCode} `;
  await editor.fill(source);
  await page
    .getByRole("button", { name: c["v02.problem.submit"], exact: true })
    .click();
  await expect(
    page.getByText(c["v02.problem.versionConflict"], { exact: true }),
  ).toBeVisible();
  await expect(editor).toHaveText(source, { useInnerText: true });
  expect(
    (await upstreamCalls()).filter(
      (call) => call.path === "/api/v1/submissions" && call.method === "POST",
    ),
  ).toHaveLength(1);
  await page
    .locator("form")
    .filter({ has: editor })
    .getByRole("button", { name: c["v02.problem.refreshProblem"], exact: true })
    .click();
  await expect(
    page.getByText(c["v02.problem.versionRefreshed"], { exact: true }),
  ).toBeVisible();
  await expect(editor).toHaveText(source, { useInnerText: true });
  await page
    .getByRole("button", { name: c["v02.problem.submit"], exact: true })
    .click();
  await expect(page).toHaveURL(/\/problems\/detail\?problemId=/);
  await expect(editor).toHaveText(source, { useInnerText: true });
  await page
    .getByRole("tabpanel", { name: c["v02.problem.results"], exact: true })
    .getByRole("link", { name: c["v02.openSubmission"], exact: true })
    .click();
  await expect(page).toHaveURL(/\/submissions\/detail\?submissionId=/);
  const writes = (await upstreamCalls()).filter(
    (call) => call.path === "/api/v1/submissions" && call.method === "POST",
  );
  expect(writes).toHaveLength(2);
  expect(writes[0].headers["idempotency-key"]).not.toBe(
    writes[1].headers["idempotency-key"],
  );
  expect(writes.map((call) => call.body?.sourceCode)).toEqual([source, source]);
  expect(writes[0].body?.problemRef).not.toEqual(writes[1].body?.problemRef);
});

test("V0.2: uncertain submission retry reuses its key and preserves exact code", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await configureUpstream({ v02LoseResponse: true });
  await page.goto(detail);
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  await editor.fill(v02SourceCode);
  await page
    .getByRole("button", { name: "Submit for judging", exact: true })
    .click();
  const retry = page.getByRole("button", {
    name: "Retry this submission",
    exact: true,
  });
  await expect(retry).toBeEnabled();
  const notice = page.locator('[data-slot="toast"][data-type="error"]');
  await expect(notice).toBeVisible();
  await notice
    .getByLabel(translate("en", "ui.dismiss"), { exact: true })
    .click();
  await expect(notice).toBeHidden();
  await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
  await retry.click();
  await expect(page).toHaveURL(/\/problems\/detail\?problemId=/);
  await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
  await page
    .getByRole("tabpanel", {
      name: copy("en")["v02.problem.results"],
      exact: true,
    })
    .getByRole("link", { name: copy("en")["v02.openSubmission"], exact: true })
    .click();
  await expect(page).toHaveURL(/\/submissions\/detail\?submissionId=/);
  const writes = (await upstreamCalls()).filter(
    (call) => call.path === "/api/v1/submissions" && call.method === "POST",
  );
  expect(writes).toHaveLength(2);
  expect(writes[0].headers["idempotency-key"]).toBe(
    writes[1].headers["idempotency-key"],
  );
  expect(writes[0].body).toEqual(writes[1].body);
  expect(writes.map((call) => call.body?.sourceCode)).toEqual([
    v02SourceCode,
    v02SourceCode,
  ]);
});

test("V0.2: blank and UTF-8 oversized editor source are accessible and never submitted", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.goto(detail);
  const c = copy("en");
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  const submit = page.getByRole("button", {
    name: "Submit for judging",
    exact: true,
  });
  await editor.fill(" \n\t ");
  await submit.click();
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText(c["v02.problem.blankSource"], { exact: true }),
  ).toBeVisible();
  await editor.fill("中".repeat(Math.floor(SOURCE_BYTE_LIMIT / 3) + 1));
  await expect(submit).toBeDisabled();
  await expect(
    page.getByText(c["v02.problem.largeSource"], { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).filter(
      (call) => call.path === "/api/v1/submissions" && call.method === "POST",
    ),
  ).toHaveLength(0);
  await editor.focus();
  await page.keyboard.press("Tab");
  await expect(editor).not.toBeFocused();
});

test("V0.2: external plan only offers local-safe navigation and completion follows actual CF synchronization", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.goto("/learning-recommendations");
  const external = page.locator("article").filter({ hasText: "A Small Step" });
  await external
    .getByRole("button", { name: "Add to training plan", exact: true })
    .click();
  const original = external.getByRole("link", {
    name: "Open original Codeforces problem",
    exact: true,
  });
  await expect(original).toHaveAttribute(
    "href",
    "https://codeforces.com/problemset/problem/4/A",
  );
  // External destinations are inspected, never followed by the loopback-only fixture.
  const records = pageEnvelope(trainingRecordSchema).parse(
    await (
      await page.request.get("/api/v1/me/training-records?source=EXTERNAL")
    ).json(),
  );
  const record = records.data.find(
    (item) => item.problem.title === "A Small Step",
  )!;
  expect(record.status).toBe("PLANNED");
  await page.goto(
    `/training/detail?trainingRecordId=${record.trainingRecordId}`,
  );
  await expect(
    page.getByText(copy("en")["v02.externalCompletionNote"], { exact: true }),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).some(
      (call) =>
        call.path.includes("/analysis") && call.path.includes("/submissions/"),
    ),
  ).toBe(false);
  const readProfile = async () =>
    envelope(learningProfileSchema).parse(
      await (
        await page.request.get("/api/v1/me/learning-profile/latest")
      ).json(),
    ).data;
  const readHistory = async () =>
    pageEnvelope(learningProfileSchema).parse(
      await (
        await page.request.get("/api/v1/me/learning-profile/history")
      ).json(),
    );
  const previousProfile = await readProfile();
  const previousHistory = await readHistory();
  const previousBatch = envelope(learningRecommendationBatchSchema).parse(
    await (await page.request.get("/api/v1/me/recommendations/latest")).json(),
  ).data;
  // The fixture's next synchronized CF facts contain the external AC.
  await configureUpstream({ v02ExternalAccepted: true }, true);
  const syncResponse = await page.request.post(
    "/api/v1/oj-accounts/9007199254740993/sync",
    { headers: { Origin: origin } },
  );
  const sync = (await syncResponse.json()) as { data: { jobId: string } };
  await expect
    .poll(async () => {
      const result = (await (
        await page.request.get(`/api/v1/sync-jobs/${sync.data.jobId}`)
      ).json()) as { data: { status: string } };
      return result.data.status;
    })
    .toMatch(/^(SUCCESS|PARTIAL)$/);
  await page.reload();
  await expect(
    page.getByText(copy("en")["v02.status.COMPLETED"], { exact: true }),
  ).toBeVisible();
  const currentProfile = await readProfile();
  expect(currentProfile.stale).toBe(false);
  expect(currentProfile.snapshotId).not.toBe(previousProfile.snapshotId);
  expect(currentProfile.sources.externalSubmissionCount).toBe(
    previousProfile.sources.externalSubmissionCount + 1,
  );
  expect(currentProfile.summary.acceptedSubmissionCount).toBe(
    previousProfile.summary.acceptedSubmissionCount + 1,
  );
  const currentHistory = await readHistory();
  expect(currentHistory.meta.total).toBe(previousHistory.meta.total + 1);
  expect(currentHistory.data[0].snapshotId).toBe(currentProfile.snapshotId);
  const frozenProfile = envelope(learningProfileSchema).parse(
    await (
      await page.request.get(
        `/api/v1/me/learning-profile/${previousProfile.snapshotId}`,
      )
    ).json(),
  ).data;
  expect(frozenProfile).toEqual(previousProfile);
  const frozenBatch = envelope(learningRecommendationBatchSchema).parse(
    await (
      await page.request.get(
        `/api/v1/me/recommendations/${previousBatch.batchId}`,
      )
    ).json(),
  ).data;
  const frozenItems = (batch: typeof previousBatch) =>
    batch.recommendations.map(
      ({ problem, rank, score, reason, reasonCode }) => ({
        problem,
        rank,
        score,
        reason,
        reasonCode,
      }),
    );
  expect(frozenItems(frozenBatch)).toEqual(frozenItems(previousBatch));
  expect(
    frozenBatch.recommendations.find(
      (item) => item.problem.title === "A Small Step",
    )?.solvedSinceGeneration,
  ).toBe(true);
  // Reads never schedule another computation or replace frozen history.
  expect((await readProfile()).snapshotId).toBe(currentProfile.snapshotId);
  expect((await readHistory()).meta.total).toBe(currentHistory.meta.total);
  expect(
    (await upstreamCalls()).some(
      (call) =>
        call.method === "POST" &&
        call.path === "/api/v1/me/learning-profile/rebuild",
    ),
  ).toBe(false);
});

async function fits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}

test("V0.2: analysis retry shows a new task and retained evidence without changing AC", async ({
  page,
  context,
}) => {
  test.setTimeout(45_000);
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await configureUpstream({
    v02AnalysisStatus: "PARTIAL",
    v02KeepAnalysis: true,
  });
  await page.goto("/submissions/detail?submissionId=9007199254748002");
  await expect(page.getByText("AC · Accepted", { exact: true })).toBeVisible();
  await expect(page.getByText("Lizard", { exact: true })).toBeVisible();
  const retryResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/analysis/retry") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Retry code analysis", exact: true })
    .click();
  const response = await retryResponse;
  expect([200, 202]).toContain(response.status());
  await expect(
    page.getByText(copy("en")["v02.analysisPreviousEvidence"], { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Lizard", { exact: true })).toBeVisible();
  await expect(page.getByText("AC · Accepted", { exact: true })).toBeVisible();
  await configureUpstream(
    { v02KeepAnalysis: false, v02AnalysisRetryStatus: "SUCCEEDED" },
    true,
  );
  await expect(
    page.getByText(copy("en")["v02.analysis.SUCCEEDED"], { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(copy("en")["v02.analysisPreviousEvidence"], { exact: true }),
  ).toHaveCount(0);
  expect(
    (await upstreamCalls()).filter(
      (call) => call.path.endsWith("/analysis/retry") && call.method === "POST",
    ),
  ).toHaveLength(1);
});

test("V0.2: learning window and recommendation scope controls read all combinations without generating", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.goto("/learning-profile");
  const windows = page.getByRole("group", {
    name: translate("en", "v.window"),
    exact: true,
  });
  for (let index = 0; index < 4; index++) {
    const button = windows.getByRole("button").nth(index);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Learning overview", exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () =>
        (await upstreamCalls()).some((call) =>
          call.path.includes(
            `/me/learning-profile/latest?window=${["7D", "30D", "365D", "ALL"][index]}`,
          ),
        ),
      )
      .toBe(true);
  }
  const history = page
    .getByRole("link", { name: "View snapshot", exact: true })
    .first();
  await expect(history).toHaveAttribute("href", /snapshotId=/);
  await history.click();
  await expect(page).toHaveURL(/\/learning-profile\?snapshotId=/);
  await page.goto("/learning-recommendations");
  const sources = page.getByRole("group", {
    name: "Problem source",
    exact: true,
  });
  const modes = page.getByRole("group", {
    name: "Recommendation mode",
    exact: true,
  });
  for (let source = 0; source < 3; source++) {
    await sources.getByRole("button").nth(source).click();
    for (let mode = 0; mode < 3; mode++) {
      const option = modes.getByRole("button").nth(mode);
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("heading", {
          name: "Recommendation batch",
          exact: true,
        }),
      ).toBeVisible();
      await expect
        .poll(async () =>
          (await upstreamCalls()).some((call) => {
            const url = new URL(call.path, origin);
            return (
              url.pathname === "/api/v1/me/recommendations/latest" &&
              url.searchParams.get("source") ===
                ["ALL", "PLATFORM", "EXTERNAL"][source] &&
              url.searchParams.get("mode") ===
                ["LEVEL", "WEAKNESS", "HYBRID"][mode]
            );
          }),
        )
        .toBe(true);
    }
  }
  await expect(
    page
      .getByRole("link", { name: "View recommendation batch", exact: true })
      .first(),
  ).toHaveAttribute("href", /batchId=/);
  const calls = await upstreamCalls();
  expect(calls.filter((call) => call.method === "POST")).toHaveLength(0);
  for (const window of ["7D", "30D", "365D", "ALL"])
    expect(
      calls.some((call) =>
        call.path.includes(`/me/learning-profile/latest?window=${window}`),
      ),
    ).toBe(true);
  for (const source of ["ALL", "PLATFORM", "EXTERNAL"])
    for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"])
      expect(
        calls.some((call) => {
          const url = new URL(call.path, origin);
          return (
            url.pathname === "/api/v1/me/recommendations/latest" &&
            url.searchParams.get("source") === source &&
            url.searchParams.get("mode") === mode
          );
        }),
      ).toBe(true);
});

test("V0.2: training filters send source/status and inclusive/exclusive UTC bounds", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.goto("/training");
  await page
    .getByLabel("Problem source", { exact: true })
    .selectOption("PLATFORM");
  await page
    .getByLabel("Training status", { exact: true })
    .selectOption("COMPLETED");
  await page.getByRole("button", { name: "Date range", exact: true }).click();
  await page
    .getByLabel("Submission start (UTC, inclusive)", { exact: true })
    .fill("2026-01-01");
  await page
    .getByLabel("Submission end (UTC, exclusive)", { exact: true })
    .fill("2026-12-31");
  const response = page.waitForResponse(
    (reply) =>
      new URL(reply.url()).pathname === "/api/v1/me/training-records" &&
      new URL(reply.url()).searchParams.get("status") === "COMPLETED",
  );
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  const url = new URL((await response).url());
  expect(url.searchParams.get("source")).toBe("PLATFORM");
  expect(url.searchParams.get("page")).toBe("1");
  expect(url.searchParams.get("from")).toMatch(
    /^2026-01-01T00:00:00(?:\.000)?Z$/,
  );
  expect(url.searchParams.get("to")).toMatch(
    /^2026-12-31T00:00:00(?:\.000)?Z$/,
  );
});
