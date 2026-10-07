import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { formatTimestamp, translate, type Locale } from "@/lib/i18n/locale";
import { v012TeamAnalysis, v012TeamBatch } from "@/lib/demo/v012-fixtures";
import { TeamAnalysisView, TeamBatchView } from "./team-insights";

vi.mock("next/navigation", () => ({ usePathname: () => "/teams" }));
// The browser suite verifies the actual radar. These tests cover the supplied
// values and recommendation semantics outside the visualization.
vi.mock("./chart", () => ({
  Chart: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

function view(locale: Locale, children: React.ReactNode) {
  document.cookie = `codestartrack_locale=${locale}; Path=/`;
  return <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>;
}

describe.each(["en", "zh-CN"] as const)("team insights in %s", (locale) => {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  it.each([true, false])(
    "shows the supplied analysis time and audience with explicit history context (%s)",
    (historical) => {
      const analysis = {
        ...v012TeamAnalysis(),
        dataCutoffAt: "2026-06-03T04:05:06.123456Z",
        createdAt: "2026-07-02T10:11:12.987654Z",
      };
      render(
        view(
          locale,
          <TeamAnalysisView analysis={analysis} historical={historical} />,
        ),
      );

      for (const [label, value] of [
        ["v.cutoff", analysis.dataCutoffAt],
        ["v.createdAt", analysis.createdAt],
      ] as const) {
        const detail = screen.getByText(`${t(label)}:`).nextElementSibling;
        expect(detail).toHaveTextContent(formatTimestamp(value, locale));
        expect(detail?.querySelector("time")).toHaveAttribute(
          "datetime",
          value,
        );
      }
      expect(
        screen.getAllByText(t(`v12.audience.${analysis.audience}`)),
      ).toHaveLength(1);
      expect(!!screen.queryByText(t("v12.teamHistoricalAnalysis"))).toBe(
        historical,
      );
      expect(
        screen.queryByText(t("v12.teamHistoricalBatch")),
      ).not.toBeInTheDocument();
    },
  );

  it.each([true, false])(
    "shows the supplied batch generation time and audience with explicit history context (%s)",
    (historical) => {
      const batch = {
        ...v012TeamBatch(undefined, "MEMBER"),
        generatedAt: "2026-05-04T07:08:09.123456Z",
      };
      render(
        view(locale, <TeamBatchView batch={batch} historical={historical} />),
      );

      const detail = screen.getByText(
        `${t("v.createdAt")}:`,
      ).nextElementSibling;
      expect(detail).toHaveTextContent(
        formatTimestamp(batch.generatedAt, locale),
      );
      expect(detail?.querySelector("time")).toHaveAttribute(
        "datetime",
        batch.generatedAt,
      );
      expect(
        screen.getAllByText(t(`v12.audience.${batch.audience}`)),
      ).toHaveLength(1);
      expect(!!screen.queryByText(t("v12.teamHistoricalBatch"))).toBe(
        historical,
      );
      expect(screen.queryByText(`${t("v.cutoff")}:`)).not.toBeInTheDocument();
    },
  );

  it("labels dimension samples while preserving zero and precise supplied scores", () => {
    const source = v012TeamAnalysis();
    const analysis = {
      ...source,
      memberCount: 12345,
      includedMemberCount: 12345,
      excludedMemberCount: 0,
      dimensions: source.dimensions.map((dimension, index) => ({
        ...dimension,
        score: index === 0 ? 56.861234 : index === 1 ? 0 : dimension.score,
        memberSampleCount: index === 0 ? 12345 : 0,
      })),
    };
    render(view(locale, <TeamAnalysisView analysis={analysis} />));

    const score = screen.getByText("56.861234 / 100");
    expect(score.parentElement).toHaveTextContent(
      `${t("v12.dimensionSamples")}: 12,345`,
    );
    expect(screen.getByText("0 / 100").parentElement).toHaveTextContent(
      `${t("v12.dimensionSamples")}: 0`,
    );
    expect(
      screen.getAllByText(new RegExp(`${t("v12.dimensionSamples")}:`)),
    ).toHaveLength(6);
    const weakest = screen
      .getAllByText(t("v.weakest"))
      .find((element) => element.matches('[data-slot="badge"]'))
      ?.closest("dt");
    expect(weakest).toHaveTextContent(
      t(`data.dimension.${analysis.weakestDimension}`),
    );
  });

  it.each([true, false])(
    "emphasizes the first supplied item and preserves order and nullable sources (primary link %s)",
    (primaryLinked) => {
      const source = v012TeamBatch(undefined, "MEMBER");
      const item = source.recommendations[0];
      const batch = {
        ...source,
        resultCount: 3,
        recommendations: [
          {
            ...item,
            rank: 7,
            score: 0.7345678901234567,
            reason: "Primary backend reason",
            problem: {
              ...item.problem,
              title: null,
              externalProblemKey: "primary-key",
              difficulty: null,
              url: primaryLinked
                ? "https://codeforces.com/problemset/problem/1/A"
                : null,
              tags: ["primary-tag"],
            },
          },
          {
            ...item,
            rank: 2,
            reason: "Supporting backend reason",
            problem: {
              ...item.problem,
              title: "Supporting problem",
              externalProblemKey: "supporting-key",
              url: primaryLinked
                ? null
                : "https://codeforces.com/problemset/problem/1/B",
              tags: ["supporting-tag"],
            },
          },
          {
            ...item,
            rank: 1,
            score: 0,
            reason: "Final backend reason",
            problem: {
              ...item.problem,
              title: "Final problem",
              difficulty: 0,
              url: "https://codeforces.com/problemset/problem/1/C",
            },
          },
        ],
      };
      const { container } = render(
        view(locale, <TeamBatchView batch={batch} />),
      );

      expect(
        screen
          .getAllByRole("heading", { name: /^#\d/ })
          .map((heading) => heading.textContent),
      ).toEqual(["#7primary-key", "#2Supporting problem", "#1Final problem"]);
      const primary = screen
        .getByText(t("v12.primaryRecommendation"))
        .closest("[data-slot=card]");
      expect(primary).toHaveTextContent("#7");
      expect(primary).toHaveTextContent("Primary backend reason");
      expect(primary).toHaveTextContent("primary-tag");
      expect(primary).toHaveTextContent("0.7345678901234567");
      expect(primary).toHaveTextContent(t("v.unrated"));
      expect(primary).toHaveTextContent("Codeforces");
      expect(
        screen.getByText(t("recommendation.orderNote")),
      ).toBeInTheDocument();
      expect(screen.getByText("Supporting backend reason")).toBeInTheDocument();
      expect(screen.getByText("supporting-tag")).toBeInTheDocument();
      expect(
        container.querySelector('[data-recommendation-rank="1"]'),
      ).toHaveTextContent(
        `${t("v12.problemDifficulty")}: 0 · ${t("v12.recommendationScore")}: 0`,
      );
      expect(
        screen.getByRole("button", {
          name: t("recommendation.linkUnavailable"),
        }),
      ).toBeDisabled();
      for (const link of screen.getAllByRole("link")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      const primaryQueries = within(primary as HTMLElement);
      expect(
        primaryLinked
          ? primaryQueries.getByRole("link")
          : primaryQueries.getByRole("button", {
              name: t("recommendation.linkUnavailable"),
            }),
      ).toBeInTheDocument();
      expect(container.firstElementChild).toHaveAttribute(
        "data-team-audience",
        "MEMBER",
      );
    },
  );

  it("keeps a genuinely empty batch empty", () => {
    render(
      view(
        locale,
        <TeamBatchView batch={v012TeamBatch(undefined, "COACH", true)} />,
      ),
    );
    expect(screen.getByText(t("v12.candidateShortage"))).toBeInTheDocument();
    expect(
      screen.queryByText(t("v12.primaryRecommendation")),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
