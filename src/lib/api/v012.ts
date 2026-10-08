import { z } from "zod";
import { readData, readPage, request, queryString } from "./client";
import {
  userSchema,
  uuidSchema,
  type AnalysisWindow,
  type SubmissionDto,
} from "./schemas";
import {
  aiJobSchema,
  applicationSchema,
  coachDashboardSchema,
  invitationSchema,
  notificationSchema,
  personalReportSchema,
  privacySchema,
  sharedProfileSchema,
  sharedTrainingSchema,
  teamAnalysisSchema,
  teamBatchSchema,
  teamDetailSchema,
  teamMemberSchema,
  teamSummarySchema,
  userAnalysisSchema,
  userSubmissionSchema,
  type JoinApplicationStatus,
  type PrivacySettingsDto,
  type TeamAnalysisAudience,
  type TeamInvitationStatus,
  type TeamMemberStatus,
  type TeamRecommendationMode,
} from "./v012-schemas";
export type Paging = { page?: number; pageSize?: number };
export type TeamInput = {
  name: string;
  description: string | null;
  avatarUrl: string | null;
};
const uuid = (id: string) => uuidSchema.parse(id);
const team = (id: string) => `/teams/${uuid(id)}`;
const member = (teamId: string, publicId: string) =>
  `${team(teamId)}/members/${uuid(publicId)}`;
