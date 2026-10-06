import type { Response } from "@playwright/test";
import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("a failed chart chunk retries locally while keeping exact profile evidence", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "codestartrack_locale", value: "en", url: "http://127.0.0.1:3100" },
  ]);

  // Discover the emitted library URL rather than couple the fault injection to
  // a build hash. A separate document keeps the tested module loader cold.
  const probe = await context.newPage();
  const scripts: Response[] = [];
  probe.on("response", (response) => {
    const request = response.request();
    if (
      request.resourceType() === "script" &&
      new URL(response.url()).pathname.startsWith("/_next/static/chunks/")
    ) {
      scripts.push(response);
    }
  });
  await probe.goto("/profile");
  await expect(
    probe
      .locator("[data-analysis-ability]")
      .getByRole("img", { name: translate("en", "v.dimensions"), exact: true })
      .locator("svg"),
  ).toBeVisible();
  let chartChunk = "";
  for (const response of scripts) {
    const source = await response.text();
    if (
      source.includes("_echarts_instance_") &&
      source.includes("renderToSVGString")
    ) {
      chartChunk = response.url();
      break;
    }
  }
  expect(
    chartChunk,
    "The probe must identify the emitted ECharts library chunk",
  ).not.toBe("");
  await probe.close();

  let blocked = true;
  let chunkRequests = 0;
  await page.route(chartChunk, (route) => {
    chunkRequests += 1;
    return blocked ? route.abort("failed") : route.continue();
  });
  await page.goto("/profile");
  const ability = page.locator("[data-analysis-ability]");
  const frame = ability.locator(".chart-frame");
  await expect(frame).toHaveAttribute("data-chart-state", "unavailable");
  await expect(frame.getByRole("alert")).toContainText(
    translate("en", "chart.unavailable"),
  );
  const values = await ability.locator("dl dd").allTextContents();
  expect(values).toHaveLength(6);
  expect(values.every((value) => /\d.*\/ 100$/.test(value))).toBe(true);
  const requestsBeforeRetry = chunkRequests;
  expect(requestsBeforeRetry).toBeGreaterThan(0);

  blocked = false;
  await frame
    .getByRole("button", { name: translate("en", "chart.retry") })
    .click();
  await expect(frame).toHaveAttribute("data-chart-state", "ready");
  await expect(
    ability
      .getByRole("img", { name: translate("en", "v.dimensions"), exact: true })
      .locator("svg"),
  ).toBeVisible();
  expect(
    chunkRequests,
    "Retry must fetch the failed chunk again",
  ).toBeGreaterThan(requestsBeforeRetry);
  await expect(ability.locator("dl dd")).toHaveText(values);
});
