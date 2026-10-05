import { teamSummarySchema } from "../api/v012-schemas.ts";
import {
  demoUser,
  demoAccounts,
  demoAnalysis,
  demoProblem,
  fixtureUuid,
} from "./fixtures.ts";
import type {
  AiJobDto,
  JoinApplicationDto,
  NotificationDto,
  PersonalReportDto,
  PrivacySettingsDto,
  TeamAnalysisAudience,
  TeamAnalysisDto,
  TeamDetailDto,
  TeamInvitationDto,
  TeamMemberDto,
  TeamRecommendationBatchDto,
  UserAnalysisDto,
  UserBriefDto,
} from "../api/v012-schemas";
export const v012Student = { ...demoUser, roles: ["STUDENT"] };
export const v012Coach = {
  ...demoUser,
  roles: ["STUDENT", "COACH"],
  primaryRole: "COACH",
};
export const v012Peer: UserBriefDto = {
  publicId: fixtureUuid(1101),
  username: "TrainingPeer",
  displayName: "训练伙伴",
  avatarUrl: null,
};
export const v012Applicant: UserBriefDto = {
  publicId: fixtureUuid(1102),
  username: "NewLearner",
  displayName: "新成员",
  avatarUrl: null,
};
export const v012Owner: UserBriefDto = {
  publicId: demoUser.publicId,
  username: demoUser.username,
  displayName: demoUser.displayName,
  avatarUrl: demoUser.avatarUrl,
};
export const v012Teams: TeamDetailDto[] = [
  {
    teamId: fixtureUuid(1001),
    name: "星轨训练队",
    description: "一起练习，持续进步。",
    avatarUrl: null,
    status: "ACTIVE",
    owner: v012Owner,
    creator: v012Owner,
    memberCount: 2,
    createdAt: "2026-09-01T02:30:00Z",
    updatedAt: "2026-10-02T02:30:00Z",
    myMembershipRole: "OWNER",
    myJoinApplicationStatus: null,
    myInvitationStatus: null,
    canManage: true,
    canLeave: false,
  },
  {
    teamId: fixtureUuid(1002),
    name: "算法研习社",
    description: null,
    avatarUrl: null,
    status: "ACTIVE",
    owner: v012Peer,
    creator: v012Peer,
    memberCount: 2,
    createdAt: "2026-09-02T02:30:00Z",
    updatedAt: "2026-10-02T02:30:00Z",
    myMembershipRole: "MEMBER",
    myJoinApplicationStatus: null,
    myInvitationStatus: null,
    canManage: false,
    canLeave: true,
  },
  {
    teamId: fixtureUuid(1003),
    name: "开放训练营",
    description: "欢迎加入",
    avatarUrl: null,
    status: "ACTIVE",
    owner: v012Peer,
    creator: v012Peer,
    memberCount: 1,
    createdAt: "2026-09-03T02:30:00Z",
    updatedAt: "2026-10-02T02:30:00Z",
    myMembershipRole: null,
    myJoinApplicationStatus: null,
    myInvitationStatus: null,
    canManage: false,
    canLeave: false,
  },
  {
    teamId: fixtureUuid(1004),
    name: "归档训练队",
    description: null,
    avatarUrl: null,
    status: "ARCHIVED",
    owner: v012Peer,
    creator: v012Peer,
    memberCount: 2,
    createdAt: "2026-09-03T02:30:00Z",
    updatedAt: "2026-10-02T02:30:00Z",
    myMembershipRole: null,
    myJoinApplicationStatus: null,
    myInvitationStatus: null,
    canManage: false,
    canLeave: false,
  },
  {
    teamId: fixtureUuid(1005),
    name: "历史训练队",
    description: null,
    avatarUrl: null,
    status: "DISSOLVED",
    owner: v012Peer,
    creator: v012Peer,
    memberCount: 0,
    createdAt: "2026-09-03T02:30:00Z",
    updatedAt: "2026-10-02T02:30:00Z",
    myMembershipRole: null,
    myJoinApplicationStatus: null,
    myInvitationStatus: null,
    canManage: false,
    canLeave: false,
  },
];
const access = {
  basicTraining: false,
  abilityProfile: false,
  detailedSubmissions: false,
  analysisReport: false,
};
export const v012Members: TeamMemberDto[] = v012Teams.flatMap((team, index) =>
  team.status === "DISSOLVED"
    ? []
    : [
        team.owner,
        ...(index < 2
          ? [index === 0 ? v012Peer : v012Owner]
          : index === 3
            ? [v012Applicant]
            : []),
      ].map((user, memberIndex) => ({
        membershipId: fixtureUuid(1200 + index * 10 + memberIndex),
        teamId: team.teamId,
        user,
        role: memberIndex === 0 ? "OWNER" : "MEMBER",
        status: "ACTIVE",
        joinedAt: "2026-09-10T02:30:00Z",
        endedAt: null,
        dataAccess:
          user.publicId === v012Owner.publicId
            ? {
                ...access,
                basicTraining: true,
                abilityProfile: true,
                detailedSubmissions: true,
                analysisReport: true,
              }
            : {
                ...access,
                basicTraining: true,
                abilityProfile: index === 0,
                detailedSubmissions: index === 1,
                analysisReport: index === 0,
              },
      })),
);
export const v012Privacy: PrivacySettingsDto = {
  basicTraining: "PRIVATE",
  abilityProfile: "PRIVATE",
  detailedSubmissions: "PRIVATE",
  analysisReport: "PRIVATE",
  updatedAt: "2026-10-02T02:30:00Z",
};
export const v012MixedPrivacy: PrivacySettingsDto = {
  ...v012Privacy,
  basicTraining: "TEAM_MEMBER",
  abilityProfile: "TEAM_COACH",
};
export function v012Analysis(
  window: UserAnalysisDto["window"] = "ALL",
  zero = false,
): UserAnalysisDto {
  const source = demoAnalysis(demoAccounts[0].accountId, window, zero);
  const {
    accountId: _accountId,
    sourceDataVersion: _version,
    ...data
  } = source;
  void _accountId;
  void _version;
  return {
    ...data,
    publicId: demoUser.publicId,
    snapshotId: fixtureUuid(
      1300 + ["7D", "30D", "365D", "ALL"].indexOf(window),
    ),
    ratingAccounts: demoAccounts.map((account) => ({
      accountId: account.accountId,
      platform: "codeforces",
      username: account.username,
      bindStatus: "ACTIVE",
      currentRating: account.rating,
      maxRating: account.maxRating,
      lastSyncedAt: account.lastSyncedAt!,
    })),
    sourceAccountCount: 2,
    sourceAccountIds: demoAccounts.map((account) => account.accountId),
    sourceFingerprint: "synthetic-user-source-v1",
    algorithmVersion: "user-profile-v0.13.1",
  };
}
export function v012Report(
  previous = false,
  snapshots?: { all: UserAnalysisDto; recent: UserAnalysisDto },
): PersonalReportDto {
  const all =
      snapshots?.all ??
      (previous ? v012HistoricalAnalysis("ALL") : v012Analysis("ALL")),
    recent =
      snapshots?.recent ??
      (previous ? v012HistoricalAnalysis("30D") : v012Analysis("30D"));
  return {
    reportId: fixtureUuid(previous ? 1401 : 1400),
    analysisSnapshotId: all.snapshotId,
    recentAnalysisSnapshotId: recent.snapshotId,
    sourceFingerprint: all.sourceFingerprint,
    statisticsSnapshot: {
      summary: all.summary,
      currentRating: all.currentRating,
      maxRating: all.maxRating,
      sourceAccountCount: all.sourceAccountCount,
      dataCutoffAt: all.dataCutoffAt,
    },
    profileSnapshot: {
      overallScore: all.overallScore,
      dimensions: all.dimensions,
      weakestDimension: all.weakestDimension,
      tagStats: all.tagStats,
      difficultyStats: all.difficultyStats,
    },
    recentTrainingSnapshot: {
      period: { start: recent.period.start!, end: recent.period.end },
      summary: recent.summary,
      tagStats: recent.tagStats,
      difficultyStats: recent.difficultyStats,
      activityStats: recent.activityStats,
    },
    content: {
      overview: previous
        ? "历史报告：当时尚无训练证据。"
        : "你已经形成稳定的训练节奏。",
      strengths: ["持续练习基础题"],
      weaknesses: ["图论练习较少"],
      recentTrend: "最近 30 天持续训练。",
      actionSuggestions: ["保持规律训练，复盘未通过题目。"],
      caution: previous ? "当时可用训练样本较少。" : null,
    },
    reportVersion: "personal-report-v0.12.1",
    promptVersion: "synthetic-prompt-v1",
    modelName: "synthetic-model",
    triggerType: "SCHEDULED",
    generatedAt: previous ? "2026-09-30T02:30:00Z" : "2026-10-02T02:35:00Z",
  };
}
export function v012HistoricalAnalysis(
  window: UserAnalysisDto["window"],
): UserAnalysisDto {
  const analysis = v012Analysis(window, true);
  const cutoff = "2026-09-30T02:30:00Z";
  return {
    ...analysis,
    snapshotId: fixtureUuid(
      2300 + ["7D", "30D", "365D", "ALL"].indexOf(window),
    ),
    sourceFingerprint: "synthetic-user-source-old",
    createdAt: "2026-09-30T02:31:00Z",
    dataCutoffAt: cutoff,
    period: {
      start:
        analysis.period.start === null
          ? null
          : new Date(
              Date.parse(analysis.period.start) - 2 * 86400000,
            ).toISOString(),
      end: cutoff,
    },
  };
}
export const v012Applications: JoinApplicationDto[] = (
  ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const
).map((status, index) => ({
  applicationId: fixtureUuid(1500 + index),
  team: teamSummarySchema.parse(v012Teams[0]),
  applicant: index === 1 ? v012Peer : v012Applicant,
  status,
  message: "希望加入训练",
  decisionReason: status === "REJECTED" ? "本期招募已满" : null,
  createdAt: "2026-10-01T02:30:00Z",
  decidedAt: status === "PENDING" ? null : "2026-10-02T02:30:00Z",
  decidedBy: status === "PENDING" ? null : v012Owner,
}));
export const v012Invitations: TeamInvitationDto[] = (
  ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"] as const
).map((status, index) => ({
  invitationId: fixtureUuid(1600 + index),
  team: teamSummarySchema.parse(index === 1 ? v012Teams[1] : v012Teams[2]),
  inviter: v012Peer,
  invitee: v012Owner,
  inviteeEmail: null,
  status,
  createdAt: "2026-10-01T02:30:00Z",
  lastSentAt: "2026-10-01T02:30:00Z",
  expiresAt:
    status === "EXPIRED" ? "2026-10-01T02:30:00Z" : "2030-10-08T02:30:00Z",
  respondedAt: status === "PENDING" ? null : "2026-10-02T02:30:00Z",
  emailDeliveryStatus: index === 0 ? "FAILED" : "SENT",
  emailDeliveryErrorCode: index === 0 ? "EMAIL_DELIVERY_FAILED" : null,
}));
export const v012OwnerInvitation: TeamInvitationDto = {
  ...v012Invitations[0],
  invitationId: fixtureUuid(1610),
  team: teamSummarySchema.parse(v012Teams[0]),
  inviter: v012Owner,
  invitee: null,
  inviteeEmail: "new-member@example.test",
  emailDeliveryStatus: "PENDING",
  emailDeliveryErrorCode: null,
};
export const v012Notifications: NotificationDto[] = (
  [
    "TEAM_INVITATION",
    "JOIN_APPLICATION_CREATED",
    "JOIN_APPLICATION_APPROVED",
    "JOIN_APPLICATION_REJECTED",
    "MEMBER_JOINED",
    "MEMBER_REMOVED",
    "TEAM_INVITATION_CANCELLED",
    "JOIN_APPLICATION_CANCELLED",
  ] as const
).map((type, index) => ({
  notificationId: fixtureUuid(1700 + index),
  type,
  title: [
    "收到团队邀请",
    "有新的加入申请",
    "加入申请已通过",
    "加入申请被拒绝",
    "新成员加入团队",
    "团队成员已移除",
    "团队邀请已取消",
    "加入申请已取消",
  ][index],
  body: "团队状态已更新，请查看最新记录。",
  teamId: v012Teams[type.startsWith("TEAM_INVITATION") ? 2 : 0].teamId,
  actor: v012Peer,
  referenceType: type.startsWith("TEAM_INVITATION")
    ? "INVITATION"
    : type.startsWith("JOIN_APPLICATION")
      ? "APPLICATION"
      : "MEMBERSHIP",
  referenceId: fixtureUuid(
    type.startsWith("TEAM_INVITATION")
      ? type === "TEAM_INVITATION_CANCELLED"
        ? 1604
        : 1600
      : type.startsWith("JOIN_APPLICATION")
        ? type === "JOIN_APPLICATION_APPROVED"
          ? 1501
          : type === "JOIN_APPLICATION_REJECTED"
            ? 1502
            : type === "JOIN_APPLICATION_CANCELLED"
              ? 1503
              : 1500
        : type === "MEMBER_REMOVED"
          ? 3301
          : 1201,
  ),
  payload: {},
  read: index > 1,
  createdAt: "2026-10-02T02:30:00Z",
}));
export function v012TeamAnalysis(
  teamId = v012Teams[0].teamId,
  audience: TeamAnalysisAudience = "COACH",
  empty = false,
): TeamAnalysisDto {
  const source = v012Analysis();
  const included = empty ? 0 : audience === "COACH" ? 2 : 1;
  return {
    snapshotId: fixtureUuid(
      1800 +
        Math.max(
          0,
          v012Teams.findIndex((team) => team.teamId === teamId),
        ) *
          10 +
        (audience === "MEMBER" ? 1 : 0),
    ),
    teamId,
    audience,
    memberCount: 2,
    includedMemberCount: included,
    excludedMemberCount: 2 - included,
    trainingMemberCount: empty ? 0 : 2,
    levelMemberCount: empty ? 0 : 1,
    overallScore: empty ? 0 : source.overallScore,
    dimensions: source.dimensions.map((item) => ({
      code: item.code,
      name: item.name,
      displayOrder: item.displayOrder,
      score: empty ? 0 : item.score,
      memberSampleCount: included,
      rankOrder: item.rankOrder,
    })),
    weakestDimension: source.weakestDimension,
    activityStats: empty
      ? []
      : source.activityStats.map((item) => ({
          date: item.date,
          submissionCount: item.submissionCount,
          acceptedSubmissionCount: item.acceptedSubmissionCount,
          activeMemberCount: 1,
        })),
    targetRating: empty ? null : 1500,
    sourceFingerprint: "synthetic-team-source-v1",
    algorithmVersion: "team-profile-v0.12.1",
    mappingVersion: source.mappingVersion,
    dataCutoffAt: source.dataCutoffAt,
    createdAt: source.createdAt,
    stale: false,
  };
}
export function v012TeamBatch(
  teamId = v012Teams[0].teamId,
  audience: TeamAnalysisAudience = "COACH",
  empty = false,
): TeamRecommendationBatchDto {
  const analysis = v012TeamAnalysis(teamId, audience);
  return {
    batchId: fixtureUuid(
      1900 +
        Math.max(
          0,
          v012Teams.findIndex((team) => team.teamId === teamId),
        ) *
          10 +
        (audience === "MEMBER" ? 1 : 0),
    ),
    teamId,
    analysisSnapshotId: analysis.snapshotId,
    audience,
    mode: "HYBRID",
    targetRating: 1500,
    targetDimension: analysis.weakestDimension,
    candidateCount: empty ? 0 : 1,
    resultCount: empty ? 0 : 1,
    recommendations: empty
      ? []
      : [
          {
            rank: 1,
            problem: demoProblem,
            score: 0.8,
            reasonCode: "TEAM_WEAKNESS_MATCH",
            reason: "这道题覆盖团队当前相对薄弱的能力。",
          },
        ],
    algorithmVersion: "team-recommend-v0.12.1",
    mappingVersion: analysis.mappingVersion,
    generatedAt: "2026-10-02T02:35:00Z",
    stale: false,
  };
}
export function v012Job(
  status: AiJobDto["status"] = "QUEUED",
  type: AiJobDto["type"] = "USER_ANALYSIS",
): AiJobDto {
  return {
    jobId: fixtureUuid(2000),
    type,
    triggerType: "MANUAL",
    status,
    resultId: status === "SUCCESS" ? fixtureUuid(1303) : null,
    errors:
      status === "FAILED"
        ? [
            {
              code: "LLM_UNAVAILABLE",
              message: "Synthetic service unavailable",
              retryable: true,
            },
          ]
        : [],
    requestedAt: "2026-10-02T02:30:00Z",
    startedAt: status === "QUEUED" ? null : "2026-10-02T02:31:00Z",
    finishedAt: ["SUCCESS", "FAILED"].includes(status)
      ? "2026-10-02T02:32:00Z"
      : null,
  };
}

export const notificationReadFixtures = {
  unread: v012Notifications.map((notification) => ({
    ...notification,
    read: false,
  })),
  read: v012Notifications.map((notification) => ({
    ...notification,
    read: true,
  })),
} satisfies Record<string, NotificationDto[]>;
