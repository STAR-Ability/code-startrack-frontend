import { useState, type ReactNode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import type { DataQuery } from "@/lib/api/data-state";
import {
  DataRegion,
  ErrorNotice,
  QueryFeedback,
  SLOW_REQUEST_MS,
} from "./feedback";

const toast = vi.hoisted(() => ({ add: vi.fn(), close: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ toast }));
vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));

beforeEach(() => {
  vi.clearAllMocks();
  document.cookie = "codestartrack_locale=en; Path=/";
});
afterEach(() => vi.useRealTimers());

function query(overrides: Partial<DataQuery> = {}): DataQuery {
  return {
    data: undefined,
    error: null,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
    ...overrides,
  };
}
function frame(children: ReactNode) {
  return <LocaleProvider initialLocale="en">{children}</LocaleProvider>;
}
function Draft() {
  const [value, setValue] = useState(0);
  return (
    <button type="button" onClick={() => setValue(value + 1)}>
      Draft {value}
    </button>
  );
}

describe("scoped data feedback", () => {
  it("keeps local skeletons, mounted state and cached content through request states", () => {
    const content = (state: DataQuery) =>
      frame(
        <DataRegion
          name="Ability profile"
          query={state}
          showInitialLoading={false}
        >
          <Draft />
          {state.data === undefined ? (
            <Skeleton data-testid="profile-loading" className="h-32 w-full" />
          ) : (
            <p>Supplied score: 45</p>
          )}
        </DataRegion>,
      );
    const { rerender } = render(
      content(query({ isPending: true, isFetching: true })),
    );
    const region = screen.getByRole("region", { name: "Ability profile" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(within(region).getByRole("status")).toHaveTextContent("Loading");
    expect(screen.getByTestId("profile-loading")).toBeVisible();
    expect(screen.queryByText("Getting things ready")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Draft 0" }));

    const known = { score: 45 };
    rerender(content(query({ data: known })));
    expect(screen.getByRole("button", { name: "Draft 1" })).toBeVisible();
    expect(screen.getByText("Supplied score: 45")).toBeVisible();
    expect(region).toHaveAttribute("aria-busy", "false");

    rerender(content(query({ data: known, isFetching: true })));
    expect(screen.getByText("Supplied score: 45")).toBeVisible();
    expect(within(region).getByRole("status")).toHaveTextContent(
      "you can still view the current content",
    );
    expect(screen.queryByTestId("profile-loading")).not.toBeInTheDocument();

    rerender(
      content(query({ data: known, error: new ApiError("NETWORK_ERROR") })),
    );
    expect(screen.getByRole("button", { name: "Draft 1" })).toBeVisible();
    expect(screen.getByText("Supplied score: 45")).toBeVisible();
    expect(within(region).getByRole("alert")).toHaveTextContent(
      "Ability profile",
    );
    expect(
      screen.getByText("Showing the last successfully loaded data."),
    ).toBeVisible();
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("keeps the default first-load surface for regions without feature skeletons", () => {
    const { rerender } = render(
      frame(
        <DataRegion
          name="Recommendations"
          query={query({ isPending: true, isFetching: true })}
        >
          <p>Recommendation controls</p>
        </DataRegion>,
      ),
    );
    expect(screen.getByText("Getting things ready")).toBeVisible();
    expect(screen.getByRole("status", { name: /^Loading/ })).toBeVisible();
    expect(screen.getByText("Recommendation controls")).toBeVisible();
    rerender(
      frame(
        <DataRegion name="Recommendations" query={query({ data: null })}>
          <p>No batch generated</p>
        </DataRegion>,
      ),
    );
    expect(screen.getByRole("region")).toHaveAttribute("data-state", "empty");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("keeps distinct named read failures and independent recovery without global duplicates", () => {
    const profileRetry = vi.fn();
    const historyRetry = vi.fn();
    render(
      frame(
        <>
          <DataRegion
            name="Ability profile"
            query={query({
              error: new ApiError("NETWORK_ERROR", 0, "synthetic-profile-read"),
              refetch: profileRetry,
            })}
          >
            <p>Profile context</p>
          </DataRegion>
          <DataRegion
            name="Analysis history"
            query={query({
              error: new ApiError("NETWORK_ERROR", 0, "synthetic-history-read"),
              refetch: historyRetry,
            })}
          >
            <p>History context</p>
          </DataRegion>
        </>,
      ),
    );
    const profile = screen.getByRole("region", { name: "Ability profile" });
    const history = screen.getByRole("region", { name: "Analysis history" });
    expect(within(profile).getByRole("alert")).toHaveTextContent(
      "Ability profile",
    );
    expect(within(history).getByRole("alert")).toHaveTextContent(
      "Analysis history",
    );
    fireEvent.click(within(profile).getByRole("button", { name: "Retry" }));
    expect(profileRetry).toHaveBeenCalledOnce();
    expect(historyRetry).not.toHaveBeenCalled();
    fireEvent.click(within(history).getByRole("button", { name: "Retry" }));
    expect(historyRetry).toHaveBeenCalledOnce();
    const details = within(profile).getByRole("button", {
      name: "View details",
    });
    expect(details).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(details);
    expect(within(profile).getByText(/synthetic-profile-read/)).toBeVisible();
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("preserves action and explicit CAPTCHA/job notifications while suppressing ordinary read notifications", () => {
    render(
      frame(
        <>
          <ErrorNotice error={new ApiError("NETWORK_ERROR")} />
          <QueryFeedback
            compact
            showLoading={false}
            notify
            query={query({ error: new ApiError("CAPTCHA_EXPIRED", 400) })}
          />
          <QueryFeedback
            query={query({ error: new ApiError("NETWORK_ERROR") })}
          />
        </>,
      ),
    );
    expect(toast.add).toHaveBeenCalledTimes(2);
    for (const [notice] of toast.add.mock.calls)
      expect(notice).toMatchObject({ type: "error", timeout: 8_000 });
    expect(screen.getAllByRole("alert")).toHaveLength(3);
  });

  it("retains cooldown and permission guards on scoped read recovery", () => {
    vi.useFakeTimers();
    const limited = query({
      error: new ApiError("RATE_LIMITED", 429, null, {}, 2),
    });
    const { rerender } = render(frame(<QueryFeedback query={limited} />));
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    rerender(
      frame(
        <QueryFeedback
          query={query({ error: new ApiError("FORBIDDEN", 403) })}
        />,
      ),
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("does not label a missing record as still displaying cached data", () => {
    render(
      frame(
        <QueryFeedback
          query={query({
            data: { score: 45 },
            error: new ApiError("RESOURCE_NOT_FOUND", 404),
          })}
        />,
      ),
    );
    expect(screen.getByRole("alert")).toBeVisible();
    expect(
      screen.queryByText("Showing the last successfully loaded data."),
    ).not.toBeInTheDocument();
  });

  it("retains one delayed slow notice and dismisses it when the scoped read finishes", () => {
    vi.useFakeTimers();
    const pending = query({ isPending: true, isFetching: true });
    const { rerender, unmount } = render(
      frame(<QueryFeedback query={pending} showInitialLoading={false} />),
    );
    act(() => vi.advanceTimersByTime(SLOW_REQUEST_MS - 1));
    expect(toast.add).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(toast.add).toHaveBeenCalledOnce();
    const notice = toast.add.mock.calls[0][0] as { id: string };
    expect(notice).toMatchObject({ type: "loading", timeout: 0 });
    rerender(frame(<QueryFeedback query={query({ data: null })} />));
    expect(toast.close).toHaveBeenCalledWith(notice.id);
    unmount();
    act(() => vi.advanceTimersByTime(SLOW_REQUEST_MS));
    expect(toast.add).toHaveBeenCalledOnce();
  });
});
