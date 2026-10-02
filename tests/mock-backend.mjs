import { createServer } from "node:http";
import {
  demoAccounts,
  demoAnalysis,
  demoBatch,
  demoProblem,
  demoGym,
  demoJob,
  demoUnbound,
  demoUser,
  fixtureUuid,
} from "../src/lib/demo/fixtures.ts";

export function createMockBackend() {
  let config = {};
  let calls = [];
  let bound = structuredClone(demoAccounts);
  let jobs = new Map();
  let batches = new Map();
  let replay = new Map();
  let generationFailures = 0;
  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://fixture");
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : undefined;
    const json = (value, status = 200, headers = {}) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        ...headers,
      });
      response.end(JSON.stringify(value));
    };
    const data = (value, status = 200, headers = {}) =>
      json({ data: value, requestId: fixtureUuid(900) }, status, headers);
    const error = (code, status, headers = {}) =>
      json(
        {
          error: { code, message: "Synthetic test error", details: {} },
          requestId: fixtureUuid(900),
        },
        status,
        headers,
      );
    const paginated = (
      items,
      size = Number(url.searchParams.get("pageSize") || 20),
    ) => {
      const page = Number(url.searchParams.get("page") || 1);
      const offset = (page - 1) * size;
      json({
        data: items.slice(offset, offset + size),
        meta: {
          page,
          pageSize: size,
          total: items.length,
          hasNext: page * size < items.length,
        },
        requestId: fixtureUuid(900),
      });
    };
    if (url.pathname === "/__control") {
      if (request.method === "POST") {
        if (!body.preserveCalls) calls = [];
        config = body.preserveCalls ? { ...config, ...body } : body;
        if (!body.preserveCalls) {
          bound = body.noAccounts ? [] : structuredClone(demoAccounts);
          jobs = new Map();
          batches = new Map();
          replay = new Map();
          generationFailures = 0;
        }
      }
      json({ calls });
      return;
    }
    calls.push({
      method: request.method,
      path: request.url,
      body,
      headers: request.headers,
    });
    if (!url.pathname.startsWith("/api/v1/")) {
      error("INVALID_ARGUMENT", 404);
      return;
    }
    const path = url.pathname.slice(7);
    if (path === "/auth/captcha" && request.method === "POST") {
      data({
        challengeId: fixtureUuid(100),
        imageData:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL5sAAAAASUVORK5CYII=",
        expiresInSeconds: 180,
      });
      return;
    }
    if (path === "/auth/email-codes" && request.method === "POST") {
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
    if (
      ["/auth/login", "/auth/register"].includes(path) &&
      request.method === "POST"
    ) {
      if (config.loginFailure) {
        error("INVALID_CREDENTIALS", 401);
        return;
      }
      config.loggedOut = false;
      data(
        { user: demoUser, requiresOjBinding: !bound.length },
        path.endsWith("register") ? 201 : 200,
        {
          "Set-Cookie": "cst_session=synthetic; Path=/; HttpOnly; SameSite=Lax",
        },
      );
      return;
    }
    if (path === "/auth/logout" && request.method === "POST") {
      config.loggedOut = true;
      response
        .writeHead(204, { "Set-Cookie": "cst_session=; Max-Age=0; Path=/" })
        .end();
      return;
    }
    if (path === "/auth/password/reset" && request.method === "POST") {
      data({ reset: true });
      return;
    }
    if (config.loggedOut) {
      error("SESSION_EXPIRED", 401);
      return;
    }
    if (path === "/me") {
      data(
        config.guest
          ? { ...demoUser, roles: ["GUEST"], primaryRole: "GUEST" }
          : demoUser,
      );
      return;
    }
    if (path === "/me/roles") {
      data({
        primaryRole: "STUDENT",
        roles: [{ code: "STUDENT", name: "Student" }],
      });
      return;
    }
    if (path === "/auth/logout-all") {
      config.loggedOut = true;
      data({ revokedSessions: 1 });
      return;
    }
    if (path === "/me/password/change") {
      config.loggedOut = true;
      data({ changed: true, reauthRequired: true });
      return;
    }
    if (path === "/me/email/change") {
      config.loggedOut = true;
      data({ email: body.newEmail, emailVerified: true, reauthRequired: true });
      return;
    }
    if (path === "/oj-accounts") {
      if (request.method === "POST") {
        const account = {
          ...demoAccounts[0],
          accountId: "9007199254740997",
          username: body.username,
          lastSyncedAt: null,
          lastSyncStatus: "QUEUED",
        };
        bound.unshift(account);
        const initialSync = {
          ...demoJob(account.accountId, "QUEUED"),
          jobId: fixtureUuid(63),
        };
        jobs.set(account.accountId, initialSync);
        data({ account, initialSync }, 201);
        return;
      }
      const items =
        url.searchParams.get("includeUnbound") === "true"
          ? [...bound, demoUnbound]
          : bound;
      paginated(items, config.paginateAccounts ? 1 : 100);
      return;
    }
    if (path.startsWith("/sync-jobs/")) {
      const job = [...jobs.values()].find(
        (item) => item.jobId === path.split("/")[2],
      );
      if (!job) {
        data(demoJob());
        return;
      }
      if (config.pollFailure) {
        error("INTERNAL_ERROR", 500);
        return;
      }
      if (!config.keepRunning) {
        job.status = config.partial ? "PARTIAL" : "SUCCESS";
        job.stage = config.partial ? "ANALYSIS" : "DONE";
        job.errors = config.partial
          ? demoJob(job.accountId, "PARTIAL").errors
          : [];
        job.finishedAt = "2026-10-02T02:35:00Z";
        bound = bound.map((a) =>
          a.accountId === job.accountId
            ? { ...a, lastSyncStatus: job.status }
            : a,
        );
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
    const account = [...bound, demoUnbound].find(
      (a) => a.accountId === accountId,
    );
    if (!account) {
      error("OJ_ACCOUNT_NOT_FOUND", 404);
      return;
    }
    if (request.method === "DELETE" && !resource) {
      bound = bound.filter((a) => a.accountId !== accountId);
      response.writeHead(204).end();
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
    const window =
      url.searchParams.get("window") ||
      (resource === "/training/overview" ? "30D" : "ALL");
    const analysis = config.noAnalysis
      ? null
      : {
          ...demoAnalysis(
            config.mismatch ? demoAccounts[1].accountId : accountId,
            window,
            config.zero,
          ),
          stale: !!config.stale,
        };
    const mode = url.searchParams.get("mode") || "HYBRID";
    const batch = config.noBatch
      ? null
      : (batches.get(`${accountId}:${mode}`) ?? {
          ...demoBatch(accountId, mode),
          stale: !!config.stale,
          ...(config.emptyCandidates
            ? { candidateCount: 0, resultCount: 0, recommendations: [] }
            : {}),
        });
    const sync = {
      accountId,
      lastSyncedAt: account.lastSyncedAt,
      lastSyncStatus: jobs.get(accountId)?.status ?? account.lastSyncStatus,
      nextSyncAt: account.nextSyncAt,
      latestJob: jobs.get(accountId) ?? null,
    };
    if (config.errorResource === resource) {
      error(
        config.errorCode || "ALGORITHM_UNAVAILABLE",
        config.errorStatus || 503,
        config.retryAfter ? { "Retry-After": String(config.retryAfter) } : {},
      );
      return;
    }
    if (
      ["/sync", "/analysis/rebuild"].includes(resource) &&
      request.method === "POST"
    ) {
      if (config.rateLimit) {
        error("SYNC_RATE_LIMITED", 429, { "Retry-After": "2" });
        return;
      }
      const job = {
        ...demoJob(accountId, "QUEUED"),
        scope: resource.includes("rebuild") ? "ANALYSIS_ONLY" : "ACCOUNT_FULL",
        jobId: fixtureUuid(accountId === demoAccounts[0].accountId ? 61 : 62),
      };
      jobs.set(accountId, job);
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
      data({
        accountId,
        account,
        sync,
        analysis,
        recommendationBatch: batch,
        nextAction:
          config.nextAction ||
          (jobs.has(accountId) &&
          ["QUEUED", "RUNNING"].includes(jobs.get(accountId).status)
            ? "WAIT_SYNC"
            : "NONE"),
      });
      return;
    }
    if (["/analysis/latest", "/training/overview"].includes(resource)) {
      data(analysis);
      return;
    }
    if (resource === "/analysis/history") {
      paginated(
        analysis
          ? [
              analysis,
              {
                ...analysis,
                snapshotId: fixtureUuid(80),
                dataCutoffAt: "2026-10-01T02:30:00Z",
                stale: true,
              },
            ]
          : [],
      );
      return;
    }
    if (resource.startsWith("/analysis/")) {
      data({
        ...demoAnalysis(accountId),
        snapshotId: resource.split("/").at(-1),
        stale: true,
      });
      return;
    }
    if (resource === "/recommendations/latest") {
      data(batch);
      return;
    }
    if (resource === "/recommendations/history") {
      paginated(batch ? [batch] : []);
      return;
    }
    if (resource === "/recommendations/generate" && request.method === "POST") {
      if (config.failGenerationOnce && generationFailures++ === 0) {
        error("ALGORITHM_TIMEOUT", 504);
        return;
      }
      const key = request.headers["idempotency-key"];
      if (!key) {
        error("INVALID_ARGUMENT", 400);
        return;
      }
      const existing = replay.get(key);
      if (
        existing &&
        (existing.mode !== body.mode || existing.limit !== body.limit)
      ) {
        error("IDEMPOTENCY_CONFLICT", 409);
        return;
      }
      const result = existing?.result ?? {
        ...demoBatch(accountId, body.mode),
        ...(config.emptyCandidates
          ? { candidateCount: 0, resultCount: 0, recommendations: [] }
          : {}),
      };
      replay.set(key, { mode: body.mode, limit: body.limit, result });
      batches.set(`${accountId}:${body.mode}`, result);
      data(result, existing ? 200 : 201);
      return;
    }
    if (resource.startsWith("/recommendations/")) {
      data({
        ...demoBatch(accountId, mode),
        batchId: resource.split("/").at(-1),
      });
      return;
    }
    if (resource === "/problems") {
      let items = config.emptyRecords
        ? []
        : [demoProblem, demoGym].map((problem, index) => ({
            accountId,
            problem,
            progress: {
              attemptCount: 2,
              accepted: index === 0,
              acceptedSubmissionCount: index === 0 ? 1 : 0,
              failedSubmissionCount: 1,
              pendingSubmissionCount: index === 0 ? 0 : 1,
              firstSubmittedAt: "2026-10-01T02:00:00Z",
              lastSubmittedAt: "2026-10-01T02:30:00Z",
              acceptedAt: index === 0 ? "2026-10-01T02:30:00Z" : null,
            },
          }));
      if (url.searchParams.get("status") === "SOLVED")
        items = items.filter((item) => item.progress.accepted);
      if (url.searchParams.get("status") === "UNSOLVED")
        items = items.filter((item) => !item.progress.accepted);
      if (url.searchParams.has("tag"))
        items = items.filter((item) =>
          item.problem.tags.includes(url.searchParams.get("tag")),
        );
      paginated(items);
      return;
    }
    if (resource === "/submissions") {
      const problem =
        url.searchParams.get("problemId") === demoProblem.problemId
          ? demoProblem
          : demoGym;
      const item = {
        submissionId: "9007199254742993",
        accountId,
        externalSubmissionId: "9007199254743993",
        problem,
        verdict: "PENDING",
        verdictRaw: null,
        programmingLanguage: "GNU C++23",
        participantType: "CONTESTANT",
        memberHandles: ["DemoAlpha", "DemoBeta"],
        teamId: "1",
        teamName: "Synthetic team",
        testset: null,
        passedTestCount: null,
        timeMs: null,
        memoryBytes: 1048576,
        submittedAt: "2026-10-01T02:30:00Z",
      };
      paginated(config.emptyRecords ? [] : [item]);
      return;
    }
    if (resource === "/rating-changes") {
      paginated(
        config.emptyRecords
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
}
