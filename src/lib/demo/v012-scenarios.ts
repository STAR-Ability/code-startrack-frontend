import { demoUser, demoAccounts, fixtureUuid } from "./fixtures.ts";
import {
  v012Teams,
  v012Members,
  v012Applications,
  v012Invitations,
  v012OwnerInvitation,
  v012Peer,
  v012Owner,
  v012Job,
  v012TeamAnalysis,
} from "./v012-fixtures.ts";
import type {
  AiJobDto,
  TeamMemberDto,
  TeamDetailDto,
  JoinApplicationDto,
  TeamInvitationDto,
  TeamAnalysisDto,
} from "../api/v012-schemas";
import type { UserDto } from "../api/schemas";

export const identityNames = [
  "student",
  "student-no-cf",
  "student-one-cf",
  "student-multiple-cf",
  "coach-no-teams",
  "coach-one-team",
  "coach-multiple-teams",
  "coach-owner-member",
] as const;
export type MockIdentity = (typeof identityNames)[number];
export function identityFixture(name: MockIdentity = "student") {
  const coach = name.startsWith("coach-");
  const user: UserDto = {
    ...demoUser,
    roles: coach ? ["STUDENT", "COACH"] : ["STUDENT"],
    primaryRole: coach ? "COACH" : "STUDENT",
  };
  const accounts = structuredClone(
    name === "student-no-cf"
      ? []
      : name === "student-one-cf"
        ? demoAccounts.slice(0, 1)
        : demoAccounts,
  );
  return {
    user,
    accounts,
    ownedTeams:
      name === "coach-no-teams" || !coach
        ? 0
        : name === "coach-multiple-teams"
          ? 2
          : 1,
  };
}
export const dataAccessFixtures = {
  private: {
    basicTraining: false,
    abilityProfile: false,
    detailedSubmissions: false,
    analysisReport: false,
  },
  training: {
    basicTraining: true,
    abilityProfile: false,
    detailedSubmissions: false,
    analysisReport: false,
  },
  ability: {
    basicTraining: false,
    abilityProfile: true,
    detailedSubmissions: false,
    analysisReport: false,
  },
  submissions: {
    basicTraining: false,
    abilityProfile: false,
    detailedSubmissions: true,
    analysisReport: false,
  },
  reports: {
    basicTraining: false,
    abilityProfile: false,
    detailedSubmissions: false,
    analysisReport: true,
  },
  all: {
    basicTraining: true,
    abilityProfile: true,
    detailedSubmissions: true,
    analysisReport: true,
  },
  mixed: {
    basicTraining: true,
    abilityProfile: true,
    detailedSubmissions: false,
    analysisReport: true,
  },
} satisfies Record<string, TeamMemberDto["dataAccess"]>;
export type CollaborationFixtureOptions = {
  identity?: MockIdentity;
  coach?: boolean;
  teamState?: TeamDetailDto["status"];
  memberPrivacy?: keyof typeof dataAccessFixtures;
  manyApplications?: boolean;
  noApplications?: boolean;
  noInvitations?: boolean;
  manyMembers?: boolean;
  ownerDeliveryFailed?: boolean;
};
export function collaborationFixture(
  options: CollaborationFixtureOptions = {},
) {
  const identity = identityFixture(
    options.identity ?? (options.coach ? "coach-owner-member" : "student"),
  );
  const teams: TeamDetailDto[] = structuredClone(v012Teams);
  const members: TeamMemberDto[] = structuredClone(v012Members);
  const applications: JoinApplicationDto[] = structuredClone(v012Applications);
  const invitations: TeamInvitationDto[] = structuredClone([
    ...v012Invitations,
    v012OwnerInvitation,
  ]);
  invitations.push({
    ...structuredClone(v012OwnerInvitation),
    invitationId: fixtureUuid(1611),
    invitee: {
      publicId: fixtureUuid(3700),
      username: "RegisteredInvitee",
      displayName: "已注册受邀者",
      avatarUrl: null,
    },
    inviteeEmail: "registered-invitee@example.test",
    emailDeliveryStatus: "SENT",
  });
  if (options.ownerDeliveryFailed) {
    const invitation = invitations.find(
      (item) => item.invitationId === fixtureUuid(1610),
    )!;
    invitation.emailDeliveryStatus = "FAILED";
    invitation.emailDeliveryErrorCode = "EMAIL_DELIVERY_FAILED";
  }
  const first = teams[0];
  if (!identity.ownedTeams) {
    first.owner = structuredClone(v012Peer);
    first.creator = structuredClone(v012Peer);
    members
      .filter((item) => item.teamId === first.teamId)
      .forEach((item) => {
        item.role =
          item.user.publicId === v012Peer.publicId ? "OWNER" : "MEMBER";
      });
  }
  if (identity.ownedTeams === 2) {
    teams[1].owner = structuredClone(v012Owner);
    members
      .filter((item) => item.teamId === teams[1].teamId)
      .forEach((item) => {
        item.role =
          item.user.publicId === v012Owner.publicId ? "OWNER" : "MEMBER";
      });
  }
  if (options.manyMembers) {
    Object.values(dataAccessFixtures).forEach((dataAccess, index) =>
      members.push({
        membershipId: fixtureUuid(3100 + index),
        teamId: first.teamId,
        user: {
          publicId: fixtureUuid(3200 + index),
          username: `Learner${index + 1}`,
          displayName: `训练成员 ${index + 1}`,
          avatarUrl: null,
        },
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: "2026-09-12T02:30:00Z",
        endedAt: null,
        dataAccess: structuredClone(dataAccess),
      }),
    );
  }
  for (const [index, status] of (["LEFT", "REMOVED"] as const).entries())
    members.push({
      membershipId: fixtureUuid(3300 + index),
      teamId: first.teamId,
      user: {
        publicId: fixtureUuid(3400 + index),
        username: `FormerLearner${index + 1}`,
        displayName: null,
        avatarUrl: null,
      },
      role: "MEMBER",
      status,
      joinedAt: "2026-09-01T02:30:00Z",
      endedAt: "2026-09-20T02:30:00Z",
      dataAccess: structuredClone(dataAccessFixtures.private),
    });
  if (options.memberPrivacy)
    members
      .filter(
        (item) =>
          item.user.publicId !== identity.user.publicId &&
          item.status === "ACTIVE",
      )
      .forEach((item) => {
        item.dataAccess = structuredClone(
          dataAccessFixtures[options.memberPrivacy!],
        );
      });
  if (options.manyApplications)
    for (let index = 0; index < 24; index++)
      applications.push({
        ...structuredClone(applications[0]),
        applicationId: fixtureUuid(3500 + index),
        applicant: {
          publicId: fixtureUuid(3600 + index),
          username: `Applicant${index + 1}`,
          displayName: `申请人 ${index + 1}`,
          avatarUrl: null,
        },
      });
  if (options.teamState) first.status = options.teamState;
  if (first.status !== "ACTIVE") {
    applications
      .filter(
        (item) =>
          item.team.teamId === first.teamId && item.status === "PENDING",
      )
      .forEach((item) => {
        item.status = "CANCELLED";
        item.decidedAt = "2026-10-02T02:30:00Z";
        item.decidedBy = null;
      });
    invitations
      .filter(
        (item) =>
          item.team.teamId === first.teamId && item.status === "PENDING",
      )
      .forEach((item) => {
        item.status = "CANCELLED";
        item.respondedAt = "2026-10-02T02:30:00Z";
      });
  }
  if (first.status === "DISSOLVED")
    members
      .filter(
        (item) => item.teamId === first.teamId && item.status === "ACTIVE",
      )
      .forEach((item) => {
        item.status = "REMOVED";
        item.endedAt = "2026-10-02T02:30:00Z";
        item.dataAccess = structuredClone(dataAccessFixtures.private);
      });
  for (const team of teams) {
    const active = members.filter(
      (item) => item.teamId === team.teamId && item.status === "ACTIVE",
    );
    team.memberCount = active.length;
    team.myMembershipRole =
      active.find((item) => item.user.publicId === identity.user.publicId)
        ?.role ?? null;
    team.canManage = team.myMembershipRole === "OWNER";
    team.canLeave =
      team.myMembershipRole === "MEMBER" && team.status !== "DISSOLVED";
  }
  // Record references use the same canonical team, including owner and lifecycle.
  applications.forEach((item) => {
    item.team = structuredClone(
      teams.find((team) => team.teamId === item.team.teamId)!,
    );
    if (item.decidedBy) item.decidedBy = item.team.owner;
  });
  invitations.forEach((item) => {
    item.team = structuredClone(
      teams.find((team) => team.teamId === item.team.teamId)!,
    );
    item.inviter = item.team.owner;
  });
  return {
    identity,
    teams,
    members,
    applications: options.noApplications ? [] : applications,
    invitations: options.noInvitations ? [] : invitations,
  };
}
export function aiJobFixture(
  type: AiJobDto["type"],
  status: AiJobDto["status"],
): AiJobDto {
  const types = [
    "USER_ANALYSIS",
    "PERSONAL_REPORT",
    "TEAM_ANALYSIS",
    "TEAM_RECOMMENDATION",
  ] as const;
  const statuses = ["QUEUED", "RUNNING", "SUCCESS", "FAILED"] as const;
  const results = [
    fixtureUuid(1303),
    fixtureUuid(1400),
    fixtureUuid(1800),
    fixtureUuid(1900),
  ];
  return {
    ...v012Job(status, type),
    jobId: fixtureUuid(
      4000 + types.indexOf(type) * 10 + statuses.indexOf(status),
    ),
    resultId: status === "SUCCESS" ? results[types.indexOf(type)] : null,
  };
}
export function teamAnalysisFixture(
  team: TeamDetailDto,
  audience: TeamAnalysisDto["audience"],
  state:
    "fresh" | "stale" | "no-ability" | "no-training" | "no-level" = "fresh",
): TeamAnalysisDto {
  const analysis = v012TeamAnalysis(team.teamId, audience);
  analysis.memberCount = team.memberCount;
  analysis.includedMemberCount =
    state === "no-ability"
      ? 0
      : Math.min(analysis.includedMemberCount, team.memberCount);
  analysis.excludedMemberCount =
    team.memberCount - analysis.includedMemberCount;
  analysis.trainingMemberCount =
    state === "no-training"
      ? 0
      : Math.min(analysis.trainingMemberCount, team.memberCount);
  analysis.levelMemberCount =
    state === "no-level"
      ? 0
      : Math.min(analysis.levelMemberCount, analysis.trainingMemberCount);
  analysis.targetRating = analysis.levelMemberCount ? 1500 : null;
  analysis.dimensions.forEach((d) => {
    d.memberSampleCount = analysis.includedMemberCount;
    if (!analysis.includedMemberCount) d.score = 0;
  });
  if (!analysis.includedMemberCount) analysis.overallScore = 0;
  if (!analysis.trainingMemberCount) analysis.activityStats = [];
  analysis.stale = state === "stale";
  return analysis;
}
