import { expect, test, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream({}));

test("switches locale in place and persists server-rendered language without API traffic", async ({
  page,
  context,
}) => {
  const reads: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      reads.push(request.url());
  });
  await page.goto("/?view=demo#main-content");
  const english = page.getByRole("button", { name: "English", exact: true });
  await english.focus();
  await page.keyboard.press("Space");
  await expect(english).toBeFocused();
  await expect(page).toHaveURL(/\/\?view=demo#main-content$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("codeStartrack | Read-only Demo");
  await expect(
    page.getByRole("heading", {
      name: /Every line of code,\s*a step in your story\./,
    }),
  ).toBeVisible();
  const preference = (await context.cookies()).find(
    (cookie) => cookie.name === "codestartrack_locale",
  );
  expect(preference).toMatchObject({
    value: "en",
    path: "/",
    sameSite: "Lax",
    httpOnly: false,
  });
  const response = await page.reload();
  expect(await response?.text()).toContain('lang="en"');
  await expect(page).toHaveTitle("codeStartrack | Read-only Demo");
  expect(reads).toEqual([]);
});

test("invalid cookies default to Chinese and blocked persistence is announced", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "fr", url: "http://127.0.0.1:3100" },
  ]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.evaluate(() =>
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
      set: () => {},
    }),
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("status")).toContainText("could not save");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("memory-only locale remains consistent through client navigation", async ({
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
  await page.getByRole("link", { name: "View read-only demo" }).click();
  await expect(
    page.getByRole("link", { name: "Open on Codeforces" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Practice | codeStartrack");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Explore a demo learner/,
  );
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect(page).toHaveTitle("codeStartrack | Read-only Demo");
});
