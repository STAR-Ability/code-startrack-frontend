import { afterEach, describe, expect, it, vi } from "vitest";
import { v012 } from "./v012";
import {
  v012Analysis,
  v012Report,
  v012TeamBatch,
  v012Teams,
  v012Job,
} from "../demo/v012-fixtures";
import { fixtureUuid, demoSubmissions, demoUser } from "../demo/fixtures";
import {
  personalReportSchema,
  sharedProfileSchema,
  sharedTrainingSchema,
  teamAnalysisSchema,
  userAnalysisSchema,
  aiJobSchema,
  teamDetailSchema,
} from "./v012-schemas";
import { aiPollDelay } from "@/components/workspace/use-ai-job";
import { keys } from "../query/keys";
import { notificationRoute } from "../ui/notification-route";
import { v012Notifications, v012TeamAnalysis } from "../demo/v012-fixtures";
afterEach(() => vi.unstubAllGlobals());
function response(data: unknown) {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ data, requestId: fixtureUuid(9999) })),
    );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
describe("V0.12 public contract", () => {
  it("reads deployed count and wrapped member submissions", async () => {
    response({ count: 3 });
    expect(await v012.unreadCount()).toEqual({ count: 3 });
    response({ unreadCount: 3 });
    await expect(v012.unreadCount()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    const submission = demoSubmissions()[0];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                sourceAccount: {
                  accountId: submission.accountId,
                  platform: "codeforces",
                  username: "TrainingPeer",
                },
                submission,
              },
            ],
            meta: { page: 1, pageSize: 20, total: 1, hasNext: false },
            requestId: fixtureUuid(9999),
          }),
        ),
      ),
    );
    const page = await v012.memberSubmissions(
      v012Teams[0].teamId,
      fixtureUuid(1101),
      { page: 1 },
    );
    expect(page.data[0].submission).toEqual(submission);
    expect(page.data[0].sourceAccount.username).toBe("TrainingPeer");
  });
  it("accepts complete user profiles, frozen reports and split minimal shared DTOs", () => {
    const profile = v012Analysis();
    expect(userAnalysisSchema.parse(profile)).toEqual(profile);
    expect(personalReportSchema.parse(v012Report())).toEqual(v012Report());
    const training = sharedTrainingSchema.parse(profile),
      ability = sharedProfileSchema.parse(profile);
    expect(training).not.toHaveProperty("dimensions");
    expect(training).not.toHaveProperty("sourceAccountIds");
    expect(ability).not.toHaveProperty("summary");
    expect(ability).not.toHaveProperty("ratingAccounts");
    expect(
      personalReportSchema.safeParse({
        ...v012Report(),
        recentTrainingSnapshot: {
          ...v012Report().recentTrainingSnapshot,
          period: { start: null, end: profile.dataCutoffAt },
        },
      }).success,
    ).toBe(false);
  });
  it("rejects an account profile or sync job in place of user analysis / AI job", () => {
    expect(
      userAnalysisSchema.safeParse({ ...v012Analysis(), publicId: undefined })
        .success,
    ).toBe(false);
    expect(
      aiJobSchema.safeParse({ ...v012Job(), status: "PARTIAL" }).success,
    ).toBe(false);
  });
  it("sends user aggregate windows without an account dependency", async () => {
    const profile = v012Analysis();
    const fetch = response(profile);
    await v012.userAnalysis(profile.publicId, "ALL");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/me/analysis/latest?window=ALL",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });
  it("rejects late/wrong user and team/audience results", async () => {
    response(v012Analysis());
    await expect(v012.userAnalysis(fixtureUuid(999))).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    response(v012TeamBatch());
    await expect(
      v012.teamRecommendations(v012Teams[1].teamId, "COACH", "HYBRID"),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    response(v012TeamBatch());
    await expect(
      v012.teamRecommendations(v012Teams[0].teamId, "MEMBER", "HYBRID"),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("never sends audience on team analysis or undeclared queries on member data", async () => {
    const team = v012Teams[0];
    const fetch = response(v012TeamAnalysis());
    await v012.teamAnalysis(team.teamId);
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/v1/teams/${team.teamId}/analysis/latest`,
    );
    const profile = v012Analysis();
    const read = response(sharedTrainingSchema.parse(profile));
    await v012.memberTraining(team.teamId, profile.publicId);
    expect(read.mock.calls[0][0]).toBe(
      `/api/v1/teams/${team.teamId}/members/${profile.publicId}/training/overview`,
    );
  });
  it("accepts absent member snapshots and validates explicitly requested windows", async () => {
    const teamId = v012Teams[0].teamId;
    const publicId = v012Analysis().publicId;
    const empty = response(null);
    expect(await v012.memberTraining(teamId, publicId)).toBeNull();
    expect(empty.mock.calls[0][0]).toBe(
      `/api/v1/teams/${teamId}/members/${publicId}/training/overview`,
    );
    response(null);
    expect(await v012.memberProfile(teamId, publicId)).toBeNull();

    const training = sharedTrainingSchema.parse(v012Analysis("7D"));
    const read = response(training);
    expect(
      await v012.memberTraining(teamId, publicId, undefined, "7D"),
    ).toEqual(training);
    expect(read.mock.calls[0][0]).toBe(
      `/api/v1/teams/${teamId}/members/${publicId}/training/overview?window=7D`,
    );
    response(sharedProfileSchema.parse(v012Analysis("30D")));
    await expect(
      v012.memberProfile(teamId, publicId, undefined, "7D"),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("preserves additive team detail counts without rejecting V0.12 DTOs", () => {
    const legacy = v012Teams[0];
    expect(teamDetailSchema.parse(legacy)).toEqual(legacy);
    expect(
      teamDetailSchema.parse({ ...legacy, activeMemberCount: 0 }),
    ).toHaveProperty("activeMemberCount", 0);
    expect(
      teamDetailSchema.safeParse({ ...legacy, activeMemberCount: -1 }).success,
    ).toBe(false);
  });
  it("forwards documented shared filters and member status without changing defaults", async () => {
    const teamId = v012Teams[0].teamId;
    const publicId = v012Analysis().publicId;
    const fetch = vi.fn().mockImplementation(
      () =>
        new Response(
          JSON.stringify({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0, hasNext: false },
            requestId: fixtureUuid(9999),
          }),
        ),
    );
    vi.stubGlobal("fetch", fetch);
    await v012.memberSubmissions(teamId, publicId, {
      page: 1,
      verdict: "ACCEPTED",
      problemId: "9007199254740993",
      from: "2026-10-01T00:00:00Z",
      to: "2026-10-02T00:00:00Z",
    });
    const submitted = new URL(
      fetch.mock.calls[0][0],
      "https://frontend.invalid",
    );
    expect(Object.fromEntries(submitted.searchParams)).toEqual({
      page: "1",
      verdict: "ACCEPTED",
      problemId: "9007199254740993",
      from: "2026-10-01T00:00:00Z",
      to: "2026-10-02T00:00:00Z",
    });
    await v012.members(teamId, { status: "LEFT" });
    expect(fetch.mock.calls[1][0]).toBe(
      `/api/v1/teams/${teamId}/members?status=LEFT`,
    );
  });
  it("validates and unwraps deployed coach and notification mutation responses", async () => {
    response({ user: demoUser });
    expect(await v012.redeemCoachCode("synthetic-code")).toEqual({
      user: demoUser,
    });
    response({ count: 2 });
    await expect(v012.readAllNotifications()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    response({ updated: 2 });
    expect(await v012.readAllNotifications()).toEqual({ updated: 2 });
    const notification = { ...v012Notifications[0], read: true };
    response(notification);
    expect(await v012.readNotification(notification.notificationId)).toEqual(
      notification,
    );
    response(notification);
    await expect(v012.readNotification(fixtureUuid(999))).rejects.toMatchObject(
      {
        code: "INVALID_RESPONSE",
      },
    );
  });
  it("uses no-content membership responses and preserves an optional removal reason", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const teamId = v012Teams[0].teamId;
    await expect(
      v012.removeMember(teamId, fixtureUuid(1101), "Synthetic reason"),
    ).resolves.toBeUndefined();
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      reason: "Synthetic reason",
    });
    await expect(v012.leaveTeam(teamId)).resolves.toBeUndefined();
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(fetch.mock.calls[1][1]).not.toHaveProperty("body");
  });
  it("uses PATCH for independent privacy scopes and preserves PRIVATE", async () => {
    const fetch = response({
      basicTraining: "PRIVATE",
      abilityProfile: "PRIVATE",
      detailedSubmissions: "TEAM_MEMBER",
      analysisReport: "PRIVATE",
      updatedAt: v012Analysis().createdAt,
    });
    await v012.updatePrivacy({ detailedSubmissions: "TEAM_MEMBER" });
    expect(fetch.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      detailedSubmissions: "TEAM_MEMBER",
    });
  });
  it("partitions cache by identity, team, permission domain, audience and filters", () => {
    const key = keys.team("user-a", "team-a", "recommendations", {
      audience: "COACH",
      page: 1,
    });
    expect(key).not.toEqual(
      keys.team("user-b", "team-a", "recommendations", {
        audience: "COACH",
        page: 1,
      }),
    );
    expect(key).not.toEqual(
      keys.team("user-a", "team-a", "recommendations", {
        audience: "MEMBER",
        page: 1,
      }),
    );
    expect(key).not.toEqual(
      keys.team("user-a", "team-b", "recommendations", {
        audience: "COACH",
        page: 1,
      }),
    );
  });
  it("polls only active AI jobs with bounded exponential backoff", () => {
    expect(aiPollDelay(v012Job(), 0)).toBe(3000);
    expect(aiPollDelay(v012Job(), 1)).toBe(6000);
    expect(aiPollDelay(v012Job(), 5)).toBe(30000);
    expect(aiPollDelay(v012Job("SUCCESS"), 0)).toBe(false);
    expect(aiPollDelay(v012Job("FAILED"), 0)).toBe(false);
  });
  it("routes notifications by structured references and ignores arbitrary prose/URLs", () => {
    const item = {
      ...v012Notifications[0],
      title: "/coach",
      body: "https://evil.test",
      payload: { url: "https://evil.test" },
    };
    expect(notificationRoute(item)).toBe("/teams?tab=invitations");
    expect(
      notificationRoute({
        ...item,
        type: "MEMBER_REMOVED",
        referenceType: "MEMBERSHIP",
      }),
    ).toBe("/teams");
  });
  it("validates documented empty team analysis without misinterpreting sample counts", () => {
    expect(
      teamAnalysisSchema.parse(v012TeamAnalysis(undefined, "MEMBER", true))
        .includedMemberCount,
    ).toBe(0);
  });
});
