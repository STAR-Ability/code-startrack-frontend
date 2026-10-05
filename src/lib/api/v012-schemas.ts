import { z } from "zod";
import {
  analysisSchema,
  algorithmVersionSchema,
  dimensionCodes,
  idSchema,
  instantSchema,
  problemSchema,
  summarySchema,
  submissionSchema,
  uuidSchema,
  windows,
} from "./schemas.ts";
const count = z.number().int().nonnegative().safe();
const number = z.number().finite();
const text = z.string().nullable();
const period = analysisSchema.shape.period;
const dimensions = analysisSchema.shape.dimensions;
const tagStats = analysisSchema.shape.tagStats;
const difficultyStats = analysisSchema.shape.difficultyStats;
const activityStats = analysisSchema.shape.activityStats;
export const privacyScopes = [
  "PRIVATE",
  "TEAM_COACH",
  "TEAM_MEMBER",
  "PUBLIC",
] as const;
export const applicationStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export const invitationStatuses = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;
export const audiences = ["COACH", "MEMBER"] as const;
export const teamModes = ["WEAKNESS", "HYBRID"] as const;
export const userBriefSchema = z.object({
  publicId: uuidSchema,
  username: z.string(),
  displayName: text,
  avatarUrl: text,
});
export const teamSummarySchema = z.object({
  teamId: uuidSchema,
  name: z.string(),
  description: text,
  avatarUrl: text,
  status: z.enum(["ACTIVE", "ARCHIVED", "DISSOLVED"]),
  owner: userBriefSchema,
  memberCount: count,
  createdAt: instantSchema,
  updatedAt: instantSchema,
  myMembershipRole: z.enum(["OWNER", "MEMBER"]).nullable(),
  myJoinApplicationStatus: z.enum(applicationStatuses).nullable(),
  myInvitationStatus: z.enum(invitationStatuses).nullable(),
});
export const teamDetailSchema = teamSummarySchema.extend({
  creator: userBriefSchema,
  canManage: z.boolean(),
  canLeave: z.boolean(),
});
export const memberAccessSchema = z.object({
  basicTraining: z.boolean(),
  abilityProfile: z.boolean(),
  detailedSubmissions: z.boolean(),
  analysisReport: z.boolean(),
});
export const teamMemberSchema = z.object({
  membershipId: uuidSchema,
  teamId: uuidSchema,
  user: userBriefSchema,
  role: z.enum(["OWNER", "MEMBER"]),
  status: z.enum(["ACTIVE", "LEFT", "REMOVED"]),
  joinedAt: instantSchema,
  endedAt: instantSchema.nullable(),
  dataAccess: memberAccessSchema,
});
export const applicationSchema = z.object({
  applicationId: uuidSchema,
  team: teamSummarySchema,
  applicant: userBriefSchema,
  status: z.enum(applicationStatuses),
  message: text,
  decisionReason: text,
  createdAt: instantSchema,
  decidedAt: instantSchema.nullable(),
  decidedBy: userBriefSchema.nullable(),
});
export const invitationSchema = z.object({
  invitationId: uuidSchema,
  team: teamSummarySchema,
  inviter: userBriefSchema,
  invitee: userBriefSchema.nullable(),
  inviteeEmail: text,
  status: z.enum(invitationStatuses),
  createdAt: instantSchema,
  lastSentAt: instantSchema,
  expiresAt: instantSchema,
  respondedAt: instantSchema.nullable(),
  emailDeliveryStatus: z.enum(["PENDING", "SENT", "FAILED"]),
  emailDeliveryErrorCode: text,
});
export const privacySchema = z.object({
  basicTraining: z.enum(privacyScopes),
  abilityProfile: z.enum(privacyScopes),
  detailedSubmissions: z.enum(privacyScopes),
  analysisReport: z.enum(privacyScopes),
  updatedAt: instantSchema,
});
export const ratingAccountSchema = z.object({
  accountId: idSchema,
  platform: z.literal("codeforces"),
  username: z.string(),
  bindStatus: z.enum(["ACTIVE", "INVALID"]),
  currentRating: number.nullable(),
  maxRating: number.nullable(),
  lastSyncedAt: instantSchema,
});
export const userAnalysisSchema = z.object({
  publicId: uuidSchema,
  snapshotId: uuidSchema,
  window: z.enum(windows),
  period,
  summary: summarySchema,
  currentRating: number.nullable(),
  maxRating: number.nullable(),
  ratingAccounts: z.array(ratingAccountSchema),
  overallScore: number.min(0).max(100),
  dimensions,
  weakestDimension: z.enum(dimensionCodes),
  tagStats,
  difficultyStats,
  activityStats,
  sourceAccountCount: count,
  sourceAccountIds: z.array(idSchema),
  sourceFingerprint: z.string(),
  algorithmVersion: algorithmVersionSchema,
  mappingVersion: z.string(),
  timezone: z.string(),
  dataCutoffAt: instantSchema,
  createdAt: instantSchema,
  stale: z.boolean(),
});
export const sharedTrainingSchema = userAnalysisSchema.pick({
  publicId: true,
  snapshotId: true,
  window: true,
  period: true,
  summary: true,
  currentRating: true,
  maxRating: true,
  tagStats: true,
  difficultyStats: true,
  activityStats: true,
  sourceAccountCount: true,
  dataCutoffAt: true,
  stale: true,
});
export const sharedProfileSchema = userAnalysisSchema.pick({
  publicId: true,
  snapshotId: true,
  window: true,
  overallScore: true,
  dimensions: true,
  weakestDimension: true,
  dataCutoffAt: true,
  stale: true,
});
export const reportContentSchema = z.object({
  overview: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recentTrend: z.string(),
  actionSuggestions: z.array(z.string()),
  caution: text,
});
export const reportStatisticsSchema = z.object({
  summary: summarySchema,
  currentRating: number.nullable(),
  maxRating: number.nullable(),
  sourceAccountCount: count,
  dataCutoffAt: instantSchema,
});
export const reportProfileSchema = z.object({
  overallScore: number.min(0).max(100),
  dimensions,
  weakestDimension: z.enum(dimensionCodes),
  tagStats,
  difficultyStats,
});
export const reportRecentSchema = z.object({
  period: z.object({ start: instantSchema, end: instantSchema }),
  summary: summarySchema,
  tagStats,
  difficultyStats,
  activityStats,
});
export const personalReportSchema = z.object({
  reportId: uuidSchema,
  analysisSnapshotId: uuidSchema,
  recentAnalysisSnapshotId: uuidSchema,
  sourceFingerprint: z.string(),
  statisticsSnapshot: reportStatisticsSchema,
  profileSnapshot: reportProfileSchema,
  recentTrainingSnapshot: reportRecentSchema,
  content: reportContentSchema,
  reportVersion: algorithmVersionSchema,
  promptVersion: z.string(),
  modelName: z.string(),
  triggerType: z.enum(["SCHEDULED", "MANUAL"]),
  generatedAt: instantSchema,
});
export const aiJobSchema = z.object({
  jobId: uuidSchema,
  type: z.enum([
    "USER_ANALYSIS",
    "PERSONAL_REPORT",
    "TEAM_ANALYSIS",
    "TEAM_RECOMMENDATION",
  ]),
  triggerType: z.enum(["MANUAL", "SCHEDULED", "SYSTEM"]),
  status: z.enum(["QUEUED", "RUNNING", "SUCCESS", "FAILED"]),
  resultId: uuidSchema.nullable(),
  errors: z.array(
    z.object({ code: z.string(), message: z.string(), retryable: z.boolean() }),
  ),
  requestedAt: instantSchema,
  startedAt: instantSchema.nullable(),
  finishedAt: instantSchema.nullable(),
});
export const notificationSchema = z.object({
  notificationId: uuidSchema,
  type: z.enum([
    "TEAM_INVITATION",
    "TEAM_INVITATION_CANCELLED",
    "JOIN_APPLICATION_CREATED",
    "JOIN_APPLICATION_APPROVED",
    "JOIN_APPLICATION_REJECTED",
    "JOIN_APPLICATION_CANCELLED",
    "MEMBER_JOINED",
    "MEMBER_REMOVED",
  ]),
  title: z.string(),
  body: z.string(),
  teamId: uuidSchema.nullable(),
  actor: userBriefSchema.nullable(),
  referenceType: z
    .enum(["APPLICATION", "INVITATION", "MEMBERSHIP", "TEAM"])
    .nullable(),
  referenceId: uuidSchema.nullable(),
  payload: z.record(z.string(), z.unknown()),
  read: z.boolean(),
  createdAt: instantSchema,
});
export const teamDimensionSchema = z.object({
  code: z.enum(dimensionCodes),
  name: z.string(),
  displayOrder: count,
  score: number.min(0).max(100),
  memberSampleCount: count,
  rankOrder: z.number().int().min(1).max(6),
});
export const teamActivitySchema = z.object({
  date: z.iso.date(),
  submissionCount: count,
  acceptedSubmissionCount: count,
  activeMemberCount: count,
});
export const teamAnalysisSchema = z.object({
  snapshotId: uuidSchema,
  teamId: uuidSchema,
  audience: z.enum(audiences),
  memberCount: count,
  includedMemberCount: count,
  excludedMemberCount: count,
  trainingMemberCount: count,
  levelMemberCount: count,
  overallScore: number.min(0).max(100),
  dimensions: z.array(teamDimensionSchema).length(6),
  weakestDimension: z.enum(dimensionCodes),
  activityStats: z.array(teamActivitySchema),
  targetRating: number.nullable(),
  sourceFingerprint: z.string(),
  algorithmVersion: algorithmVersionSchema,
  mappingVersion: z.string(),
  dataCutoffAt: instantSchema,
  createdAt: instantSchema,
  stale: z.boolean(),
});
export const teamRecommendationItemSchema = z.object({
  rank: z.number().int().positive(),
  problem: problemSchema,
  score: number,
  reasonCode: z.enum([
    "TEAM_WEAKNESS_MATCH",
    "TEAM_LEVEL_MATCH",
    "TEAM_COVERAGE_GAP",
    "TEAM_BALANCED_PRACTICE",
  ]),
  reason: z.string(),
});
export const teamBatchSchema = z.object({
  batchId: uuidSchema,
  teamId: uuidSchema,
  analysisSnapshotId: uuidSchema,
  audience: z.enum(audiences),
  mode: z.enum(teamModes),
  targetRating: number,
  targetDimension: z.enum(dimensionCodes),
  candidateCount: count,
  resultCount: count,
  recommendations: z.array(teamRecommendationItemSchema),
  algorithmVersion: algorithmVersionSchema,
  mappingVersion: z.string(),
  generatedAt: instantSchema,
  stale: z.boolean(),
});
export const coachDashboardSchema = z.object({
  managedTeamCount: count,
  activeMemberCount: count,
  pendingApplicationCount: count,
  recentNotifications: z.array(notificationSchema),
});
export type UserBriefDto = z.infer<typeof userBriefSchema>;
export type TeamSummaryDto = z.infer<typeof teamSummarySchema>;
export type TeamDetailDto = z.infer<typeof teamDetailSchema>;
export type TeamMemberDto = z.infer<typeof teamMemberSchema>;
export type TeamMemberDataAccessDto = z.infer<typeof memberAccessSchema>;
export type JoinApplicationDto = z.infer<typeof applicationSchema>;
export type TeamInvitationDto = z.infer<typeof invitationSchema>;
export type PrivacySettingsDto = z.infer<typeof privacySchema>;
export type UserAnalysisDto = z.infer<typeof userAnalysisSchema>;
export type UserRatingAccountDto = z.infer<typeof ratingAccountSchema>;
export type SharedTrainingOverviewDto = z.infer<typeof sharedTrainingSchema>;
export type SharedAbilityProfileDto = z.infer<typeof sharedProfileSchema>;
export type PersonalReportDto = z.infer<typeof personalReportSchema>;
export type PersonalReportContentDto = z.infer<typeof reportContentSchema>;
export type ReportStatisticsSnapshotDto = z.infer<
  typeof reportStatisticsSchema
