import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { translate } from "@/lib/i18n/locale";
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
        if (state === "unavailable") {
          expect(
            screen.queryByText(translate("en", "v.noAnalysis")),
          ).not.toBeInTheDocument();
          if (view === "ability") {
            expect(
              screen.getByRole("heading", { name: "Six dimensions · 0–100" }),
            ).toBeInTheDocument();
          }
          expect(
            screen.getAllByText(translate("en", "ui.unavailableTitle")),
          ).toHaveLength(view === "ability" ? 1 : 3);
          expect(
            screen.queryByText(translate("en", "v.noRecords")),
          ).not.toBeInTheDocument();
        }
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

  it("preserves all dimension identities and display order from a shuffled snapshot", () => {
    const snapshot = demoAnalysis();
    const ordered = [...snapshot.dimensions].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <AnalysisView
          analysis={{
            ...snapshot,
            dimensions: [...snapshot.dimensions].reverse(),
          }}
          ability
          dimensions
        />
      </LocaleProvider>,
    );
    const rows = [...container.querySelectorAll(".analysis-dimension-row")];
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => row.getAttribute("data-dimension-code"))).toEqual(
      ordered.map((dimension) => dimension.code),
    );
    for (const [index, row] of rows.entries()) {
      expect(row.querySelector("dt")).toHaveTextContent(
        translate("en", `data.dimension.${ordered[index].code}`),
      );
      expect(row.querySelector("dd")).toHaveTextContent(
        `${ordered[index].score} / 100`,
      );
    }
    const weakest = rows.filter(
      (row) => row.getAttribute("data-weakest") === "true",
    );
    expect(weakest).toHaveLength(1);
    expect(weakest[0]).toHaveAttribute(
      "data-dimension-code",
      snapshot.weakestDimension,
    );
  });

  it("does not present a failed read as empty evidence and preserves cached evidence", () => {
    const view = (analysis: ReturnType<typeof demoAnalysis> | null) => (
      <LocaleProvider initialLocale="en">
        <AnalysisView
          analysis={analysis}
          ability
          dimensions
          statistics
          unavailable
        />
      </LocaleProvider>
    );
    const { container, rerender } = render(view(null));
    const abilityFrame = container.querySelector("[data-analysis-ability]");
    expect(abilityFrame).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(translate("en", "ui.unavailableTitle")),
    ).toHaveLength(4);
    const statisticFrames = [
      ...container.querySelectorAll(".analysis-statistics [data-slot='card']"),
    ];
    expect(statisticFrames).toHaveLength(3);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".analysis-dimension-row")).toBeNull();
    expect(screen.queryByText(/^0\s*\/\s*100$/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(translate("en", "v.noAnalysis")),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(translate("en", "v.noRecords")),
    ).not.toBeInTheDocument();

    rerender(view(demoAnalysis()));
    expect(container.querySelector("[data-analysis-ability]")).toBe(
      abilityFrame,
    );
    container
      .querySelectorAll(".analysis-statistics [data-slot='card']")
      .forEach((frame, index) => expect(frame).toBe(statisticFrames[index]));
    expect(
      screen.queryByText(translate("en", "ui.unavailableTitle")),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll(".analysis-dimension-row")).toHaveLength(
      6,
    );
    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Daily practice" }),
    ).toBeInTheDocument();
  });

  it.each([
    { activity: true, distributions: true, count: 3 },
    { activity: true, distributions: false, count: 1 },
    { activity: false, distributions: true, count: 2 },
  ])(
    "retains the $count requested statistics frames when an initial read settles unavailable",
    ({ activity, distributions, count }) => {
      const view = (loading: boolean) => (
        <LocaleProvider initialLocale="en">
          <AnalysisStatistics
            analysis={null}
            loading={loading}
            unavailable={!loading}
            activity={activity}
            distributions={distributions}
          />
        </LocaleProvider>
      );
      const { container, rerender } = render(view(true));
      const frames = [...container.querySelectorAll("[data-slot='card']")];
      const headings = screen.getAllByRole("heading");
      expect(frames).toHaveLength(count);

      rerender(view(false));
      const settledFrames = container.querySelectorAll("[data-slot='card']");
      const settledHeadings = screen.getAllByRole("heading");
      expect(settledFrames).toHaveLength(count);
      expect(settledHeadings).toHaveLength(count);
      settledFrames.forEach((frame, index) =>
        expect(frame).toBe(frames[index]),
      );
      settledHeadings.forEach((heading, index) =>
        expect(heading).toBe(headings[index]),
      );
      expect(
        screen.getAllByText(translate("en", "ui.unavailableTitle")),
      ).toHaveLength(count);
      expect(
        screen.queryByText(translate("en", "v.noRecords")),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector("dd")).toBeNull();
    },
  );

  it("displays the supplied source count without replacing zero or inventing a missing count", () => {
    const snapshot = demoAnalysis();
    const { rerender } = render(
      <LocaleProvider initialLocale="en">
        <AnalysisView analysis={snapshot} ability dimensions sourceCount={0} />
      </LocaleProvider>,
    );
    const zeroSources = `${translate("en", "v12.sources")}: 0`;
    expect(screen.getByText(zeroSources)).toBeInTheDocument();
    rerender(
      <LocaleProvider initialLocale="en">
        <AnalysisView analysis={snapshot} ability dimensions />
      </LocaleProvider>,
    );
    expect(screen.queryByText(zeroSources)).not.toBeInTheDocument();
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
