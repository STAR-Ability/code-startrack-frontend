import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { StaticAnalysisView, analysisCanRetry } from "./static-analysis-view";
import {
  exampleAnalysis,
  exampleAnalysisResult,
  exampleSubmission,
} from "./submission-test-fixtures";
import type { AnalysisStatus } from "@/lib/api/v02-schemas";

vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions/detail",
}));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

describe("static analysis evidence", () => {
  it("shows nullable metrics, exact diagnostic locations, and every tool's failure evidence", () => {
    const result = exampleAnalysisResult();
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <StaticAnalysisView analysis={exampleAnalysis()} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Partial analysis available")).toBeInTheDocument();
    expect(
      screen.getByText("main.cpp · lines 1–3 · column 2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bug risk")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Infer timed out.")).toBeInTheDocument();
    expect(
      screen.getByText("Tool unavailable for this language."),
    ).toBeInTheDocument();
    expect(screen.getByText("TOOL_TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("1.17")).toBeInTheDocument();
    expect(container).toHaveTextContent(result.tools[1].configSha256);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(container.querySelector("[data-analysis-evidence]")).toHaveAttribute(
      "data-analysis-evidence",
      "current",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reproducibility" }));
    expect(screen.getByText(result.reproducibility.imageDigest)).toBeVisible();
    expect(screen.getByText(result.resultHash)).toBeVisible();
    expect(
      screen.getByText("Not requested. V0.2 provides static tool evidence."),
    ).toBeInTheDocument();
  });

  it("keeps the new task's identity distinct from labeled previous evidence", () => {
    const previous = exampleAnalysisResult();
    const nextId = "50000000-0000-4000-8000-000000000001";
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <StaticAnalysisView
          analysis={exampleAnalysis({
            analysisId: nextId,
            revision: 1,
            status: "QUEUED",
            result: null,
          })}
          previousResult={previous}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText(nextId)).toBeInTheDocument();
    expect(
      screen.getByText(/Showing the previous usable analysis/),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-analysis-evidence]")).toHaveAttribute(
      "data-analysis-evidence",
      "previous",
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Analysis queued")).toBeInTheDocument();
  });

  for (const status of [
    "NOT_REQUESTED",
    "QUEUED",
    "RUNNING",
    "FAILED",
    "SKIPPED",
  ] as AnalysisStatus[]) {
    it(`${status} without evidence never invents metrics`, () => {
      const { container } = render(
        <LocaleProvider initialLocale="en">
          <StaticAnalysisView
            analysis={exampleAnalysis({ status, result: null })}
          />
        </LocaleProvider>,
      );
      expect(
        screen.queryByRole("heading", { name: "Code metrics" }),
      ).not.toBeInTheDocument();
      expect(container.querySelector("[data-analysis-evidence]")).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Synthesis" }),
      ).toBeInTheDocument();
    });
  }

  it("renders supplied zero metrics separately from null", () => {
    const result = exampleAnalysisResult();
    result.metrics = {
      sourceLines: 0,
      functionCount: 0,
      maxCyclomaticComplexity: null,
      meanCyclomaticComplexity: null,
      duplicateLines: 0,
      maintainabilityIndex: null,
    };
    render(
      <LocaleProvider initialLocale="en">
        <StaticAnalysisView analysis={exampleAnalysis({ result })} />
      </LocaleProvider>,
    );
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  it("requires completed judging and allows failed or partial attempts while the backend validates retry", () => {
    expect(analysisCanRetry(exampleAnalysis(), exampleSubmission())).toBe(true);
    for (const judgeStatus of [
      "QUEUED",
      "RUNNING",
      "FAILED",
      "CANCELLED",
    ] as const)
      expect(
        analysisCanRetry(exampleAnalysis(), exampleSubmission({ judgeStatus })),
      ).toBe(false);
    for (const status of [
      "SUCCEEDED",
      "RUNNING",
      "QUEUED",
      "NOT_REQUESTED",
    ] as AnalysisStatus[])
      expect(
        analysisCanRetry(exampleAnalysis({ status }), exampleSubmission()),
      ).toBe(false);
    expect(
      analysisCanRetry(
        exampleAnalysis({
          status: "SKIPPED",
          result: null,
          error: {
            code: "UNSUPPORTED_LANGUAGE",
            message: "Unsupported",
            retryable: false,
          },
        }),
        exampleSubmission(),
      ),
    ).toBe(false);
    expect(
      analysisCanRetry(
        exampleAnalysis({
          status: "FAILED",
          result: null,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Wait",
            retryable: true,
          },
        }),
        exampleSubmission(),
      ),
    ).toBe(true);
    const partial = exampleAnalysis();
    partial.result!.tools = partial.result!.tools.map((tool) => ({
      ...tool,
      error: tool.error ? { ...tool.error, retryable: false } : null,
    }));
    expect(partial.error).toBeNull();
    expect(analysisCanRetry(partial, exampleSubmission())).toBe(true);
    expect(
      analysisCanRetry(
        exampleAnalysis({
          status: "FAILED",
          result: null,
          error: {
            code: "TOOL_FAILED",
            message: "The tool did not produce a usable result.",
            retryable: false,
          },
        }),
        exampleSubmission(),
      ),
    ).toBe(true);
  });

  it("disables duplicate retry requests and supports translated evidence", () => {
    document.cookie = "codestartrack_locale=zh-CN; Path=/";
    const retry = vi.fn();
    render(
      <LocaleProvider initialLocale="zh-CN">
        <StaticAnalysisView
          analysis={exampleAnalysis()}
          retry={retry}
          retrying
        />
      </LocaleProvider>,
    );
    const button = screen.getByRole("button", { name: "正在申请分析重试…" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(retry).not.toHaveBeenCalled();
    expect(
      screen.getByText("main.cpp · 第 1–3 行 · 第 2 列"),
    ).toBeInTheDocument();
  });
});
