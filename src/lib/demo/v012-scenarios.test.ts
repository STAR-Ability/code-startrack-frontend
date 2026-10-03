import { describe, expect, it } from "vitest";
import {
  identityNames,
  identityFixture,
  collaborationFixture,
  dataAccessFixtures,
  aiJobFixture,
  teamAnalysisFixture,
} from "./v012-scenarios";
import { userSchema, accountSchema } from "../api/schemas";
import {
  teamDetailSchema,
  teamMemberSchema,
  applicationSchema,
  invitationSchema,
  teamAnalysisSchema,
  aiJobSchema,
} from "../api/v012-schemas";

describe("V0.12 deterministic relationships", () => {
  it.each(identityNames)(
    "%s preserves DTOs, additive roles and canonical ownership",
    (name) => {
      const identity = identityFixture(name);
      expect(userSchema.safeParse(identity.user).success).toBe(true);
      identity.accounts.forEach((account) =>
        expect(accountSchema.safeParse(account).success).toBe(true),
      );
      const fixture = collaborationFixture({ identity: name });
      fixture.teams.forEach((team) => {
        expect(teamDetailSchema.safeParse(team).success).toBe(true);
        const active = fixture.members.filter(
          (member) =>
            member.teamId === team.teamId && member.status === "ACTIVE",
        );
        expect(active.length).toBe(team.memberCount);
        if (team.status !== "DISSOLVED")
          expect(
            active
              .filter((member) => member.role === "OWNER")
              .map((member) => member.user.publicId),
          ).toEqual([team.owner.publicId]);
        else expect(active).toHaveLength(0);
        expect(team.canManage).toBe(team.myMembershipRole === "OWNER");
      });
      expect(fixture.teams.filter((team) => team.canManage)).toHaveLength(
        identity.ownedTeams,
      );
      fixture.members.forEach((member) =>
        expect(teamMemberSchema.safeParse(member).success).toBe(true),
      );
      for (const row of fixture.applications) {
        expect(applicationSchema.safeParse(row).success).toBe(true);
        expect(row.team.owner).toEqual(
          fixture.teams.find((team) => team.teamId === row.team.teamId)!.owner,
        );
      }
      fixture.invitations.forEach((row) =>
        expect(invitationSchema.safeParse(row).success).toBe(true),
      );
    },
  );
  it("historical memberships, processing records and privacy combinations remain distinct", () => {
    const fixture = collaborationFixture({
      coach: true,
      manyApplications: true,
      manyMembers: true,
    });
    expect(new Set(fixture.members.map((member) => member.status))).toEqual(
      new Set(["ACTIVE", "LEFT", "REMOVED"]),
    );
    expect(
      fixture.applications.filter((row) => row.status === "PENDING"),
    ).toHaveLength(25);
    expect(
      new Set(fixture.applications.map((row) => row.applicationId)).size,
    ).toBe(fixture.applications.length);
    for (const access of Object.values(dataAccessFixtures))
      expect(
        fixture.members.some(
          (member) =>
            JSON.stringify(member.dataAccess) === JSON.stringify(access),
        ),
      ).toBe(true);
    expect(new Set(fixture.invitations.map((row) => row.status))).toEqual(
      new Set(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"]),
    );
    expect(
      new Set(fixture.invitations.map((row) => row.emailDeliveryStatus)),
    ).toEqual(new Set(["PENDING", "SENT", "FAILED"]));
    expect(
      fixture.invitations.some(
        (row) => row.invitee === null && row.inviteeEmail !== null,
      ),
    ).toBe(true);
    expect(fixture.invitations.some((row) => row.invitee !== null)).toBe(true);
  });
  it.each(["ACTIVE", "ARCHIVED", "DISSOLVED"] as const)(
    "%s lifecycle preserves member and pending-record invariants",
    (teamState) => {
      const fixture = collaborationFixture({ coach: true, teamState });
      const team = fixture.teams[0];
      if (teamState !== "ACTIVE") {
        expect(
          fixture.applications.some(
            (row) =>
              row.team.teamId === team.teamId && row.status === "PENDING",
          ),
        ).toBe(false);
        expect(
          fixture.invitations.some(
            (row) =>
              row.team.teamId === team.teamId && row.status === "PENDING",
          ),
        ).toBe(false);
      }
      if (teamState === "DISSOLVED") expect(team.memberCount).toBe(0);
    },
  );
  it("both audiences preserve analysis counts for each data-availability state", () => {
    const fixture = collaborationFixture({ coach: true });
    for (const team of fixture.teams)
      for (const audience of ["MEMBER", "COACH"] as const)
        for (const state of [
          "fresh",
          "stale",
          "no-ability",
          "no-training",
          "no-level",
        ] as const) {
          const analysis = teamAnalysisFixture(team, audience, state);
          expect(teamAnalysisSchema.safeParse(analysis).success).toBe(true);
          expect(
            analysis.includedMemberCount + analysis.excludedMemberCount,
          ).toBe(team.memberCount);
          expect(analysis.levelMemberCount).toBeLessThanOrEqual(
            analysis.trainingMemberCount,
          );
          expect(analysis.trainingMemberCount).toBeLessThanOrEqual(
            team.memberCount,
          );
          if (!analysis.levelMemberCount)
            expect(analysis.targetRating).toBeNull();
        }
  });
  it("every AI type and status uses its own coherent result and timestamps", () => {
    const ids: string[] = [];
    for (const type of [
      "USER_ANALYSIS",
      "PERSONAL_REPORT",
      "TEAM_ANALYSIS",
      "TEAM_RECOMMENDATION",
    ] as const)
      for (const status of [
        "QUEUED",
        "RUNNING",
        "SUCCESS",
        "FAILED",
      ] as const) {
        const job = aiJobFixture(type, status);
        ids.push(job.jobId);
        expect(aiJobSchema.safeParse(job).success).toBe(true);
        expect(job.resultId !== null).toBe(status === "SUCCESS");
        expect(job.finishedAt !== null).toBe(
          status === "SUCCESS" || status === "FAILED",
        );
      }
    expect(new Set(ids).size).toBe(16);
  });
  it("reset produces identical data rather than random IDs", () => {
    expect(collaborationFixture({ coach: true, manyMembers: true })).toEqual(
      collaborationFixture({ coach: true, manyMembers: true }),
    );
  });
});
