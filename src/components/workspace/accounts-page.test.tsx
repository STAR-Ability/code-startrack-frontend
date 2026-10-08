import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { OjAccountDto } from "@/lib/api/schemas";
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
import { translate } from "@/lib/i18n/locale";
import { keys } from "@/lib/query/keys";
import { v02Keys } from "@/lib/query/v02";
import * as learningQueries from "@/lib/query/v02-hooks";
import { AccountsPage } from "./accounts-page";

const context = vi.hoisted(() => ({
  accounts: [] as OjAccountDto[],
  selectAccount: vi.fn(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/accounts" }));
vi.mock("./account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return {
    useAccounts: () => ({
      user: demoUser,
      accounts: context.accounts,
      selectedAccountId: context.accounts[0]?.accountId ?? null,
      query: { data: context.accounts, isFetching: false, error: null },
      selectAccount: context.selectAccount,
    }),
  };
});

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.restoreAllMocks();
  context.accounts = [];
  context.selectAccount.mockClear();
});

function showAccounts(
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  }),
) {
  const result = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <AccountsPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...result, client };
}

function showHistory() {
  const result = showAccounts();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Show unbound history" }),
  );
  return result;
}

describe("historical account availability", () => {
  it("shows loading rather than an empty-account conclusion while history is pending", () => {
    vi.spyOn(api, "accounts").mockImplementation(
      () => new Promise<OjAccountDto[]>(() => {}),
    );
    const { container } = showHistory();

    expect(container.querySelector('[data-state="loading"]')).not.toBeNull();
    expect(
      screen.queryByText("No Codeforces account connected"),
    ).not.toBeInTheDocument();
  });

  it("shows a real history failure without an empty-account conclusion", async () => {
    vi.spyOn(api, "accounts").mockRejectedValue(
      new ApiError("UPSTREAM_UNAVAILABLE", 503),
    );
    const { container } = showHistory();

    await waitFor(() =>
      expect(container.querySelector('[data-state="error"]')).not.toBeNull(),
    );
    expect(
      screen.queryByText("No Codeforces account connected"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows an empty-account conclusion only for a successfully loaded empty history", async () => {
    vi.spyOn(api, "accounts").mockResolvedValue([]);
    showHistory();

    expect(
      await screen.findByText("No Codeforces account connected"),
    ).toBeInTheDocument();
    expect(api.accounts).toHaveBeenCalledWith(true, expect.any(AbortSignal));
  });
});

function learningCache() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(keys.session, demoUser);
  client.setQueryData(keys.accounts(demoUser.publicId), context.accounts);
  const profile = v02LearningProfile();
  const batch = v02RecommendationBatch();
  const currentKeys = [
    v02Keys.resource(demoUser.publicId, "learning-profile", { window: "ALL" }),
    v02Keys.resource(demoUser.publicId, "learning-history", { window: "ALL" }),
    v02Keys.resource(demoUser.publicId, "recommendation-batch", {
      batchId: batch.batchId,
    }),
  ];
  client.setQueryData(currentKeys[0], profile);
  client.setQueryData(currentKeys[1], [profile]);
  client.setQueryData(currentKeys[2], batch);
  const frozenKey = v02Keys.resource(demoUser.publicId, "learning-snapshot", {
    snapshotId: profile.snapshotId,
  });
  client.setQueryData(frozenKey, profile);
  const otherId = fixtureUuid(999);
  const otherKey = v02Keys.resource(otherId, "learning-profile", {
    window: "ALL",
  });
  client.setQueryData(otherKey, { ...profile, publicId: otherId });
  const bridge = vi.spyOn(learningQueries, "invalidateV02LearningSources");
  return { client, bridge, currentKeys, frozenKey, otherKey, otherId };
}

function assertLearningRefresh(cache: ReturnType<typeof learningCache>) {
  for (const key of cache.currentKeys)
    expect(cache.client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(cache.client.getQueryState(cache.frozenKey)?.isInvalidated).toBe(
    false,
  );
  expect(cache.client.getQueryState(cache.otherKey)?.isInvalidated).toBe(false);
}

describe("CF binding changes refresh combined learning evidence", () => {
  it("refreshes mutable current-user learning data after binding", async () => {
    const cache = learningCache();
    vi.spyOn(api, "bind").mockResolvedValue({
      account: demoAccounts[0],
      initialSync: demoJob(demoAccounts[0].accountId, "QUEUED"),
    });
    showAccounts(cache.client);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "DemoAlpha" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: translate("en", "v.bind") }),
    );
    await waitFor(() => expect(cache.bridge).toHaveBeenCalledOnce());
    expect(cache.bridge).toHaveBeenCalledWith(cache.client, demoUser.publicId);
    assertLearningRefresh(cache);
    expect(context.selectAccount).toHaveBeenCalledWith(
      demoAccounts[0].accountId,
    );
  });

  it("ignores binding completion when the session changes while account invalidation is pending", async () => {
    const cache = learningCache();
    vi.spyOn(api, "bind").mockResolvedValue({
      account: demoAccounts[0],
      initialSync: demoJob(demoAccounts[0].accountId, "QUEUED"),
    });
    let release = () => {};
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const invalidate = cache.client.invalidateQueries.bind(cache.client);
    const delayed = vi
      .spyOn(cache.client, "invalidateQueries")
      .mockImplementation((filters, options) =>
        JSON.stringify(filters?.queryKey) ===
        JSON.stringify(keys.accounts(demoUser.publicId))
          ? waiting
          : invalidate(filters, options),
      );
    showAccounts(cache.client);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "DemoAlpha" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: translate("en", "v.bind") }),
    );
    await waitFor(() =>
      expect(delayed).toHaveBeenCalledWith({
        queryKey: keys.accounts(demoUser.publicId),
      }),
    );
    await act(async () => {
      cache.client.setQueryData(keys.session, {
        ...demoUser,
        publicId: cache.otherId,
      });
      release();
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: translate("en", "v.bind") }),
      ).toBeEnabled(),
    );
    expect(cache.bridge).not.toHaveBeenCalled();
    expect(context.selectAccount).not.toHaveBeenCalled();
    for (const key of cache.currentKeys)
      expect(cache.client.getQueryState(key)?.isInvalidated).toBe(false);
  });

  it("refreshes mutable current-user learning data after confirmed unbinding", async () => {
    context.accounts = [demoAccounts[0]];
    const cache = learningCache();
    vi.spyOn(api, "unbind").mockResolvedValue(undefined);
    showAccounts(cache.client);
    fireEvent.click(
      screen.getByRole("button", { name: translate("en", "v.unbind") }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: translate("en", "v.confirm") }),
    );
    await waitFor(() => expect(cache.bridge).toHaveBeenCalledOnce());
    expect(cache.bridge).toHaveBeenCalledWith(cache.client, demoUser.publicId);
    assertLearningRefresh(cache);
    expect(cache.client.getQueryData(keys.accounts(demoUser.publicId))).toEqual(
      [],
    );
    expect(context.selectAccount).toHaveBeenCalledWith(null);
  });

  it("preserves accounts and learning caches when the session changes during unbinding cancellation", async () => {
    context.accounts = [demoAccounts[0]];
    const cache = learningCache();
    const accountKey = keys.resource(
      demoUser.publicId,
      demoAccounts[0].accountId,
      "dashboard",
    );
    cache.client.setQueryData(accountKey, {
      accountId: demoAccounts[0].accountId,
    });
    vi.spyOn(api, "unbind").mockResolvedValue(undefined);
    let release = () => {};
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const cancel = vi
      .spyOn(cache.client, "cancelQueries")
      .mockReturnValue(waiting);
    showAccounts(cache.client);
    fireEvent.click(
      screen.getByRole("button", { name: translate("en", "v.unbind") }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: translate("en", "v.confirm") }),
    );
    await waitFor(() => expect(cancel).toHaveBeenCalled());
    await act(async () => {
      cache.client.setQueryData(keys.session, {
        ...demoUser,
        publicId: cache.otherId,
      });
      release();
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: translate("en", "v.confirm") }),
      ).toBeEnabled(),
    );
    expect(cache.bridge).not.toHaveBeenCalled();
    expect(context.selectAccount).not.toHaveBeenCalled();
    expect(cache.client.getQueryData(keys.accounts(demoUser.publicId))).toEqual(
      [demoAccounts[0]],
    );
    expect(cache.client.getQueryData(accountKey)).toEqual({
      accountId: demoAccounts[0].accountId,
    });
    for (const key of cache.currentKeys)
      expect(cache.client.getQueryState(key)?.isInvalidated).toBe(false);
  });
});
