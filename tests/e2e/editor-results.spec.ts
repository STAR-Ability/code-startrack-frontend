import type { BrowserContext, Page } from "@playwright/test";
import { envelope } from "../../src/lib/api/schemas";
import { submissionViewSchema } from "../../src/lib/api/v02-schemas";
import { v02Problems, v02SourceCode } from "../../src/lib/demo/v02-fixtures";
import { translate, type Locale } from "../../src/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const origin = "http://127.0.0.1:3100";
const detail = `/problems/detail?problemId=${v02Problems[0].problemRef.problemId}`;
const source = `  // 保留 UTF-8 与空白\n${v02SourceCode}\n  `;
const editor = (page: Page, locale: Locale = "en") =>
  page.getByRole("textbox", {
    name: translate(locale, "v02.problem.sourceCode"),
    exact: true,
  });
const results = (page: Page, locale: Locale = "en") =>
  page.getByRole("tabpanel", {
    name: translate(locale, "v02.problem.results"),
    exact: true,
  });
const submissions = async () =>
  (await upstreamCalls()).filter(
    (call) => call.method === "POST" && call.path === "/api/v1/submissions",
  );

async function openEditor(
  page: Page,
  context: BrowserContext,
  locale: Locale = "en",
) {
  await context.addCookies([
    { name: "codestartrack_locale", value: locale, url: origin },
  ]);
  await page.goto(detail);
  await expect(editor(page, locale)).toHaveAttribute("contenteditable", "true");
  await editor(page, locale).fill(source);
}

async function submit(page: Page, locale: Locale = "en", keyboard = false) {
  const response = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/submissions" &&
      response.request().method() === "POST",
  );
  const button = page.getByRole("button", {
    name: translate(locale, "v02.problem.submit"),
    exact: true,
  });
  if (keyboard) {
    await button.focus();
    await expect(button).toBeFocused();
    await button.press("Enter");
  } else await button.click();
  const accepted = await response;
  expect(accepted.status()).toBe(202);
  return envelope(submissionViewSchema).parse(await accepted.json()).data;
}

async function assertInlineReadsOnly(submissionId: string, writes = 1) {
  const calls = await upstreamCalls();
  expect(await submissions()).toHaveLength(writes);
  expect(
    calls.filter((call) =>
      new RegExp(
        `/submissions/${submissionId}/(?:source|analysis)(?:/|$)`,
      ).test(call.path),
    ),
  ).toHaveLength(0);
  expect(calls.filter((call) => call.method === "POST")).toHaveLength(writes);
}

test.beforeEach(() => configureUpstream({ scenario: "v02-new-learner" }));

