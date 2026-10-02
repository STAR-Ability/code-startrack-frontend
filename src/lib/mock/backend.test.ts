// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createMockBackend } from "./backend.mjs";
import {
  demoAccounts,
  demoAnalysis,
  demoBatch,
  demoSubmissions,
  fixtureUuid,
} from "../demo/fixtures";
import {
  accountSchema,
  analysisSchema,
  batchSchema,
  dashboardSchema,
  envelope,
  errorSchema,
  jobSchema,
  modes,
  pageEnvelope,
  problemProgressSchema,
  ratingSchema,
  submissionSchema,
  userSchema,
  windows,
} from "../api/schemas";

const server = createMockBackend();
let base: string;
beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  if (!server.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
async function control(config = {}) {
  await fetch(`${base}/__control`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}
beforeEach(() => control());
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload: unknown =
    response.status === 204 ? undefined : await response.json();
  return { response, payload };
}
const id = demoAccounts[0].accountId;
const path = `/oj-accounts/${id}`;
describe("typed synthetic dataset", () => {
  for (const account of demoAccounts)
    it(`has complete and consistent DTOs for ${account.username}`, () => {
      expect(accountSchema.parse(account)).toEqual(account);
      for (const window of windows) {
        const analysis = demoAnalysis(account.accountId, window);
        expect(analysisSchema.parse(analysis)).toEqual(analysis);
        const submissions = demoSubmissions(account.accountId);
        submissions.forEach((item) =>
          expect(submissionSchema.parse(item)).toEqual(item),
        );
        const summary = analysis.summary;
        expect(summary.submissionCount).toBe(submissions.length);
        expect(
          summary.acceptedSubmissionCount +
            summary.failedSubmissionCount +
            summary.pendingSubmissionCount,
        ).toBe(summary.submissionCount);
        expect(summary.attemptedProblemCount).toBe(
          new Set(submissions.map((s) => s.problem.problemId)).size,
        );
        expect(summary.solvedCount).toBe(
          new Set(
            submissions
              .filter((s) => s.verdict === "ACCEPTED")
              .map((s) => s.problem.problemId),
          ).size,
        );
        expect(
          analysis.difficultyStats.reduce((n, item) => n + item.solvedCount, 0),
        ).toBe(summary.solvedCount);
        expect(
          analysis.activityStats.reduce((n, item) => n + item.solvedCount, 0),
        ).toBe(summary.solvedCount);
        expect(analysis.activityStats.length).toBe(summary.activeDays);
        for (const mode of modes) {
          const batch = demoBatch(account.accountId, mode);
          expect(batchSchema.parse(batch)).toEqual(batch);
          expect(batch.analysisSnapshotId).toBe(
            demoAnalysis(account.accountId).snapshotId,
          );
          const solved = new Set(
            submissions
              .filter((s) => s.verdict === "ACCEPTED")
              .map((s) => s.problem.problemId),
          );
          expect(
            batch.recommendations.every(
              (r) => !solved.has(r.problem.problemId),
            ),
          ).toBe(true);
        }
      }
    });
});
describe("documented HTTP contract", () => {
  it("validates exact envelopes and all account reads", async () => {
    const me = await call("/me");
    expect(envelope(userSchema).parse(me.payload).data.publicId).toBe(
      fixtureUuid(1),
    );
    expect(me.response.headers.get("X-codeStartrack-Mock")).toBe("true");
    for (const [suffix, schema] of [
      ["", envelope(accountSchema)],
      ["/dashboard", envelope(dashboardSchema)],
      ["/problems", pageEnvelope(problemProgressSchema)],
      ["/submissions", pageEnvelope(submissionSchema)],
      ["/rating-changes", pageEnvelope(ratingSchema)],
    ] as const) {
      const { payload } = await call(path + suffix);
      expect(schema.parse(payload)).toEqual(payload);
    }
    for (const window of windows) {
      const a = (await call(path + `/analysis/latest?window=${window}`))
        .payload;
      expect(
        analysisSchema.parse(envelope(analysisSchema).parse(a).data).window,
      ).toBe(window);
      expect(
        (await call(path + `/training/overview?window=${window}`)).payload,
      ).toMatchObject({ data: envelope(analysisSchema).parse(a).data });
    }
  });
  it("filters before pagination, handles null difficulty and exclusive date bounds", async () => {
    const result = pageEnvelope(problemProgressSchema).parse(
      (
        await call(
          path +
            "/problems?status=SOLVED&minDifficulty=1200&maxDifficulty=1200&pageSize=1",
        )
      ).payload,
    );
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 1,
      total: 2,
      hasNext: true,
    });
    expect(
      pageEnvelope(problemProgressSchema).parse(
        (await call(path + "/problems?status=UNSOLVED&minDifficulty=1"))
          .payload,
      ).data,
    ).toEqual([]);
    const records = pageEnvelope(submissionSchema).parse(
      (
        await call(
          path +
            "/submissions?verdict=ACCEPTED&from=2026-10-01T02:05:00Z&to=2026-10-01T02:15:00Z",
        )
      ).payload,
    );
    expect(records.data).toHaveLength(1);
    expect(records.data[0].submittedAt).toBe("2026-10-01T02:05:00Z");
    const none = pageEnvelope(submissionSchema).parse(
      (await call(path + "/submissions?page=100")).payload,
    );
    expect(none.data).toEqual([]);
    expect(none.meta.total).toBe(5);
    expect(none.meta.hasNext).toBe(false);
  });
  it.each([
    "/problems?page=0",
    "/problems?pageSize=101",
    "/problems?status=BAD",
    "/problems?minDifficulty=1400&maxDifficulty=1200",
    "/submissions?verdict=BAD",
    "/submissions?extra=x",
    "/submissions?page=1&page=2",
    "/analysis/latest?window=BAD",
    "/dashboard?window=ALL",
  ])("rejects undocumented input %s", async (suffix) => {
    const { response, payload } = await call(path + suffix);
    expect(response.status).toBe(400);
    expect(errorSchema.parse(payload).error.code).toBe("INVALID_ARGUMENT");
  });
  it("checks methods, JSON, ownership and immutable snapshot identities", async () => {
    expect((await call("/me", "POST")).response.status).toBe(404);
    const malformed = await fetch(base + "/api/v1/auth/login", {
      method: "POST",
      body: "{",
    });
    expect(malformed.status).toBe(400);
    expect((await call("/oj-accounts/123/dashboard")).response.status).toBe(
      404,
    );
    expect(
      (await call(path + "/analysis/" + fixtureUuid(999))).response.status,
    ).toBe(404);
    const history = pageEnvelope(analysisSchema).parse(
      (await call(path + "/analysis/history?window=7D")).payload,
    );
    for (const item of history.data)
      expect(
        envelope(analysisSchema).parse(
          (await call(path + "/analysis/" + item.snapshotId)).payload,
        ).data,
      ).toEqual(item);
  });
  it("soft-unbinds, preserves historical data and rebinds a new ID", async () => {
    expect((await call(path, "DELETE")).response.status).toBe(204);
    expect(
      envelope(accountSchema).parse((await call(path)).payload).data.bindStatus,
    ).toBe("UNBOUND");
    const all = pageEnvelope(accountSchema).parse(
      (await call("/oj-accounts?includeUnbound=true")).payload,
    );
    expect(all.data.some((a) => a.accountId === id)).toBe(true);
    expect((await call(path + "/sync", "POST")).response.status).toBe(409);
    const rebound = await call("/oj-accounts", "POST", {
      platform: "codeforces",
      username: "DemoAlpha",
    });
    const newAccount = (
      rebound.payload as { data: { account: { accountId: string } } }
    ).data.account;
    expect(newAccount.accountId).not.toBe(id);
    expect(
      envelope(analysisSchema.nullable()).parse(
        (await call(`/oj-accounts/${newAccount.accountId}/analysis/latest`))
          .payload,
      ).data,
    ).toBeNull();
    expect(
      (
        await call("/oj-accounts", "POST", {
          platform: "codeforces",
          username: "demoalpha",
        })
      ).response.status,
    ).toBe(409);
  });
  it("keeps histories immutable and honors generation limits and idempotency", async () => {
    const previous = envelope(batchSchema.nullable()).parse(
      (await call(path + "/recommendations/latest")).payload,
    ).data!;
    const key = fixtureUuid(950);
    const first = await call(
      path + "/recommendations/generate",
      "POST",
      { mode: "HYBRID", limit: 1 },
      key,
    );
    expect(first.response.status).toBe(201);
    expect(envelope(batchSchema).parse(first.payload).data.resultCount).toBe(1);
    const repeat = await call(
      path + "/recommendations/generate",
      "POST",
      { mode: "HYBRID", limit: 1 },
      key,
    );
    expect(repeat.response.status).toBe(200);
    expect(repeat.payload).toMatchObject({
      data: envelope(batchSchema).parse(first.payload).data,
    });
    expect(
      (
        await call(
          path + "/recommendations/generate",
          "POST",
          { mode: "HYBRID", limit: 2 },
          key,
        )
      ).response.status,
    ).toBe(409);
    expect(
      envelope(batchSchema).parse(
        (await call(path + "/recommendations/" + previous.batchId)).payload,
      ).data,
    ).toEqual(previous);
    expect(
      pageEnvelope(batchSchema).parse(
        (await call(path + "/recommendations/history")).payload,
      ).meta.total,
    ).toBe(4);
  });
  it("returns the same active job, a partial analysis failure and original sync time on rebuild", async () => {
    await control({ partial: true });
    const first = envelope(jobSchema).parse(
      (await call(path + "/analysis/rebuild", "POST")).payload,
    ).data;
    const second = envelope(jobSchema).parse(
      (await call(path + "/sync", "POST")).payload,
    ).data;
    expect(first).toEqual(second);
    const terminal = envelope(jobSchema).parse(
      (await call("/sync-jobs/" + first.jobId)).payload,
    ).data;
    expect(terminal.status).toBe("PARTIAL");
    expect(terminal.errors[0].stage).toBe("ANALYSIS");
    expect(
      envelope(accountSchema).parse((await call(path)).payload).data
        .lastSyncedAt,
    ).toBe(demoAccounts[0].lastSyncedAt);
    const cooldown = await call(path + "/sync", "POST");
    expect(cooldown.response.status).toBe(429);
    expect(
      Number(cooldown.response.headers.get("Retry-After")),
    ).toBeGreaterThan(0);
  });
  it("distinguishes null, zero evidence, empty candidates and failures", async () => {
    await control({ noAnalysis: true });
    expect(
      envelope(analysisSchema.nullable()).parse(
        (await call(path + "/analysis/latest")).payload,
      ).data,
    ).toBeNull();
    await control({ zero: true, emptyCandidates: true });
    const zero = envelope(analysisSchema).parse(
      (await call(path + "/analysis/latest")).payload,
    ).data;
    expect(zero.dimensions.every((d) => d.score === 0)).toBe(true);
    expect(zero.summary.averageSolvedDifficulty).toBeNull();
    expect(
      envelope(batchSchema).parse(
        (await call(path + "/recommendations/latest")).payload,
      ).data.recommendations,
    ).toEqual([]);
    await control({ failReads: true });
    expect((await call("/me")).response.status).toBe(503);
  });
});
