import { collaborationFixture } from "../demo/v012-scenarios.ts";
import { demoSubmissions, fixtureUuid } from "../demo/fixtures.ts";
import {
  v012Analysis,
  v012HistoricalAnalysis,
  v012Report,
  v012Teams,
  v012Members,
  v012Applications,
  v012OwnerInvitation,
  v012Notifications,
  v012Privacy,
  v012MixedPrivacy,
  v012TeamAnalysis,
  v012TeamBatch,
  v012Job,
} from "../demo/v012-fixtures.ts";
import {
  teamSummarySchema,
  sharedTrainingSchema,
  sharedProfileSchema,
} from "../api/v012-schemas.ts";
// Synthetic business transitions are confined to this offline service.
export function createV012Mock() {
  let teams,
    members,
    applications,
    invitations,
    privacy,
    notifications,
    reports,
    analyses,
    teamAnalyses,
    teamBatches,
    jobs;
  let sequence = 10000;
  const nextId = () => fixtureUuid(sequence++);
  const timestamp = () =>
    new Date(
      Date.parse("2026-10-04T00:00:00Z") + sequence++ * 1000,
    ).toISOString();
  let configForSnapshots = {};
  function teamSnapshot(teamId, audience, noSharing) {
    const analysis = v012TeamAnalysis(teamId, audience, noSharing);
    analysis.memberCount = members.filter(
      (item) => item.teamId === teamId && item.status === "ACTIVE",
    ).length;
    analysis.includedMemberCount = Math.min(
      analysis.includedMemberCount,
      analysis.memberCount,
    );
    analysis.excludedMemberCount =
      analysis.memberCount - analysis.includedMemberCount;
    analysis.trainingMemberCount = Math.min(
      analysis.trainingMemberCount,
      analysis.memberCount,
    );
    analysis.levelMemberCount = Math.min(
      analysis.levelMemberCount,
      analysis.trainingMemberCount,
    );
    analysis.dimensions.forEach(
      (item) => (item.memberSampleCount = analysis.includedMemberCount),
    );
    if (configForSnapshots.noAbility) {
      analysis.includedMemberCount = 0;
      analysis.excludedMemberCount = analysis.memberCount;
      analysis.overallScore = 0;
      analysis.dimensions.forEach((d) => {
        d.score = 0;
        d.memberSampleCount = 0;
      });
    }
    if (configForSnapshots.noTraining) {
      analysis.trainingMemberCount = 0;
      analysis.activityStats = [];
    }
    if (configForSnapshots.noLevel || !analysis.trainingMemberCount)
      analysis.levelMemberCount = 0;
    if (!analysis.levelMemberCount) analysis.targetRating = null;
    analysis.stale = !!configForSnapshots.stale;
    return analysis;
  }
  function reset(config) {
    sequence = 10000;
    configForSnapshots = config;
    const fixture = collaborationFixture(config);
    ({ teams, members, applications, invitations } = fixture);
    if (config.identity) {
      const sourceAccounts = fixture.identity.accounts;
      config.noAccounts = sourceAccounts.length === 0;
    }
    privacy = structuredClone(
      config.mixedPrivacy ? v012MixedPrivacy : v012Privacy,
    );
    notifications = config.noNotifications
      ? []
      : structuredClone(v012Notifications);
    if (config.notificationsRead !== undefined)
      notifications.forEach((item) => {
        item.read = config.notificationsRead;
      });
    analyses = ["7D", "30D", "365D", "ALL"].map((window) => ({
      ...v012Analysis(window, !!config.zero || !!config.emptyRecords),
      stale: !!config.stale || !!config.invalid,
    }));
    if (config.identity || config.oneAccount || config.noAccounts) {
      const accounts = config.identity
        ? fixture.identity.accounts
        : config.noAccounts
          ? []
          : v012Analysis().ratingAccounts.slice(0, 1);
      analyses.forEach((item) => {
        item.ratingAccounts = item.ratingAccounts.filter((a) =>
          accounts.some((b) => b.accountId === a.accountId),
        );
        item.sourceAccountIds = item.ratingAccounts.map((a) => a.accountId);
        item.sourceAccountCount = item.ratingAccounts.length;
      });
    }
    const previous = analyses.map((item) =>
      v012HistoricalAnalysis(item.window),
    );
    reports = [
      v012Report(false, {
        all: analyses.find((item) => item.window === "ALL"),
        recent: analyses.find((item) => item.window === "30D"),
      }),
      v012Report(true),
    ];
    reports[1].analysisSnapshotId = previous.find(
      (item) => item.window === "ALL",
    ).snapshotId;
    reports[1].recentAnalysisSnapshotId = previous.find(
      (item) => item.window === "30D",
    ).snapshotId;
    analyses.push(...previous);
    teamAnalyses = [];
    teamBatches = [];
    jobs = new Map();
    for (const team of teams.filter((team) => team.status !== "DISSOLVED"))
      for (const audience of ["COACH", "MEMBER"]) {
        const analysis = teamSnapshot(
          team.teamId,
          audience,
          !!config.noSharing,
        );
        teamAnalyses.push(analysis);
        for (const mode of ["HYBRID", "WEAKNESS"]) {
          const batch = v012TeamBatch(
            team.teamId,
            audience,
            !!config.emptyCandidates,
          );
          batch.batchId = nextId();
          batch.analysisSnapshotId = analysis.snapshotId;
          batch.mode = mode;
          batch.stale = !!config.stale;
          teamBatches.push(batch);
        }
      }
  }
  function handle({
    path,
    method,
    body,
    query,
    config,
    user,
    bound,
    data,
    paginated,
    error,
    noContent,
  }) {
    const now = timestamp;
    const brief = () => ({
      publicId: user.publicId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
    const activeMember = (team, publicId = user.publicId) =>
      members.find(
        (item) =>
          item.teamId === team.teamId &&
          item.user.publicId === publicId &&
          item.status === "ACTIVE",
      );
    const summary = (team) => {
      const membership = activeMember(team);
      return {
        ...team,
        memberCount: members.filter(
          (item) => item.teamId === team.teamId && item.status === "ACTIVE",
        ).length,
        myMembershipRole: membership?.role ?? null,
        myJoinApplicationStatus:
          applications.find(
            (item) =>
              item.team.teamId === team.teamId &&
              item.applicant.publicId === user.publicId &&
              item.status === "PENDING",
          )?.status ?? null,
        myInvitationStatus:
          invitations.find(
            (item) =>
              item.team.teamId === team.teamId &&
              item.invitee?.publicId === user.publicId &&
              item.status === "PENDING",
          )?.status ?? null,
        canManage: membership?.role === "OWNER",
        canLeave: membership?.role === "MEMBER" && team.status !== "DISSOLVED",
      };
    };
    const summaryDto = (team) => teamSummarySchema.parse(summary(team));
    const admin = (team) => {
      if (!summary(team).canManage) {
        error("TEAM_FORBIDDEN", 403);
        return false;
      }
      return true;
    };
    const readable = (team) => {
      if (!activeMember(team)) {
        error("TEAM_FORBIDDEN", 403);
        return false;
      }
      return true;
    };
    const joinable = (team) => {
      if (team.status !== "ACTIVE") {
        error("TEAM_NOT_JOINABLE", 409);
        return false;
      }
      return true;
    };
    const addMember = (team, userBrief) => {
      if (activeMember(team, userBrief.publicId)) return;
      members.push({
        membershipId: nextId(),
        teamId: team.teamId,
        user: userBrief,
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: now(),
        endedAt: null,
        dataAccess: {
          basicTraining: false,
          abilityProfile: false,
          detailedSubmissions: false,
          analysisReport: false,
        },
      });
    };
    const notify = (type, team, referenceType, referenceId) =>
      notifications.unshift({
        notificationId: nextId(),
        type,
        title: "团队状态已更新",
        body: "请查看最新团队记录。",
        teamId: team.teamId,
        actor: brief(),
        referenceType,
        referenceId,
        payload: {},
        read: false,
        createdAt: now(),
      });
    const userSource = (item) => ({
      ...item,
      publicId: config.mismatch ? fixtureUuid(999) : user.publicId,
      ratingAccounts:
        item.sourceFingerprint === "synthetic-user-source-old"
          ? item.ratingAccounts
          : bound
              .filter(
                (item) => item.bindStatus !== "UNBOUND" && item.lastSyncedAt,
              )
              .map((item) => ({
                accountId: item.accountId,
                platform: "codeforces",
                username: item.username,
                bindStatus: item.bindStatus,
                currentRating: item.rating,
                maxRating: item.maxRating,
                lastSyncedAt: item.lastSyncedAt,
              })),
      sourceAccountIds:
        item.sourceFingerprint === "synthetic-user-source-old"
          ? item.sourceAccountIds
          : bound
              .filter((item) => item.bindStatus !== "UNBOUND")
              .map((item) => item.accountId),
      sourceAccountCount:
        item.sourceFingerprint === "synthetic-user-source-old"
          ? item.sourceAccountCount
          : bound.filter((item) => item.bindStatus !== "UNBOUND").length,
      stale: item.stale || bound.some((item) => item.bindStatus === "INVALID"),
    });
    const startJob = (type, teamId, audience, mode) => {
      const existing = [...jobs.values()].find(
        (item) =>
          item.job.type === type &&
          item.teamId === teamId &&
          item.audience === audience &&
          item.mode === mode &&
          ["QUEUED", "RUNNING"].includes(item.job.status),
      );
      if (existing) {
        data(existing.job, 202);
        return;
      }
      const job = {
        ...v012Job("QUEUED", type),
        jobId: nextId(),
        requestedAt: now(),
      };
      jobs.set(job.jobId, { job, teamId, audience, mode, polls: 0 });
      data(job, 202);
    };
    const forStatus = (items) =>
      items.filter((item) => !query.status || item.status === query.status);
    if (path === "/coach-invite-codes/redeem") {
      user.roles = ["STUDENT", "COACH"];
      user.primaryRole = "COACH";
      data(user);
      return true;
    }
    if (path === "/coach/dashboard") {
      if (!user.roles.includes("COACH")) {
        error("ROLE_REQUIRED", 403);
        return true;
      }
      const managed = teams.filter(
        (team) => summary(team).canManage && team.status !== "DISSOLVED",
      );
      data({
        managedTeamCount: managed.length,
        activeMemberCount: members.filter(
          (item) =>
            managed.some((team) => team.teamId === item.teamId) &&
            item.status === "ACTIVE",
        ).length,
        pendingApplicationCount: applications.filter(
          (item) =>
            item.status === "PENDING" &&
            managed.some((team) => team.teamId === item.team.teamId),
        ).length,
        recentNotifications: notifications.slice(0, 5),
      });
      return true;
    }
    if (path === "/me/privacy") {
      if (method === "PATCH")
        privacy = { ...privacy, ...body, updatedAt: now() };
      data(privacy);
      return true;
    }
    if (path === "/notifications/unread-count") {
      data({ count: notifications.filter((item) => !item.read).length });
      return true;
    }
    if (path === "/notifications") {
      paginated(
        notifications.filter(
          (item) => query.unreadOnly !== "true" || !item.read,
        ),
      );
      return true;
    }
    if (path === "/notifications/read-all") {
      notifications.forEach((item) => (item.read = true));
      data({ count: notifications.length });
      return true;
    }
    const read = path.match(/^\/notifications\/([^/]+)\/read$/);
    if (read) {
      const item = notifications.find(
        (item) => item.notificationId === read[1],
      );
      if (!item) error("RESOURCE_NOT_FOUND", 404);
      else {
        item.read = true;
        data(item);
      }
      return true;
    }
    if (path === "/me/training/overview" || path === "/me/analysis/latest") {
      const window =
        query.window ?? (path.includes("training") ? "30D" : "ALL");
      data(
        config.noAnalysis ||
          !bound.some((item) => item.bindStatus !== "UNBOUND")
          ? null
          : userSource(analyses.find((item) => item.window === window)),
      );
      return true;
    }
    if (path === "/me/analysis/history") {
      paginated(
        config.noAnalysis
          ? []
          : analyses
              .filter((item) => item.window === query.window)
              .map(userSource),
      );
      return true;
    }
    if (path === "/me/analysis/rebuild") {
      if (
        !bound.length ||
        bound.some(
          (item) => item.bindStatus !== "UNBOUND" && !item.lastSyncedAt,
        )
      ) {
        error("USER_SOURCE_NOT_READY", 409);
        return true;
      }
      startJob("USER_ANALYSIS");
      return true;
    }
    const snapshot = path.match(/^\/me\/analysis\/([^/]+)$/);
    if (snapshot) {
      const item = analyses.find((item) => item.snapshotId === snapshot[1]);
      if (!item) error("RESOURCE_NOT_FOUND", 404);
      else data(userSource(item));
      return true;
    }
    if (path === "/me/reports/latest") {
      data(config.noReport ? null : reports[0]);
      return true;
    }
    if (path === "/me/reports") {
      paginated(config.noReport ? [] : reports);
      return true;
    }
    if (path === "/me/reports/generate") {
      if (config.reportRateLimited) {
        error("REPORT_RATE_LIMITED", 429, { "Retry-After": "3" });
        return true;
      }
      if (config.noAnalysis) {
        error("USER_ANALYSIS_NOT_READY", 409);
        return true;
      }
      startJob("PERSONAL_REPORT");
      return true;
    }
    const report = path.match(/^\/me\/reports\/([^/]+)$/);
    if (report) {
      const item = reports.find((item) => item.reportId === report[1]);
      if (!item) error("RESOURCE_NOT_FOUND", 404);
      else data(item);
      return true;
    }
    const jobMatch = path.match(/^\/ai-jobs\/([^/]+)$/);
    if (jobMatch) {
      const item = jobs.get(jobMatch[1]);
      if (!item) {
        error("RESOURCE_NOT_FOUND", 404);
        return true;
      }
      item.polls++;
      if (config.keepQueued) item.job.status = "QUEUED";
      else if (config.aiFailed) {
        item.job = {
          ...item.job,
          status: "FAILED",
          errors: [
            {
              code: "LLM_UNAVAILABLE",
              message: "Synthetic service unavailable",
              retryable: true,
            },
          ],
          finishedAt: now(),
        };
      } else if (config.keepRunning) item.job.status = "RUNNING";
      else if (item.polls === 1) {
        item.job.status = "RUNNING";
        item.job.startedAt = now();
      } else if (item.job.status !== "SUCCESS") {
        item.job.status = "SUCCESS";
        item.job.finishedAt = now();
        item.job.resultId = nextId();
        if (item.job.type === "USER_ANALYSIS") {
          config.noAnalysis = false;
          const updated = ["7D", "30D", "365D", "ALL"].map((window) => ({
            ...structuredClone(
              analyses.find((analysis) => analysis.window === window),
            ),
            snapshotId: window === "ALL" ? item.job.resultId : nextId(),
            createdAt: now(),
            stale: false,
          }));
          analyses.unshift(...updated);
        }
        if (item.job.type === "PERSONAL_REPORT") {
          config.noReport = false;
          const report = {
            ...v012Report(false, {
              all: analyses.find((analysis) => analysis.window === "ALL"),
              recent: analyses.find((analysis) => analysis.window === "30D"),
            }),
            reportId: item.job.resultId,
            triggerType: "MANUAL",
            generatedAt: now(),
          };
          reports.unshift(report);
        }
        if (item.job.type === "TEAM_ANALYSIS") {
          config.noTeamAnalysis = false;
          const team = teams.find((team) => team.teamId === item.teamId);
          for (const audience of ["COACH", "MEMBER"]) {
            const analysis = teamSnapshot(
              team.teamId,
              audience,
              !!config.noSharing,
            );
            analysis.snapshotId =
              audience === "COACH" ? item.job.resultId : nextId();
            analysis.createdAt = now();
            teamAnalyses.unshift(analysis);
          }
        }
        if (item.job.type === "TEAM_RECOMMENDATION") {
          config.noTeamBatch = false;
          const batch = v012TeamBatch(
            item.teamId,
            item.audience,
            !!config.emptyCandidates,
          );
          batch.batchId = item.job.resultId;
          batch.mode = item.mode ?? "HYBRID";
          batch.generatedAt = now();
          batch.analysisSnapshotId = teamAnalyses.find(
            (analysis) =>
              analysis.teamId === item.teamId &&
              analysis.audience === item.audience,
          ).snapshotId;
          teamBatches.unshift(batch);
        }
      }
      data(item.job);
      return true;
    }
    if (path === "/teams/mine") {
      paginated(
        teams
          .filter(
            (team) =>
              team.status !== "DISSOLVED" &&
              activeMember(team) &&
              (query.scope !== "MANAGED" || summary(team).canManage),
          )
          .map(summaryDto),
      );
      return true;
    }
    if (path === "/teams/search") {
      paginated(
        teams
          .filter(
            (team) =>
              team.status === "ACTIVE" &&
              team.name.toLowerCase().includes((query.q ?? "").toLowerCase()),
          )
          .map(summaryDto),
      );
      return true;
    }
    if (path === "/teams" && method === "POST") {
      if (!user.roles.includes("COACH")) {
        error("ROLE_REQUIRED", 403);
        return true;
      }
      const team = {
        ...v012Teams[0],
        ...body,
        teamId: nextId(),
        owner: brief(),
        creator: brief(),
        memberCount: 1,
        createdAt: now(),
        updatedAt: now(),
      };
      teams.push(team);
      members.push({
        ...v012Members[0],
        teamId: team.teamId,
        user: brief(),
        membershipId: nextId(),
        joinedAt: now(),
      });
      data(summary(team), 201);
      return true;
    }
    if (path === "/me/team-applications") {
      paginated(
        forStatus(
          applications.filter(
            (item) => item.applicant.publicId === user.publicId,
          ),
        ).map((item) => ({
          ...item,
          team: summaryDto(
            teams.find((team) => team.teamId === item.team.teamId),
          ),
        })),
      );
      return true;
    }
    if (path === "/me/team-invitations") {
      paginated(
        forStatus(
          invitations.filter(
            (item) => item.invitee?.publicId === user.publicId,
          ),
        ).map((item) => ({
          ...item,
          inviteeEmail: null,
          team: summaryDto(
            teams.find((team) => team.teamId === item.team.teamId),
          ),
        })),
      );
      return true;
    }
    const applicationAction = path.match(
      /^\/team-applications\/([^/]+)\/(cancel|approve|reject)$/,
    );
    if (applicationAction) {
      const item = applications.find(
        (item) => item.applicationId === applicationAction[1],
      );
      if (!item) {
        error("RESOURCE_NOT_FOUND", 404);
        return true;
      }
      const team = teams.find((team) => team.teamId === item.team.teamId);
      const action = applicationAction[2];
      if (
        action === "cancel"
          ? item.applicant.publicId !== user.publicId
          : !summary(team).canManage
      ) {
        error("TEAM_FORBIDDEN", 403);
        return true;
      }
      if (item.status !== "PENDING") {
        error("APPLICATION_ALREADY_PROCESSED", 409);
        return true;
      }
      if (action !== "cancel" && !joinable(team)) return true;
      item.status =
        action === "cancel"
          ? "CANCELLED"
          : action === "approve"
            ? "APPROVED"
            : "REJECTED";
      item.decidedAt = now();
      item.decidedBy = brief();
      item.decisionReason = body?.reason ?? null;
      if (action === "approve") addMember(team, item.applicant);
      notify(
        action === "cancel"
          ? "JOIN_APPLICATION_CANCELLED"
          : action === "approve"
            ? "JOIN_APPLICATION_APPROVED"
            : "JOIN_APPLICATION_REJECTED",
        team,
        "APPLICATION",
        item.applicationId,
      );
      data({ ...item, team: summaryDto(team) });
      return true;
    }
    const inviteAction = path.match(
      /^\/team-invitations\/([^/]+)\/(cancel|resend|accept|reject)$/,
    );
    if (inviteAction) {
      const item = invitations.find(
        (item) => item.invitationId === inviteAction[1],
      );
      if (!item) {
        error("RESOURCE_NOT_FOUND", 404);
        return true;
      }
      const team = teams.find((team) => team.teamId === item.team.teamId);
      const action = inviteAction[2];
      const ownerAction = ["cancel", "resend"].includes(action);
      if (
        ownerAction
          ? !summary(team).canManage
          : item.invitee?.publicId !== user.publicId
      ) {
        error("TEAM_FORBIDDEN", 403);
        return true;
      }
      if (item.status !== "PENDING") {
        error(
          item.status === "EXPIRED"
            ? "INVITATION_EXPIRED"
            : "INVITATION_ALREADY_PROCESSED",
          409,
        );
        return true;
      }
      if (action === "resend") {
        if (config.inviteRateLimited) {
          error("TEAM_INVITE_RATE_LIMITED", 429, { "Retry-After": "3" });
          return true;
        }
        if (!joinable(team)) return true;
        item.lastSentAt = now();
        item.emailDeliveryStatus = "SENT";
        item.emailDeliveryErrorCode = null;
      } else {
        if (action === "accept" && !joinable(team)) return true;
        item.status =
          action === "cancel"
            ? "CANCELLED"
            : action === "accept"
              ? "ACCEPTED"
              : "REJECTED";
        item.respondedAt = now();
        if (action === "accept") {
          addMember(team, brief());
        }
        if (action !== "reject")
          notify(
            action === "cancel" ? "TEAM_INVITATION_CANCELLED" : "MEMBER_JOINED",
            team,
            "INVITATION",
            item.invitationId,
          );
      }
      data({
        ...item,
        inviteeEmail: ownerAction ? item.inviteeEmail : null,
        team: summaryDto(team),
      });
      return true;
    }
    const teamMatch = path.match(/^\/teams\/([^/]+)(?:\/(.*))?$/);
    if (!teamMatch) return false;
    const team = teams.find((team) => team.teamId === teamMatch[1]);
    if (!team) {
      error("RESOURCE_NOT_FOUND", 404);
      return true;
    }
    const tail = teamMatch[2] ?? "";
    if (tail === "" && method === "GET") {
      data(summary(team));
      return true;
    }
    if (tail === "" && method === "PATCH") {
      if (!admin(team)) return true;
      Object.assign(team, body, { updatedAt: now() });
      data(summary(team));
      return true;
    }
    if (["archive", "activate", "dissolve", "transfer"].includes(tail)) {
      if (!admin(team)) return true;
      if (team.status === "DISSOLVED") {
        error("TEAM_NOT_JOINABLE", 409);
        return true;
      }
      if (tail === "dissolve") {
        if (body.confirmation !== team.name) {
          error("INVALID_ARGUMENT", 400);
          return true;
        }
        team.status = "DISSOLVED";
        members
          .filter(
            (item) => item.teamId === team.teamId && item.status === "ACTIVE",
          )
          .forEach((item) => {
            item.status = "REMOVED";
            item.endedAt = now();
          });
      } else if (tail === "transfer") {
        const target = activeMember(team, body.newOwnerPublicId);
        if (
          !target ||
          target.role === "OWNER" ||
          !(
            target.user.publicId === fixtureUuid(1101) ||
            (target.user.publicId === user.publicId &&
              user.roles.includes("COACH"))
          )
        ) {
          error("INVALID_ARGUMENT", 400);
          return true;
        }
        activeMember(team).role = "MEMBER";
        target.role = "OWNER";
        team.owner = target.user;
      } else team.status = tail === "archive" ? "ARCHIVED" : "ACTIVE";
      if (["archive", "dissolve"].includes(tail)) {
        applications
          .filter(
            (item) =>
              item.team.teamId === team.teamId && item.status === "PENDING",
          )
          .forEach((item) => {
            item.status = "CANCELLED";
            item.decidedAt = now();
            item.decidedBy = null;
          });
        invitations
          .filter(
            (item) =>
              item.team.teamId === team.teamId && item.status === "PENDING",
          )
          .forEach((item) => {
            item.status = "CANCELLED";
            item.respondedAt = now();
          });
      }
      team.updatedAt = now();
      data(summary(team));
      return true;
    }
    if (tail === "leave") {
      if (!readable(team)) return true;
      const membership = activeMember(team);
      if (membership.role === "OWNER") {
        error("TEAM_OWNER_CANNOT_LEAVE", 409);
        return true;
      }
      membership.status = "LEFT";
      membership.endedAt = now();
      noContent();
      return true;
    }
    if (tail === "applications") {
      if (method === "GET") {
        if (!admin(team)) return true;
        paginated(
          forStatus(
            applications.filter((item) => item.team.teamId === team.teamId),
          ),
        );
      } else {
        if (!joinable(team)) return true;
        if (activeMember(team)) {
          error("TEAM_ALREADY_MEMBER", 409);
          return true;
        }
        if (
          applications.some(
            (item) =>
              item.team.teamId === team.teamId &&
              item.applicant.publicId === user.publicId &&
              item.status === "PENDING",
          )
        ) {
          error("APPLICATION_ALREADY_PENDING", 409);
          return true;
        }
        const item = {
          ...v012Applications[0],
          applicationId: nextId(),
          team: summaryDto(team),
          applicant: brief(),
          message: body.message ?? null,
          createdAt: now(),
        };
        applications.unshift(item);
        notify(
          "JOIN_APPLICATION_CREATED",
          team,
          "APPLICATION",
          item.applicationId,
        );
        data(item, 201);
      }
      return true;
    }
    if (tail === "invitations") {
      if (!admin(team)) return true;
      if (method === "GET")
        paginated(
          forStatus(
            invitations.filter((item) => item.team.teamId === team.teamId),
          ),
        );
      else {
        if (!joinable(team)) return true;
        if (
          invitations.some(
            (item) =>
              item.team.teamId === team.teamId &&
              item.inviteeEmail === body.email &&
              item.status === "PENDING",
          )
        ) {
          error("INVITATION_ALREADY_PENDING", 409);
          return true;
        }
        if (config.inviteRateLimited) {
          error("TEAM_INVITE_RATE_LIMITED", 429, { "Retry-After": "3" });
          return true;
        }
        const item = {
          ...v012OwnerInvitation,
          invitationId: nextId(),
          team: summaryDto(team),
          inviter: brief(),
          invitee: body.email === user.email ? brief() : null,
          inviteeEmail: body.email,
          createdAt: now(),
        };
        invitations.unshift(item);
        notify("TEAM_INVITATION", team, "INVITATION", item.invitationId);
        data(item, 201);
      }
      return true;
    }
    if (tail === "members") {
      if (!readable(team)) return true;
      paginated(
        members
          .filter(
            (item) => item.teamId === team.teamId && item.status === "ACTIVE",
          )
          .map((item) =>
            config.privacyDenied && item.user.publicId !== user.publicId
              ? {
                  ...item,
                  dataAccess: {
                    basicTraining: false,
                    abilityProfile: false,
                    detailedSubmissions: false,
                    analysisReport: false,
                  },
                }
              : item,
          ),
      );
      return true;
    }
    const memberMatch = tail.match(/^members\/([^/]+)(?:\/(.*))?$/);
    if (memberMatch) {
      if (!readable(team)) return true;
      const target = activeMember(team, memberMatch[1]);
      if (!target) {
        error("RESOURCE_NOT_FOUND", 404);
        return true;
      }
      if (method === "DELETE") {
        if (!admin(team)) return true;
        if (target.role === "OWNER") {
          error("TEAM_OWNER_CANNOT_LEAVE", 409);
          return true;
        }
        target.status = "REMOVED";
        target.endedAt = now();
        notify("MEMBER_REMOVED", team, "MEMBERSHIP", target.membershipId);
        noContent();
        return true;
      }
      const resource = memberMatch[2];
      const permission =
        resource === "training/overview"
          ? "basicTraining"
          : resource === "profile"
            ? "abilityProfile"
            : resource === "submissions"
              ? "detailedSubmissions"
              : "analysisReport";
      if (config.privacyDenied || !target.dataAccess[permission]) {
        error("PRIVACY_DENIED", 403);
        return true;
      }
      const source = { ...v012Analysis(), publicId: target.user.publicId };
      if (resource === "training/overview")
        data(sharedTrainingSchema.parse(source));
      else if (resource === "profile") data(sharedProfileSchema.parse(source));
      else if (resource === "submissions")
        paginated(
          demoSubmissions().map((submission) => ({
            sourceAccount: {
              accountId: submission.accountId,
              platform: "codeforces",
              username: "TrainingPeer",
            },
            submission,
          })),
        );
      else if (resource === "reports") paginated(reports);
      else if (resource?.startsWith("reports/")) {
        const report = reports.find(
          (item) => item.reportId === resource.slice(8),
        );
        if (!report) error("RESOURCE_NOT_FOUND", 404);
        else data(report);
      } else error("RESOURCE_NOT_FOUND", 404);
      return true;
    }
    if (tail.startsWith("analysis")) {
      if (!readable(team)) return true;
      const audience = summary(team).canManage ? "COACH" : "MEMBER";
      if (tail === "analysis/rebuild") {
        if (!admin(team)) return true;
        startJob("TEAM_ANALYSIS", team.teamId);
      } else {
        const items = teamAnalyses.filter(
          (item) => item.teamId === team.teamId && item.audience === audience,
        );
        if (tail === "analysis/history")
          paginated(config.noTeamAnalysis ? [] : items);
        else data(config.noTeamAnalysis ? null : (items[0] ?? null));
      }
      return true;
    }
    if (tail.startsWith("recommendations")) {
      if (!readable(team)) return true;
      let audience = body?.audience ?? query.audience;
      const batchId = tail.split("/")[1];
      const stored = teamBatches.find(
        (item) => item.batchId === batchId && item.teamId === team.teamId,
      );
      if (stored) audience = stored.audience;
      if (audience === "COACH" && !summary(team).canManage) {
        error("TEAM_FORBIDDEN", 403);
        return true;
      }
      if (tail === "recommendations/generate") {
        if (!admin(team)) return true;
        const analysis = teamAnalyses.find(
          (item) => item.teamId === team.teamId && item.audience === audience,
        );
        if (config.noTeamAnalysis || !analysis) {
          error("TEAM_ANALYSIS_NOT_READY", 409);
          return true;
        }
        if (!analysis.levelMemberCount) {
          error("TEAM_LEVEL_NOT_READY", 409);
          return true;
        }
        startJob("TEAM_RECOMMENDATION", team.teamId, audience, body.mode);
        return true;
      }
      const items = teamBatches.filter(
        (item) =>
          item.teamId === team.teamId &&
          item.audience === audience &&
          (!query.mode || item.mode === query.mode),
      );
      if (tail === "recommendations/latest")
        data(config.noTeamBatch ? null : (items[0] ?? null));
      else if (tail === "recommendations/history")
        paginated(config.noTeamBatch ? [] : items);
      else if (stored) data(stored);
      else error("RESOURCE_NOT_FOUND", 404);
      return true;
    }
    error("RESOURCE_NOT_FOUND", 404);
    return true;
  }
  return { reset, handle };
}