>;
export type ReportProfileSnapshotDto = z.infer<typeof reportProfileSchema>;
export type ReportRecentTrainingSnapshotDto = z.infer<
  typeof reportRecentSchema
>;
export type AiJobDto = z.infer<typeof aiJobSchema>;
export type AiJobErrorDto = AiJobDto["errors"][number];
export type NotificationDto = z.infer<typeof notificationSchema>;
export type TeamAnalysisDto = z.infer<typeof teamAnalysisSchema>;
export type TeamRecommendationBatchDto = z.infer<typeof teamBatchSchema>;
export type TeamRecommendationItemDto = z.infer<
  typeof teamRecommendationItemSchema
>;
export type CoachDashboardDto = z.infer<typeof coachDashboardSchema>;
export type PrivacyScope = PrivacySettingsDto["basicTraining"];
export type TeamAnalysisAudience = TeamAnalysisDto["audience"];
export type TeamRecommendationMode = TeamRecommendationBatchDto["mode"];
export type JoinApplicationStatus = JoinApplicationDto["status"];
export type TeamInvitationStatus = TeamInvitationDto["status"];
export type TeamStatus = TeamSummaryDto["status"];
export type TeamMemberRole = TeamMemberDto["role"];
export type TeamMemberStatus = TeamMemberDto["status"];
export type AiJobStatus = AiJobDto["status"];
export type AiJobType = AiJobDto["type"];
export type AiJobTrigger = AiJobDto["triggerType"];
export type NotificationType = NotificationDto["type"];
export type TeamReasonCode = TeamRecommendationItemDto["reasonCode"];
export type TeamDimensionScoreDto = z.infer<typeof teamDimensionSchema>;
export type TeamActivityStatDto = z.infer<typeof teamActivitySchema>;

export const userSubmissionSchema = z.object({
  sourceAccount: z.object({
    accountId: idSchema,
    platform: z.literal("codeforces"),
    username: z.string(),
  }),
  submission: submissionSchema,
});
export type UserSubmissionDto = z.infer<typeof userSubmissionSchema>;
