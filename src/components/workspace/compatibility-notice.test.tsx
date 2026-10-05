import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { ApiError } from "@/lib/api/errors";
import { CompatibilityNotice } from "./compatibility-notice";
import { AnalysisView } from "./analysis-view";
import { QueryFeedback } from "./feedback";

vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));
vi.mock("./chart", () => ({
  Chart: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));
vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn(), close: vi.fn() },
}));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

describe("version and invalid response feedback", () => {
  it("adds no notice for a known audited version", () => {
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <CompatibilityNotice
          version="user-profile-v0.13.1"
          family="user-profile"
        />
      </LocaleProvider>,
    );
    expect(
      container.querySelector("[data-algorithm-compatibility]"),
    ).toBeNull();
  });

  it("keeps actual scores and charts visible for an unknown version", () => {
    const snapshot = {
      ...demoAnalysis(),
      algorithmVersion: "profile-v0.13.2",
    };
    render(
      <LocaleProvider initialLocale="en">
        <AnalysisView analysis={snapshot} ability dimensions />
      </LocaleProvider>,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "You can keep using the available data.",
    );
    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
    for (const dimension of snapshot.dimensions)
      expect(screen.getByText(`${dimension.score} / 100`)).toBeInTheDocument();
    expect(
      screen.queryByText("No analysis generated yet"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Analysis version" }));
    expect(screen.getByText("profile-v0.13.2")).toBeVisible();
  });

  it("renders metadata as plain text", () => {
    const version = '<img src="invalid" onerror="alert(1)">';
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <CompatibilityNotice version={version} family="user-profile" />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Analysis version" }));
    expect(screen.getByText(version)).toBeVisible();
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows a format error with retry instead of claiming a connection or absent record", () => {
    const retry = vi.fn();
    render(
      <LocaleProvider initialLocale="en">
        <QueryFeedback
          query={{
            data: undefined,
            error: new ApiError("INVALID_RESPONSE", 200),
            isFetching: false,
            isPending: false,
            refetch: retry,
          }}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText("We couldn’t read this data")).toBeInTheDocument();
    expect(
      screen.getByText(/The service returned data in an unexpected format/, {
        selector: '[data-slot="empty-description"]',
      }),
    ).toBeVisible();
    expect(
      screen.queryByText("Content hasn’t loaded yet"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Check your network/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
