// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  profileFixture,
  recommendationsFixture,
} from "../../../tests/api-fixtures.mjs";
import {
  getTrainingProfile,
  getTrainingRecommendations,
} from "./client.server";
import { backendOrigin } from "./config.server";
import { readGateway } from "./gateway.server";
import { profileSchema, recommendationsSchema } from "./schemas";

const fetchStub = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("BACKEND_BASE_URL", "http://upstream.invalid:8080");
  vi.stubGlobal("fetch", fetchStub);
});

afterEach(() => {
  fetchStub.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("closed GET transport", () => {
  test.each([
    [getTrainingProfile, profileFixture, "/api/users/1/profile"],
    [
      getTrainingRecommendations,
      recommendationsFixture,
      "/api/users/1/recommendations?limit=1",
    ],
  ] as const)(
    "forwards exactly the approved operation: %s",
    async (read, payload, path) => {
      fetchStub.mockResolvedValue(Response.json(payload));
      expect(await read()).toEqual(payload);
      expect(fetchStub).toHaveBeenCalledExactlyOnceWith(
        `http://upstream.invalid:8080${path}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
          redirect: "manual",
          cache: "no-store",
          signal: expect.any(AbortSignal),
        },
      );
    },
  );

  test("importing modules neither reads configuration nor fetches", async () => {
    vi.stubEnv("BACKEND_BASE_URL", undefined);
    vi.resetModules();
    await import("./client.server");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test.each([
    undefined,
    "",
    " ",
    "/api",
    "example.invalid",
    "ftp://example.invalid",
    "https://name:password@example.invalid",
    "https://@example.invalid",
    "http://example.invalid/path",
    "http://example.invalid/../",
    "http://example.invalid//",
    "http://example.invalid?",
    "http://example.invalid?x=1",
    "http://example.invalid#",
    "http://example.invalid#fragment",
    "http://example.invalid\\",
    " http://example.invalid",
    "http://example.invalid\n",
    "http://example.invalid:invalid",
  ])("rejects unusable configuration before transport: %s", async (value) => {
    vi.stubEnv("BACKEND_BASE_URL", value);
    await expect(getTrainingProfile()).rejects.toMatchObject({
      detail: { category: "configuration", status: 500 },
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test("reads runtime configuration each time and normalizes a trailing slash", async () => {
    fetchStub.mockImplementation(async () => Response.json(profileFixture));
    await getTrainingProfile();
    vi.stubEnv("BACKEND_BASE_URL", "https://second.invalid/");
    expect(backendOrigin("profile")).toBe("https://second.invalid");
    await getTrainingProfile();
    expect(fetchStub.mock.calls.map(([url]) => url)).toEqual([
      "http://upstream.invalid:8080/api/users/1/profile",
      "https://second.invalid/api/users/1/profile",
    ]);
  });

  test.each([getTrainingProfile, getTrainingRecommendations])(
    "rejects a different learner",
    async (read) => {
      fetchStub.mockResolvedValue(
        Response.json({
          ...profileFixture,
          ...recommendationsFixture,
          userId: 2,
        }),
      );
      await expect(read()).rejects.toMatchObject({
        detail: { category: "invalid_payload" },
      });
    },
  );

  test.each([301, 302, 307, 308, 400, 404, 409, 429, 500, 502, 503])(
    "keeps HTTP status %s without redirect or raw body passthrough",
    async (status) => {
      fetchStub.mockResolvedValue(
        Response.json(
          {
            error: "account_not_found",
            message: "private upstream http://upstream.invalid:8080",
          },
          {
            status,
            headers: {
              Location: "http://another.invalid",
              "Set-Cookie": "secret=value",
            },
          },
        ),
      );
      const response = await readGateway(
        new Request("http://frontend.invalid/api/training/profile"),
        "profile",
      );
      expect(response.status).toBe(status >= 400 ? status : 502);
      expect(await response.json()).toEqual({
        error: {
          operation: "profile",
          category: "http",
          status: status >= 400 ? status : 502,
          upstreamStatus: status,
          backendError: "account_not_found",
        },
      });
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(fetchStub).toHaveBeenCalledTimes(1);
    },
  );

  test.each([
    "",
    "<html>private error</html>",
    '{"error":"secret_identifier","message":"private"}',
  ])("preserves status for unrecognized error bodies: %s", async (body) => {
    fetchStub.mockResolvedValue(new Response(body, { status: 404 }));
    await expect(getTrainingRecommendations()).rejects.toMatchObject({
      detail: {
        operation: "recommendation",
        category: "http",
        status: 404,
        upstreamStatus: 404,
      },
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  test.each(["", "not json", "{"])(
    "classifies invalid success JSON: %s",
    async (body) => {
      fetchStub.mockResolvedValue(new Response(body));
      await expect(getTrainingProfile()).rejects.toMatchObject({
        detail: { category: "invalid_json", status: 502 },
      });
    },
  );

  test("normalizes a network failure without retry or exposing its message", async () => {
    fetchStub.mockRejectedValue(
      new Error("secret URL http://upstream.invalid:8080"),
    );
    const response = await readGateway(
      new Request("http://frontend.invalid/api/training/profile"),
      "profile",
    );
    expect(await response.json()).toEqual({
      error: { operation: "profile", category: "transport", status: 502 },
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  test("an already aborted operation makes no request", async () => {
    await expect(getTrainingProfile(AbortSignal.abort())).rejects.toMatchObject(
      { detail: { category: "aborted", status: 502 } },
    );
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test.each(["abort", "timeout"])(
    "bounds pending transport: %s",
    async (mode) => {
      vi.useFakeTimers();
      fetchStub.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted private request")),
              { once: true },
            );
          }),
      );
      const controller = new AbortController();
      const outcome = expect(
        getTrainingProfile(controller.signal),
      ).rejects.toMatchObject({
        detail: {
          category: mode === "timeout" ? "timeout" : "aborted",
          status: mode === "timeout" ? 504 : 502,
        },
      });
      if (mode === "abort") controller.abort();
      else await vi.advanceTimersByTimeAsync(8_000);
      await outcome;
      expect(fetchStub).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  test("the timeout also bounds a response whose body stalls", async () => {
    vi.useFakeTimers();
    fetchStub.mockImplementation(
      async (_url, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener(
                "abort",
                () => controller.error(new Error("body aborted")),
                { once: true },
              );
            },
          }),
        ),
    );
    const outcome = expect(getTrainingProfile()).rejects.toMatchObject({
      detail: { category: "timeout", status: 504, upstreamStatus: 200 },
    });
    await vi.advanceTimersByTimeAsync(8_000);
    await outcome;
  });
});

describe("truthful consumed fields", () => {
  test("keeps zeros and separate timestamps, strips unrelated placeholder fields", () => {
    expect(
      profileSchema.parse({
        ...profileFixture,
        skills: [{ score: 1 }],
        futureField: true,
      }),
    ).toEqual(profileFixture);
    expect(recommendationsSchema.parse(recommendationsFixture)).toEqual(
      recommendationsFixture,
    );
    expect(
      recommendationsSchema.parse({
        ...recommendationsFixture,
        recommendations: [],
      }).recommendations,
    ).toEqual([]);
  });

  test.each([
    undefined,
    null,
    -1,
    1.5,
    "0",
    Number.NaN,
    Infinity,
    2_147_483_648,
  ])("rejects unusable required counts: %s", (totalSolved) => {
    expect(
      profileSchema.safeParse({ ...profileFixture, totalSolved }).success,
    ).toBe(false);
  });

  test.each([undefined, null, -1, Infinity, "0"])(
    "rejects unusable average: %s",
    (averageDifficulty) => {
      expect(
        profileSchema.safeParse({ ...profileFixture, averageDifficulty })
          .success,
      ).toBe(false);
    },
  );

  test.each([
    undefined,
    null,
    {},
    { last_7_days: 0 },
    { last_7_days: 0, last_30_days: -1 },
  ])("rejects unusable activity: %s", (recentActivity) => {
    expect(
      profileSchema.safeParse({ ...profileFixture, recentActivity }).success,
    ).toBe(false);
  });

  test.each([
    undefined,
    "",
    "yesterday",
    "2026-02-30T00:00:00Z",
    "2026-01-01",
    "2026-01-01T25:00:00Z",
  ])("rejects unusable timestamps: %s", (updatedAt) => {
    expect(
      profileSchema.safeParse({ ...profileFixture, updatedAt }).success,
    ).toBe(false);
  });

  test.each(["2026-01-02T03:04:05", "2026-01-02T03:04:05.123456789012+08:00"])(
    "accepts usable precision/offset variants: %s",
    (updatedAt) => {
      expect(
        profileSchema.parse({ ...profileFixture, updatedAt }).updatedAt,
      ).toBe(updatedAt);
    },
  );

  test.each([Number.MAX_SAFE_INTEGER + 1, 1.5, "1", null])(
    "rejects unsafe/non-numeric IDs: %s",
    (id) => {
      expect(
        profileSchema.safeParse({ ...profileFixture, userId: id }).success,
      ).toBe(false);
      expect(
        recommendationsSchema.safeParse({
          ...recommendationsFixture,
          userId: id,
        }).success,
      ).toBe(false);
      expect(
        recommendationsSchema.safeParse({
          ...recommendationsFixture,
          recommendations: [
            { ...recommendationsFixture.recommendations[0], problemId: id },
          ],
        }).success,
      ).toBe(false);
    },
  );

  test("does not invent absent display metadata or expose score as confidence", () => {
    const item = {
      problemId: 7,
      platform: "codeforces",
      externalProblemId: "synthetic-A",
      reason: "",
      score: 1,
    };
    const result = recommendationsSchema.parse({
      ...recommendationsFixture,
      recommendations: [item],
    }).recommendations[0];
    expect(result).toEqual({
      problemId: 7,
      platform: "codeforces",
      externalProblemId: "synthetic-A",
      reason: "",
    });
    expect(result).not.toHaveProperty("score");
  });

  test.each([
    null,
    "",
    "/relative",
    "//example.invalid",
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@example.invalid",
    "not a URL",
    {},
  ])("makes an invalid supplied URL unusable: %s", (url) => {
    const result = recommendationsSchema.parse({
      ...recommendationsFixture,
      recommendations: [{ ...recommendationsFixture.recommendations[0], url }],
    });
    expect(result.recommendations[0].url).toBeNull();
  });
});

describe("local gateway rejection", () => {
  test("serializes missing configuration safely before any transport", async () => {
    vi.stubEnv("BACKEND_BASE_URL", undefined);
    const response = await readGateway(
      new Request("http://frontend.invalid/api/training/profile"),
      "profile",
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { operation: "profile", category: "configuration", status: 500 },
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test.each([
    "userId=2",
    "user_id=2",
    "limit=2",
    "url=http://another.invalid",
    "path=/api/accounts",
    "method=POST",
    "_method=DELETE",
  ])("rejects input %s before transport", async (query) => {
    const response = await readGateway(
      new Request(`http://frontend.invalid/api/training/profile?${query}`),
      "profile",
    );
    expect(response.status).toBe(400);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test.each([
    "x-http-method-override",
    "x-method-override",
    "x-http-method",
    "transfer-encoding",
    "content-length",
  ])("rejects override/body header %s before transport", async (name) => {
    const response = await readGateway(
      new Request("http://frontend.invalid/api/training/profile", {
        headers: { [name]: "1" },
      }),
      "profile",
    );
    expect(response.status).toBe(400);
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