test("editor results: polling survives samples and collapsed console; later request failure labels the previous WA", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  await configureUpstream({
    scenario: "v02-new-learner",
    v02KeepJudge: true,
    v02JudgeVerdict: "WA",
  });
  await openEditor(page, context);
  const accepted = await submit(page);
  await expect(page).toHaveURL(detail);
  const panel = results(page);
  await expect(
    panel.getByText(translate("en", "v02.judge.QUEUED"), { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", {
      name: translate("en", "v02.openSubmission"),
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `/submissions/detail?submissionId=${accepted.submissionId}`,
  );

  await page
    .getByRole("tab", {
      name: translate("en", "v02.problem.samples"),
      exact: true,
    })
    .click();
  await expect(panel).toBeHidden();
  const changed = `${source}// editable while judging`;
  await editor(page).press("ControlOrMeta+End");
  await page.keyboard.insertText("// editable while judging");
  await expect(editor(page)).toHaveText(changed, { useInnerText: true });
  await page
    .getByRole("separator", {
      name: translate("en", "v02.problem.resizeResults"),
      exact: true,
    })
    .press("Enter");
  const expand = page.getByRole("button", {
    name: translate("en", "v02.problem.expandConsole"),
    exact: true,
  });
  await expect(expand).toBeFocused();
  const readsBefore = (await upstreamCalls()).filter(
    (call) =>
      call.method === "GET" &&
      call.path === `/api/v1/submissions/${accepted.submissionId}`,
  ).length;
  await expect
    .poll(
      async () =>
        (await upstreamCalls()).filter(
          (call) =>
            call.method === "GET" &&
            call.path === `/api/v1/submissions/${accepted.submissionId}`,
        ).length,
      { timeout: 10_000 },
    )
    .toBeGreaterThan(readsBefore);
  const judged = page.waitForResponse(
    async (response) =>
      new URL(response.url()).pathname ===
        `/api/v1/submissions/${accepted.submissionId}` &&
      response.request().method() === "GET" &&
      response.ok() &&
      (await response.json()).data.judgeStatus === "COMPLETED",
  );
  await configureUpstream({ v02KeepJudge: false }, true);
  await judged;
  await expect(expand).toBeFocused();
  await expand.press("Enter");
  const samples = page.getByRole("tab", {
    name: translate("en", "v02.problem.samples"),
    exact: true,
  });
  await samples.focus();
  await samples.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByText(`WA · ${translate("en", "v02.verdict.WA")}`, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(panel.getByText("0 / 12", { exact: true })).toBeVisible();
  await expect(
    panel.getByText(translate("en", "v02.problem.draftChanged"), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(editor(page)).toHaveText(changed, { useInnerText: true });

  await configureUpstream(
    { errorPath: "/submissions", errorStatus: 503 },
    true,
  );
  const rejected = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/submissions" &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", {
      name: translate("en", "v02.problem.submit"),
      exact: true,
    })
    .click();
  expect((await rejected).status()).toBe(503);
  await expect(
    panel.getByText(translate("en", "v02.problem.previousResult"), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    panel.getByText(`WA · ${translate("en", "v02.verdict.WA")}`, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", {
      name: translate("en", "v02.openSubmission"),
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `/submissions/detail?submissionId=${accepted.submissionId}`,
  );
  await expect(
    page.getByText(translate("en", "v02.problem.submitFailure"), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(editor(page)).toHaveText(changed, { useInnerText: true });
  await expect(page).toHaveURL(detail);
  const writes = await submissions();
  expect(writes.map((call) => call.body?.sourceCode)).toEqual([
    source,
    changed,
  ]);
  expect(writes[0].headers["idempotency-key"]).not.toBe(
    writes[1].headers["idempotency-key"],
  );
  await assertInlineReadsOnly(accepted.submissionId, 2);
});

for (const verdict of ["CE", "IE"] as const) {
  test(`editor results: ${verdict} exposes supported diagnostics without opening analysis or private source`, async ({
    page,
    context,
  }) => {
    await configureUpstream({
      scenario: "v02-new-learner",
      v02JudgeVerdict: verdict,
    });
    await openEditor(page, context);
    const accepted = await submit(page);
    const panel = results(page);
    await expect(
      panel.getByText(
        `${verdict} · ${translate("en", `v02.verdict.${verdict}`)}`,
        { exact: true },
      ),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(detail);
    await expect(editor(page)).toHaveText(source, { useInnerText: true });
    if (verdict === "CE") {
      await expect(
        panel.getByText(translate("en", "v02.judge.COMPLETED"), {
          exact: true,
        }),
      ).toBeVisible();
      const log = panel.getByLabel(translate("en", "v02.compileLog"), {
        exact: true,
      });
      await expect(log).toBeVisible();
      await expect(log).toHaveText("main.cpp:3: expected ';' before return");
      const disclosure = panel.getByRole("button", {
        name: translate("en", "v02.compileLog"),
        exact: true,
      });
      await disclosure.focus();
      await disclosure.press("Enter");
      await expect(log).toBeHidden();
      await disclosure.press("Enter");
      await expect(log).toBeVisible();
    } else {
      await expect(
        panel.getByText(translate("en", "v02.judge.FAILED"), { exact: true }),
      ).toBeVisible();
      await expect(panel.getByRole("alert")).toContainText(
        "JUDGE_EXECUTION_FAILED",
      );
      await expect(
        panel.getByText("SANDBOX_UNAVAILABLE", { exact: true }),
      ).toBeVisible();
      await expect(
        panel.getByText(translate("en", "v02.judgeFailureNote"), {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        panel.getByText(`WA · ${translate("en", "v02.verdict.WA")}`, {
          exact: true,
        }),
      ).toHaveCount(0);
    }
    await assertInlineReadsOnly(accepted.submissionId);
  });
}

test("editor results: denied polling hides seeded status, identity and detail link while preserving the editable draft", async ({
  page,
  context,
}) => {
  await configureUpstream({ scenario: "v02-new-learner", v02KeepJudge: true });
  await openEditor(page, context);
  const accepted = await submit(page);
  const panel = results(page);
  await expect(
    panel.getByText(accepted.submissionId, { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", {
      name: translate("en", "v02.openSubmission"),
      exact: true,
    }),
  ).toBeVisible();
  const denial = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        `/api/v1/submissions/${accepted.submissionId}` &&
      response.status() === 403,
  );
  await configureUpstream(
    {
      errorPath: `/submissions/${accepted.submissionId}`,
      errorStatus: 403,
      errorCode: "FORBIDDEN",
    },
    true,
  );
  await denial;
  await expect(panel.getByRole("alert")).toBeVisible();
  for (const text of [
    accepted.submissionId,
    accepted.problem.problemRef.problemVersionId!,
    "cpp17",
    translate("en", "v02.judge.QUEUED"),
    translate("en", "v02.timeUsage"),
    translate("en", "v02.memoryUsage"),
  ]) {
    await expect(panel.getByText(text, { exact: true })).toHaveCount(0);
  }
  await expect(
    panel.getByRole("link", {
      name: translate("en", "v02.openSubmission"),
      exact: true,
    }),
  ).toHaveCount(0);
  await editor(page).press("ControlOrMeta+End");
  await page.keyboard.insertText("// still editable");
  await expect(editor(page)).toHaveText(`${source}// still editable`, {
    useInnerText: true,
  });
  await expect(page).toHaveURL(detail);
  await assertInlineReadsOnly(accepted.submissionId);
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`editor results ${locale}: 320px at 200 percent text keeps keyboard tabs, resizing, source and explicit detail reachable`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 320, height: 1000 });
    await openEditor(page, context, locale);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const accepted = await submit(page, locale, true);
    const panel = results(page, locale);
    await expect(
      panel.getByText(`AC · ${translate(locale, "v02.verdict.AC")}`, {
        exact: true,
      }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(detail);
    await expect(editor(page, locale)).toHaveText(source, {
      useInnerText: true,
    });
    const resultTab = page.getByRole("tab", {
      name: translate(locale, "v02.problem.results"),
      exact: true,
    });
    const sampleTab = page.getByRole("tab", {
      name: translate(locale, "v02.problem.samples"),
      exact: true,
    });
    for (const tab of [sampleTab, resultTab]) {
      await tab.focus();
      await expect(tab).toBeFocused();
      const labelGeometry = await tab.evaluate((element) => {
        const header = element.closest(".console-header");
        if (!header) throw new Error("Missing console header");
        const failures = [];
        const bounds = [
          {
            name: "tab button",
            rect: element.getBoundingClientRect(),
            clipsX: true,
            clipsY: true,
          },
          {
            name: "console header",
            rect: header.getBoundingClientRect(),
            clipsX: true,
            clipsY: true,
          },
        ];
        for (
          let ancestor = element.parentElement;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const style = getComputedStyle(ancestor);
          if (ancestor.scrollLeft !== 0)
            failures.push(
              `Tab focus scrolls ${ancestor.tagName}.${ancestor.className} horizontally`,
            );
          const clipsX = /^(hidden|clip|auto|scroll)$/.test(style.overflowX);
          const clipsY = /^(hidden|clip)$/.test(style.overflowY);
          if (clipsX || clipsY)
            bounds.push({
              name: `${ancestor.tagName}.${ancestor.className}`,
              rect: ancestor.getBoundingClientRect(),
              clipsX,
              clipsY,
            });
        }
        const text = [];
        let lineCount = 0;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent?.trim()) continue;
          text.push(node.textContent);
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (!rect.width || !rect.height) continue;
            lineCount++;
            for (const bound of bounds) {
              if (
                bound.clipsX &&
                (rect.left < bound.rect.left - 1 ||
                  rect.right > bound.rect.right + 1)
              )
                failures.push(
                  `Label line ${lineCount} clips horizontally in ${bound.name}`,
                );
              if (
                bound.clipsY &&
                (rect.top < bound.rect.top - 1 ||
                  rect.bottom > bound.rect.bottom + 1)
              )
                failures.push(
                  `Label line ${lineCount} clips vertically in ${bound.name}`,
                );
            }
          }
        }
        return {
          text: text.join("").trim(),
          lineCount,
          failures,
          buttonLeft: element.getBoundingClientRect().left,
          buttonRight: element.getBoundingClientRect().right,
          headerLeft: header.getBoundingClientRect().left,
          headerRight: header.getBoundingClientRect().right,
        };
      });
      expect(labelGeometry.text).not.toBe("");
      expect(labelGeometry.lineCount).toBeGreaterThan(0);
      expect(
        labelGeometry.failures,
        `Entire tab label: ${labelGeometry.text}`,
      ).toEqual([]);
      expect(labelGeometry.buttonLeft).toBeGreaterThanOrEqual(0);
      expect(labelGeometry.buttonRight).toBeLessThanOrEqual(320);
      expect(labelGeometry.headerLeft).toBeGreaterThanOrEqual(0);
      expect(labelGeometry.headerRight).toBeLessThanOrEqual(320);
    }
    await resultTab.focus();
    await resultTab.press("Home");
    await expect(sampleTab).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(sampleTab).toHaveAttribute("aria-selected", "true");
    await expect(panel).toBeHidden();
    await sampleTab.press("ArrowRight");
    await expect(resultTab).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(resultTab).toHaveAttribute("aria-selected", "true");
    const resizer = page.getByRole("separator", {
      name: translate(locale, "v02.problem.resizeResults"),
      exact: true,
    });
    await resizer.focus();
    await resizer.press("End");
    await expect
      .poll(
        async () =>
          (await page.locator(".code-editor-canvas").boundingBox())?.height ??
          0,
      )
      .toBeGreaterThanOrEqual(100);
    await expect
      .poll(async () =>
        page
          .locator(".console-body")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      )
      .toBe(true);
    const memory = panel.getByText(/1 MiB \(/);
    await memory.scrollIntoViewIfNeeded();
    const memoryBox = await memory.boundingBox();
    const consoleBox = await page.locator(".console-body").boundingBox();
    expect(memoryBox!.x).toBeGreaterThanOrEqual(consoleBox!.x - 1);
    expect(memoryBox!.x + memoryBox!.width).toBeLessThanOrEqual(
      consoleBox!.x + consoleBox!.width + 1,
    );
    await resizer.press("Enter");
    const expand = page.getByRole("button", {
      name: translate(locale, "v02.problem.expandConsole"),
      exact: true,
    });
    await expect(expand).toBeFocused();
    await expect(panel).toBeHidden();
    await expand.press("Enter");
    await expect(panel).toBeVisible();
    await expect(editor(page, locale)).toHaveText(source, {
      useInnerText: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await assertInlineReadsOnly(accepted.submissionId);
    const link = panel.getByRole("link", {
      name: translate(locale, "v02.openSubmission"),
      exact: true,
    });
    await link.focus();
    await expect(link).toBeFocused();
    const linkBox = await link.boundingBox();
    expect(linkBox!.x).toBeGreaterThanOrEqual(0);
    expect(linkBox!.x + linkBox!.width).toBeLessThanOrEqual(320);
    expect(linkBox!.y).toBeGreaterThanOrEqual(0);
    expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(1000);
    await link.press("Enter");
    await expect(page).toHaveURL(
      `/submissions/detail?submissionId=${accepted.submissionId}`,
    );
    await expect
      .poll(async () =>
        (await upstreamCalls()).some(
          (call) =>
            call.method === "GET" &&
            call.path ===
              `/api/v1/submissions/${accepted.submissionId}/analysis`,
        ),
      )
      .toBe(true);
    expect(
      (await upstreamCalls()).filter(
        (call) =>
          call.path === `/api/v1/submissions/${accepted.submissionId}/source`,
      ),
    ).toHaveLength(0);
    expect(await submissions()).toHaveLength(1);
  });
}
