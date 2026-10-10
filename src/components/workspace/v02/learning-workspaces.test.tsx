import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import { v02 } from "@/lib/api/v02";
import type { TrainingRecord } from "@/lib/api/v02-schemas";
import { modes, windows } from "@/lib/api/schemas";
import { recommendationSources } from "@/lib/api/v02-schemas";
import { keys } from "@/lib/query/keys";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import {
  v02ExternalProblem,
  v02Instant,
  v02LearningProfile,
  v02RecommendationBatch,
} from "@/lib/demo/v02-fixtures";
import { translate } from "@/lib/i18n/locale";
import { WorkspaceSessionProvider } from "../account-provider";
import { LearningProfileView } from "./learning-profile-view";
import {
  LearningProfilePage,
  LearningProfileRebuild,
} from "./learning-profile-page";
import { LearningRecommendationPage } from "./learning-recommendation-page";
import { LearningRecommendationView } from "./learning-recommendation-view";
import { TrainingPlanAction } from "./training-problem";
import { TrainingDetail } from "./training-detail";
import { TrainingPage } from "./training-page";

const navigation = vi.hoisted(() => ({ query: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/learning-profile",
  useSearchParams: () => new URLSearchParams(navigation.query),
  useRouter: () => ({ replace: navigation.replace }),
}));
vi.mock("../chart", () => ({
  Chart: ({ label, option }: { label: string; option: unknown }) => (
    <div
      role="img"
      aria-label={label}
      data-chart-option={JSON.stringify(option)}
    />
  ),
}));

