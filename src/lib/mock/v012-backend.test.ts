// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createMockBackend } from "./backend.mjs";
import { fixtureUuid } from "../demo/fixtures";
import { v012Teams, v012Peer } from "../demo/v012-fixtures";
import {
  userAnalysisSchema,
  personalReportSchema,
  privacySchema,
  teamDetailSchema,
  teamMemberSchema,
  teamAnalysisSchema,
  teamBatchSchema,
  applicationSchema,
  invitationSchema,
  notificationSchema,
  aiJobSchema,
} from "../api/v012-schemas";
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
async function control(body: Record<string, unknown> = {}) {
  await fetch(`${base}/__control`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
beforeEach(() => control());
async function call(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    payload: response.status === 204 ? null : await response.json(),
  };
}
describe("V0.12 synthetic service", () => {
  it("serves all new read DTO families through the public contract", async () => {
    await control({ coach: true });
    for (const [path, schema, paged] of [
      ["/me/analysis/latest?window=ALL", userAnalysisSchema, false],
      ["/me/training/overview?window=30D", userAnalysisSchema, false],
      ["/me/reports/latest", personalReportSchema, false],
      ["/me/reports", personalReportSchema, true],
      ["/me/privacy", privacySchema, false],
      [`/teams/${v012Teams[0].teamId}`, teamDetailSchema, false],
      [`/teams/${v012Teams[0].teamId}/members`, teamMemberSchema, true],
      [
        `/teams/${v012Teams[0].teamId}/analysis/latest`,
        teamAnalysisSchema,
        false,
      ],
      [
        `/teams/${v012Teams[0].teamId}/recommendations/latest?audience=COACH&mode=HYBRID`,
        teamBatchSchema,
        false,
      ],
      ["/notifications", notificationSchema, true],
    ] as const) {
      const result = await call(path);
      expect(result.status, path).toBe(200);
      for (const item of paged ? result.payload.data : [result.payload.data])
        expect(schema.safeParse(item).success, path).toBe(true);
    }
  });
  it("prevents ordinary members from reading coach recommendation batches", async () => {
    const result = await call(
      `/teams/${v012Teams[1].teamId}/recommendations/latest?audience=COACH&mode=HYBRID`,
    );
    expect(result.status).toBe(403);
    expect(result.payload.error.code).toBe("TEAM_FORBIDDEN");
    const member = await call(
      `/teams/${v012Teams[1].teamId}/recommendations/latest?audience=MEMBER&mode=HYBRID`,
    );
    expect(member.payload.data.audience).toBe("MEMBER");
  });
  it("approval creates a membership and terminal applications reject repeated decisions", async () => {
    await control({ coach: true });
    const result = await call(
      `/team-applications/${fixtureUuid(1500)}/approve`,
      "POST",
    );
    expect(applicationSchema.parse(result.payload.data).status).toBe(
      "APPROVED",
    );
    const members = await call(`/teams/${v012Teams[0].teamId}/members`);
    expect(
      members.payload.data.some(
        (item: { user: { publicId: string } }) =>
          item.user.publicId === result.payload.data.applicant.publicId,
      ),
    ).toBe(true);
    expect(
      (await call(`/team-applications/${fixtureUuid(1500)}/reject`, "POST", {}))
        .status,
    ).toBe(409);
  });
  it("invite acceptance creates membership, redacts email and enforces terminal state", async () => {
    const result = await call(
      `/team-invitations/${fixtureUuid(1600)}/accept`,
      "POST",
    );
    expect(invitationSchema.parse(result.payload.data).status).toBe("ACCEPTED");
    expect(result.payload.data.inviteeEmail).toBeNull();
    const mine = await call("/teams/mine?scope=JOINED");
    expect(
      mine.payload.data.map((item: { teamId: string }) => item.teamId),
    ).toContain(v012Teams[2].teamId);
    expect(
      (await call(`/team-invitations/${fixtureUuid(1600)}/accept`, "POST"))
        .status,
    ).toBe(409);
  });
  it("privacy is independent and minimal shared endpoints never leak the other domain", async () => {
    expect((await call("/me/privacy")).payload.data.basicTraining).toBe(
      "PRIVATE",
    );
    const changed = await call("/me/privacy", "PATCH", {
      basicTraining: "TEAM_MEMBER",
    });
    expect(changed.payload.data.abilityProfile).toBe("PRIVATE");
    const path = `/teams/${v012Teams[0].teamId}/members/${v012Peer.publicId}`;
    const training = await call(`${path}/training/overview`);
    expect(training.payload.data).not.toHaveProperty("dimensions");
    const profile = await call(`${path}/profile`);
    expect(profile.payload.data).not.toHaveProperty("summary");
    expect((await call(`${path}/submissions`)).status).toBe(403);
  });
  it("AI jobs transition separately from sync jobs and never create jobs on reads", async () => {
    const result = await call("/me/reports/generate", "POST");
    expect(result.status).toBe(202);
    const job = aiJobSchema.parse(result.payload.data);
    expect((await call(`/ai-jobs/${job.jobId}`)).payload.data.status).toBe(
      "RUNNING",
    );
    const completed = await call(`/ai-jobs/${job.jobId}`);
    expect(completed.payload.data.status).toBe("SUCCESS");
    expect((await call("/me/reports/latest")).payload.data.reportId).toBe(
      completed.payload.data.resultId,
    );
  });
  it("validates undeclared queries/body fields and additive coach role", async () => {
    expect(
      (
        await call(
          `/teams/${v012Teams[0].teamId}/analysis/latest?audience=MEMBER`,
        )
      ).status,
    ).toBe(400);
    expect(
      (await call("/me/privacy", "PATCH", { canManage: true })).status,
    ).toBe(400);
    expect((await call("/coach/dashboard")).status).toBe(403);
    await call("/coach-invite-codes/redeem", "POST", { code: "synthetic" });
    expect((await call("/me")).payload.data.roles).toEqual([
      "STUDENT",
      "COACH",
    ]);
    expect((await call("/coach/dashboard")).status).toBe(200);
  });
  it("rebuilds immutable user snapshots and freezes reports against their actual sources", async () => {
    await control({ zero: true, stale: true });
    const before = userAnalysisSchema.parse(
      (await call("/me/analysis/latest?window=ALL")).payload.data,
    );
    const previousReport = personalReportSchema.parse(
      (await call("/me/reports/latest")).payload.data,
    );
    expect(previousReport.statisticsSnapshot.summary).toEqual(before.summary);
    const rebuild = aiJobSchema.parse(
      (await call("/me/analysis/rebuild", "POST")).payload.data,
    );
    await call(`/ai-jobs/${rebuild.jobId}`);
    const completed = aiJobSchema.parse(
      (await call(`/ai-jobs/${rebuild.jobId}`)).payload.data,
    );
    const all = userAnalysisSchema.parse(
      (await call("/me/analysis/latest?window=ALL")).payload.data,
    );
    const recent = userAnalysisSchema.parse(
      (await call("/me/analysis/latest?window=30D")).payload.data,
    );
    expect(completed.status).toBe("SUCCESS");
    expect(all.snapshotId).toBe(completed.resultId);
    expect(all.snapshotId).not.toBe(before.snapshotId);
    expect(all.stale).toBe(false);
    expect(
      (await call(`/me/analysis/${before.snapshotId}`)).payload.data,
    ).toEqual(before);
    const generation = aiJobSchema.parse(
      (await call("/me/reports/generate", "POST")).payload.data,
    );
    await call(`/ai-jobs/${generation.jobId}`);
    await call(`/ai-jobs/${generation.jobId}`);
    const report = personalReportSchema.parse(
      (await call("/me/reports/latest")).payload.data,
    );
    expect(report.analysisSnapshotId).toBe(all.snapshotId);
    expect(report.recentAnalysisSnapshotId).toBe(recent.snapshotId);
    expect(report.statisticsSnapshot.summary).toEqual(all.summary);
    expect(report.profileSnapshot.dimensions).toEqual(all.dimensions);
    expect(report.recentTrainingSnapshot.summary).toEqual(recent.summary);
    expect(
      (await call(`/me/reports/${previousReport.reportId}`)).payload.data,
    ).toEqual(previousReport);
  });
  it("team rebuild results resolve to snapshots with current membership sample counts", async () => {
    await control({ coach: true });
    const teamId = v012Teams[0].teamId;
    const before = teamAnalysisSchema.parse(
      (await call(`/teams/${teamId}/analysis/latest`)).payload.data,
    );
    await call(`/team-applications/${fixtureUuid(1500)}/approve`, "POST");
    const members = (await call(`/teams/${teamId}/members`)).payload.data;
    expect(members).toHaveLength(3);
    const rebuild = aiJobSchema.parse(
      (await call(`/teams/${teamId}/analysis/rebuild`, "POST")).payload.data,
    );
    await call(`/ai-jobs/${rebuild.jobId}`);
    const completed = aiJobSchema.parse(
      (await call(`/ai-jobs/${rebuild.jobId}`)).payload.data,
    );
    const latest = teamAnalysisSchema.parse(
      (await call(`/teams/${teamId}/analysis/latest`)).payload.data,
    );
    expect(latest.snapshotId).toBe(completed.resultId);
    expect(latest.memberCount).toBe(members.length);
    expect(latest.includedMemberCount + latest.excludedMemberCount).toBe(
      members.length,
    );
    expect(latest.levelMemberCount).toBeLessThanOrEqual(
      latest.trainingMemberCount,
    );
    expect(latest.trainingMemberCount).toBeLessThanOrEqual(members.length);
    const history = (await call(`/teams/${teamId}/analysis/history`)).payload
      .data;
    expect(
      history.find(
        (item: { snapshotId: string }) => item.snapshotId === before.snapshotId,
      ),
    ).toEqual(before);
    await call("/coach-invite-codes/redeem", "POST", { code: "synthetic" });
    const created = teamDetailSchema.parse(
      (
        await call("/teams", "POST", {
          name: "Single member team",
          description: null,
          avatarUrl: null,
        })
      ).payload.data,
    );
    const singleJob = aiJobSchema.parse(
      (await call(`/teams/${created.teamId}/analysis/rebuild`, "POST")).payload
        .data,
    );
    await call(`/ai-jobs/${singleJob.jobId}`);
    await call(`/ai-jobs/${singleJob.jobId}`);
    const single = teamAnalysisSchema.parse(
      (await call(`/teams/${created.teamId}/analysis/latest`)).payload.data,
    );
    expect(single.memberCount).toBe(1);
    expect(single.includedMemberCount + single.excludedMemberCount).toBe(1);
    expect(single.trainingMemberCount).toBeLessThanOrEqual(1);
  });
  it("empty samples obey counts and never become false real zero ability", async () => {
    await control({ noSharing: true, coach: true });
    const analysis = (
      await call(`/teams/${v012Teams[0].teamId}/analysis/latest`)
    ).payload.data;
    expect(analysis.includedMemberCount).toBe(0);
    expect(analysis.targetRating).toBeNull();
    expect(
      (
        await call(
          `/teams/${v012Teams[0].teamId}/recommendations/generate`,
          "POST",
          { audience: "MEMBER" },
        )
      ).payload.error.code,
    ).toBe("TEAM_LEVEL_NOT_READY");
  });
});
