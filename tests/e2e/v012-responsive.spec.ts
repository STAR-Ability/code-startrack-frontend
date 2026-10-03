import { test, expect, configureUpstream } from "./fixtures";
const owner = "00000000-0000-4000-8000-000000001001";
const peer = "00000000-0000-4000-8000-000000001101";
for (const locale of ["zh-CN", "en"]) {
  test(`${locale}: collaboration pages fit desktop, laptop, tablet, mobile and enlarged text`, async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    await configureUpstream({ coach: true });
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    for (const route of [
      "/teams",
      `/teams/detail?teamId=${owner}`,
      `/teams/member?teamId=${owner}&memberPublicId=${peer}&view=basicTraining`,
      `/teams/member?teamId=${owner}&memberPublicId=${peer}&view=abilityProfile`,
      "/privacy",
      "/notifications",
      "/coach",
      "/coach/teams",
      "/coach/teams/create",
      "/security/coach",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: locale === "en" ? "Refresh data" : "刷新数据",
          exact: true,
        }),
      ).toBeEnabled();
      for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await expect
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            { message: `${route} overflow at ${width}px (${locale})` },
          )
          .toBe(true);
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          { message: `${route} overflow with enlarged text (${locale})` },
        )
        .toBe(true);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
    }
  });
}