function wrap(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(keys.session, demoUser);
  return (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <WorkspaceSessionProvider>{children}</WorkspaceSessionProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
const record: TrainingRecord = {
  trainingRecordId: fixtureUuid(2501),
  problem: v02ExternalProblem,
  status: "PLANNED",
  recommendationBatchId: fixtureUuid(2402),
  firstSubmittedAt: null,
  lastSubmittedAt: null,
  attemptCount: 0,
  acceptedSubmissionCount: 0,
  lastSubmissionId: null,
  completedAt: null,
  createdAt: v02Instant,
  updatedAt: v02Instant,
};
const page = <T,>(data: T[]) => ({
  data,
  meta: { page: 1, pageSize: 20, total: data.length, hasNext: false },
  requestId: fixtureUuid(2999),
});

beforeEach(() => {
  vi.restoreAllMocks();
  navigation.query = "";
  navigation.replace.mockReset();
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.spyOn(api, "me").mockResolvedValue(demoUser);
  vi.spyOn(api, "accounts").mockResolvedValue([]);
  vi.spyOn(v02, "learningProfile").mockImplementation(async (_id, window) =>
    v02LearningProfile(window, true),
  );
  vi.spyOn(v02, "learningHistory").mockResolvedValue(
    page([v02LearningProfile()]),
  );
  vi.spyOn(v02, "recommendations").mockResolvedValue(null);
  vi.spyOn(v02, "recommendationHistory").mockResolvedValue(page([]));
});

describe("learning profile evidence", () => {
  it("presents successful zero evidence with no CF accounts and separate code quality", () => {
    render(
      wrap(<LearningProfileView profile={v02LearningProfile("ALL", true)} />),
    );
    expect(
      screen.getByText("Profile generated with no training evidence"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No learning profile yet"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Code quality" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No CF source accounts/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Six dimensions · 0–100" }),
    ).toBeInTheDocument();
  });

  it("renders each difficulty scale independently and keeps staleness visible", () => {
    render(
      wrap(
        <LearningProfileView
          profile={{ ...v02LearningProfile(), stale: true }}
        />,
      ),
    );
    for (const scale of ["CF Rating", "Platform Rating", "Unrated"])
      expect(
        screen.getByRole("img", { name: `Difficulty by scale · ${scale}` }),
      ).toBeInTheDocument();
    expect(screen.getByText(/This profile is stale/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Average\/max difficulty and rated solved counts use CF_RATING only/,
      ),
    ).toBeInTheDocument();
  });

  it("bounds tag plots to ten supplied tags while preserving full text and plotted activity evidence", () => {
    const profile = v02LearningProfile();
    profile.tagStats = Array.from({ length: 12 }, (_, index) => ({
      tag: `tag-${index}`,
      attemptedProblemCount: index + 1,
      solvedCount: index,
      submissionCount: index + 2,
    }));
    render(wrap(<LearningProfileView profile={profile} />));
    const chart = screen.getByRole("img", { name: "Knowledge tags" });
    expect(chart.getAttribute("data-chart-option")).toContain('"tag-9"');
    expect(chart.getAttribute("data-chart-option")).not.toContain('"tag-10"');
    expect(screen.getByText("tag-11", { selector: "dt" })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Daily training details" }),
    );
    expect(
      screen.getByText("2026-10-02", { selector: "time" }),
    ).toBeInTheDocument();
  });

  it("loads all four windows and offers bookmarkable history without a CF account", async () => {
    render(wrap(<LearningProfilePage />));
    await screen.findByText("Profile generated with no training evidence");
    for (const window of windows) {
      fireEvent.click(
        screen.getByRole("button", {
          name: translate("en", `v.window.${window}`),
        }),
      );
      await waitFor(() =>
        expect(v02.learningProfile).toHaveBeenCalledWith(
          demoUser.publicId,
          window,
          expect.any(AbortSignal),
        ),
      );
    }
    expect(screen.getByRole("link", { name: "View snapshot" })).toHaveAttribute(
      "href",
      `/learning-profile?snapshotId=${v02LearningProfile().snapshotId}`,
    );
  });

  it("keeps an archived URL snapshot separate from the latest window", async () => {
    const historical = {
      ...v02LearningProfile("7D"),
      snapshotId: fixtureUuid(2701),
      overallScore: 17,
    };
    navigation.query = `snapshotId=${historical.snapshotId}`;
    vi.spyOn(v02, "learningSnapshot").mockResolvedValue(historical);
    render(wrap(<LearningProfilePage />));
    await waitFor(() =>
      expect(v02.learningSnapshot).toHaveBeenCalledWith(
        demoUser.publicId,
        historical.snapshotId,
        expect.any(AbortSignal),
      ),
    );
    expect(await screen.findByText(historical.snapshotId)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest result" })).toHaveAttribute(
      "href",
      "/learning-profile",
    );
  });

  it("uses the new SUCCEEDED job terminal state after rebuilding", async () => {
    const job = {
      jobId: fixtureUuid(2801),
      status: "QUEUED" as const,
      sourceFingerprint: "f".repeat(64),
      profileJobId: null,
      error: null,
      createdAt: v02Instant,
      updatedAt: v02Instant,
      finishedAt: null,
    };
    const rebuild = vi.spyOn(v02, "rebuildProfile").mockResolvedValue(job);
    vi.spyOn(v02, "profileJob").mockResolvedValue({
      ...job,
      status: "SUCCEEDED",
      profileJobId: job.jobId,
      finishedAt: v02Instant,
    });
    render(wrap(<LearningProfileRebuild />));
    fireEvent.click(
      screen.getByRole("button", { name: "Rebuild learning profile" }),
    );
    expect(
      await screen.findByText("Profile job succeeded"),
    ).toBeInTheDocument();
    expect(rebuild).toHaveBeenCalledWith(
      expect.stringMatching(/^[\da-f-]{36}$/),
    );
    expect(
      screen.getByRole("button", { name: "Rebuild learning profile" }),
    ).toBeEnabled();
  });

  it("recovers an accepted rebuild through GET retry without unlocking a second POST after a transient read error", async () => {
    const job = {
      jobId: fixtureUuid(2802),
      status: "QUEUED" as const,
      sourceFingerprint: "f".repeat(64),
      profileJobId: null,
      error: null,
      createdAt: v02Instant,
      updatedAt: v02Instant,
      finishedAt: null,
    };
    const rebuild = vi.spyOn(v02, "rebuildProfile").mockResolvedValue(job);
    const read = vi
      .spyOn(v02, "profileJob")
      .mockRejectedValueOnce(new TypeError("network disconnected"))
      .mockResolvedValue({
        ...job,
        status: "SUCCEEDED",
        profileJobId: job.jobId,
        finishedAt: v02Instant,
      });
    render(wrap(<LearningProfileRebuild />));
    fireEvent.click(
      screen.getByRole("button", { name: "Rebuild learning profile" }),
    );
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByRole("button", { name: "Rebuilding" })).toBeDisabled();
    fireEvent.click(retry);
    expect(
      await screen.findByText("Profile job succeeded"),
    ).toBeInTheDocument();
    expect(rebuild).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledTimes(2);
  });
});

describe("recommendation training loop", () => {
  it("previews the first supplied recommendation and links to the complete frozen batch", () => {
    const batch = v02RecommendationBatch();
    const supplied = {
      ...batch,
      recommendations: [
        { ...batch.recommendations[0], rank: 2, reason: "Supplied preview" },
        { ...batch.recommendations[1], rank: 1, reason: "Complete batch only" },
      ],
    };
    render(wrap(<LearningRecommendationView batch={supplied} compact />));
    expect(screen.getByText("Supplied preview")).toBeInTheDocument();
    expect(screen.queryByText("Complete batch only")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Problem 2",
    );
    expect(
      screen.getByRole("link", { name: "View recommendation batch" }),
    ).toHaveAttribute(
      "href",
      `/learning-recommendations?batchId=${batch.batchId}`,
    );
  });

  it("plans with the actual frozen batch and reference; external navigation sends no completion", async () => {
    const create = vi
      .spyOn(v02, "createTrainingRecord")
      .mockResolvedValue(record);
    render(
      wrap(
        <TrainingPlanAction
          problem={v02ExternalProblem}
          batchId={record.recommendationBatchId!}
        />,
      ),
    );
    expect(
      screen.queryByRole("link", { name: "Open original Codeforces problem" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Add to training plan" }),
    );
    const external = await screen.findByRole("link", {
      name: "Open original Codeforces problem",
    });
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      {
        problemRef: v02ExternalProblem.problemRef,
        recommendationBatchId: record.recommendationBatchId,
      },
      expect.stringMatching(/^[\da-f-]{36}$/),
    );
    expect(external).toHaveAttribute("href", v02ExternalProblem.url);
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    external.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(external);
    expect(create).toHaveBeenCalledOnce();
    expect(record.status).toBe("PLANNED");
    expect(
      screen.queryByRole("button", { name: /complete|accept/i }),
    ).not.toBeInTheDocument();
  });

  it("retains backend ranks/reasons and independently marks later accepted problems", () => {
    const batch = v02RecommendationBatch();
    const frozen = {
      ...batch,
      recommendations: [
        {
          ...batch.recommendations[0],
          rank: 2,
          reason: "Frozen second choice",
          solvedSinceGeneration: true,
        },
        { ...batch.recommendations[1], rank: 1, reason: "Frozen first choice" },
      ],
    };
    render(wrap(<LearningRecommendationView batch={frozen} />));
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((item) => item.textContent),
    ).toEqual(["Problem 2", "Problem 1"]);
    expect(screen.getByText("Frozen second choice")).toBeInTheDocument();
    expect(screen.getByText("Frozen first choice")).toBeInTheDocument();
    expect(screen.getByText("Accepted since generation")).toBeInTheDocument();
  });

  it("validates recommendation count and sends explicit documented defaults", async () => {
    const generate = vi
      .spyOn(v02, "generateRecommendations")
      .mockResolvedValue(v02RecommendationBatch());
    vi.spyOn(v02, "recommendationBatch").mockResolvedValue(
      v02RecommendationBatch(),
    );
    render(wrap(<LearningRecommendationPage />));
    const input = screen.getByRole("spinbutton", {
      name: "Problem count (1–50)",
    });
    fireEvent.change(input, { target: { value: "1.5" } });
    fireEvent.submit(input.closest("form")!);
    expect(
      await screen.findByText("Enter an integer from 1 to 50."),
    ).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() =>
      expect(generate).toHaveBeenCalledWith(
        { source: "ALL", mode: "HYBRID", limit: 10 },
        expect.any(String),
      ),
    );
    expect(
      (
        await screen.findAllByText(
          "Platform difficulty is a separate scale; selected for implementation practice.",
        )
      ).length,
    ).toBe(2);
  });

  it("loads all nine source and mode combinations without changing backend ranking", async () => {
    render(wrap(<LearningRecommendationPage />));
    const sourceGroup = screen.getByRole("group", { name: "Problem source" });
    const modeGroup = screen.getByRole("group", {
      name: "Recommendation mode",
    });
    for (const source of recommendationSources) {
      fireEvent.click(
        within(sourceGroup).getByRole("button", {
          name: translate("en", `v02.source.${source}`),
        }),
      );
      for (const mode of modes) {
        fireEvent.click(
          within(modeGroup).getByRole("button", {
            name: translate("en", `v.mode.${mode}`),
          }),
        );
        await waitFor(() =>
          expect(v02.recommendations).toHaveBeenCalledWith(
            source,
            mode,
            expect.any(AbortSignal),
          ),
        );
      }
    }
  });

  it("keeps an explicitly opened historical batch when an earlier generation resolves late", async () => {
    const latest = v02RecommendationBatch();
    const generated = {
      ...latest,
      recommendations: [
        { ...latest.recommendations[0], reason: "Newly generated batch A" },
      ],
      resultCount: 1,
    };
    const historical = {
      ...latest,
      batchId: fixtureUuid(2851),
      recommendations: [
        { ...latest.recommendations[0], reason: "Frozen historical batch B" },
      ],
      resultCount: 1,
    };
    let resolveGeneration: (batch: typeof generated) => void = () => {};
    vi.spyOn(v02, "generateRecommendations").mockReturnValue(
      new Promise((resolve) => {
        resolveGeneration = resolve;
      }),
    );
    vi.spyOn(v02, "recommendationHistory").mockResolvedValue(
      page([historical]),
    );
    vi.spyOn(v02, "recommendationBatch").mockImplementation(async (id) =>
      id === historical.batchId ? historical : generated,
    );
    render(wrap(<LearningRecommendationPage />));
    const historicalLink = await screen.findByRole("link", {
      name: "View recommendation batch",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Generate recommendations" }),
    );
    await screen.findByRole("button", { name: "Generating" });
    historicalLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(historicalLink);
    expect(
      await screen.findByText("Frozen historical batch B"),
    ).toBeInTheDocument();
    await act(async () => resolveGeneration(generated));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Generate recommendations" }),
      ).toBeEnabled(),
    );
    expect(screen.getByText("Frozen historical batch B")).toBeInTheDocument();
    expect(
      screen.queryByText("Newly generated batch A"),
    ).not.toBeInTheDocument();
  });

  it.each(["source", "mode"] as const)(
    "keeps the new %s scope when an earlier generation resolves late",
    async (context) => {
      const generated = v02RecommendationBatch();
      let resolveGeneration: (batch: typeof generated) => void = () => {};
      const generate = vi.spyOn(v02, "generateRecommendations").mockReturnValue(
        new Promise((resolve) => {
          resolveGeneration = resolve;
        }),
      );
      const readBatch = vi
        .spyOn(v02, "recommendationBatch")
        .mockResolvedValue(generated);
      render(wrap(<LearningRecommendationPage />));
      fireEvent.click(
        screen.getByRole("button", { name: "Generate recommendations" }),
      );
      await screen.findByRole("button", { name: "Generating" });
      const group = screen.getByRole("group", {
        name: context === "source" ? "Problem source" : "Recommendation mode",
      });
      fireEvent.click(
        within(group).getByRole("button", {
          name: context === "source" ? "Codeforces" : "Weakness practice",
        }),
      );
      await act(async () => resolveGeneration(generated));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Generate recommendations" }),
        ).toBeEnabled(),
      );
      expect(generate).toHaveBeenCalledWith(
        { source: "ALL", mode: "HYBRID", limit: 10 },
        expect.any(String),
      );
      expect(readBatch).not.toHaveBeenCalled();
      expect(
        screen.getByText("No recommendations for this scope yet"),
      ).toBeInTheDocument();
      expect(
        within(group).getByRole("button", {
          name: context === "source" ? "Codeforces" : "Weakness practice",
        }),
      ).toHaveAttribute("aria-pressed", "true");
    },
  );

  it("applies only documented training filters with inclusive/exclusive UTC boundaries", async () => {
    const records = vi
      .spyOn(v02, "trainingRecords")
      .mockResolvedValue(page([]));
    render(wrap(<TrainingPage />));
    await screen.findByText("No matching training records");
    fireEvent.change(screen.getByRole("combobox", { name: "Problem source" }), {
      target: { value: "EXTERNAL" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Training status" }),
      { target: { value: "IN_PROGRESS" } },
    );
    fireEvent.change(
      screen.getByLabelText("Submission start (UTC, inclusive)"),
      { target: { value: "2026-10-01" } },
    );
    fireEvent.change(screen.getByLabelText("Submission end (UTC, exclusive)"), {
      target: { value: "2026-10-08" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(records).toHaveBeenLastCalledWith(
        {
          source: "EXTERNAL",
          status: "IN_PROGRESS",
          from: "2026-10-01T00:00:00Z",
          to: "2026-10-08T00:00:00Z",
          page: 1,
        },
        expect.any(AbortSignal),
      ),
    );
  });

  it("resets filters when a same-route source URL changes", async () => {
    const records = vi
      .spyOn(v02, "trainingRecords")
      .mockResolvedValue(page([]));
    navigation.query = "source=PLATFORM";
    const view = render(wrap(<TrainingPage />));
    await waitFor(() =>
      expect(records).toHaveBeenLastCalledWith(
        { source: "PLATFORM", page: 1 },
        expect.any(AbortSignal),
      ),
    );
    navigation.query = "source=EXTERNAL";
    view.rerender(wrap(<TrainingPage />));
    await waitFor(() =>
      expect(records).toHaveBeenLastCalledWith(
        { source: "EXTERNAL", page: 1 },
        expect.any(AbortSignal),
      ),
    );
    expect(
      screen.getByRole("combobox", { name: "Problem source" }),
    ).toHaveValue("EXTERNAL");
  });

  it("renders current backend counters after an accepted result is revoked", async () => {
    const current = {
      ...record,
      status: "IN_PROGRESS" as const,
      attemptCount: 3,
      acceptedSubmissionCount: 0,
      firstSubmittedAt: v02Instant,
      lastSubmittedAt: v02Instant,
      lastSubmissionId: "42",
    };
    navigation.query = `trainingRecordId=${record.trainingRecordId}`;
    vi.spyOn(v02, "trainingRecord").mockResolvedValue(current);
    render(wrap(<TrainingDetail />));
    expect(await screen.findByText("In progress")).toBeInTheDocument();
    const label = screen.getByText("Accepted submissions", { selector: "dt" });
    expect(within(label.parentElement!).getByText("0")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View last platform submission" }),
    ).not.toBeInTheDocument();
  });
});
