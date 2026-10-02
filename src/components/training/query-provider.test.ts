import { afterEach, expect, test, vi } from "vitest";
import { QueryObserver } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { createQueryClient, clearSession } from "./query-provider";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import { demoUser, demoAccounts, demoAnalysis } from "@/lib/demo/fixtures";
import { api } from "@/lib/api/endpoints";
import { fixtureUuid } from "@/lib/demo/fixtures";
import { pollingInterval } from "@/components/workspace/sync-panel";

afterEach(() => vi.unstubAllGlobals());
test("keys isolate users, accounts, windows, modes and filters", () => {
  const keysToCompare = [
    keys.resource("u", "a", "analysis", { window: "ALL" }),
    keys.resource("u", "b", "analysis", { window: "ALL" }),
    keys.resource("v", "a", "analysis", { window: "ALL" }),
    keys.resource("u", "a", "analysis", { window: "7D" }),
    keys.resource("u", "a", "recommendations", { mode: "HYBRID" }),
    keys.resource("u", "a", "recommendations", { mode: "LEVEL" }),
    keys.resource("u", "a", "problems", { page: 1, tag: "dp" }),
    keys.resource("u", "a", "problems", { page: 2, tag: "dp" }),
  ];
  expect(new Set(keysToCompare.map((key) => JSON.stringify(key))).size).toBe(
    keysToCompare.length,
  );
});
test("logout cancels an in-flight read and clears every private cache", async () => {
  const client = createQueryClient();
  client.setQueryData(keys.session, demoUser);
  let resolve: ((value: Response) => void) | undefined;
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_path, options) => {
      signal = options.signal;
      return new Promise<Response>((done) => {
        resolve = done;
      });
    }),
  );
  const key = keys.resource(
    demoUser.publicId,
    demoAccounts[0].accountId,
    "analysis",
    { window: "ALL" },
  );
  const read = client
    .fetchQuery({
      queryKey: key,
      queryFn: ({ signal }) =>
        api.analysis(demoAccounts[0].accountId, "ALL", signal),
    })
    .catch(() => undefined);
  clearSession(client);
  expect(signal?.aborted).toBe(true);
  resolve?.(
    Response.json({ data: demoAnalysis(), requestId: fixtureUuid(900) }),
  );
  await read;
  expect(client.getQueryData(key)).toBeUndefined();
  expect(client.getQueryData(keys.session)).toBeNull();
  expect(isCurrentUser(client, demoUser.publicId)).toBe(false);
  client.clear();
});
test("later read failure retains previously successful data", async () => {
  const client = createQueryClient();
  const key = keys.resource(
    demoUser.publicId,
    demoAccounts[0].accountId,
    "analysis",
  );
  client.setQueryData(key, demoAnalysis());
  await client.invalidateQueries({ queryKey: key });
  await expect(
    client.fetchQuery({
      queryKey: key,
      queryFn: async () => {
        throw new Error("temporary");
      },
    }),
  ).rejects.toThrow();
  expect(client.getQueryData(key)).toEqual(demoAnalysis());
  client.clear();
});
test("late mutation identity cannot write after a user change", () => {
  const client = createQueryClient();
  client.setQueryData(keys.session, { ...demoUser, publicId: fixtureUuid(2) });
  expect(isCurrentUser(client, demoUser.publicId)).toBe(false);
  client.clear();
});
test("job network retries back off to at most thirty seconds", () => {
  expect([0, 1, 2, 3, 4, 5].map(pollingInterval)).toEqual([
    3000, 6000, 12000, 24000, 30000, 30000,
  ]);
});

test("a private 401 notifies the mounted session observer and removes private data", async () => {
  const client = createQueryClient();
  client.setQueryData(keys.session, demoUser);
  client.setQueryData(keys.accounts(demoUser.publicId), demoAccounts);
  const observer = new QueryObserver<typeof demoUser | null>(client, {
    queryKey: keys.session,
    enabled: false,
  });
  const observed = vi.fn();
  const unsubscribe = observer.subscribe(observed);
  try {
    await expect(
      client.fetchQuery({
        queryKey: keys.resource(
          demoUser.publicId,
          demoAccounts[0].accountId,
          "recommendations",
        ),
        queryFn: async () => {
          throw new ApiError("UNAUTHENTICATED", 401);
        },
      }),
    ).rejects.toThrow();
    expect(observer.getCurrentResult().data).toBeNull();
    expect(observed).toHaveBeenCalledWith(
      expect.objectContaining({ data: null }),
    );
    expect(
      client.getQueryData(keys.accounts(demoUser.publicId)),
    ).toBeUndefined();
  } finally {
    unsubscribe();
    client.clear();
  }
});