export const v012 = {
  userOverview: (
    publicId: string,
    window: AnalysisWindow = "30D",
    signal?: AbortSignal,
  ) =>
    readData(
      `/me/training/overview${queryString({ window })}`,
      userAnalysisSchema.nullable(),
      { signal },
      undefined,
      { publicId, window },
    ),
  userAnalysis: (
    publicId: string,
    window: AnalysisWindow = "ALL",
    signal?: AbortSignal,
  ) =>
    readData(
      `/me/analysis/latest${queryString({ window })}`,
      userAnalysisSchema.nullable(),
      { signal },
      undefined,
      { publicId, window },
    ),
  userAnalysisHistory: (
    publicId: string,
    window: AnalysisWindow,
    paging: Paging,
    signal?: AbortSignal,
  ) =>
    readPage(
      `/me/analysis/history${queryString({ window, ...paging })}`,
      userAnalysisSchema,
      signal,
      undefined,
      { publicId, window },
    ),
  userSnapshot: (publicId: string, snapshotId: string, signal?: AbortSignal) =>
    readData(
      `/me/analysis/${uuid(snapshotId)}`,
      userAnalysisSchema,
      { signal },
      undefined,
      { publicId, snapshotId },
    ),
  rebuildUser: () =>
    readData(
      "/me/analysis/rebuild",
      aiJobSchema,
      { method: "POST" },
      undefined,
      { type: "USER_ANALYSIS" },
    ),
  latestReport: (signal?: AbortSignal) =>
    readData("/me/reports/latest", personalReportSchema.nullable(), { signal }),
  reports: (paging: Paging, signal?: AbortSignal) =>
    readPage(`/me/reports${queryString(paging)}`, personalReportSchema, signal),
  report: (reportId: string, signal?: AbortSignal) =>
    readData(
      `/me/reports/${uuid(reportId)}`,
      personalReportSchema,
      { signal },
      undefined,
      { reportId },
    ),
  generateReport: () =>
    readData(
      "/me/reports/generate",
      aiJobSchema,
      { method: "POST" },
      undefined,
      { type: "PERSONAL_REPORT" },
    ),
  aiJob: (jobId: string, signal?: AbortSignal) =>
    readData(`/ai-jobs/${uuid(jobId)}`, aiJobSchema, { signal }, undefined, {
      jobId,
    }),
  createTeam: (body: TeamInput) =>
    readData("/teams", teamDetailSchema, { method: "POST", body }),
  mine: (
    scope: "ALL" | "JOINED" | "MANAGED",
    paging: Paging,
    signal?: AbortSignal,
  ) =>
    readPage(
      `/teams/mine${queryString({ scope, ...paging })}`,
      teamSummarySchema,
      signal,
    ),
  searchTeams: (q: string, paging: Paging, signal?: AbortSignal) =>
    readPage(
      `/teams/search${queryString({ q, ...paging })}`,
      teamSummarySchema,
      signal,
    ),
  team: (teamId: string, signal?: AbortSignal) =>
    readData(team(teamId), teamDetailSchema, { signal }, undefined, { teamId }),
  updateTeam: (teamId: string, body: Partial<TeamInput>) =>
    readData(
      team(teamId),
      teamDetailSchema,
      {
        method: "PATCH",
        body: {
          ...body,
          ...(body.description === null ? { description: "" } : {}),
          ...(body.avatarUrl === null ? { avatarUrl: "" } : {}),
        },
      },
      undefined,
      { teamId },
    ),
  archiveTeam: (teamId: string) =>
    readData(
      `${team(teamId)}/archive`,
      teamDetailSchema,
      { method: "POST" },
      undefined,
      { teamId },
    ),
  activateTeam: (teamId: string) =>
    readData(
      `${team(teamId)}/activate`,
      teamDetailSchema,
      { method: "POST" },
      undefined,
      { teamId },
    ),
  dissolveTeam: (teamId: string, confirmation: string) =>
    readData(
      `${team(teamId)}/dissolve`,
      teamDetailSchema,
      { method: "POST", body: { confirmation } },
      undefined,
      { teamId },
    ),
  transferTeam: (teamId: string, newOwnerPublicId: string) =>
    readData(
      `${team(teamId)}/transfer`,
      teamDetailSchema,
      { method: "POST", body: { newOwnerPublicId: uuid(newOwnerPublicId) } },
      undefined,
      { teamId },
    ),
  apply: (teamId: string, message?: string) =>
    readData(`${team(teamId)}/applications`, applicationSchema, {
      method: "POST",
      body: message ? { message } : {},
    }),
  myApplications: (
    filters: Paging & { status?: JoinApplicationStatus },
    signal?: AbortSignal,
  ) =>
    readPage(
      `/me/team-applications${queryString(filters)}`,
      applicationSchema,
      signal,
    ),
  applications: (
    teamId: string,
    filters: Paging & { status?: JoinApplicationStatus },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${team(teamId)}/applications${queryString(filters)}`,
      applicationSchema,
      signal,
    ),
  cancelApplication: (id: string) =>
    readData(
      `/team-applications/${uuid(id)}/cancel`,
      applicationSchema,
      { method: "POST" },
      undefined,
      { applicationId: id },
    ),
  approveApplication: (id: string) =>
    readData(
      `/team-applications/${uuid(id)}/approve`,
      applicationSchema,
      { method: "POST" },
      undefined,
      { applicationId: id },
    ),
  rejectApplication: (id: string, reason?: string) =>
    readData(
      `/team-applications/${uuid(id)}/reject`,
      applicationSchema,
      { method: "POST", body: reason ? { reason } : {} },
      undefined,
      { applicationId: id },
    ),
  invite: (teamId: string, email: string) =>
    readData(`${team(teamId)}/invitations`, invitationSchema, {
      method: "POST",
      body: { email },
    }),
  invitations: (
    teamId: string,
    filters: Paging & { status?: TeamInvitationStatus },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${team(teamId)}/invitations${queryString(filters)}`,
      invitationSchema,
      signal,
    ),
  myInvitations: (
    filters: Paging & { status?: TeamInvitationStatus },
    signal?: AbortSignal,
  ) =>
    readPage(
      `/me/team-invitations${queryString(filters)}`,
      invitationSchema,
      signal,
    ),
  cancelInvitation: (id: string) =>
    readData(
      `/team-invitations/${uuid(id)}/cancel`,
      invitationSchema,
      { method: "POST" },
      undefined,
      { invitationId: id },
    ),
  resendInvitation: (id: string) =>
    readData(
      `/team-invitations/${uuid(id)}/resend`,
      invitationSchema,
      { method: "POST" },
      undefined,
      { invitationId: id },
    ),
  acceptInvitation: (id: string) =>
    readData(
      `/team-invitations/${uuid(id)}/accept`,
      invitationSchema,
      { method: "POST" },
      undefined,
      { invitationId: id },
    ),
  rejectInvitation: (id: string) =>
    readData(
      `/team-invitations/${uuid(id)}/reject`,
      invitationSchema,
      { method: "POST" },
      undefined,
      { invitationId: id },
    ),
  members: (
    teamId: string,
    paging: Paging & { status?: TeamMemberStatus },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${team(teamId)}/members${queryString(paging)}`,
      teamMemberSchema,
      signal,
      undefined,
      { teamId },
    ),
  removeMember: (teamId: string, publicId: string, reason?: string) =>
    request(member(teamId, publicId), z.undefined(), {
      method: "DELETE",
      ...(reason ? { body: { reason } } : {}),
    }),
  leaveTeam: (teamId: string) =>
    request(`${team(teamId)}/leave`, z.undefined(), { method: "POST" }),
  privacy: (signal?: AbortSignal) =>
    readData("/me/privacy", privacySchema, { signal }),
  updatePrivacy: (body: Partial<Omit<PrivacySettingsDto, "updatedAt">>) =>
    readData("/me/privacy", privacySchema, { method: "PATCH", body }),
  memberTraining: (
    teamId: string,
    publicId: string,
    signal?: AbortSignal,
    window?: AnalysisWindow,
  ) =>
    readData(
      `${member(teamId, publicId)}/training/overview${queryString({ window })}`,
      sharedTrainingSchema.nullable(),
      { signal },
      undefined,
      { publicId, ...(window ? { window } : {}) },
    ),
  memberProfile: (
    teamId: string,
    publicId: string,
    signal?: AbortSignal,
    window?: AnalysisWindow,
  ) =>
    readData(
      `${member(teamId, publicId)}/profile${queryString({ window })}`,
      sharedProfileSchema.nullable(),
      { signal },
      undefined,
      { publicId, ...(window ? { window } : {}) },
    ),
  memberSubmissions: (
    teamId: string,
    publicId: string,
    paging: Paging & {
      verdict?: SubmissionDto["verdict"];
      problemId?: string;
      from?: string;
      to?: string;
    },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${member(teamId, publicId)}/submissions${queryString(paging)}`,
      userSubmissionSchema,
      signal,
    ),
  memberReports: (
    teamId: string,
    publicId: string,
    paging: Paging,
    signal?: AbortSignal,
  ) =>
    readPage(
      `${member(teamId, publicId)}/reports${queryString(paging)}`,
      personalReportSchema,
      signal,
    ),
  memberReport: (
    teamId: string,
    publicId: string,
    reportId: string,
    signal?: AbortSignal,
  ) =>
    readData(
      `${member(teamId, publicId)}/reports/${uuid(reportId)}`,
      personalReportSchema,
      { signal },
      undefined,
      { reportId },
    ),
  teamAnalysis: (teamId: string, signal?: AbortSignal) =>
    readData(
      `${team(teamId)}/analysis/latest`,
      teamAnalysisSchema.nullable(),
      { signal },
      undefined,
      { teamId },
    ),
  teamAnalysisHistory: (teamId: string, paging: Paging, signal?: AbortSignal) =>
    readPage(
      `${team(teamId)}/analysis/history${queryString(paging)}`,
      teamAnalysisSchema,
      signal,
      undefined,
      { teamId },
    ),
  rebuildTeam: (teamId: string) =>
    readData(
      `${team(teamId)}/analysis/rebuild`,
      aiJobSchema,
      { method: "POST" },
      undefined,
      { type: "TEAM_ANALYSIS" },
    ),
  teamRecommendations: (
    teamId: string,
    audience: TeamAnalysisAudience,
    mode: TeamRecommendationMode,
    signal?: AbortSignal,
  ) =>
    readData(
      `${team(teamId)}/recommendations/latest${queryString({ audience, mode })}`,
      teamBatchSchema.nullable(),
      { signal },
      undefined,
      { teamId, audience, mode },
    ),
  teamRecommendationHistory: (
    teamId: string,
    audience: TeamAnalysisAudience,
    mode: TeamRecommendationMode | undefined,
    paging: Paging,
    signal?: AbortSignal,
  ) =>
    readPage(
      `${team(teamId)}/recommendations/history${queryString({ audience, mode, ...paging })}`,
      teamBatchSchema,
      signal,
      undefined,
      { teamId, audience, ...(mode ? { mode } : {}) },
    ),
  teamBatch: (
    teamId: string,
    batchId: string,
    audience: TeamAnalysisAudience,
    signal?: AbortSignal,
  ) =>
    readData(
      `${team(teamId)}/recommendations/${uuid(batchId)}`,
      teamBatchSchema,
      { signal },
      undefined,
      { teamId, batchId, audience },
    ),
  generateTeamRecommendations: (
    teamId: string,
    body: {
      audience: TeamAnalysisAudience;
      mode?: TeamRecommendationMode;
      limit?: number;
    },
  ) =>
    readData(
      `${team(teamId)}/recommendations/generate`,
      aiJobSchema,
      { method: "POST", body },
      undefined,
      { type: "TEAM_RECOMMENDATION" },
    ),
  coachDashboard: (signal?: AbortSignal) =>
    readData("/coach/dashboard", coachDashboardSchema, { signal }),
  redeemCoachCode: (code: string) =>
    readData("/coach-invite-codes/redeem", z.object({ user: userSchema }), {
      method: "POST",
      body: { code },
    }),
  notifications: (
    filters: Paging & { unreadOnly?: boolean },
    signal?: AbortSignal,
  ) =>
    readPage(
      `/notifications${queryString(filters)}`,
      notificationSchema,
      signal,
    ),
  unreadCount: (signal?: AbortSignal) =>
    readData(
      "/notifications/unread-count",
      z.object({ count: z.number().int().nonnegative().safe() }),
      { signal },
    ),
  readNotification: (id: string) =>
    readData(
      `/notifications/${uuid(id)}/read`,
      notificationSchema,
      { method: "POST" },
      undefined,
      { notificationId: id },
    ),
  readAllNotifications: () =>
    readData(
      "/notifications/read-all",
      z.object({ updated: z.number().int().nonnegative().safe() }),
      { method: "POST" },
    ),
};
