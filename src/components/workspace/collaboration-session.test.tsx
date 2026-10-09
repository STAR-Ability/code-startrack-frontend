import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDto } from "@/lib/api/schemas";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { keys } from "@/lib/query/keys";
import { useCollaborationMutation } from "./v012-shared";

const session = vi.hoisted(() => ({ user: null as UserDto | null }));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: session.user }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(keys.session, demoUser);
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  session.user = demoUser;
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("collaboration completion ownership", () => {
  it("does not complete the previous user's deferred write in a new session", async () => {
    const { client, wrapper } = harness();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const team = { teamId: fixtureUuid(2001) };
    let finishWrite!: (value: typeof team) => void;
    const run = vi.fn(
      () =>
        new Promise<typeof team>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(
      () => useCollaborationMutation("create", run, undefined, onSuccess),
      { wrapper },
    );
    act(() => result.current.mutate(undefined));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    const next = { ...demoUser, publicId: fixtureUuid(7777) };
    act(() => {
      client.setQueryData(keys.session, next);
      session.user = next;
    });
    rerender();
    await act(async () => finishWrite(team));
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(onSuccess).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryData(keys.session)).toEqual(next);
    client.clear();
  });

  it.each(["logout", "another user"])(
    "does not navigate or reset forms after %s during the follow-up refresh",
    async (change) => {
      const { client, wrapper } = harness();
      let finishRefresh!: () => void;
      const refresh = new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      const invalidate = vi
        .spyOn(client, "invalidateQueries")
        .mockReturnValue(refresh);
      const onSuccess = vi.fn();
      const { result, rerender } = renderHook(
        () =>
          useCollaborationMutation(
            "create",
            async () => ({ teamId: fixtureUuid(2001) }),
            undefined,
            onSuccess,
          ),
        { wrapper },
      );
      act(() => result.current.mutate(undefined));
      await waitFor(() => expect(invalidate).toHaveBeenCalled());

      const next =
        change === "logout"
          ? null
          : { ...demoUser, publicId: fixtureUuid(7777) };
      act(() => {
        client.setQueryData(keys.session, next);
        session.user = next;
      });
      rerender();
      await act(async () => finishRefresh());
      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(onSuccess).not.toHaveBeenCalled();
      expect(client.getQueryData(keys.session)).toEqual(next);
      client.clear();
    },
  );

  it("runs the completion handler when the operation still belongs to the session", async () => {
    const { client, wrapper } = harness();
    const team = { teamId: fixtureUuid(2001) };
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useCollaborationMutation(
          "create",
          async () => team,
          undefined,
          onSuccess,
        ),
      { wrapper },
    );
    act(() => result.current.mutate(undefined));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(team);
    client.clear();
  });
});
