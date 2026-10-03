// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createMockBackend } from "./backend.mjs";
import { identityNames, identityFixture } from "../demo/v012-scenarios";
import { mockApiErrors, mockScenarios } from "./scenarios.mjs";
import { fixtureUuid } from "../demo/fixtures";
import { teamAnalysisSchema, teamBatchSchema } from "../api/v012-schemas";
const server = createMockBackend();
let base: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
async function reset(config: Record<string, unknown>) {
  await fetch(`${base}/__control`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}
async function call(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    response,
    payload: response.status === 204 ? null : await response.json(),
  };
}
const team = fixtureUuid(1001);
describe("shared offline scenario boundary", () => {
  it.each(identityNames)(
    "%s serves the intended system and team roles",
    async (scenario) => {
      await reset({ scenario });
      expect((await call("/me")).payload.data.roles).toEqual(
        identityFixture(scenario).user.roles,
      );
      const managed = await call("/teams/mine?scope=MANAGED");
      expect(managed.payload.data).toHaveLength(
        identityFixture(scenario).ownedTeams,
      );
      const accounts = await call("/oj-accounts");
      expect(accounts.payload.data).toHaveLength(
        identityFixture(scenario).accounts.length,
      );
      const detail = await call(`/teams/${fixtureUuid(1002)}`);
      expect(detail.payload.data.canManage).toBe(
        scenario === "coach-multiple-teams",
      );
      if (scenario === "coach-owner-member")
        expect(
          (
            await call(
              `/teams/${fixtureUuid(1002)}/recommendations/latest?audience=COACH&mode=HYBRID`,
            )
          ).response.status,
        ).toBe(403);
    },
  );
  it.each(Object.entries(mockApiErrors))(
    "%s reproduces the error envelope and Retry-After",
    async (code, status) => {
      await reset({
        scenario: `error-${code.toLowerCase().replaceAll("_", "-")}`,
      });
      const result = await call("/me/reports/latest");
      expect(result.response.status).toBe(status);
      expect(result.payload.error.code).toBe(code);
      expect(result.payload.error.details).toEqual({});
      if (status === 429)
        expect(result.response.headers.get("Retry-After")).toBe("3");
    },
  );
  it("empty, stale, absent and sample-restricted team results conform to the DTOs", async () => {
    for (const scenario of [
      "team-no-ability",
      "team-no-training",
      "team-no-level",
      "stale",
    ]) {
      await reset({ scenario, coach: true });
      const result = teamAnalysisSchema.parse(
        (await call(`/teams/${team}/analysis/latest`)).payload.data,
      );
      expect(result.includedMemberCount + result.excludedMemberCount).toBe(
        result.memberCount,
      );
      expect(result.levelMemberCount).toBeLessThanOrEqual(
        result.trainingMemberCount,
      );
      if (scenario === "team-no-level")
        expect(
          (
            await call(`/teams/${team}/recommendations/generate`, "POST", {
              audience: "COACH",
            })
          ).payload.error.code,
        ).toBe("TEAM_LEVEL_NOT_READY");
      if (scenario === "stale") expect(result.stale).toBe(true);
    }
    await reset({ scenario: "team-no-analysis" });
    expect(
      (await call(`/teams/${team}/analysis/latest`)).payload.data,
    ).toBeNull();
    expect(
      (
        await call(`/teams/${team}/recommendations/generate`, "POST", {
          audience: "COACH",
        })
      ).payload.error.code,
    ).toBe("TEAM_ANALYSIS_NOT_READY");
    await reset({ scenario: "team-no-recommendations" });
    expect(
      (
        await call(
          `/teams/${team}/recommendations/latest?audience=COACH&mode=HYBRID`,
        )
      ).payload.data,
    ).toBeNull();
    await reset({ scenario: "team-empty-recommendations" });
    expect(
      teamBatchSchema.parse(
        (
          await call(
            `/teams/${team}/recommendations/latest?audience=COACH&mode=HYBRID`,
          )
        ).payload.data,
      ).recommendations,
    ).toEqual([]);
  });
  it("archive cancels outstanding records and dissolved teams have no active members", async () => {
    await reset({ coach: true });
    await call(`/teams/${team}/archive`, "POST");
    expect(
      (await call(`/teams/${team}/applications?status=PENDING`)).payload.data,
    ).toEqual([]);
    expect(
      (await call(`/teams/${team}/invitations?status=PENDING`)).payload.data,
    ).toEqual([]);
    await call(`/teams/${team}/dissolve`, "POST", {
      confirmation: "星轨训练队",
    });
    expect((await call(`/teams/${team}`)).payload.data.memberCount).toBe(0);
    expect((await call("/teams/mine?scope=MANAGED")).payload.data).toEqual([]);
  });
  it("resend recovery and rate limits preserve invitation business state", async () => {
    await reset({ coach: true, inviteRateLimited: true });
    const blocked = await call(
      `/team-invitations/${fixtureUuid(1610)}/resend`,
      "POST",
    );
    expect(blocked.response.status).toBe(429);
    expect(blocked.response.headers.get("Retry-After")).toBe("3");
    await reset({ coach: true });
    const sent = await call(
      `/team-invitations/${fixtureUuid(1610)}/resend`,
      "POST",
    );
    expect(sent.payload.data.emailDeliveryStatus).toBe("SENT");
    expect(sent.payload.data.status).toBe("PENDING");
  });
  it("creates applications and invitations through the validated mutation paths", async () => {
    await reset({ coach: true });
    await call(`/team-invitations/${fixtureUuid(1600)}/reject`, "POST");
    const application = await call(
      `/teams/${fixtureUuid(1003)}/applications`,
      "POST",
      { message: "Together" },
    );
    expect(application.response.status).toBe(201);
    expect(application.payload.data.status).toBe("PENDING");
    const invitation = await call(`/teams/${team}/invitations`, "POST", {
      email: "new@example.test",
    });
    expect(invitation.response.status).toBe(201);
    expect(invitation.payload.data.inviteeEmail).toBe("new@example.test");
    expect(invitation.payload.data.status).toBe("PENDING");
  });
  it("all AI types expose queued, running, failed and successful independent jobs", async () => {
    const operations = [
      ["USER_ANALYSIS", "/me/analysis/rebuild", undefined],
      ["PERSONAL_REPORT", "/me/reports/generate", undefined],
      ["TEAM_ANALYSIS", `/teams/${team}/analysis/rebuild`, undefined],
      [
        "TEAM_RECOMMENDATION",
        `/teams/${team}/recommendations/generate`,
        { audience: "COACH", mode: "HYBRID" },
      ],
    ] as const;
    for (const [type, path, body] of operations)
      for (const state of ["QUEUED", "RUNNING", "FAILED", "SUCCESS"]) {
        await reset({
          coach: true,
          keepQueued: state === "QUEUED",
          keepRunning: state === "RUNNING",
          aiFailed: state === "FAILED",
        });
        const job = (await call(path, "POST", body)).payload.data;
        expect(job.type).toBe(type);
        expect(job.status).toBe("QUEUED");
        let final = (await call(`/ai-jobs/${job.jobId}`)).payload.data;
        if (state === "SUCCESS")
          final = (await call(`/ai-jobs/${job.jobId}`)).payload.data;
        expect(final.status).toBe(state);
        if (state === "SUCCESS") expect(final.resultId).not.toBeNull();
      }
  });
  it("reset preserves deterministic identifiers and generic network failures stay failures", async () => {
    await reset({ coach: true });
    const before = (
      await call(
        `/teams/${team}/recommendations/latest?audience=COACH&mode=HYBRID`,
      )
    ).payload.data;
    await reset({ coach: true });
    expect(
      (
        await call(
          `/teams/${team}/recommendations/latest?audience=COACH&mode=HYBRID`,
        )
      ).payload.data,
    ).toEqual(before);
    await reset({ scenario: "network-failure" });
    await expect(call("/me")).rejects.toThrow();
    expect(Object.keys(mockScenarios).length).toBeGreaterThan(60);
  });
});
