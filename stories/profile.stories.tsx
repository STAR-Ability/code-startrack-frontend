import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnalysisView } from "@/components/workspace/analysis-view";
import { ProfileDirection } from "@/components/workspace/user-analysis-page";
import { EmptyState, ErrorNotice } from "@/components/workspace/feedback";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { ApiError } from "@/lib/api/errors";
import { fn } from "storybook/test";
import { StoryFrame, mobile } from "./helpers";

const snapshot = demoAnalysis();
const meta = {
  title: "Workspace/Profile",
  component: AnalysisView,
  args: { analysis: snapshot, ability: true, dimensions: true },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The actual account-scoped profile presentation, using a synthetic V0.11 DTO. No algorithm service is called. A missing analysis, zero evidence, stale data and an unavailable request are different states. Statistics remain secondary to the training loop.",
      },
    },
  },
} satisfies Meta<typeof AnalysisView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = {
  args: { analysis: null, loading: true },
};
export const Empty: Story = { args: { analysis: null } };
export const ContextualEmpty: Story = {
  args: {
    analysis: null,
    aggregate: true,
    emptyState: (
      <EmptyState
        embedded
        title="Your connected accounts are waiting for a profile"
        description="Rebuild the profile or review the account connections. No score is available yet."
        href="/accounts"
        action="Review account connections"
      />
    ),
  },
};
export const ContextualEmptyMobile: Story = {
  ...ContextualEmpty,
  globals: { ...mobile, locale: "en" },
};
export const ZeroEvidence: Story = {
  args: { analysis: demoAnalysis(undefined, "ALL", true) },
};
export const Stale: Story = {
  args: { analysis: { ...snapshot, stale: true } },
};
export const TrainingFocus: Story = {
  render: (args) => (
    <>
      {args.analysis && <ProfileDirection analysis={args.analysis} />}
      <AnalysisView {...args} metricTitle="metrics.ability" />
    </>
  ),
};
export const HistoricalFocus: Story = {
  render: (args) => (
    <>
      {args.analysis && (
        <ProfileDirection analysis={args.analysis} historical />
      )}
      <AnalysisView {...args} metricTitle="metrics.snapshot" />
    </>
  ),
};
export const TrainingFocusMobile: Story = {
  ...TrainingFocus,
  globals: { ...mobile, locale: "en" },
};
export const Error: Story = {
  args: { analysis: null, unavailable: true },
  render: (args) => (
    <>
      <ErrorNotice
        error={new ApiError("NETWORK_ERROR")}
        retry={fn()}
        dataError
      />
      <AnalysisView {...args} />
    </>
  ),
};
export const Statistics: Story = {
  args: { ability: false, dimensions: false, statistics: true },
};
export const EmptyStatistics: Story = {
  args: { analysis: null, ability: false, dimensions: false, statistics: true },
};
export const LoadingStatistics: Story = {
  args: {
    analysis: null,
    loading: true,
    ability: false,
    dimensions: false,
    statistics: true,
  },
};
export const Mobile: Story = { globals: mobile };
