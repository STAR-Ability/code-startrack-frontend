import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

test.beforeEach(() => configureUpstream());

test("latest recommendations distinguish loading from settled empty and keep cached results during refresh", async ({
  page,
}) => {
  await page.clock.install();
  let releaseEmpty!: () => void;
  const heldEmpty = new Promise<void>((resolve) => {
    releaseEmpty = resolve;
  });
  await page.route("**/recommendations/latest?mode=HYBRID", async (route) => {
    await heldEmpty;
    await route.fulfill({
      json: { data: null, requestId: "00000000-0000-4000-8000-000000000900" },
    });
  });
  const initialRead = page.waitForRequest(
    "**/recommendations/latest?mode=HYBRID",
  );
  await page.goto("/practice");
  await initialRead;
  const recommendations = page.getByRole("region", {
    name: "为你推荐",
    exact: true,
  });
  await expect(recommendations).toHaveAttribute("aria-busy", "true");
  await expect(recommendations.getByRole("status")).toBeVisible();
  await expect(
    recommendations.locator('[data-slot="skeleton"]').first(),
  ).toBeVisible();
  await expect(
    recommendations.getByText("尚未生成推荐", { exact: true }),
  ).toHaveCount(0);
  await expect(
    recommendations.getByText("暂无数据", { exact: true }),
  ).toHaveCount(0);

  releaseEmpty();
  await expect(recommendations).toHaveAttribute("aria-busy", "false");
  await expect(
    recommendations.getByText("尚未生成推荐", { exact: true }),
  ).toBeVisible();

  let releasePopulated!: () => void;
  const heldPopulated = new Promise<void>((resolve) => {
    releasePopulated = resolve;
  });
  await page.route("**/recommendations/latest?mode=WEAKNESS", async (route) => {
    await heldPopulated;
    await route.continue();
  });
  const populatedRead = page.waitForRequest(
    "**/recommendations/latest?mode=WEAKNESS",
  );
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await populatedRead;
  await expect(recommendations.getByRole("status")).toBeVisible();
  await expect(
    recommendations.getByText("尚未生成推荐", { exact: true }),
  ).toHaveCount(0);
  releasePopulated();
  const firstProblem = recommendations.getByRole("heading", {
    name: /A Small Step/,
  });
  await expect(firstProblem).toBeVisible();

  // Return to a stale mode while holding its refetch. Its known result remains
  // readable instead of reverting to an initial placeholder or empty state.
  await page.clock.fastForward(31_000);
  await page.getByRole("button", { name: "综合推荐", exact: true }).click();
  await expect(
    recommendations.getByText("尚未生成推荐", { exact: true }),
  ).toBeVisible();
  await page.unroute("**/recommendations/latest?mode=WEAKNESS");
  let releaseRefresh!: () => void;
  const heldRefresh = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  await page.route("**/recommendations/latest?mode=WEAKNESS", async (route) => {
    await heldRefresh;
    await route.continue();
  });
  const refresh = page.waitForRequest(
    "**/recommendations/latest?mode=WEAKNESS",
  );
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await refresh;
  await expect(recommendations).toHaveAttribute("aria-busy", "true");
  await expect(firstProblem).toBeVisible();
  await expect(
    recommendations.getByText("尚未生成推荐", { exact: true }),
  ).toHaveCount(0);
  releaseRefresh();
  await expect(recommendations).toHaveAttribute("aria-busy", "false");
  await expect(firstProblem).toBeVisible();
  expect((await upstreamCalls()).every((call) => call.method === "GET")).toBe(
    true,
  );
});
