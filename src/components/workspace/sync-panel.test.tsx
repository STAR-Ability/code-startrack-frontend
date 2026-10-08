import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import type { SyncJobDto } from "@/lib/api/schemas";
import {
  demoAccounts,
  demoJob,
  demoUser,
  fixtureUuid,
} from "@/lib/demo/fixtures";
import {
  v02LearningProfile,
  v02RecommendationBatch,
} from "@/lib/demo/v02-fixtures";
import { keys } from "@/lib/query/keys";
import { v02Keys } from "@/lib/query/v02";
import * as learningQueries from "@/lib/query/v02-hooks";
import { SyncPanel } from "./sync-panel";

vi.mock("next/navigation", () => ({ usePathname: () => "/accounts" }));
vi.mock("./account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return { useAccounts: () => ({ user: demoUser }) };
});

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.restoreAllMocks();
});

function mountedSync(status: SyncJobDto["status"]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const account = demoAccounts[0];
  const job = demoJob(account.accountId, status);
  const syncStatus = {
    accountId: account.accountId,
    lastSyncedAt: account.lastSyncedAt,
    lastSyncStatus: status,
    nextSyncAt: account.nextSyncAt,
    latestJob: job,
  };
  client.setQueryData(keys.session, demoUser);
  client.setQueryData(keys.accounts(demoUser.publicId), [account]);
  client.setQueryData(
    keys.resource(demoUser.publicId, account.accountId, "sync-status"),
    syncStatus,
  );
  const jobKey = keys.resource(demoUser.publicId, account.accountId, "job", {
    jobId: job.jobId,
  });
  client.setQueryData(jobKey, job);
  vi.spyOn(api, "syncStatus").mockResolvedValue(syncStatus);
  vi.spyOn(api, "job").mockResolvedValue(job);

  const profile = v02LearningProfile();
  const batch = v02RecommendationBatch();
  const mutable = [
    ["training-records", { source: "EXTERNAL", page: 1 }, []],
    ["learning-profile", { window: "ALL" }, profile],
    ["learning-history", { window: "ALL", page: 1 }, [profile]],
    ["recommendations", { source: "ALL", mode: "HYBRID" }, batch],
    ["recommendation-history", { page: 1 }, [batch]],
    ["recommendation-batch", { batchId: batch.batchId }, batch],
  ] as const;
  const currentKeys = mutable.map(([resource, params, value]) => {
    const key = v02Keys.resource(demoUser.publicId, resource, params);
    client.setQueryData(key, value);
    return key;
  });
  const otherId = fixtureUuid(999);
  const otherKeys = mutable.map(([resource, params, value]) => {
    const key = v02Keys.resource(otherId, resource, params);
    client.setQueryData(key, value);
    return key;
  });
  const frozenKey = v02Keys.resource(demoUser.publicId, "learning-snapshot", {
    snapshotId: profile.snapshotId,
  });
  client.setQueryData(frozenKey, profile);
  const bridge = vi.spyOn(learningQueries, "invalidateV02LearningSources");
  render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <SyncPanel account={account} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return {
    client,
    job,
    jobKey,
    bridge,
    currentKeys,
    otherKeys,
    frozenKey,
    profile,
    otherId,
  };
}

describe("CF sync refreshes combined learning projections", () => {
  for (const status of ["SUCCESS", "PARTIAL", "FAILED"] as const) {
    it(`refreshes current-user mutable evidence after ${status}, preserving frozen snapshots and other users`, async () => {
      const { client, bridge, currentKeys, otherKeys, frozenKey, profile } =
        mountedSync(status);
      await waitFor(() => {
        for (const key of currentKeys)
          expect(client.getQueryState(key)?.isInvalidated).toBe(true);
      });
      expect(bridge).toHaveBeenCalledOnce();
      expect(bridge).toHaveBeenCalledWith(client, demoUser.publicId);
      for (const key of otherKeys)
        expect(client.getQueryState(key)?.isInvalidated).toBe(false);
      expect(client.getQueryState(frozenKey)?.isInvalidated).toBe(false);
      expect(client.getQueryData(frozenKey)).toEqual(profile);
    });
  }

  for (const status of ["QUEUED", "RUNNING"] as const) {
    it(`keeps combined evidence unchanged while CF sync is ${status}`, async () => {
      const { client, bridge, currentKeys } = mountedSync(status);
      await act(async () => {});
      expect(bridge).not.toHaveBeenCalled();
      for (const key of currentKeys)
        expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    });
  }

  it("ignores a terminal result observed after the session changed", async () => {
    const { client, job, jobKey, bridge, currentKeys, otherKeys, otherId } =
      mountedSync("RUNNING");
    await act(async () => {
      client.setQueryData(keys.session, { ...demoUser, publicId: otherId });
      client.setQueryData(jobKey, { ...job, status: "SUCCESS" });
    });
    expect(bridge).not.toHaveBeenCalled();
    for (const key of [...currentKeys, ...otherKeys])
      expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
});
