import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/layout/locale-provider";
import {
  useV02Analysis,
  useV02Mutation,
  useV02Query,
} from "@/lib/query/v02-hooks";
import { SubmissionAnalysis } from "./submission-detail";
import { exampleAnalysis, exampleSubmission } from "./submission-test-fixtures";
import type { SubmissionAnalysisView } from "@/lib/api/v02-schemas";

vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions/detail",
}));
vi.mock("@/lib/query/v02-hooks", () => ({
  useV02Analysis: vi.fn(),
  useV02Mutation: vi.fn(),
  useV02Query: vi.fn(),
  useV02Submission: vi.fn(),
}));

const mutate = vi.fn();

function analysisState(analysis: SubmissionAnalysisView) {
  vi.mocked(useV02Analysis).mockReturnValue({
    isPending: false,
    isFetching: false,
    error: null,
    data: analysis,
    refetch: vi.fn(),
    accept: vi.fn(),
  } as unknown as ReturnType<typeof useV02Analysis>);
}

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  mutate.mockClear();
  vi.mocked(useV02Query).mockClear();
  // A temporarily unreachable algorithm can produce this cached capability.
  vi.mocked(useV02Query).mockReturnValue({
    data: { languages: [{ languageId: "cpp17", analysisSupported: false }] },
  } as unknown as ReturnType<typeof useV02Query>);
  vi.mocked(useV02Mutation).mockReturnValue({
    error: null,
    isPending: false,
    blocked: false,
    mutate,
  } as unknown as ReturnType<typeof useV02Mutation>);
});

describe("submission analysis recovery actions", () => {
  it("offers retry for partial evidence with no top-level error even when every tool error is nonretryable", () => {
    const analysis = exampleAnalysis();
    analysis.result!.tools = analysis.result!.tools.map((tool) => ({
      ...tool,
      error: tool.error ? { ...tool.error, retryable: false } : null,
    }));
    analysisState(analysis);
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionAnalysis submission={exampleSubmission()} />
      </LocaleProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Retry code analysis" }),
    );
    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledWith(exampleSubmission().submissionId);
    expect(useV02Query).not.toHaveBeenCalled();
  });

  it("offers recovery for temporarily skipped analysis despite a cached false capability", () => {
    analysisState(
      exampleAnalysis({
        status: "SKIPPED",
        result: null,
        error: {
          code: "ALGORITHM_UNAVAILABLE",
          message: "The algorithm is temporarily unavailable.",
          retryable: true,
        },
      }),
    );
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionAnalysis submission={exampleSubmission()} />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Retry code analysis" }),
    ).toBeEnabled();
    expect(useV02Query).not.toHaveBeenCalled();
  });

  it("keeps a failed attempt recoverable while final eligibility is checked by the backend", () => {
    analysisState(
      exampleAnalysis({
        status: "FAILED",
        result: null,
        error: {
          code: "TOOL_FAILED",
          message: "The task did not produce a usable result.",
          retryable: false,
        },
      }),
    );
    render(
      <LocaleProvider initialLocale="en">
        <SubmissionAnalysis submission={exampleSubmission()} />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Retry code analysis" }),
    ).toBeEnabled();
  });

  for (const state of [
    "complete",
    "permanently-skipped",
    "judge-pending",
  ] as const) {
    it(`blocks ${state} analysis retry`, () => {
      analysisState(
        state === "permanently-skipped"
          ? exampleAnalysis({
              status: "SKIPPED",
              result: null,
              error: {
                code: "UNSUPPORTED_LANGUAGE",
                message: "Unsupported language.",
                retryable: false,
              },
            })
          : exampleAnalysis({
              status: state === "complete" ? "SUCCEEDED" : "PARTIAL",
            }),
      );
      render(
        <LocaleProvider initialLocale="en">
          <SubmissionAnalysis
            submission={exampleSubmission({
              judgeStatus: state === "judge-pending" ? "RUNNING" : "COMPLETED",
            })}
          />
        </LocaleProvider>,
      );
      expect(
        screen.queryByRole("button", { name: "Retry code analysis" }),
      ).not.toBeInTheDocument();
    });
  }
});
