import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateCollaboration,
  invalidateAiResult,
} from "./v012-invalidation";
import { keys } from "./keys";
import { clearSession } from "@/components/training/query-provider";
describe("V0.12 mutation refresh", () => {
  it("refreshes application/member/notification/coach data only for initiating identity", async () => {
    const client = new QueryClient();
    const own = keys.team("a", "t", "applications", { page: 1 });
    const members = keys.team("a", "t", "members", { page: 1 });
    const other = keys.team("b", "t", "members", { page: 1 });
    for (const key of [
      own,
      members,
      other,
      keys.userResource("a", "notifications", { page: 1 }),
    ])
      client.setQueryData(key, []);
    await invalidateCollaboration(client, "a", "application", "t");
    expect(client.getQueryState(own)?.isInvalidated).toBe(true);
    expect(client.getQueryState(members)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  });
  it("AI completion refreshes latest and history without altering unrelated resources", async () => {
    const client = new QueryClient();
    const latest = keys.userResource("a", "reports", { endpoint: "latest" });
    const history = keys.userResource("a", "reports", {
      endpoint: "history",
      page: 2,
    });
    const profile = keys.userResource("a", "user-analysis", { window: "ALL" });
    for (const key of [latest, history, profile]) client.setQueryData(key, {});
    await invalidateAiResult(client, "a", "PERSONAL_REPORT");
    expect(client.getQueryState(latest)?.isInvalidated).toBe(true);
    expect(client.getQueryState(history)?.isInvalidated).toBe(true);
    expect(client.getQueryState(profile)?.isInvalidated).toBe(false);
  });
  it("logout clears team, report, privacy, notifications and AI caches", () => {
    const client = new QueryClient();
    for (const key of [
      keys.team("a", "t", "recommendations", { audience: "COACH" }),
      keys.userResource("a", "privacy"),
      keys.userResource("a", "reports"),
      keys.aiJob("a", "job"),
      keys.userResource("a", "notifications"),
    ])
      client.setQueryData(key, {});
    clearSession(client);
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toEqual([keys.session]);
  });
});
