import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { AnalysisView, AnalysisStatistics } from "./analysis-view";
import { ProfileDirection } from "./user-analysis-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));
// Data provenance is the behavior under test; ECharts rendering is covered in
// the guarded browser suite rather than initialized in jsdom.
vi.mock("./chart", () => ({
  Chart: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

describe("analysis evidence presentation", () => {
  for (const view of ["ability", "statistics"] as const) {
    for (const state of ["missing", "loading", "unavailable"] as const) {
      it(`${state} ${view} evidence does not invent scores, counts or charts`, () => {
        const { container } = render(
          <LocaleProvider initialLocale="en">
            <AnalysisView
              analysis={null}
              ability={view === "ability"}
              dimensions={view === "ability"}
              statistics={view === "statistics"}
              loading={state === "loading"}
              unavailable={state === "unavailable"}
            />
          </LocaleProvider>,
        );

        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        expect(screen.queryByText(/^0\s*\/\s*100$/)).not.toBeInTheDocument();
        for (const value of container.querySelectorAll("dd")) {
          expect(value).not.toHaveTextContent(/^0$/);
          if (state !== "loading")
            expect(value).toHaveTextContent("Unavailable");
        }
        expect(
          screen.queryByText("No training evidence yet"),
        ).not.toBeInTheDocument();
        if (state === "missing")
          expect(
            screen.getAllByText("No analysis generated yet").length,
          ).toBeGreaterThan(0);
      });
    }
  }

  it("keeps genuine zero evidence distinct from an absent snapshot", () => {
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <AnalysisView
          analysis={demoAnalysis(undefined, "ALL", true)}
          ability
          dimensions
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("No training evidence yet")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^0\s*\/\s*100$/)).toHaveLength(6);
    expect(
      [...container.querySelectorAll("dd")].some(
        (value) => value.textContent === "0",
      ),
    ).toBe(true);
    expect(
      screen.queryByText("No analysis generated yet"),
    ).not.toBeInTheDocument();
  });

  it("shows only supplied ability scores for an actual snapshot", () => {
    const snapshot = demoAnalysis();
    render(
      <LocaleProvider initialLocale="en">
        <AnalysisView analysis={snapshot} ability dimensions />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
    for (const dimension of snapshot.dimensions)
      expect(screen.getByText(`${dimension.score} / 100`)).toBeInTheDocument();
    expect(
      screen.queryByText("No training evidence yet"),
    ).not.toBeInTheDocument();
  });

  it("shows contextual recovery only for a settled absent dimensional snapshot", () => {
    const view = (
      analysis: ReturnType<typeof demoAnalysis> | null,
      loading = false,
    ) => (
      <LocaleProvider initialLocale="en">
        <AnalysisView
          analysis={analysis}
          dimensions
          ability
          loading={loading}
          emptyState={<a href="/accounts">Review source accounts</a>}
        />
      </LocaleProvider>
    );
    const { rerender } = render(view(null));
    expect(
      screen.getByRole("link", { name: "Review source accounts" }),
    ).toHaveAttribute("href", "/accounts");
    expect(
      screen.queryByText("No analysis generated yet"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(view(null, true));
    expect(
      screen.queryByRole("link", { name: "Review source accounts" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(view(demoAnalysis()));
    expect(
      screen.queryByRole("link", { name: "Review source accounts" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
  });

  it("presents supporting snapshot statistics without duplicating primary metrics", () => {
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <AnalysisStatistics analysis={demoAnalysis()} aggregate />
      </LocaleProvider>,
    );
    expect(container.querySelector("[data-metric-panel]")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Daily practice" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Knowledge tags" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Difficulty distribution" }),
    ).toBeInTheDocument();
  });

  it("labels historical guidance using the displayed snapshot rather than current-state copy", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ProfileDirection analysis={demoAnalysis()} historical />
      </LocaleProvider>,
    );
    expect(screen.getByText("Historical profile snapshot")).toBeInTheDocument();
    expect(screen.queryByText("Latest saved profile")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /This snapshot’s weakest dimension/,
      }),
    ).toHaveTextContent("Implementation");
    expect(
      screen.getByRole("link", { name: "Find your next problem" }),
    ).toHaveAttribute("href", "/practice");
  });

  it("does not interpret zero training evidence as a known weakness", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ProfileDirection analysis={demoAnalysis(undefined, "ALL", true)} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Build your evidence",
    );
    expect(screen.queryByText(/consider practicing/)).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation")).not.toBeInTheDocument();
  });
});
