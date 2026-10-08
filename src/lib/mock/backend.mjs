import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import {
  demoAccounts,
  demoAnalysis,
  demoBatch,
  demoCandidate,
  demoGym,
  demoJob,
  demoSubmissions,
  demoSecondProblem,
  demoUnbound,
  demoUser,
  fixtureUuid,
} from "../demo/fixtures.ts";
import { uuidSchema, windows, modes } from "../api/schemas.ts";
import { identityFixture } from "../demo/v012-scenarios.ts";
import { scenarioConfig, mockScenarios } from "./scenarios.mjs";
import { mockCaptchaImage } from "./captcha.mjs";
import { createV012Mock } from "./v012-backend.mjs";
import { validateMockRequest } from "./requests.mjs";
import { createV02Mock } from "./v02-backend.mjs";
import { isV02Path, validateV02Request } from "./v02-requests.mjs";

// Isolated, in-memory single-learner service. No provider, DB or network calls.
export function createMockBackend({ scenario = "success" } = {}) {
  const collaboration = createV012Mock();
  const learning = createV02Mock();
  let config,
    calls,
    bound,
    jobs,
    snapshots,
    batches,
    replay,
    generationFailures,
    user;
  let nextAccount = 9007199254740997n;
  let lastManualJob;
  function reset(options = {}) {
    config = { ...scenarioConfig(options.scenario ?? scenario), ...options };
    calls = [];
    user = structuredClone(
      config.identity ? identityFixture(config.identity).user : demoUser,
    );
    if (config.coach) {
      user.roles = ["STUDENT", "COACH"];
      user.primaryRole = "COACH";
    }
    if (config.publicId) user.publicId = config.publicId;
    if (config.roles) {
      user.roles = [...config.roles];
      user.primaryRole = config.roles[0];
    }
    learning.reset();
    collaboration.reset(config);
    bound = config.noAccounts
      ? []
      : structuredClone([
          ...(config.identity
            ? identityFixture(config.identity).accounts
            : config.oneAccount
              ? demoAccounts.slice(0, 1)
              : demoAccounts),
          demoUnbound,
        ]);
    if (config.invalid && bound[0]) bound[0].bindStatus = "INVALID";
    if (config.v02HistoricalRatingOnly && bound[0]) bound[0].rating = null;
    jobs = new Map();
    lastManualJob = new Map();
    snapshots = new Map();
    batches = new Map();
    replay = new Map();
    generationFailures = 0;
    nextAccount = 9007199254740997n;
    for (const account of bound) {
      const history = windows.flatMap((window) => {
        const latest = demoAnalysis(
          account.accountId,
          window,
          !!config.zero || !!config.emptyRecords,
        );
        const previous = {
          ...structuredClone(latest),
          snapshotId: fixtureUuid(
            (account.accountId === demoAccounts[1].accountId
              ? 81
              : account.accountId === demoUnbound.accountId
                ? 82
                : 80) +
              (window === "ALL" ? 0 : (windows.indexOf(window) + 1) * 100),
          ),
          dataCutoffAt: "2026-09-30T02:30:00Z",
          createdAt: "2026-09-30T02:31:00Z",
          period: { start: null, end: "2026-09-30T02:30:00Z" },
          stale: true,
          summary: demoAnalysis(account.accountId, window, true).summary,
          dimensions: demoAnalysis(account.accountId, window, true).dimensions,
          overallScore: 0,
          tagStats: [],
          difficultyStats: [],
          activityStats: [],
        };
        // Finite historical windows use the same calendar-day rule as current snapshots.
        if (window !== "ALL") {
          const start = new Date(latest.period.start);
          start.setUTCDate(start.getUTCDate() - 2);
          previous.period.start = start.toISOString();
        }
        latest.stale = !!config.stale;
        return [latest, previous];
      });
      snapshots.set(account.accountId, config.noAnalysis ? [] : history);
      batches.set(
        account.accountId,
        config.noBatch
          ? []
          : modes.map((mode) => {
              const batch = demoBatch(account.accountId, mode);
              batch.batchId = fixtureUuid(
                (account.accountId === demoAccounts[1].accountId
                  ? 50
                  : account.accountId === demoUnbound.accountId
                    ? 70
                    : 40) + modes.indexOf(mode),
              );
              batch.stale = !!config.stale;
              if (config.emptyCandidates) {
                batch.candidateCount = 0;
                batch.resultCount = 0;
                batch.recommendations = [];
              }
              return batch;
            }),
      );
      if (config.completed && !config.noBatch) {
        const batch = demoBatch(account.accountId);
        batch.batchId = randomUUID();
        batch.analysisSnapshotId = history.find(
          (item) => item.window === "ALL" && item.stale,
        )?.snapshotId;
        batch.generatedAt = "2026-10-01T01:00:00Z";
        batch.stale = true;
        batch.recommendations[0].problem = demoSecondProblem;
        batch.recommendations[0].solvedSinceGeneration = true;
        batches.get(account.accountId).push(batch);
      }
    }
    if (config.paginateAccounts && !config.noAccounts) {
      // Exercise real 100-item pagination without overriding the requested pageSize.
      bound.push(
        ...Array.from({ length: 99 }, (_, index) => ({
          ...structuredClone(demoAccounts[1]),
          accountId: String(9007199254750000n + BigInt(index)),
          username: `DemoExtra${index + 1}`,
          boundAt: "2026-09-29T02:30:00Z",
          lastSyncedAt: null,
          lastSyncStatus: null,
        })),
      );
    }
  }
  reset();
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://fixture");
    const requestId = randomUUID();
    const json = (value, status = 200, headers = {}) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-codeStartrack-Mock": "true",
        ...headers,
      });
      response.end(JSON.stringify(value));
    };
    const data = (value, status = 200, headers = {}) =>
      json({ data: value, requestId }, status, headers);
    const error = (code, status, headers = {}, details = {}) =>
      json(
        {
          error: { code, message: "Synthetic local Mock error", details },
          requestId,
        },
        status,
        headers,
      );
    const noContent = (headers = {}) =>
      response
        .writeHead(204, { "X-codeStartrack-Mock": "true", ...headers })
        .end();
    let body;
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const bytes = Buffer.concat(chunks);
      if (bytes.byteLength > 2097152) {
        error("INPUT_TOO_LARGE", 413);
        return;
      }
      const raw = bytes.toString();
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      error("INVALID_ARGUMENT", 400);
      return;
    }
    // Control is deliberately outside /api/v1 and not forwarded by the frontend.
    if (url.pathname === "/__control") {
      if (
        !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          request.socket.remoteAddress,
        )
      ) {
        error("FORBIDDEN", 403);
        return;
      }
      if (request.method === "POST") {
        if (body?.preserveCalls) {
          config = { ...config, ...body };
          if (body.publicId) user.publicId = body.publicId;
          if (body.roles) {
            user.roles = [...body.roles];
            user.primaryRole = body.roles[0];
          }
        } else reset(body ?? {});
      }
      json({
        calls,
        scenario: config.scenario ?? scenario,
        availableScenarios: Object.keys(mockScenarios),
      });
      return;
    }
    calls.push({
      method: request.method,
      path: request.url,
      body,
      headers: request.headers,
    });
    if (!url.pathname.startsWith("/api/v1/")) {
      error("RESOURCE_NOT_FOUND", 404);
      return;
    }
    const path = url.pathname.slice(7);
    const valid = (isV02Path(path) ? validateV02Request : validateMockRequest)(
      request.method,
      path,
      body,
      url.searchParams,
    );
    if (!valid.success) {
      error(
        valid.missing
          ? "RESOURCE_NOT_FOUND"
          : (valid.code ?? "INVALID_ARGUMENT"),
        valid.missing ? 404 : 400,
      );
      return;
    }
    body = valid.body;
    const query = valid.query;
    const paginated = (items) => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      json({
        data: items.slice((page - 1) * pageSize, page * pageSize),
        meta: {
          page,
          pageSize,
          total: items.length,
          hasNext: page * pageSize < items.length,
        },
        requestId,
      });
    };
    if (config.delayMs)
      await new Promise((resolve) => setTimeout(resolve, config.delayMs));
    if (config.networkFailure) {
      response.destroy();
      return;
    }
    if (config.failReads && request.method === "GET") {
      error("INTERNAL_ERROR", 503);
      return;
    }
    if (
      config.errorPath === path ||
      (config.errorResource && path.endsWith(config.errorResource))
    ) {
      error(
        config.errorCode ?? "INTERNAL_ERROR",
        config.errorStatus ?? 503,
        config.retryAfter ? { "Retry-After": String(config.retryAfter) } : {},
      );
      return;
    }
    if (path === "/auth/captcha") {
      data({
        challengeId: fixtureUuid(100),
        imageData: mockCaptchaImage,
        expiresInSeconds: 180,
      });
      return;
    }
    if (path === "/auth/email-codes") {
      if (config.loggedOut && body.purpose.startsWith("EMAIL_CHANGE")) {
        error("SESSION_EXPIRED", 401);
        return;
      }
      data(
        {
          verificationId: fixtureUuid(101),
          cooldownSeconds: 60,
          expiresInSeconds: 600,
        },
        202,
      );
      return;
    }
    const cookie = {
      "Set-Cookie":
        "cst_session=synthetic; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
    };
    const clearCookie = {
      "Set-Cookie": "cst_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    };
    if (["/auth/login", "/auth/register"].includes(path)) {
      if (config.loginFailure) {
        error("INVALID_CREDENTIALS", 401);
        return;
      }
      config.loggedOut = false;
      if (path.endsWith("register")) {
        user = {
          ...user,
          username: body.username,
          displayName: null,
          email: body.email.trim().toLowerCase(),
        };
        data({ user }, 201, cookie);
      } else
        data(
          {
            user,
            requiresOjBinding: !bound.some((a) => a.bindStatus !== "UNBOUND"),
          },
          200,
          cookie,
        );
      return;
    }
    if (path === "/auth/logout") {
      config.loggedOut = true;
      noContent(clearCookie);
      return;
    }
    if (path === "/auth/password/reset") {
      config.loggedOut = true;
      data({ reset: true }, 200, clearCookie);
      return;
    }
    if (config.loggedOut) {
      error("SESSION_EXPIRED", 401);
      return;
    }
    if (path === "/me") {
      data(
        config.guest
          ? { ...user, roles: ["GUEST"], primaryRole: "GUEST" }
          : user,
      );
      return;
    }
    if (path === "/me/roles") {
      data({
        primaryRole: config.guest ? "GUEST" : "STUDENT",
        roles: [
          {
            code: config.guest ? "GUEST" : "STUDENT",
            name: config.guest ? "Guest" : "Student",
          },
        ],
      });
      return;
    }
    if (path === "/auth/logout-all") {
      config.loggedOut = true;
      data({ revokedSessions: 1 }, 200, clearCookie);
      return;
    }
    if (path === "/me/password/change") {
      config.loggedOut = true;
      data({ changed: true, reauthRequired: true }, 200, clearCookie);
      return;
    }
    if (path === "/me/email/change") {
      user.email = body.newEmail.trim().toLowerCase();
      config.loggedOut = true;
      data(
        { email: user.email, emailVerified: true, reauthRequired: true },
        200,
        clearCookie,
      );
      return;
    }
    if (
      learning.handle({
        path,
        method: request.method,
        body,
        query,
        config,
        user,
        bound,
        data,
        paginated,
        error,
        request,
        response,
      })
    )
      return;
    if (config.guest) {
      error("FORBIDDEN", 403);
      return;
    }
    if (
      collaboration.handle({
        path,
        method: request.method,
        body,
        query,
        config,
        user,
        bound,
        data,
        paginated,
        error,
        noContent,
      })
    )
      return;
    if (path === "/oj-accounts") {
      if (request.method === "POST") {
        const existing = bound.find(
          (a) =>
            a.bindStatus !== "UNBOUND" &&
            a.username.toLowerCase() === body.username.toLowerCase(),
        );
        if (existing) {
          error(
            "OJ_ACCOUNT_ALREADY_BOUND",
            409,
            {},
            { accountId: existing.accountId },
          );
          return;
        }
        const account = {
          ...structuredClone(demoAccounts[1]),
          accountId: String(nextAccount++),
          username: body.username,
          boundAt: "2026-10-02T02:34:00Z",
          lastSyncedAt: null,
          nextSyncAt: null,
          lastSyncStatus: "QUEUED",
        };
        bound.unshift(account);
        snapshots.set(account.accountId, []);
        batches.set(account.accountId, []);
        const initialSync = {
          ...demoJob(account.accountId, "QUEUED"),
          jobId: randomUUID(),
        };
        jobs.set(account.accountId, initialSync);
        jobs.set(initialSync.jobId, initialSync);
        learning.sourceChanged({ user, bound, config, event: "bound" });
        data({ account, initialSync }, 201);
        return;
      }
      const items = bound.filter(
        (a) => query.includeUnbound === "true" || a.bindStatus !== "UNBOUND",
      );
      paginated(
        [...items].sort(
          (a, b) =>
            b.boundAt.localeCompare(a.boundAt) ||
            (BigInt(a.accountId) > BigInt(b.accountId) ? -1 : 1),
        ),
      );
      return;
    }
    if (path.startsWith("/sync-jobs/")) {
      const jobId = path.split("/")[2];
      if (!uuidSchema.safeParse(jobId).success) {
        error("SYNC_JOB_NOT_FOUND", 404);
        return;
      }
      const job = [...jobs.values()].find((item) => item.jobId === jobId);
      if (!job) {
        error("SYNC_JOB_NOT_FOUND", 404);
        return;
      }
      if (config.pollFailure) {
        error("INTERNAL_ERROR", 500);
        return;
      }
      if (job.status === "QUEUED" && config.keepRunning) {
        job.status = "RUNNING";
        job.stage = "USER_INFO";
        job.startedAt = "2026-10-02T02:34:00Z";
      }
      if (["QUEUED", "RUNNING"].includes(job.status) && !config.keepRunning) {
        job.status = config.partial ? "PARTIAL" : "SUCCESS";
        job.stage = config.partial ? "ANALYSIS" : "DONE";
        job.errors = config.partial
          ? demoJob(job.accountId, "PARTIAL").errors
          : [];
        job.startedAt = "2026-10-02T02:34:00Z";
        job.finishedAt = "2026-10-02T02:35:00Z";
        job.itemsFetched = demoSubmissions(job.accountId).length;
        job.itemsInserted = job.itemsFetched;
        const account = bound.find((a) => a.accountId === job.accountId);
        if (account && account.bindStatus !== "UNBOUND") {
          account.lastSyncStatus = job.status;
          if (job.scope === "ACCOUNT_FULL") {
            account.lastSyncedAt = job.finishedAt;
            account.bindStatus = "ACTIVE";
          }
          if (!config.partial) {
            snapshots.set(account.accountId, [
              ...windows.map((window) => {
                const snapshot = demoAnalysis(
                  account.accountId,
                  window,
                  !!config.zero || !!config.emptyRecords,
                );
                return {
                  ...snapshot,
                  snapshotId: randomUUID(),
                  currentRating: account.rating,
                  maxRating: account.maxRating,
                  dataCutoffAt: "2026-10-02T02:35:00Z",
                  createdAt: "2026-10-02T02:36:00Z",
                  period: { ...snapshot.period, end: "2026-10-02T02:35:00Z" },
                };
              }),
              ...(snapshots.get(account.accountId) ?? []),
            ]);
          } else
            for (const snapshot of snapshots.get(account.accountId) ?? [])
              snapshot.stale = true;
          learning.sourceChanged({
            user,
            bound,
            config,
            event: "sync-completed",
          });
        }
      }
      data(job);
      return;
    }
    const match = path.match(/^\/oj-accounts\/(\d+)(.*)$/);
    if (!match) {
      error("RESOURCE_NOT_FOUND", 404);
      return;
    }
    const [, accountId, resource] = match;
    const account = bound.find((a) => a.accountId === accountId);
    if (!account) {
      error("OJ_ACCOUNT_NOT_FOUND", 404);
      return;
    }
    if (request.method === "DELETE") {
      account.bindStatus = "UNBOUND";
      account.unboundAt ??= "2026-10-02T02:36:00Z";
      account.nextSyncAt = null;
      const job = jobs.get(accountId);
      if (job && ["QUEUED", "RUNNING"].includes(job.status)) {
        job.status = "FAILED";
        job.finishedAt = account.unboundAt;
        job.errors = [
          {
            stage: job.stage ?? "USER_INFO",
            code: "OJ_ACCOUNT_UNBOUND",
            message: "Synthetic binding ended",
            retryable: false,
          },
        ];
      }
      learning.sourceChanged({ user, bound, config, event: "unbound" });
      noContent();
      return;
    }
    if (!resource) {
      data(account);
      return;
    }
    if (request.method === "POST" && account.bindStatus === "UNBOUND") {
      error("OJ_ACCOUNT_UNBOUND", 409);
      return;
    }
    if (
      request.method === "POST" &&
      account.bindStatus === "INVALID" &&
      resource !== "/sync"
    ) {
      error("OJ_ACCOUNT_INVALID", 409);
      return;
    }
    if (config.errorResource === resource) {
      error(
        config.errorCode || "ALGORITHM_UNAVAILABLE",
        config.errorStatus || 503,
        config.retryAfter ? { "Retry-After": String(config.retryAfter) } : {},
      );
      return;
    }
    const window =
      query.window ?? (resource === "/training/overview" ? "30D" : "ALL");
    const history = snapshots.get(accountId) ?? [];
    const analysis = history.find((a) => a.window === window) ?? null;
    const mode = query.mode ?? "HYBRID";
    const currentAll = history.find((item) => item.window === "ALL");
    const batchHistory = (batches.get(accountId) ?? []).map((item) => ({
      ...item,
      stale:
        item.stale ||
        !currentAll ||
        currentAll.stale ||
        item.analysisSnapshotId !== currentAll.snapshotId,
    }));
    const batch = batchHistory.find((b) => b.mode === mode) ?? null;
    const sync = {
      accountId,
      lastSyncedAt: account.lastSyncedAt,
      lastSyncStatus: jobs.get(accountId)?.status ?? account.lastSyncStatus,
      nextSyncAt: account.nextSyncAt,
      latestJob: jobs.get(accountId) ?? null,
    };
    if (
      ["/sync", "/analysis/rebuild"].includes(resource) &&
      request.method === "POST"
    ) {
      const current = jobs.get(accountId);
      if (current && ["QUEUED", "RUNNING"].includes(current.status)) {
        data(current, 202);
        return;
      }
      if (config.rateLimit) {
        error("SYNC_RATE_LIMITED", 429, { "Retry-After": "2" });
        return;
      }
      const elapsed = Date.now() - (lastManualJob.get(accountId) ?? 0);
      if (elapsed < 60_000) {
        error("SYNC_RATE_LIMITED", 429, {
          "Retry-After": String(Math.ceil((60_000 - elapsed) / 1000)),
        });
        return;
      }
      lastManualJob.set(accountId, Date.now());
      const job = {
        ...demoJob(accountId, "QUEUED"),
        scope: resource.includes("rebuild") ? "ANALYSIS_ONLY" : "ACCOUNT_FULL",
        jobId: randomUUID(),
      };
      jobs.set(accountId, job);
      jobs.set(job.jobId, job);
      account.lastSyncStatus = job.status;
      data(job, 202);
      return;
    }
    if (resource === "/sync-status") {
      data(sync);
      return;
    }
    if (resource === "/dashboard") {
      if (config.delayAlpha && accountId === demoAccounts[0].accountId)
        await new Promise((resolve) => setTimeout(resolve, 1500));
      const nextAction =
        account.bindStatus === "UNBOUND"
          ? "NONE"
          : ["QUEUED", "RUNNING"].includes(sync.latestJob?.status)
            ? "WAIT_SYNC"
            : (config.nextAction ??
              (account.bindStatus === "INVALID" || !account.lastSyncedAt
                ? "SYNC"
                : !analysis || analysis.stale
                  ? "REBUILD_ANALYSIS"
                  : !batch || batch.stale
                    ? "GENERATE_RECOMMENDATIONS"
                    : "NONE"));
      data({
        accountId,
        account,
        sync,
        analysis,
        recommendationBatch: batch,
        nextAction,
      });
      return;
    }
    if (["/analysis/latest", "/training/overview"].includes(resource)) {
      data(
        config.mismatch && analysis
          ? { ...analysis, accountId: demoAccounts[1].accountId }
          : analysis,
      );
      return;
    }
    if (resource === "/analysis/history") {
      paginated(history.filter((a) => a.window === window));
      return;
    }
    if (resource.startsWith("/analysis/")) {
      const item = history.find(
        (a) => a.snapshotId === resource.split("/").at(-1),
      );
      if (!item) error("RESOURCE_NOT_FOUND", 404);
      else data(item);
      return;
    }
    if (resource === "/recommendations/latest") {
      data(batch);
      return;
    }
    if (resource === "/recommendations/history") {
      paginated(
        batchHistory.filter(
          (b) => query.mode === undefined || b.mode === query.mode,
        ),
      );
      return;
    }
    if (resource === "/recommendations/generate") {
      const key = request.headers["idempotency-key"];
      if (!uuidSchema.safeParse(key).success) {
        error("INVALID_ARGUMENT", 400);
        return;
      }
      const replayKey = `${accountId}:${key}`;
      const existing = replay.get(replayKey);
      if (
        existing &&
        (existing.mode !== body.mode || existing.limit !== body.limit)
      ) {
        error("IDEMPOTENCY_CONFLICT", 409);
        return;
      }
      if (existing) {
        data(existing.result);
        return;
      }
      if (!analysis || analysis.stale) {
        error("PROFILE_NOT_READY", 409);
        return;
      }
      if (config.failGenerationOnce && generationFailures++ === 0) {
        error("ALGORITHM_TIMEOUT", 504);
        return;
      }
      const result = {
        ...demoBatch(accountId, body.mode),
        batchId: randomUUID(),
        analysisSnapshotId: analysis.snapshotId,
        generatedAt: "2026-10-02T02:37:00Z",
        recommendations: config.emptyCandidates
          ? []
          : [demoCandidate, demoGym]
              .slice(0, body.limit)
              .map((problem, index) => ({
                rank: index + 1,
                problem,
                score: 0.8 - index * 0.1,
                reasonCode: "LEVEL_MATCH",
                reason: "这道题的难度与你当前训练水平接近。",
                matchedDimension: "IMPLEMENTATION",
                solvedSinceGeneration: false,
              })),
      };
      result.candidateCount = config.emptyCandidates ? 0 : 2;
      result.resultCount = result.recommendations.length;
      replay.set(replayKey, {
        mode: body.mode,
        limit: body.limit,
        result: structuredClone(result),
      });
      batches.set(accountId, [result, ...(batches.get(accountId) ?? [])]);
      data(result, 201);
      return;
    }
    if (resource.startsWith("/recommendations/")) {
      const item = batchHistory.find(
        (b) => b.batchId === resource.split("/").at(-1),
      );
      if (!item) error("RESOURCE_NOT_FOUND", 404);
      else data(item);
      return;
    }
    const submissions =
      config.emptyRecords || config.zero ? [] : demoSubmissions(accountId);
    if (resource === "/problems") {
      let items = [...new Set(submissions.map((s) => s.problem.problemId))].map(
        (problemId) => {
          const records = submissions.filter(
            (s) => s.problem.problemId === problemId,
          );
          const accepted = records.filter((s) => s.verdict === "ACCEPTED");
          return {
            accountId,
            problem: records[0].problem,
            progress: {
              attemptCount: records.length,
              accepted: !!accepted.length,
              acceptedSubmissionCount: accepted.length,
              failedSubmissionCount: records.filter(
                (s) => !["ACCEPTED", "PENDING"].includes(s.verdict),
              ).length,
              pendingSubmissionCount: records.filter(
                (s) => s.verdict === "PENDING",
              ).length,
              firstSubmittedAt: records.at(-1).submittedAt,
              lastSubmittedAt: records[0].submittedAt,
              acceptedAt: accepted.at(-1)?.submittedAt ?? null,
            },
          };
        },
      );
      items = items.filter(
        (item) =>
          (query.status === "ALL" ||
            item.progress.accepted === (query.status === "SOLVED")) &&
          (query.tag === undefined || item.problem.tags.includes(query.tag)) &&
          (query.minDifficulty === undefined ||
            (item.problem.difficulty !== null &&
              item.problem.difficulty >= query.minDifficulty)) &&
          (query.maxDifficulty === undefined ||
            (item.problem.difficulty !== null &&
              item.problem.difficulty <= query.maxDifficulty)),
      );
      paginated(items);
      return;
    }
    if (resource === "/submissions") {
      paginated(
        submissions.filter(
          (s) =>
            (query.problemId === undefined ||
              s.problem.problemId === query.problemId) &&
            (query.verdict === undefined || s.verdict === query.verdict) &&
            (query.from === undefined ||
              Date.parse(s.submittedAt) >= Date.parse(query.from)) &&
            (query.to === undefined ||
              Date.parse(s.submittedAt) < Date.parse(query.to)),
        ),
      );
      return;
    }
    if (resource === "/rating-changes") {
      paginated(
        config.emptyRecords || config.zero || account.rating === null
          ? []
          : [
              {
                accountId,
                contestId: 1,
                contestName: "Synthetic contest",
                rank: 15,
                oldRating: 1400,
                newRating: 1500,
                occurredAt: "2026-10-01T02:30:00Z",
              },
            ],
      );
      return;
    }
    error("RESOURCE_NOT_FOUND", 404);
  });
  // Refuse accidental public exposure even if a caller changes the startup script.
  server.on("listening", () => {
    if (!["127.0.0.1", "::1"].includes(server.address().address)) {
      server.close();
      throw new Error("Mock backend must bind to loopback");
    }
  });
  return server;
}
