import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { api } from "./endpoints";
import { assertAccount, request } from "./client";
import {
  analysisSchema,
  batchSchema,
  idSchema,
  accountSchema,
  submissionSchema,
} from "./schemas";
import {
  demoAccounts,
  demoAnalysis,
  demoBatch,
  demoGym,
  demoJob,
  demoUnbound,
  demoUser,
  fixtureUuid,
} from "@/lib/demo/fixtures";
import { ApiError } from "./errors";

const ok = (data: unknown) =>
  Response.json({ data, requestId: fixtureUuid(900) });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("V0.11 wire contract", () => {
  test.each(["9007199254740993", "9223372036854775807"])(
    "preserves opaque bigint ID %s",
    (value) => expect(idSchema.parse(value)).toBe(value),
  );
  test.each([1, 9007199254740992, "1e10", "-1", "0", "1.5", " 1", "01"])(
    "rejects invalid ID %s",
    (value) => expect(idSchema.safeParse(value).success).toBe(false),
  );
  test("complete synthetic account, zero analysis and three modes conform", () => {
    [...demoAccounts, demoUnbound].forEach((value) =>
      expect(accountSchema.safeParse(value).success).toBe(true),
    );
    for (const window of ["7D", "30D", "365D", "ALL"] as const)
      expect(
        analysisSchema.parse(demoAnalysis(undefined, window, true)).summary
          .averageSolvedDifficulty,
      ).toBeNull();
    for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"] as const)
      expect(batchSchema.parse(demoBatch(undefined, mode)).mode).toBe(mode);
  });
  test("requires nullable fields, arrays, UTC and exactly six dimensions", () => {
    const value = demoAnalysis();
    expect(
      analysisSchema.safeParse({ ...value, currentRating: undefined }).success,
    ).toBe(false);
    expect(analysisSchema.safeParse({ ...value, tagStats: {} }).success).toBe(
      false,
    );
    expect(
      analysisSchema.safeParse({
        ...value,
        dataCutoffAt: "2026-10-02T02:30:00",
      }).success,
    ).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...value,
        dimensions: value.dimensions.slice(1),
      }).success,
    ).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...value,
        dimensions: value.dimensions.map((d) => ({ ...d, code: "MATH" })),
      }).success,
    ).toBe(false);
  });
  test("rejects nested account contamination including dashboard jobs and histories", () => {
    expect(() =>
      assertAccount(
        {
          accountId: demoAccounts[0].accountId,
          sync: { latestJob: demoJob(demoAccounts[1].accountId) },
        },
        demoAccounts[0].accountId,
      ),
    ).toThrow("ACCOUNT_MISMATCH");
    expect(() =>
      assertAccount(
        [demoAnalysis(), demoAnalysis(demoAccounts[1].accountId)],
        demoAccounts[0].accountId,
      ),
    ).toThrow("ACCOUNT_MISMATCH");
  });
  test("preserves pending/team/Gym nullable submission fields", () => {
    const value = submissionSchema.parse({
      submissionId: "9007199254742993",
      accountId: demoAccounts[0].accountId,
      externalSubmissionId: "9007199254743993",
      problem: demoGym,
      verdict: "PENDING",
      verdictRaw: null,
      programmingLanguage: null,
      participantType: "CONTESTANT",
      memberHandles: ["Alpha", "Beta"],
      teamId: "123",
      teamName: "Demo team",
      testset: null,
      passedTestCount: null,
      timeMs: null,
      memoryBytes: null,
      submittedAt: "2026-10-02T02:30:00Z",
    });
    expect(value.memoryBytes).toBeNull();
    expect(value.verdict).toBe("PENDING");
  });
});
describe("centralized transport", () => {
  test("only same-origin v1 calls carry Session credentials and cancellation", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(demoUser));
    vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController();
    await api.me(controller.signal);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/me",
      expect.objectContaining({
        credentials: "include",
        method: "GET",
        cache: "no-store",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetcher.mock.calls[0][1].body).toBeUndefined();
    await expect(request("//foreign.test", z.unknown())).rejects.toThrow(
      "INVALID_API_PATH",
    );
  });
  test("reads account pages until hasNext is false", async () => {
    const fetcher = vi.fn().mockImplementation((url: string) => {
      const page = Number(
        new URL(url, "http://local").searchParams.get("page"),
      );
      return Promise.resolve(
        Response.json({
          data: [demoAccounts[page - 1]],
          requestId: fixtureUuid(900),
          meta: { page, pageSize: 1, total: 2, hasNext: page === 1 },
        }),
      );
    });
    vi.stubGlobal("fetch", fetcher);
    expect(await api.accounts(false)).toEqual(demoAccounts);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  test("rejects a mismatched analysis rather than entering it in the view", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(ok(demoAnalysis(demoAccounts[1].accountId))),
    );
    await expect(
      api.analysis(demoAccounts[0].accountId, "ALL"),
    ).rejects.toThrow("ACCOUNT_MISMATCH");
  });
  test("preserves error codes, details, requestId and Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "safe message",
              details: { key: "x" },
            },
            requestId: fixtureUuid(900),
          },
          { status: 409, headers: { "Retry-After": "2" } },
        ),
      ),
    );
    await expect(
      api.generate(demoAccounts[0].accountId, "HYBRID", 10, fixtureUuid(901)),
    ).rejects.toMatchObject({
      code: "REQUEST_IN_PROGRESS",
      status: 409,
      retryAfter: 2,
      requestId: fixtureUuid(900),
    });
  });
  test("only generation sends its exact body and Idempotency-Key; sync/logout have no body", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(ok(demoBatch()))
      .mockResolvedValueOnce(ok(demoJob()))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await api.generate(
      demoAccounts[0].accountId,
      "HYBRID",
      10,
      fixtureUuid(901),
    );
    await api.sync(demoAccounts[0].accountId);
    await api.logout();
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ mode: "HYBRID", limit: 10 }),
      headers: expect.objectContaining({ "Idempotency-Key": fixtureUuid(901) }),
    });
    expect(fetcher.mock.calls[1][1].body).toBeUndefined();
    expect(fetcher.mock.calls[2][1].body).toBeUndefined();
  });
  test("network failure and malformed payload are distinguishable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError("network"))
        .mockResolvedValueOnce(ok({})),
    );
    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
    await expect(api.me()).rejects.toThrow("INVALID_RESPONSE");
  });
});

test("rejects a response for the wrong window or mode even within the same account", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(ok(demoAnalysis(undefined, "ALL")))
      .mockResolvedValueOnce(ok(demoBatch(undefined, "LEVEL"))),
  );
  await expect(api.analysis(demoAccounts[0].accountId, "7D")).rejects.toThrow(
    "INVALID_RESPONSE",
  );
  await expect(
    api.recommendations(demoAccounts[0].accountId, "HYBRID"),
  ).rejects.toThrow("INVALID_RESPONSE");
});
