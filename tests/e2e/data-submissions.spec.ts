import type { Locator, Page } from "@playwright/test";
import type { SubmissionDto } from "../../src/lib/api/schemas";
import { formatTimestamp, translate } from "../../src/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

async function openSubmissions(page: Page, locale: "zh-CN" | "en") {
  await page.goto("/data");
  const loaded = page.waitForResponse((response) =>
    /\/api\/v1\/oj-accounts\/[^/]+\/submissions$/.test(
      new URL(response.url()).pathname,
    ),
  );
  await page
    .getByRole("main")
    .getByRole("button", {
      name: translate(locale, "v.submissions"),
      exact: true,
    })
    .click();
  return ((await (await loaded).json()) as { data: SubmissionDto[] }).data;
}

async function expectWholeWord(locator: Locator, word: string) {
  const geometry = await locator.evaluate((element, expectedWord) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let content = "";
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? "";
      nodes.push({
        node: node as Text,
        start: content.length,
        end: content.length + text.length,
      });
      content += text;
    }
    const start = content.indexOf(expectedWord);
    const end = start + expectedWord.length;
    const first = nodes.find((item) => item.start <= start && item.end > start);
    const last = nodes.find((item) => item.start < end && item.end >= end);
    const frame = element.getBoundingClientRect();
    if (start < 0 || !first || !last) return { rects: [], frame };
    const range = document.createRange();
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, end - last.start);
    return {
      rects: [...range.getClientRects()]
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        })),
      frame: { left: frame.left, right: frame.right },
    };
  }, word);
  expect(geometry.rects.length).toBeGreaterThan(0);
  for (const rect of geometry.rects) {
    expect(Math.abs(rect.top - geometry.rects[0].top)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(rect.bottom - geometry.rects[0].bottom),
    ).toBeLessThanOrEqual(1);
    expect(rect.left).toBeGreaterThanOrEqual(geometry.frame.left - 1);
    expect(rect.right).toBeLessThanOrEqual(geometry.frame.right + 1);
  }
}

