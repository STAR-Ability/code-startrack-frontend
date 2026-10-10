import { v02Problems, v02SourceCode } from "../../src/lib/demo/v02-fixtures";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const origin = "http://127.0.0.1:3100";
const detail = `/problems/detail?problemId=${v02Problems[0].problemRef.problemId}`;
test.beforeEach(() => configureUpstream());

test("coding workspace: genuine editor, keyboard splitters and console controls preserve code", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(detail);
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  async function replaceSource(source: string) {
    await editor.press("ControlOrMeta+A");
    await page.keyboard.insertText(source);
    await expect(editor).toHaveText(source, { useInnerText: true });
  }
  await replaceSource(v02SourceCode);
  await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
  await editor.press("ControlOrMeta+End");
  await editor.pressSequentially("// local draft marker");
  await expect(editor).toContainText("local draft marker");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).not.toContainText("local draft marker");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor).toContainText("local draft marker");
  await replaceSource(v02SourceCode);
  const compiler = page.getByRole("combobox", {
    name: "Compiler language",
    exact: true,
  });
  await compiler.selectOption("c11");
  await expect(page.locator(".cm-placeholder")).toBeVisible();
  await replaceSource("int main() { return 0; }\n");
  await compiler.selectOption("cpp17");
  await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
  await page.getByRole("button", { name: "Use plain text editor" }).click();
  await expect(editor).toHaveValue(v02SourceCode);
  await page.getByRole("button", { name: "Use code editor" }).click();
  await expect(editor).toHaveAttribute("contenteditable", "true");
  const split = page.getByRole("separator", {
    name: "Resize problem and editor panels",
  });
  await split.focus();
  await page.keyboard.press("ArrowRight");
  await expect(split).toHaveAttribute("aria-valuenow", "45");
  await page.keyboard.press("Home");
  await expect(split).toHaveAttribute("aria-valuenow", "30");
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(split).toHaveAttribute("aria-valuenow", "43");
  const consoleSplit = page.getByRole("separator", {
    name: "Resize test panel",
  });
  await consoleSplit.focus();
  await page.keyboard.press("ArrowUp");
  await expect(consoleSplit).toHaveAttribute("aria-valuenow", "160");
  await page.setViewportSize({ width: 1440, height: 900 });
  await consoleSplit.focus();
  await page.keyboard.press("End");
  await expect(consoleSplit).toHaveAttribute(
    "aria-valuenow",
    (await consoleSplit.getAttribute("aria-valuemax"))!,
  );
  const pane = await page.locator(".workspace-code").boundingBox();
  const actions = await page.locator(".editor-actionbar").boundingBox();
  expect(actions!.y + actions!.height).toBeLessThanOrEqual(
    pane!.y + pane!.height + 1,
  );
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Expand test panel" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Expand test panel" }).click();
  await page.getByRole("button", { name: "Collapse test panel" }).click();
  await expect(
    page.getByRole("region", { name: "Tests & results · Sample input" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Expand test panel" }).click();
  await expect(
    page.getByRole("region", { name: "Tests & results · Sample input" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Focus editor", exact: true }).click();
  await expect(page.locator(".workspace-statement")).toBeHidden();
  await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
  await page
    .getByRole("button", { name: "Show problem statement", exact: true })
    .click();
  await split.focus();
  await page.keyboard.press("Enter");
  await expect(editor).toBeFocused();
  await page
    .getByRole("button", { name: "Show problem statement", exact: true })
    .click();
  await page.getByRole("button", { name: "Find in code", exact: true }).click();
  await expect(page.locator('.cm-search input[name="search"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Editor settings", exact: true })
    .click();
  await page.getByLabel("Wrap long lines", { exact: true }).check();
  await page.getByLabel("Editor font size", { exact: true }).selectOption("16");
  await page.keyboard.press("Escape");
  await expect(page.locator(".cm-content")).toHaveClass(/cm-lineWrapping/);
  await expect(
    page.getByRole("button", { name: "Run code", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Online execution is not available yet. You can submit your solution for judging.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("Not run", { exact: true })).toBeVisible();
  expect(
    (await upstreamCalls()).filter((call) => call.method === "POST"),
  ).toHaveLength(0);
});

test("coding workspace: rapid compiler changes isolate genuine keyboard edits and keep plain mode", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.goto(detail);
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  const cppSource = "int cppDraft = 1;\n";
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(cppSource);
  const compiler = page.getByRole("combobox", {
    name: "Compiler language",
    exact: true,
  });
  await compiler.selectOption("c11");
  await editor.focus();
  await page.keyboard.insertText("c11 marker");
  await expect(editor).toHaveText("c11 marker", { useInnerText: true });
  await compiler.selectOption("cpp17");
  await expect(editor).toHaveText(cppSource, { useInnerText: true });
  await page.getByRole("button", { name: "Use plain text editor" }).click();
  await expect(editor).toHaveValue(cppSource);
  await compiler.selectOption("c11");
  await expect(editor).toHaveValue("c11 marker");
  await expect(editor).toHaveJSProperty("tagName", "TEXTAREA");
});

test("coding workspace: source remains visible and editable at 320 pixels with 200 percent text", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(detail);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.scrollIntoViewIfNeeded();
  const canvas = page.locator(".code-editor-canvas");
  expect((await canvas.boundingBox())!.height).toBeGreaterThanOrEqual(100);
  await editor.click();
  await page.keyboard.insertText("// readable source");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveText("// readable source", { useInnerText: true });
  await page.getByRole("button", { name: "Use plain text editor" }).click();
  await expect(editor).toHaveValue("// readable source");
  expect((await canvas.boundingBox())!.height).toBeGreaterThanOrEqual(100);
  await editor.click();
  await expect(editor).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("coding workspace: plain source fits the maximized console and retains its final caret", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: origin },
  ]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(detail);
  await page.getByRole("button", { name: "Use plain text editor" }).click();
  const editor = page.getByRole("textbox", {
    name: "Source code",
    exact: true,
  });
  const source = Array.from(
    { length: 90 },
    (_, index) => `// line ${index + 1}`,
  ).join("\n");
  await editor.fill(source);
  await page.getByRole("separator", { name: "Resize test panel" }).focus();
  await page.keyboard.press("End");
  await editor.focus();
  await editor.press("ControlOrMeta+End");
  await editor.pressSequentially("// final caret");
  await expect(editor).toHaveValue(`${source}// final caret`);
  const input = await editor.boundingBox();
  const canvas = await page.locator(".code-editor-canvas").boundingBox();
  expect(input!.y).toBeGreaterThanOrEqual(canvas!.y - 1);
  expect(input!.y + input!.height).toBeLessThanOrEqual(
    canvas!.y + canvas!.height + 1,
  );
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
});

for (const locale of ["en", "zh-CN"] as const) {
  test(`coding workspace ${locale}: responsive panels and advanced search remain accessible`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "codestartrack_locale", value: locale, url: origin },
    ]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/problems");
    const more = page.getByRole("button", {
      name: locale === "en" ? "More filters" : "更多筛选",
      exact: true,
    });
    const tag = page.getByLabel(
      locale === "en" ? "Tag (exact match)" : "标签（精确匹配）",
      { exact: true },
    );
    await expect(tag).toBeHidden();
    await more.click();
    await expect(tag).toBeVisible();
    await more.click();
    await page.goto(detail);
    const editor = page.getByRole("textbox", {
      name: locale === "en" ? "Source code" : "源码",
      exact: true,
    });
    await expect(editor).toHaveAttribute("contenteditable", "true");
    await editor.fill(v02SourceCode);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(editor).toHaveText(v02SourceCode, { useInnerText: true });
      await expect(
        page.getByRole("button", {
          name: locale === "en" ? "Submit for judging" : "提交判题",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(
      (await upstreamCalls()).filter((call) => call.method === "POST"),
    ).toHaveLength(0);
  });
}
