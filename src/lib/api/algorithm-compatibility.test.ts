import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyAlgorithmVersion } from "./algorithm-compatibility";
import { api } from "./endpoints";
import { v012 } from "./v012";
import { algorithmVersionSchema, analysisSchema, batchSchema } from "./schemas";
import {
  personalReportSchema,
  teamAnalysisSchema,
  teamBatchSchema,
  userAnalysisSchema,
} from "./v012-schemas";
import { demoAnalysis, demoBatch, fixtureUuid } from "../demo/fixtures";
import {
  v012Analysis,
  v012Report,
  v012TeamAnalysis,
  v012TeamBatch,
} from "../demo/v012-fixtures";

afterEach(() => vi.unstubAllGlobals());

function respond(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ data, requestId: fixtureUuid(9999) })),
  );
}

describe("algorithm metadata compatibility", () => {
  it.each(["0.12.1", "0.13.1", "0.13.2", "9.0.0"])(
    "preserves structurally valid %s payloads across every analysis family",
    (version) => {
      const account = {
        ...demoAnalysis(),
        algorithmVersion: `profile-v${version}`,
      };
      const user = {
        ...v012Analysis(),
        algorithmVersion: `user-profile-v${version}`,
      };
      const team = {
        ...v012TeamAnalysis(),
        algorithmVersion: `team-profile-v${version}`,
      };
      expect(analysisSchema.parse(account)).toEqual(account);
      expect(userAnalysisSchema.parse(user)).toEqual(user);
      expect(teamAnalysisSchema.parse(team)).toEqual(team);
    },
  );

  it.each(["0.13.1", "0.13.2", "9.0.0"])(
    "preserves %s recommendation and report metadata without literal gates",
    (version) => {
      const account = {
        ...demoBatch(),
        algorithmVersion: `recommend-v${version}`,
      };
      const team = {
        ...v012TeamBatch(),
        algorithmVersion: `team-recommend-v${version}`,
      };
      const report = {
        ...v012Report(),
        reportVersion: `personal-report-v${version}`,
      };
      expect(batchSchema.parse(account)).toEqual(account);
      expect(teamBatchSchema.parse(team)).toEqual(team);
      expect(personalReportSchema.parse(report)).toEqual(report);
    },
  );

  it("recognizes only exact audited versions in their own family", () => {
    expect(
      classifyAlgorithmVersion("user-profile-v0.13.1", "user-profile"),
    ).toBe("known");
    expect(classifyAlgorithmVersion("profile-v0.13.1", "account-profile")).toBe(
      "known",
    );
    expect(
      classifyAlgorithmVersion("team-profile-v0.12.1", "team-profile"),
    ).toBe("known");
    expect(
      classifyAlgorithmVersion("recommend-v0.12.0", "account-recommendation"),
    ).toBe("known");
    expect(
      classifyAlgorithmVersion("team-recommend-v0.12.1", "team-recommendation"),
    ).toBe("known");
    expect(
      classifyAlgorithmVersion("personal-report-v0.12.1", "personal-report"),
    ).toBe("known");
    expect(
      classifyAlgorithmVersion("user-profile-v0.13.2", "user-profile"),
    ).toBe("unknown");
    expect(
      classifyAlgorithmVersion("team-profile-v0.13.1", "team-profile"),
    ).toBe("unknown");
    expect(
      classifyAlgorithmVersion("user-profile-v0.13.1", "account-profile"),
    ).toBe("unknown");
    expect(classifyAlgorithmVersion("anything-v0.13.1", "user-profile")).toBe(
      "unknown",
    );
  });

  it.each([undefined, null, 131, "", " \t\n"])(
    "rejects invalid version metadata %j",
    (version) => {
      expect(algorithmVersionSchema.safeParse(version).success).toBe(false);
      expect(
        userAnalysisSchema.safeParse({
          ...v012Analysis(),
          algorithmVersion: version,
        }).success,
      ).toBe(false);
    },
  );

  it("does not relax required fields or score bounds for a future version", async () => {
    const future = {
      ...v012Analysis(),
      algorithmVersion: "user-profile-v9.0.0",
    };
    respond({ ...future, dimensions: [] });
    await expect(v012.userAnalysis(future.publicId)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    expect(
      userAnalysisSchema.safeParse({ ...future, overallScore: 101 }).success,
    ).toBe(false);
    expect(
      userAnalysisSchema.safeParse({ ...future, summary: undefined }).success,
    ).toBe(false);
    expect(
      teamAnalysisSchema.safeParse({
        ...v012TeamAnalysis(),
        algorithmVersion: "team-profile-v9.0.0",
        audience: "PUBLIC",
      }).success,
    ).toBe(false);
  });

  it("reads V0.13.1 user analysis through the real API adapter", async () => {
    const profile = {
      ...v012Analysis(),
      algorithmVersion: "user-profile-v0.13.1",
    };
    respond(profile);
    await expect(v012.userAnalysis(profile.publicId)).resolves.toEqual(profile);
  });

  it("retains identity checks for newer structurally valid payloads", async () => {
    const profile = {
      ...v012Analysis(),
      algorithmVersion: "user-profile-v0.13.2",
    };
    respond(profile);
    await expect(v012.userAnalysis(fixtureUuid(999))).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    const account = { ...demoAnalysis(), algorithmVersion: "profile-v9.0.0" };
    respond(account);
    await expect(api.analysis("9007199254740995", "ALL")).rejects.toMatchObject(
      {
        code: "ACCOUNT_MISMATCH",
      },
    );
  });
});
