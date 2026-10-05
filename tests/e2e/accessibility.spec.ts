import type { Page } from "@playwright/test";
import type { UserDto } from "../../src/lib/api/schemas";
import type { TeamMemberDto } from "../../src/lib/api/v012-schemas";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
for (const locale of ["zh-CN", "en"]) {
  test(`${locale}: keyboard entry, workspace and forms fit narrow screens and text zoom`, async ({
    page,
    context,
  }, info) => {
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", {
      name: locale === "en" ? "Skip to main content" : "跳至主要内容",
    });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await narrow(page);
    for (const route of [
      "/dashboard",
      "/data",
      "/analysis",
      "/profile",
      "/practice",
      "/accounts",
      "/security",
      "/security/password",
      "/security/email",
      "/login",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (route !== "/login") {
        // Measure the populated workspace as well as its initial shell.
        await expect(
          page.getByRole("button", {
            name: locale === "en" ? "Refresh data" : "刷新数据",
            exact: true,
          }),
        ).toBeEnabled();
      }
      await narrow(page);
    }
    await page.screenshot({
      path: info.outputPath(`login-${locale}.png`),
      fullPage: true,
    });
  });

  test(`${locale}: long names remain readable in the workspace and keyboard ownership select`, async ({
    page,
    context,
  }) => {
    const teamId = "00000000-0000-4000-8000-000000001001";
    const longName = "LearnerWithAnExtendedDisplayNameWithoutSpaces".repeat(2);
    await configureUpstream({ coach: true });
    await context.addCookies([
      {
        name: "codestartrack_locale",
        value: locale,
        url: "http://127.0.0.1:3100",
      },
    ]);
    await page.route("**/api/v1/me", async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { data: UserDto };
      body.data.displayName = longName;
      await route.fulfill({ response, json: body });
    });
    await page.route(`**/api/v1/teams/${teamId}/members?*`, async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { data: TeamMemberDto[] };
      for (const member of body.data) {
        if (member.role !== "OWNER") member.user.displayName = longName;
      }
      await route.fulfill({ response, json: body });
    });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/teams/detail?teamId=${teamId}&tab=settings`);
    const transfer = page.getByRole("button", {
      name: locale === "en" ? "Transfer ownership" : "转让负责人",
      exact: true,
    });
    await expect(transfer).toBeEnabled();
    for (const scale of ["100%", "200%"]) {
      await page.evaluate((value) => {
        document.documentElement.style.fontSize = value;
      }, scale);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await transfer.click();
      const dialog = page.getByRole("alertdialog");
      const select = dialog.getByRole("combobox");
      await select.focus();
      await page.keyboard.press("ArrowDown");
      const option = page.getByRole("option", { name: longName, exact: true });
      await expect(option).toBeVisible();
      await expect
        .poll(() =>
          option.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            return (
              element.scrollWidth <= element.clientWidth &&
              bounds.left >= 0 &&
              bounds.right <= innerWidth
            );
          }),
        )
        .toBe(true);
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("listbox")).toHaveCount(0);
      await expect(select).toBeFocused();
      await expect(select).toContainText(longName);
      await expect
        .poll(() =>
          select.locator('[data-slot="select-value"]').evaluate((element) => {
            return (
              element.scrollWidth <= element.clientWidth &&
              element.scrollHeight <= element.clientHeight
            );
          }),
        )
        .toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(transfer).toBeFocused();
    }
    expect(
      (await upstreamCalls()).filter(
        (call) => !["GET", "HEAD"].includes(call.method),
      ),
    ).toHaveLength(0);
  });
}
async function narrow(page: Page) {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const scale of ["100%", "200%"]) {
    await page.evaluate((value) => {
      document.documentElement.style.fontSize = value;
    }, scale);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const active = page.locator('.mobile-navigation [aria-current="page"]');
    if (await active.count()) {
      await expect
        .poll(() =>
          active.evaluate((element) => {
            const item = element.getBoundingClientRect();
            const frame = element.closest("nav")!.getBoundingClientRect();
            return item.left >= frame.left - 1 && item.right <= frame.right + 1;
          }),
        )
        .toBe(true);
    }
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
}
