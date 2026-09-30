import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { TrainingResults } from "./training-results";
import {
  profileFixture,
  recommendationsFixture,
} from "../../../tests/api-fixtures.mjs";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
afterEach(() => vi.unstubAllGlobals());

test.each(["profile", "recommendation"] as const)(
  "later %s failure preserves previous data and never repeats the other operation",
  async (operation) => {
    let failed = false;
    const fetcher = vi.fn((url: string) =>
      Promise.resolve(
        failed && url.endsWith(`/${operation}`)
          ? Response.json(
              { error: { operation, category: "http", status: 404 } },
              { status: 404 },
            )
          : Response.json(
              url.endsWith("/profile")
                ? profileFixture
                : recommendationsFixture,
            ),
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    render(
      <LocaleProvider initialLocale="en">
        <QueryClientProvider client={client}>
          <TrainingResults userId={1} />
        </QueryClientProvider>
      </LocaleProvider>,
    );
    await screen.findByRole("link", { name: "Open on Codeforces" });
    failed = true;
    await act(() =>
      client.refetchQueries({ queryKey: ["training", 1, operation] }),
    );
    expect(
      await screen.findByText("Showing the last successfully loaded data."),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open on Codeforces" }),
    ).toBeVisible();
    expect(
      document.querySelector(
        'time[datetime="' + profileFixture.updatedAt + '"]',
      ),
    ).toBeVisible();
    expect(
      document.querySelector(
        'time[datetime="' + recommendationsFixture.generatedAt + '"]',
      ),
    ).toBeVisible();
    failed = false;
    fireEvent.click(screen.getByRole("button", { name: `Retry ${operation}` }));
    await waitFor(() =>
      expect(
        screen.queryByText("Showing the last successfully loaded data."),
      ).not.toBeInTheDocument(),
    );
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "/api/training/profile",
      "/api/training/recommendation",
      `/api/training/${operation}`,
      `/api/training/${operation}`,
    ]);
    client.clear();
  },
);
