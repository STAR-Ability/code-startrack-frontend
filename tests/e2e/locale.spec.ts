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
