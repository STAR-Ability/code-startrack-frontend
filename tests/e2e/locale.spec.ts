import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("static pages restore the saved locale after hydration without API traffic", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("codeStartrack | Programming practice");
  const preference = (await context.cookies()).find(
    (cookie) => cookie.name === "codestartrack_locale",
  );
  expect(preference?.value).toBe("en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await upstreamCalls()).toEqual([]);
});
test("blocked locale persistence is announced and client navigation retains the choice", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
      set: () => {},
    }),
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("could not save");
  await page
    .getByRole("link", { name: "View read-only demo", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Training workspace demo" }),
  ).toBeVisible();
});

test("ability radar retains drawn marks and scores through locale and viewport changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/demo");
  const radar = page.locator('[role="img"][data-palette="ability"]');
  const scores = [
    "20 / 100",
    "30 / 100",
    "40 / 100",
    "50 / 100",
    "60 / 100",
    "70 / 100",
  ];
  const labels = {
    "zh-CN": ["基础实现", "算法", "数据结构", "动态规划", "图论", "数学"],
    en: [
      "Implementation",
      "Algorithms",
      "Data structures",
      "Dynamic programming",
      "Graphs",
      "Math",
    ],
  };
  for (const { locale, width } of [
    { locale: "zh-CN", width: 390 },
    { locale: "en", width: 320 },
    { locale: "zh-CN", width: 1440 },
    { locale: "en", width: 820 },
    { locale: "zh-CN", width: 390 },
  ] as const) {
    await page
      .getByRole("button", {
        name: locale === "en" ? "English" : "简体中文",
        exact: true,
      })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => radar.locator("svg path").count())
      .toBeGreaterThan(6);
    // Responsive labels can wrap into multiple SVG text nodes.
    for (const label of labels[locale]) {
      await expect
        .poll(async () =>
          (await radar.locator("svg text").allTextContents())
            .join("")
            .replace(/\s/g, ""),
        )
        .toContain(label.replace(/\s/g, ""));
    }
    await expect
      .poll(() =>
        radar.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return [...element.querySelectorAll("svg text")].every((text) => {
            const label = text.getBoundingClientRect();
            return (
              label.left >= bounds.left &&
              label.right <= bounds.right &&
              label.top >= bounds.top &&
              label.bottom <= bounds.bottom
            );
          });
        }),
      )
      .toBe(true);
    await expect(page.locator(".analysis-dimension-row dd")).toHaveText(scores);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  expect(await upstreamCalls()).toEqual([]);
});
