import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { OjAccountDto } from "@/lib/api/schemas";
import { AccountsPage } from "./accounts-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/accounts" }));
vi.mock("./account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return {
    useAccounts: () => ({
      user: demoUser,
      accounts: [],
      query: { data: [], isFetching: false, error: null },
      selectAccount: vi.fn(),
    }),
  };
});

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.restoreAllMocks();
});

function showHistory() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <AccountsPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
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
