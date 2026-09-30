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
    const renderView = (view: "profile" | "practice") => (
      <LocaleProvider initialLocale="en">
        <QueryClientProvider client={client}>
          <TrainingResults userId={1} view={view} />
        </QueryClientProvider>
      </LocaleProvider>
    );
    const result = render(renderView("practice"));
    await screen.findByRole("link", { name: "Open on Codeforces" });
    failed = true;
    await act(() =>
      client.refetchQueries({ queryKey: ["training", 1, operation] }),
    );
    result.rerender(
      renderView(operation === "profile" ? "profile" : "practice"),
    );
    expect(
      await screen.findByText("Showing the last successfully loaded data."),
    ).toBeVisible();
    expect(client.getQueryData(["training", 1, "profile"])).toEqual(
      profileFixture,
    );
    expect(
      client.getQueryData(["training", 1, "recommendation", { limit: 1 }]),
    ).toBeDefined();
    const timestamp =
      operation === "profile"
        ? profileFixture.updatedAt
        : recommendationsFixture.generatedAt;
    expect(
      document.querySelector('time[datetime="' + timestamp + '"]'),
    ).toBeVisible();
    failed = false;
    fireEvent.click(screen.getByRole("button", { name: `Retry ${operation}` }));
    await waitFor(() =>
      expect(
        screen.queryByText("Showing the last successfully loaded data."),
      ).not.toBeInTheDocument(),
    );
    result.rerender(renderView("practice"));
    expect(
      await screen.findByRole("link", { name: "Open on Codeforces" }),
    ).toBeVisible();
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "/api/training/profile",
      "/api/training/recommendation",
      `/api/training/${operation}`,
      `/api/training/${operation}`,
    ]);
    client.clear();
  },
);
