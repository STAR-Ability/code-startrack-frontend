import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { SubmissionJudge, submittedProblemHref } from "./submission-judge";
import { StaticAnalysisView } from "./static-analysis-view";
import { exampleSubmission, exampleAnalysis } from "./submission-test-fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions/detail",
}));
beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

describe("platform judge evidence", () => {
  it("preserves AC and training links when analysis fails", () => {
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionJudge
          submission={exampleSubmission({ analysisStatus: "FAILED" })}
        />
        <StaticAnalysisView
          analysis={exampleAnalysis({
            status: "FAILED",
            result: null,
            error: {
              code: "ALGORITHM_UNAVAILABLE",
              message: "Unavailable analysis service",
              retryable: true,
            },
          })}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText("AC · Accepted")).toBeInTheDocument();
    expect(screen.getByText("Analysis failed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View platform training records" }),
    ).toHaveAttribute("href", "/training?source=PLATFORM");
    expect(
      screen.getByRole("link", { name: "View submitted problem" }),
    ).toHaveAttribute("href", submittedProblemHref(exampleSubmission()));
  });

  it("shows exact resource units and supplied zero CPU time", () => {
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionJudge submission={exampleSubmission()} />
      </LocaleProvider>,
    );
    expect(screen.getByText("0 ms")).toBeInTheDocument();
    expect(screen.getByText("1 MiB (1,048,576 B)")).toBeInTheDocument();
    expect(screen.getByText("8 / 8")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("uses unavailable values for resources not run and renders compile logs as text", () => {
    const submission = exampleSubmission();
    submission.judgeResult = {
      ...submission.judgeResult!,
      verdict: "CE",
      timeMs: null,
      memoryBytes: null,
      compileLog: "<script>alert('private')</script>",
    };
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <SubmissionJudge submission={submission} />
      </LocaleProvider>,
    );
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Compilation log" }));
    expect(screen.getByLabelText("Compilation log")).toHaveTextContent(
      "<script>alert('private')</script>",
    );
    expect(container.querySelector("script")).toBeNull();
  });

  it("explains retryable local failure as ongoing reconciliation without a fabricated verdict", () => {
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionJudge
          submission={exampleSubmission({
            judgeStatus: "FAILED",
            judgeTaskId: null,
            judgeResult: null,
            judgeError: {
              code: "JUDGE_UNAVAILABLE",
              message: "Retryable dispatch uncertainty",
              retryable: true,
            },
          })}
        />
      </LocaleProvider>,
    );
    expect(
      screen.getByText(/state is read every 30 seconds/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/IE ·/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit/i }),
    ).not.toBeInTheDocument();
  });

  it("treats remote IE and cancellation as infrastructure states", () => {
    const submission = exampleSubmission();
    const view = (cancelled: boolean) => (
      <LocaleProvider initialLocale="en">
        <SubmissionJudge
          submission={{
            ...submission,
            judgeStatus: cancelled ? "CANCELLED" : "FAILED",
            judgeResult: cancelled
              ? null
              : { ...submission.judgeResult!, verdict: "IE" },
            judgeError: cancelled
              ? null
              : {
                  code: "SANDBOX_UNAVAILABLE",
                  message: "Unavailable sandbox",
                  retryable: true,
                },
          }}
        />
      </LocaleProvider>
    );
    const { rerender } = render(view(false));
    expect(
      screen.getByText("IE · Judge infrastructure error"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This service error does not count as a wrong answer."),
    ).toBeInTheDocument();
    rerender(view(true));
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText(/IE ·/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/no verdict and does not count as a wrong answer/),
    ).toBeInTheDocument();
  });
});
