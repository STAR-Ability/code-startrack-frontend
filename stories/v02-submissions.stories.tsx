import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SubmissionJudge } from "@/components/workspace/v02/submission-judge";
import { StaticAnalysisView } from "@/components/workspace/v02/static-analysis-view";
import { v02Analysis, v02Submission } from "@/lib/demo/v02-fixtures";
import type {
  JudgeVerdict,
  SubmissionAnalysisView,
  SubmissionView,
} from "@/lib/api/v02-schemas";
import { StoryFrame, mobile } from "./helpers";

const submission = v02Submission();
const result = v02Analysis();
const ready: SubmissionAnalysisView = {
  analysisId: result.analysisId,
  status: "SUCCEEDED",
  revision: 3,
  result,
  error: null,
};
const retry = fn();
function verdict(code: JudgeVerdict): SubmissionView {
  return v02Submission(undefined, {
    judgeStatus: code === "IE" ? "FAILED" : "COMPLETED",
    judgeError:
      code === "IE"
        ? {
            code: "JUDGE_EXECUTION_FAILED",
            message: "Synthetic isolated judge infrastructure failure.",
            retryable: true,
          }
        : null,
    judgeResult: {
      ...submission.judgeResult!,
      verdict: code,
      passedTestCount: code === "AC" ? 12 : 2,
      timeMs: code === "CE" ? null : 12,
      memoryBytes: code === "CE" ? null : 1048576,
      compileLog:
        code === "CE" ? "main.cpp:3: expected ';' before return" : null,
    },
  });
}
const meta = {
  title: "Workspace/V02 Submissions",
  parameters: {
    docs: {
      description: {
        component:
          "Real judge and analysis presentations. Judge facts, task failures and independent tool evidence remain separate. Cyclomatic complexity and within-submission duplication do not imply Big-O or cross-user plagiarism. LLM synthesis remains NOT_REQUESTED.",
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <SubmissionJudge submission={submission} />
      <StaticAnalysisView analysis={ready} />
    </>
  ),
};
export const Mobile: Story = { ...Default, globals: mobile };
export const English: Story = { ...Default, globals: { locale: "en" } };
export const EnglishMobile: Story = {
  ...Default,
  globals: { ...mobile, locale: "en" },
};
export const WrongAnswer: Story = {
  render: () => <SubmissionJudge submission={verdict("WA")} />,
};
export const CompileError: Story = {
  render: () => <SubmissionJudge submission={verdict("CE")} />,
};
export const TimeLimit: Story = {
  render: () => <SubmissionJudge submission={verdict("TLE")} />,
};
export const MemoryLimit: Story = {
  render: () => <SubmissionJudge submission={verdict("MLE")} />,
};
export const RuntimeError: Story = {
  render: () => <SubmissionJudge submission={verdict("RE")} />,
};
export const OutputLimit: Story = {
  render: () => <SubmissionJudge submission={verdict("OLE")} />,
};
export const InfrastructureFailure: Story = {
  render: () => <SubmissionJudge submission={verdict("IE")} />,
};
export const Queued: Story = {
  render: () => (
    <SubmissionJudge
      submission={v02Submission(undefined, {
        judgeStatus: "QUEUED",
        judgeRevision: 0,
        judgeResult: null,
        judgeError: null,
        analysisStatus: "NOT_REQUESTED",
        analysisId: null,
      })}
    />
  ),
};
export const LocalFailure: Story = {
  render: () => (
    <SubmissionJudge
      submission={v02Submission(undefined, {
        judgeStatus: "FAILED",
        judgeTaskId: null,
        judgeResult: null,
        judgeError: {
          code: "JUDGE_UNAVAILABLE",
          message:
            "The accepted submission is awaiting backend reconciliation.",
          retryable: true,
        },
      })}
    />
  ),
};
export const Cancelled: Story = {
  render: () => (
    <SubmissionJudge
      submission={v02Submission(undefined, {
        judgeStatus: "CANCELLED",
        judgeResult: null,
        judgeError: null,
      })}
    />
  ),
};
export const PartialAnalysis: Story = {
  render: () => (
    <>
      <SubmissionJudge submission={submission} />
      <StaticAnalysisView
        analysis={{
          ...ready,
          status: "PARTIAL",
          result: v02Analysis(undefined, undefined, true),
          error: {
            code: "TOOL_TIMEOUT",
            message:
              "CPD did not complete; other tool results remain available.",
            retryable: true,
          },
        }}
        retry={retry}
      />
    </>
  ),
};
export const FailedAnalysis: Story = {
  render: () => (
    <>
      <SubmissionJudge submission={submission} />
      <StaticAnalysisView
        analysis={{
          ...ready,
          status: "FAILED",
          result: null,
          error: {
            code: "ALGORITHM_UNAVAILABLE",
            message:
              "Synthetic analysis service failure. The accepted judgment remains available.",
            retryable: true,
          },
        }}
        retry={retry}
      />
    </>
  ),
};
export const SkippedAnalysis: Story = {
  render: () => (
    <StaticAnalysisView
      analysis={{
        analysisId: null,
        status: "SKIPPED",
        revision: 0,
        result: null,
        error: {
          code: "ANALYSIS_TEMPORARILY_UNAVAILABLE",
          message:
            "Current language analysis capability is temporarily unavailable.",
          retryable: true,
        },
      }}
      retry={retry}
    />
  ),
};
export const RetryingWithEvidence: Story = {
  render: () => (
    <StaticAnalysisView
      analysis={{
        ...ready,
        analysisId: "00000000-0000-4000-8000-000000002201",
        status: "QUEUED",
        revision: 0,
        result: null,
      }}
      previousResult={result}
      retry={retry}
      retrying
    />
  ),
};
export const NotRequested: Story = {
  render: () => (
    <StaticAnalysisView
      analysis={{
        analysisId: null,
        status: "NOT_REQUESTED",
        revision: 0,
        result: null,
        error: null,
      }}
    />
  ),
};