for (const locale of ["zh-CN", "en"] as const) {
  test(`desktop ${locale} submissions align at least three comparable rows beneath compact filters`, async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop comparison is covered by the desktop project");
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.setViewportSize({ width: 1280, height: 900 });
    const items = await openSubmissions(page, locale);
    const table = page.getByRole("table", {
      name: translate(locale, "v.submissions"),
    });
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader")).toHaveCount(6);
    const primary = table.locator("tr[data-submission-primary]");
    await expect(primary).toHaveCount(items.length);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(
      await table
        .locator("tbody")
        .evaluateAll((rows) =>
          rows.map((row) => row.getAttribute("data-submission-id")),
        ),
    ).toEqual(items.map((item) => item.submissionId));
    const toolbar = page.locator(".submission-filter-fields");
    const controls = await toolbar.locator('[data-slot="field"]').all();
    const positions = await Promise.all(
      controls.map((control) => control.boundingBox()),
    );
    expect(positions.every((position) => position !== null)).toBe(true);
    const top = Math.min(...positions.map((position) => position!.y));
    const bottom = Math.max(
      ...positions.map((position) => position!.y + position!.height),
    );
    expect(bottom - top).toBeLessThan(160);

    await table.evaluate((element) =>
      element.scrollIntoView({ block: "start" }),
    );
    for (const row of (await primary.all()).slice(0, 3)) {
      const box = (await row.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(900);
    }
    for (const [index, item] of items.entries()) {
      const row = primary.nth(index);
      await expect(row.locator("time")).toHaveText(
        formatTimestamp(item.submittedAt, locale),
      );
      await expect(row.locator("time")).toHaveAttribute(
        "datetime",
        item.submittedAt,
      );
      await expect(row.locator("td").nth(2)).toHaveText(
        String(item.timeMs ?? translate(locale, "v.unavailable")),
      );
      await expect(row.locator("td").nth(3)).toHaveText(
        item.memoryBytes === null
          ? translate(locale, "v.unavailable")
          : (item.memoryBytes / 1048576).toFixed(2),
      );
    }
    const firstDetails = table
      .locator("tbody")
      .first()
      .getByRole("button", {
        name: translate(locale, "v.submissionDetailsFor", {
          problem:
            items[0].problem.title ?? items[0].problem.externalProblemKey,
          id: items[0].externalSubmissionId,
        }),
        exact: true,
      });
    await firstDetails.focus();
    await page.keyboard.press("Enter");
    await expect(firstDetails).toHaveAttribute("aria-expanded", "true");
    await expect(table.locator("tbody").first()).toContainText(
      `ID: ${items[0].submissionId} · CF: ${items[0].externalSubmissionId}`,
    );
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });

  test(`narrow ${locale} submissions keep complete keyboard details and fit enlarged text`, async ({
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
    await page.setViewportSize({ width: 390, height: 844 });
    const items = await openSubmissions(page, locale);
    const list = page.locator(".submission-mobile-list");
    await expect(list).toBeVisible();
    await expect(page.locator(".submission-table")).toBeHidden();
    const record = list.locator("li").first();
    const details = record.getByRole("button", {
      name: translate(locale, "v.submissionDetailsFor", {
        problem: items[0].problem.title ?? items[0].problem.externalProblemKey,
        id: items[0].externalSubmissionId,
      }),
      exact: true,
    });
    await expect(record.getByRole("heading")).toHaveText(
      items[0].problem.title ?? items[0].problem.externalProblemKey,
    );
    await expect(record.locator("time")).toHaveText(
      formatTimestamp(items[0].submittedAt, locale),
    );
    await details.focus();
    await page.keyboard.press("Space");
    await expect(details).toHaveAttribute("aria-expanded", "true");
    await expect(
      record.getByText(
        `ID: ${items[0].submissionId} · CF: ${items[0].externalSubmissionId}`,
      ),
    ).toBeVisible();
    await expect(
      record.getByText(translate(locale, "v.time"), { exact: true }),
    ).toBeVisible();
    await expect(
      record.getByText(translate(locale, "v.memory"), { exact: true }),
    ).toBeVisible();
    if (items[0].teamName || items[0].memberHandles.length > 1)
      await expect(record).toContainText(
        `${translate(locale, "v.team")}: ${items[0].teamName} · ${items[0].memberHandles.join(", ")}`,
      );
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const fontSize of ["100%", "200%"]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size;
        }, fontSize);
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
        for (const target of [
          record,
          details,
          record.locator('[data-slot="collapsible-content"]'),
        ])
          await expect
            .poll(() =>
              target.evaluate(
                (element) => element.scrollWidth <= element.clientWidth + 1,
              ),
            )
            .toBe(true);
        if (locale === "en" && width === 320 && fontSize === "200%")
          await expectWholeWord(details, "Submission");
      }
    }
    await details.focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("aria-expanded", "false");
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });

  test(`${locale} submission filters focus associated field errors before a corrected read`, async ({
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
    const requests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/submissions"))
        requests.push(request.url());
    });
    const items = await openSubmissions(page, locale);
    const problemId = page.getByLabel(translate(locale, "v.problemId"), {
      exact: true,
    });
    const from = page.getByLabel(translate(locale, "v.from"), { exact: true });
    const to = page.getByLabel(translate(locale, "v.to"), { exact: true });
    const apply = page.getByRole("button", {
      name: translate(locale, "v.filter"),
      exact: true,
    });

    await problemId.fill("1.5");
    await apply.click();
    await expect(problemId).toBeFocused();
    await expect(problemId).toHaveAttribute("aria-invalid", "true");
    await expect(problemId).toHaveAccessibleDescription(
      translate(locale, "v.invalidProblemId"),
    );
    await expect(from).toHaveAttribute("aria-invalid", "false");
    expect(requests).toHaveLength(1);

    const fromValue = "2026-10-07T09:00";
    const toValue = "2026-10-08T09:00";
    await problemId.fill(items[0].problem.problemId);
    await from.fill(fromValue);
    await to.fill(fromValue);
    await apply.click();
    await expect(from).toBeFocused();
    await expect(from).toHaveAttribute("aria-invalid", "true");
    await expect(from).toHaveAccessibleDescription(
      translate(locale, "v.invalidDates"),
    );
    await expect(problemId).toHaveAttribute("aria-invalid", "false");
    await expect(to).toHaveAttribute("aria-invalid", "false");
    expect(requests).toHaveLength(1);

    await to.fill(toValue);
    await expect(from).toHaveAttribute("aria-invalid", "false");
    const applied = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname.endsWith("/submissions") &&
        url.searchParams.get("problemId") === items[0].problem.problemId
      );
    });
    await apply.click();
    const response = await applied;
    const expectedDates = await page.evaluate(
      ({ from, to }) => ({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      }),
      { from: fromValue, to: toValue },
    );
    const params = new URL(response.url()).searchParams;
    expect(params.get("from")).toBe(expectedDates.from);
    expect(params.get("to")).toBe(expectedDates.to);
    expect(params.get("page")).toBe("1");
    expect(requests).toHaveLength(2);
    expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
      true,
    );
  });

  for (const width of [320, 390]) {
    test(`${width}px ${locale} problem Sheet keeps useful disclosure text at 200% text and reduced motion`, async ({
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
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/data");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const opener = page
        .getByRole("button", {
          name: translate(locale, "v.problemSubmissions"),
          exact: true,
        })
        .first();
      const loaded = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          /\/oj-accounts\/[^/]+\/submissions$/.test(url.pathname) &&
          url.searchParams.has("problemId")
        );
      });
      await opener.focus();
      await opener.click();
      const response = await loaded;
      const items = ((await response.json()) as { data: SubmissionDto[] }).data;
      expect(items.length).toBeGreaterThan(0);
      const first = items[0];
      expect(new URL(response.url()).searchParams.get("problemId")).toBe(
        first.problem.problemId,
      );
      const sheet = page.getByRole("dialog");
      const list = sheet.locator(".submission-mobile-list");
      const record = list.locator("li").first();
      const details = record.getByRole("button", {
        name: translate(locale, "v.submissionDetailsFor", {
          problem: first.problem.title ?? first.problem.externalProblemKey,
          id: first.externalSubmissionId,
        }),
        exact: true,
      });
      await expect(list).toBeVisible();
      await expect(sheet.locator(".submission-table")).toBeHidden();
      await expect(sheet.locator(".submission-filter-fields")).toHaveCount(0);
      await expect(details).toHaveText(
        translate(locale, "v.submissionDetails"),
      );

      const labelGeometry = await details.evaluate((element) => {
        const textNode = [...element.childNodes].find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!textNode) throw new Error("Missing disclosure label text");
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const text = range.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          heightInLines: text.height / Number.parseFloat(style.lineHeight),
          widthInCharacters: text.width / Number.parseFloat(style.fontSize),
        };
      });
      expect(labelGeometry.heightInLines).toBeLessThanOrEqual(3);
      expect(labelGeometry.widthInCharacters).toBeGreaterThanOrEqual(3.9);

      await details.focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("aria-expanded", "true");
      await expect(record).toHaveAttribute(
        "data-submission-id",
        first.submissionId,
      );
      await expect(record.getByRole("heading")).toHaveText(
        first.problem.title ?? first.problem.externalProblemKey,
      );
      await expect(record.locator("time")).toHaveText(
        formatTimestamp(first.submittedAt, locale),
      );
      await expect(record.locator("time")).toHaveAttribute(
        "datetime",
        first.submittedAt,
      );
      await expect(record.locator('[data-slot="badge"]')).toHaveText(
        first.verdict === "PENDING"
          ? translate(locale, "v.pending")
          : first.verdict,
      );
      for (const [label, value] of [
        [
          "v.language",
          first.programmingLanguage ?? translate(locale, "v.unavailable"),
        ],
        ["v.time", String(first.timeMs ?? translate(locale, "v.unavailable"))],
        [
          "v.memory",
          first.memoryBytes === null
            ? translate(locale, "v.unavailable")
            : (first.memoryBytes / 1048576).toFixed(2),
        ],
      ] as const) {
        await expect(
          record
            .getByText(translate(locale, label), { exact: true })
            .locator("..")
            .locator("dd"),
        ).toHaveText(value);
      }
      await expect(
        record.getByText(
          `ID: ${first.submissionId} · CF: ${first.externalSubmissionId}`,
          { exact: true },
        ),
      ).toBeVisible();
      if (first.teamName || first.memberHandles.length > 1) {
        await expect(
          record.getByText(
            `${translate(locale, "v.team")}: ${first.teamName ?? ""} · ${first.memberHandles.join(", ")}`,
            { exact: true },
          ),
        ).toBeVisible();
      }
      for (const target of [
        sheet,
        list,
        record,
        details,
        record.locator('[data-slot="collapsible-content"]'),
      ]) {
        await expect
          .poll(() =>
            target.evaluate(
              (element) => element.scrollWidth <= element.clientWidth + 1,
            ),
          )
          .toBe(true);
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
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(opener).toBeFocused();
      expect(
        (await upstreamCalls()).every((call) => call.method === "GET"),
      ).toBe(true);
    });
  }
}

