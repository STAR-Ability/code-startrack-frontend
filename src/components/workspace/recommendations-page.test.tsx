import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { demoAccounts, demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { uuidSchema } from "@/lib/api/schemas";
import { keys } from "@/lib/query/keys";
import { RecommendationsPage } from "./recommendations-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/practice" }));
vi.mock("./account-provider", async () => {
  const { demoAccounts, demoUser } = await import("@/lib/demo/fixtures");
  return {
    useAccounts: () => ({
      user: demoUser,
      account: demoAccounts[0],
      selectedAccountId: demoAccounts[0].accountId,
    }),
  };
});
vi.mock("./chart", () => ({ Chart: () => null }));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.spyOn(api, "recommendations").mockResolvedValue(null);
  vi.spyOn(api, "recommendationHistory").mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, hasNext: false },
    requestId: fixtureUuid(9999),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("retained CF recommendation operations on ordinary HTTP origins", () => {
  it("generates a valid key without randomUUID, reuses it on retry and renews it after a payload edit", async () => {
    const browserCrypto = globalThis.crypto;
    const getRandomValues = vi.fn((bytes: Uint8Array) =>
      browserCrypto.getRandomValues(bytes),
    );
    vi.stubGlobal("crypto", { getRandomValues });
    const generate = vi
      .spyOn(api, "generate")
      .mockRejectedValue(new ApiError("TIMEOUT"));
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });
    client.setQueryData(keys.session, demoUser);
    client.setQueryData(keys.accounts(demoUser.publicId), demoAccounts);
    render(
      <QueryClientProvider client={client}>
        <LocaleProvider initialLocale="en">
          <RecommendationsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Generate/ }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    const first = generate.mock.calls[0][3];
    expect(uuidSchema.safeParse(first).success).toBe(true);
    expect(generate.mock.calls[0].slice(0, 3)).toEqual([
      demoAccounts[0].accountId,
      "HYBRID",
      10,
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    expect(generate.mock.calls[1][3]).toBe(first);
    expect(getRandomValues).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Generate/ })).toBeEnabled(),
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "11" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate/ }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(3));
    expect(generate.mock.calls[2][2]).toBe(11);
    expect(generate.mock.calls[2][3]).not.toBe(first);
    expect(getRandomValues).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
