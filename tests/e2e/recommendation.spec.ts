import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
test.beforeEach(() => configureUpstream());
test("mode and history reads do not generate; failed generation retries with one key", async ({
  page,
}) => {
  await configureUpstream({ failGenerationOnce: true });
  await page.goto("/practice");
  await expect(
    page.getByRole("heading", { name: /A Small Step/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "弱项训练", exact: true }).click();
  await expect
    .poll(async () =>
      (await upstreamCalls()).some((call) =>
        call.path.endsWith("/recommendations/latest?mode=WEAKNESS"),
      ),
    )
    .toBe(true);
  expect(
    (await upstreamCalls()).filter((call) => call.method === "POST"),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "生成推荐", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "ALGORITHM_TIMEOUT",
  );
  const generatedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/recommendations/generate") &&
      response.ok(),
  );
  await page.getByRole("button", { name: "重试", exact: true }).click();
  const { data: generatedBatch } = await (await generatedResponse).json();
  await expect(page.locator('[data-slot="alert"]')).toHaveCount(0);
  const writes = (await upstreamCalls()).filter((call) =>
    call.path.endsWith("/recommendations/generate"),
  );
  expect(writes).toHaveLength(2);
  expect(writes[0].headers["idempotency-key"]).toBe(
    writes[1].headers["idempotency-key"],
  );
  expect(writes[0].body).toEqual({ mode: "WEAKNESS", limit: 10 });
  // History refetches independently after generation. Select the returned batch
  // only once its row appears, rather than racing the old first history row.
  await page
    .locator(
      `[data-recommendation-history-row]:has(time[datetime="${generatedBatch.generatedAt}"])`,
    )
    .getByRole("button", { name: "查看批次", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "返回最新结果" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /A New Step/ })).toBeVisible();
  await page.getByRole("button", { name: "查看生成时的画像" }).click();
  await expect(
    page.getByRole("dialog", { name: "查看生成时的画像" }),
  ).toContainText("六维能力");
});
test("successful zero-candidate batch is an empty state, not an error", async ({
  page,
}) => {
  await configureUpstream({ emptyCandidates: true });
  await page.goto("/practice");
  await expect(page.getByText("当前难度范围暂无候选题")).toBeVisible();
  await expect(page.locator('[data-slot="alert"]')).toHaveCount(0);
});
test("historical completed recommendations retain their original rank and source snapshot", async ({
  page,
}) => {
  await configureUpstream({ completed: true });
  await page.goto("/practice");
  await page
    .getByRole("button", { name: "查看批次", exact: true })
    .last()
    .click();
  await expect(page.getByText("已完成", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "#1 One More Step" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "查看生成时的画像" }).click();
  await expect(page.getByRole("dialog")).toContainText("暂无训练证据");
});
