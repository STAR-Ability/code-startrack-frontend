import { afterEach, describe, expect, it } from "vitest";
import { envelope, pageEnvelope } from "../api/schemas";
import {
  learningRecommendationBatchSchema,
  trainingRecordSchema,
} from "../api/v02-schemas";
import { fixtureUuid } from "../demo/fixtures";
import { v02ExternalProblem, v02Problems } from "../demo/v02-fixtures";
import { installStoryScenario } from "../../../stories/mock/request-interceptor";

afterEach(() => installStoryScenario());
const read = (path: string) => window.fetch(`/api/v1${path}`);
const write = (path: string, body: unknown, key: string) =>
  window.fetch(`/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });

describe("V0.2 Storybook transport", () => {
  it("serves the production recommendation page's exact latest and history reads", async () => {
    installStoryScenario("v02-pure-platform");
    const latest = await read(
      "/me/recommendations/latest?source=ALL&mode=HYBRID",
    );
    expect(latest.status).toBe(200);
    const batch = envelope(learningRecommendationBatchSchema).parse(
      await latest.json(),
    ).data;
    const history = await read(
      "/me/recommendations/history?source=ALL&mode=HYBRID&page=1",
    );
    expect(history.status).toBe(200);
    const page = pageEnvelope(learningRecommendationBatchSchema).parse(
      await history.json(),
    );
    expect(page.data).toEqual([batch]);
    expect(
      batch.recommendations.map((item) => item.problem.problemRef.source),
    ).toContain("EXTERNAL");
    expect((await read("/me/privacy")).status).toBe(200);
  });

  it("supports every source/mode and preserves independent LEVEL difficulty scales", async () => {
    installStoryScenario("v02-pure-platform");
    for (const source of ["ALL", "PLATFORM", "EXTERNAL"])
      for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"]) {
        const response = await read(
          `/me/recommendations/latest?source=${source}&mode=${mode}`,
        );
        expect(response.status).toBe(200);
        const batch = envelope(learningRecommendationBatchSchema).parse(
          await response.json(),
        ).data;
        expect(batch).toMatchObject({ source, mode });
        if (mode === "LEVEL")
          expect(
            batch.recommendations.every(
              (item) => item.problem.difficultyScale === "CF_RATING",
            ),
          ).toBe(true);
      }
  });

  it("creates plans with batch attribution, namespace isolation and same-key replay", async () => {
    installStoryScenario("v02-pure-platform");
    const batch = envelope(learningRecommendationBatchSchema).parse(
      await (await read("/me/recommendations/latest")).json(),
    ).data;
    const plans = [];
    for (const [index, problem] of [
      v02Problems[0],
      v02ExternalProblem,
    ].entries()) {
      const body = {
        problemRef: problem.problemRef,
        recommendationBatchId: batch.batchId,
      };
      const key = fixtureUuid(9901 + index);
      const created = await write("/me/training-records", body, key);
      expect(created.status).toBe(201);
      const plan = envelope(trainingRecordSchema).parse(
        await created.json(),
      ).data;
      plans.push(plan);
      expect(plan.status).toBe("PLANNED");
      const replay = await write("/me/training-records", body, key);
      expect(replay.status).toBe(200);
      expect((await replay.json()).data.trainingRecordId).toBe(
        plan.trainingRecordId,
      );
    }
    expect(plans[0].trainingRecordId).not.toBe(plans[1].trainingRecordId);
    const records = pageEnvelope(trainingRecordSchema).parse(
      await (await read("/me/training-records?status=PLANNED")).json(),
    );
    expect(records.meta.total).toBe(2);
  });

  it("generates a limited new batch while keeping historical fixtures frozen", async () => {
    installStoryScenario("v02-pure-platform");
    const old = envelope(learningRecommendationBatchSchema).parse(
      await (await read("/me/recommendations/latest")).json(),
    ).data;
    const body = { source: "ALL", mode: "HYBRID", limit: 1 };
    const key = fixtureUuid(9903);
    const generated = await write("/me/recommendations/generate", body, key);
    expect(generated.status).toBe(201);
    const batch = envelope(learningRecommendationBatchSchema).parse(
      await generated.json(),
    ).data;
    expect(batch.batchId).not.toBe(old.batchId);
    expect(batch.resultCount).toBe(1);
    expect(
      (await write("/me/recommendations/generate", body, key)).status,
    ).toBe(200);
    expect(
      (await write("/me/recommendations/generate", { ...body, limit: 2 }, key))
        .status,
    ).toBe(409);
    expect((await read(`/me/recommendations/${old.batchId}`)).status).toBe(200);
    expect(
      (await (await read(`/me/recommendations/${old.batchId}`)).json()).data,
    ).toEqual(old);
  });

  it("retains empty and failure variants and rejects undeclared fields locally", async () => {
    installStoryScenario("v02-new-learner");
    expect(
      (await (await read("/me/recommendations/latest")).json()).data,
    ).toBeNull();
    expect((await (await read("/me/training-records")).json()).data).toEqual(
      [],
    );
    expect((await read("/me/recommendations/latest?extra=true")).status).toBe(
      400,
    );
    installStoryScenario("server-error");
    expect((await read("/me/training-records")).status).toBe(503);
  });
});
