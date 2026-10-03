import { afterEach, describe, expect, it, vi } from "vitest";
import { v012 } from "./v012";
import {
  v012Analysis,
  v012Report,
  v012TeamBatch,
  v012Teams,
  v012Job,
} from "../demo/v012-fixtures";
import { fixtureUuid, demoSubmissions } from "../demo/fixtures";
import {
  personalReportSchema,
  sharedProfileSchema,
  sharedTrainingSchema,
  teamAnalysisSchema,
  userAnalysisSchema,
  aiJobSchema,
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
