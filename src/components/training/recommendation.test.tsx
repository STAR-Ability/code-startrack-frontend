import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { TrainingPage } from "./training-page";
import { TrainingQueryProvider } from "./query-provider";
import {
  profileFixture,
  recommendationsFixture,
} from "../../../tests/api-fixtures.mjs";

vi.mock("next/navigation", () => ({ usePathname: () => "/practice" }));
afterEach(() => vi.unstubAllGlobals());
const problem = recommendationsFixture.recommendations[0];

function renderWithRecommendation(payload: unknown) {
  const fetcher = vi.fn((url: string) =>
    Promise.resolve(
      Response.json(url.endsWith("/profile") ? profileFixture : payload),
    ),
  );
  vi.stubGlobal("fetch", fetcher);
  render(
    <LocaleProvider initialLocale="en">
      <TrainingQueryProvider>
        <TrainingPage userId={1} view="practice" />
      </TrainingQueryProvider>
    </LocaleProvider>,
  );
  return fetcher;
}

test("shows only the first item, truthful missing metadata, reason and a safe new-tab link", async () => {
  const fetcher = renderWithRecommendation({
    ...recommendationsFixture,
    recommendations: [
      problem,
      { ...problem, title: "Do not render another card" },
    ],
  });
  const link = await screen.findByRole("link", { name: "Open on Codeforces" });
  expect(link).toHaveAttribute("href", problem.url);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAccessibleDescription("Opens in a new tab");
  expect(
    screen.getByRole("heading", { name: problem.externalProblemId }),
  ).toBeVisible();
  expect(screen.getByText(/Difficulty unavailable/)).toBeVisible();
  expect(screen.getByText(problem.reason)).toBeVisible();
  expect(screen.getByText(/early placeholders/)).toBeVisible();
  expect(screen.queryByRole("list", { name: "Tags" })).not.toBeInTheDocument();
  expect(
    screen.queryByText("Do not render another card"),
  ).not.toBeInTheDocument();
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "/api/training/profile",
    "/api/training/recommendation",
  ]);
});

test.each([
  undefined,
  "javascript:alert(1)",
  "https://user:password@example.invalid/problem",
])(
  "unusable URL %s leaves the card visible without inventing a destination",
  async (url) => {
    renderWithRecommendation({
      ...recommendationsFixture,
      recommendations: [{ ...problem, url, reason: "  " }],
    });
    expect(
      await screen.findByRole("button", { name: "Problem link unavailable" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: "Open on Codeforces" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("No recommendation note is available."),
    ).toBeVisible();
  },
);

test("empty results retain profile and disclosure without error retry", async () => {
  renderWithRecommendation({ ...recommendationsFixture, recommendations: [] });
  expect(
    await screen.findByText("No recommendation is available right now."),
  ).toBeVisible();
  expect(screen.getByText("Your training profile is ready")).toBeVisible();
  expect(screen.getByText(/early placeholders/)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Retry recommendation" }),
  ).not.toBeInTheDocument();
});

test("E2 waits for profile success and its retry never repeats E1", async () => {
  let resolveProfile: (value: Response) => void = () => {};
  const pendingProfile = new Promise<Response>((resolve) => {
    resolveProfile = resolve;
  });
  let recommendationCalls = 0;
  const fetcher = vi.fn((url: string) => {
    if (url.endsWith("/profile")) return pendingProfile;
    recommendationCalls++;
    return Promise.resolve(
      recommendationCalls === 1
        ? Response.json(
            {
              error: {
                operation: "recommendation",
                category: "http",
                status: 404,
              },
            },
            { status: 404 },
          )
        : Response.json(recommendationsFixture),
    );
  });
  vi.stubGlobal("fetch", fetcher);
  render(
    <LocaleProvider initialLocale="en">
      <TrainingQueryProvider>
        <TrainingPage userId={1} view="practice" />
      </TrainingQueryProvider>
    </LocaleProvider>,
  );
  expect(
    screen.getByText("Recommendations will appear after the profile loads."),
  ).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(1);
  resolveProfile(Response.json(profileFixture));
  const retry = await screen.findByRole("button", {
    name: "Retry recommendation",
  });
  expect(screen.getByText("Your training profile is ready")).toBeVisible();
  fireEvent.click(retry);
  await waitFor(() =>
    expect(
      screen.getByRole("link", { name: "Open on Codeforces" }),
    ).toBeVisible(),
  );
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "/api/training/profile",
    "/api/training/recommendation",
    "/api/training/recommendation",
  ]);
});
