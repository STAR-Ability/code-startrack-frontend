import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoBatch } from "@/lib/demo/fixtures";
import { BatchView, RecommendationCard } from "./recommendation-card";

vi.mock("next/navigation", () => ({ usePathname: () => "/practice" }));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

const problemUrl = "https://codeforces.com/problemset/problem/1/A";

function show(children: ReactNode) {
  return render(<LocaleProvider initialLocale="en">{children}</LocaleProvider>);
}

describe("recommendation batch fidelity", () => {
  it.each([false, true])(
    "keeps supplied order, ranks and completed problems with compact=%s",
    (compact) => {
      const batch = demoBatch();
      batch.recommendations = [
        batch.recommendations[1],
        { ...batch.recommendations[0], solvedSinceGeneration: true },
      ];
      const original = structuredClone(batch);
      const { container } = show(<BatchView batch={batch} compact={compact} />);
      const cards = Array.from(
        container.querySelectorAll<HTMLElement>("[data-recommendation-rank]"),
      );

      expect(cards.map((card) => card.dataset.recommendationRank)).toEqual([
        "2",
        "1",
      ]);
      expect(within(cards[0]).getByRole("heading")).toHaveTextContent(
        "#2 gym-demo-B",
      );
      expect(
        within(cards[0]).queryByText("First recommendation"),
      ).not.toBeInTheDocument();
      expect(
        within(cards[1]).getByRole("heading", { level: 2 }),
      ).toHaveTextContent("#1 A Small Step");
      expect(within(cards[1]).getByText("First recommendation")).toBeVisible();
      expect(within(cards[1]).getByText("Completed")).toBeVisible();
      expect(
        within(cards[1]).getByText(
          "Completed. Review this problem or continue to the next one.",
        ),
      ).toBeVisible();
      expect(batch).toEqual(original);
    },
  );

  it.each([false, true])(
    "retains batch target and original ranks when rank 1 is absent with compact=%s",
    (compact) => {
      const batch = demoBatch();
      batch.targetRating = 0;
      batch.recommendations = [
        { ...batch.recommendations[0], rank: 4 },
        batch.recommendations[1],
      ];
      const { container } = show(<BatchView batch={batch} compact={compact} />);

      expect(
        Array.from(
          container.querySelectorAll<HTMLElement>("[data-recommendation-rank]"),
          (card) => card.dataset.recommendationRank,
        ),
      ).toEqual(["4", "2"]);
      expect(
        screen.queryByText("First recommendation"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Target difficulty: 0")).toBeVisible();
      expect(container.querySelector("time")).toHaveAttribute(
        "datetime",
        batch.generatedAt,
      );
    },
  );

  it("firstOnly displays the first supplied item without promoting or sorting it", () => {
    const batch = demoBatch();
    batch.recommendations.reverse();
    const { container } = show(<BatchView batch={batch} firstOnly />);

    expect(
      container.querySelectorAll("[data-recommendation-rank]"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "#2 gym-demo-B" }),
    ).toBeVisible();
    expect(screen.queryByText("First recommendation")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "#1 A Small Step" }),
    ).not.toBeInTheDocument();
  });
});

describe("recommendation metadata and actions", () => {
  it.each([false, true])(
    "displays zero difficulty, target and solver count with compact=%s",
    (compact) => {
      const item = demoBatch().recommendations[0];
      show(
        <RecommendationCard
          compact={compact}
          item={{
            ...item,
            problem: { ...item.problem, difficulty: 0, solvedCount: 0 },
          }}
          targetRating={0}
        />,
      );

      for (const label of ["Problem difficulty", "Target difficulty"]) {
        const term = screen.getByText(label, { selector: "dt" });
        expect(term.nextElementSibling).toHaveTextContent(/^0$/);
      }
      expect(screen.getByText("Codeforces solver count: 0")).toBeVisible();
      expect(screen.queryByText("Unrated")).not.toBeInTheDocument();
      expect(screen.queryByText(/Unavailable/)).not.toBeInTheDocument();
    },
  );

  it.each([false, true])(
    "preserves missing metadata, source badges and optional target with compact=%s",
    (compact) => {
      const batch = demoBatch();
      const item = {
        ...batch.recommendations[0],
        problem: batch.recommendations[1].problem,
        matchedDimension: null,
      };
      show(<RecommendationCard item={item} compact={compact} />);

      expect(
        screen.getByRole("heading", { name: "#1 gym-demo-B" }),
      ).toBeVisible();
      expect(screen.getByText("Unrated")).toBeVisible();
      expect(
        screen.getByText("Codeforces solver count: Unavailable"),
      ).toBeVisible();
      expect(screen.getByText("Gym")).toBeVisible();
      expect(screen.getByText("INFERRED")).toBeVisible();
      expect(screen.queryByText("Target difficulty")).not.toBeInTheDocument();
      expect(screen.queryByText("Skill coverage")).not.toBeInTheDocument();
    },
  );

  it.each([0, 1])(
    "retains the safe external URL and new-tab disclosure for item %s",
    (index) => {
      const item = demoBatch().recommendations[index];
      show(
        <RecommendationCard
          item={{ ...item, problem: { ...item.problem, url: problemUrl } }}
        />,
      );

      const link = screen.getByRole("link", {
        name: /^Open on Codeforces\s*Opens in a new tab$/,
      });
      expect(link).toHaveAttribute("href", problemUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it.each([null, "javascript:alert(1)", "https://user:secret@example.com"])(
    "disables the action for missing or unsafe URL %s",
    (url) => {
      const item = demoBatch().recommendations[0];
      show(
        <RecommendationCard
          item={{ ...item, problem: { ...item.problem, url } }}
        />,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Problem link unavailable" }),
      ).toBeDisabled();
    },
  );

  it("compact batches put the featured action and difficulty facts before the explanation", () => {
    const batch = demoBatch();
    batch.recommendations[0] = {
      ...batch.recommendations[0],
      problem: { ...batch.recommendations[0].problem, url: problemUrl },
    };
    show(<BatchView batch={batch} compact />);

    const explanation = screen.getByText(
      "This difficulty is close to your current practice level.",
    );
    const link = screen.getByRole("link", {
      name: /^Open on Codeforces\s*Opens in a new tab$/,
    });
    for (const element of [
      link,
      screen.getByText("Problem difficulty", { selector: "dt" }),
      screen.getByText("Target difficulty", { selector: "dt" }),
    ]) {
      expect(
        element.compareDocumentPosition(explanation) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
    expect(screen.getByText("Skill coverage")).toBeVisible();
    expect(screen.getByText("implementation")).toBeVisible();
    expect(screen.getByText("Codeforces solver count: 250")).toBeVisible();
  });
});
