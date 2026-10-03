import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";
const owner = "00000000-0000-4000-8000-000000001001";
const member = "00000000-0000-4000-8000-000000001002";

test("coach ownership stays specific to each team and team switching withdraws cached content", async ({
  page,
}) => {
  await configureUpstream({ scenario: "coach-owner-member" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/teams");
  await page.getByRole("link", { name: "星轨训练队", exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "团队工作区导航" })
      .getByRole("link", { name: "团队设置", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "训练工作区", exact: true })
    .getByRole("link", { name: "我的团队", exact: true })
    .click();
  await configureUpstream({ delayMs: 500 }, true);
  await page.getByRole("link", { name: "算法研习社", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`teamId=${member}`));
  await expect(
    page.getByRole("heading", { name: "星轨训练队", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "算法研习社", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "团队工作区导航" })
      .getByRole("link", { name: "团队设置", exact: true }),
  ).toHaveCount(0);
});

test("restricted member data hides entry points and direct links remain server denied", async ({
  page,
}) => {
  await configureUpstream({ scenario: "member-private" });
  await page.goto(`/teams/detail?teamId=${owner}&tab=members`);
  const peer = page.locator("main article").filter({
    has: page.getByRole("heading", { name: "训练伙伴", exact: true }),
  });
  await expect(peer.getByRole("link")).toHaveCount(0);
  await expect(peer).toContainText("成员未向你开放此数据");
  await page.goto(
    `/teams/member?teamId=${owner}&memberPublicId=00000000-0000-4000-8000-000000001101&view=basicTraining`,
  );
  await expect(
    page.getByText("成员未向你开放此数据", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "基础训练数据", exact: true }),
  ).toHaveCount(0);
});

test("invitation resend rate limit keeps the pending invitation and blocks duplicate requests", async ({
  page,
}) => {
  await configureUpstream({ coach: true, inviteRateLimited: true });
  await page.goto(`/teams/detail?teamId=${owner}&tab=invitations`);
  const row = page.locator("main article").filter({
    has: page.getByRole("heading", {
      name: "new-member@example.test",
      exact: true,
    }),
  });
  const resend = row.getByRole("button", { name: "重发邀请", exact: true });
  await resend.click();
  await expect(resend).toBeDisabled();
  await expect(row).toContainText("待处理");
  await expect(row.getByText(/秒后可重试/)).toBeVisible();
  expect(
    (await upstreamCalls()).filter(
      (call) => call.method === "POST" && call.path.endsWith("/resend"),
    ),
  ).toHaveLength(1);
});

test("processed application conflict refreshes its queue and provides specific recovery", async ({
  page,
}) => {
  await configureUpstream({
    coach: true,
    errorResource: "/approve",
    errorStatus: 409,
    errorCode: "APPLICATION_ALREADY_PROCESSED",
  });
  await page.goto(`/teams/detail?teamId=${owner}&tab=applications`);
  await page.getByRole("button", { name: "通过", exact: true }).click();
  await expect(
    page.getByText("申请已处理，列表已刷新。", { exact: true }).first(),
  ).toBeVisible();
  expect(
    (await upstreamCalls()).filter(
      (call) =>
        call.method === "GET" &&
        call.path.includes(`/teams/${owner}/applications`),
    ).length,
  ).toBeGreaterThanOrEqual(2);
});
