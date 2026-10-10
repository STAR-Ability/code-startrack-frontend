import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { useV02Query, useV02Submission } from "@/lib/query/v02-hooks";
import { SubmissionList, submissionDetailHref } from "./submission-list";
import { SubmissionDetail } from "./submission-detail";
import { exampleSubmission } from "./submission-test-fixtures";

const route = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions",
  useSearchParams: () => new URLSearchParams(route.search),
}));
vi.mock("@/lib/query/v02-hooks", () => ({
  useV02Query: vi.fn(),
  useV02Submission: vi.fn(),
  useV02Analysis: vi.fn(),
  useV02Mutation: vi.fn(),
}));

beforeEach(() => {
  route.search = "";
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.mocked(useV02Query).mockClear();
  vi.mocked(useV02Submission).mockClear();
  vi.mocked(useV02Query).mockReturnValue({
    isPending: false,
    isFetching: false,
    error: null,
    data: {
      data: [exampleSubmission()],
      meta: { page: 1, pageSize: 20, total: 40, hasNext: true },
      requestId: "10000000-0000-4000-8000-000000000001",
    },
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useV02Query>);
});

describe("submission list filters and routes", () => {
  it("uses all exact filters and resets pagination without converting IDs to numbers", async () => {
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionList />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
        page: 2,
      }),
    );
    fireEvent.change(screen.getByLabelText("Platform problem ID"), {
      target: { value: "90071992547409939999" },
    });
    fireEvent.change(screen.getByLabelText("Judge status"), {
      target: { value: "COMPLETED" },
    });
    fireEvent.change(screen.getByLabelText("Verdict"), {
      target: { value: "AC" },
    });
    fireEvent.change(screen.getByLabelText("From (inclusive)"), {
      target: { value: "2026-10-01T12:00" },
    });
    fireEvent.change(screen.getByLabelText("To (exclusive)"), {
      target: { value: "2026-10-02T12:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
        page: 1,
        pageSize: 20,
        problemId: "90071992547409939999",
        judgeStatus: "COMPLETED",
        verdict: "AC",
        from: new Date("2026-10-01T12:00").toISOString(),
        to: new Date("2026-10-02T12:00").toISOString(),
      }),
    );
    expect(
      screen.getByRole("link", { name: "View submission" }),
    ).toHaveAttribute("href", submissionDetailHref("90071992547409939999"));
  });

  it("blocks reversed dates accessibly without changing the query", async () => {
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionList />
      </LocaleProvider>,
    );
    fireEvent.change(screen.getByLabelText("From (inclusive)"), {
      target: { value: "2026-10-02T12:00" },
    });
    fireEvent.change(screen.getByLabelText("To (exclusive)"), {
      target: { value: "2026-10-01T12:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /valid problem ID and date range/,
      ),
    );
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
      page: 1,
      pageSize: 20,
    });
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).not.toHaveProperty(
      "from",
    );
  });

  it("starts from a valid problem filter provided by navigation", () => {
    route.search = "problemId=90071992547409939999&verdict=WA";
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionList />
      </LocaleProvider>,
    );
    expect(screen.getByLabelText("Platform problem ID")).toHaveValue(
      "90071992547409939999",
    );
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
      problemId: "90071992547409939999",
      verdict: "WA",
    });
  });

  it("resets applied filters and pagination when navigating between problem links and back", async () => {
    route.search = "problemId=101&verdict=WA";
    const view = () => (
      <LocaleProvider initialLocale="en">
        <SubmissionList />
      </LocaleProvider>
    );
    const { rerender } = render(view());
    fireEvent.change(screen.getByLabelText("Platform problem ID"), {
      target: { value: "999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
        problemId: "999",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
      page: 2,
    });
    route.search = "problemId=102&judgeStatus=RUNNING";
    rerender(view());
    expect(screen.getByLabelText("Platform problem ID")).toHaveValue("102");
    expect(screen.getByLabelText("Verdict")).toHaveValue("");
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
      page: 1,
      problemId: "102",
      judgeStatus: "RUNNING",
    });
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).not.toHaveProperty(
      "verdict",
    );
    route.search = "problemId=101&verdict=WA";
    rerender(view());
    expect(screen.getByLabelText("Platform problem ID")).toHaveValue("101");
    expect(screen.getByLabelText("Judge status")).toHaveValue("");
    expect(vi.mocked(useV02Query).mock.lastCall?.[1]).toMatchObject({
      page: 1,
      problemId: "101",
      verdict: "WA",
    });
  });

  it("does not run private detail hooks for invalid resource links", () => {
    route.search = "submissionId=123junk";
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionDetail />
      </LocaleProvider>,
    );
    expect(
      screen.getByText(
        "Invalid submission link. Return to the submission list.",
      ),
    ).toBeInTheDocument();
    expect(useV02Submission).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "Back to submissions" }),
    ).toHaveAttribute("href", "/submissions");
  });
});