test("English desktop null submission measurements remain whole words within their cells", async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop measurement is covered by the desktop project");
  await context.addCookies([
    {
      name: "codestartrack_locale",
      value: "en",
      url: "http://127.0.0.1:3100",
    },
  ]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/v1/oj-accounts/*/submissions?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { data: SubmissionDto[] };
    expect(body.data.length).toBeGreaterThan(0);
    body.data[0] = { ...body.data[0], timeMs: null, memoryBytes: null };
    await route.fulfill({ response, json: body });
  });
  const items = await openSubmissions(page, "en");
  expect(items[0].timeMs).toBeNull();
  expect(items[0].memoryBytes).toBeNull();
  const table = page.getByRole("table", { name: "Submissions", exact: true });
  await expect(table).toBeVisible();
  const record = table.locator("tr[data-submission-primary]").first();
  for (const column of [2, 3]) {
    const cell = record.locator("td").nth(column);
    await expect(cell).toHaveText("Unavailable");
    await expectWholeWord(cell, "Unavailable");
  }
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});

test("a desktop problem Sheet uses the narrow layout and keeps its problem-scoped read", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/data");
  const loaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      /\/oj-accounts\/[^/]+\/submissions$/.test(url.pathname) &&
      url.searchParams.has("problemId")
    );
  });
  await page
    .getByRole("button", { name: "题目提交记录", exact: true })
    .first()
    .click();
  const response = await loaded;
  const body = (await response.json()) as { data: SubmissionDto[] };
  expect(body.data.length).toBeGreaterThan(0);
  expect(new URL(response.url()).searchParams.get("problemId")).toBe(
    body.data[0].problem.problemId,
  );
  const sheet = page.getByRole("dialog");
  await expect(sheet.locator(".submission-mobile-list")).toBeVisible();
  await expect(sheet.locator(".submission-table")).toBeHidden();
  await expect(sheet.locator(".submission-filter-fields")).toHaveCount(0);
  const trigger = sheet
    .locator(".submission-mobile-list li")
    .first()
    .getByRole("button", {
      name: translate("zh-CN", "v.submissionDetailsFor", {
        problem:
          body.data[0].problem.title ?? body.data[0].problem.externalProblemKey,
        id: body.data[0].externalSubmissionId,
      }),
      exact: true,
    });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});

test("submission filters and pagination preserve account read parameters and reset the page on Apply", async ({
  page,
}) => {
  await page.route("**/api/v1/oj-accounts/*/submissions?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as {
      data: SubmissionDto[];
      meta: { page: number; pageSize: number; total: number; hasNext: boolean };
    };
    const requested = Number(
      new URL(route.request().url()).searchParams.get("page"),
    );
    body.meta = {
      ...body.meta,
      page: requested,
      total: 10,
      hasNext: requested === 1,
    };
    await route.fulfill({ response, json: body });
  });
  const items = await openSubmissions(page, "zh-CN");
  const problemId = items[0].problem.problemId;
  const from = "2026-09-01T09:00";
  const to = "2026-10-02T18:00";
  await page
    .getByLabel(translate("zh-CN", "v.verdict"), { exact: true })
    .selectOption("ACCEPTED");
  await page.getByLabel("题目 ID", { exact: true }).fill(problemId);
  await page
    .getByLabel(translate("zh-CN", "v.from"), { exact: true })
    .fill(from);
  await page.getByLabel(translate("zh-CN", "v.to"), { exact: true }).fill(to);
  const applied = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/submissions") &&
      url.searchParams.get("verdict") === "ACCEPTED" &&
      url.searchParams.get("page") === "1"
    );
  });
  await page.getByRole("button", { name: "应用筛选", exact: true }).click();
  const response = await applied;
  const expectedDates = await page.evaluate(
    ({ from, to }) => ({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    }),
    { from, to },
  );
  const filters = new URL(response.url()).searchParams;
  expect(response.request().method()).toBe("GET");
  expect(filters.get("problemId")).toBe(problemId);
  expect(filters.get("from")).toBe(expectedDates.from);
  expect(filters.get("to")).toBe(expectedDates.to);
  const next = page.waitForResponse(
    (result) =>
      new URL(result.url()).pathname.endsWith("/submissions") &&
      new URL(result.url()).searchParams.get("page") === "2",
  );
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  expect((await next).request().method()).toBe("GET");
  await page
    .getByLabel(translate("zh-CN", "v.verdict"), { exact: true })
    .selectOption("WRONG_ANSWER");
  const changed = page.waitForResponse(
    (result) =>
      new URL(result.url()).pathname.endsWith("/submissions") &&
      new URL(result.url()).searchParams.get("verdict") === "WRONG_ANSWER",
  );
  await page.getByRole("button", { name: "应用筛选", exact: true }).click();
  expect(new URL((await changed).url()).searchParams.get("page")).toBe("1");
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});
