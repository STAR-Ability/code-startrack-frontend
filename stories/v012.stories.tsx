import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnalysisView } from "@/components/workspace/analysis-view";
import { PersonalReportView } from "@/components/workspace/personal-reports-page";
import {
  TeamAnalysisView,
  TeamBatchView,
} from "@/components/workspace/team-insights";
import {
  SharedTrainingView,
  SharedProfileView,
} from "@/components/workspace/team-member-page";
import { EmptyState, ErrorNotice } from "@/components/workspace/feedback";
import { Status } from "@/components/workspace/v012-shared";
import {
  v012Analysis,
  v012Report,
  v012TeamAnalysis,
  v012TeamBatch,
} from "@/lib/demo/v012-fixtures";
import {
  sharedTrainingSchema,
  sharedProfileSchema,
} from "@/lib/api/v012-schemas";
import { ApiError } from "@/lib/api/errors";
import { StoryFrame, mobile } from "./helpers";
const meta = {
  title: "Workspace/V012",
  parameters: {
    docs: {
      description: {
        component:
          "Production presentations backed by complete synthetic V0.12 DTOs. User aggregate, frozen report, independently shared member domains and audience-specific team results. No API requests or algorithm calculations.",
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
    <AnalysisView analysis={v012Analysis()} aggregate dimensions ability />
  ),
};
export const UserStale: Story = {
  render: () => (
    <AnalysisView
      analysis={{ ...v012Analysis(), stale: true }}
      aggregate
      dimensions
      ability
    />
  ),
};
export const UserZero: Story = {
  render: () => (
    <AnalysisView
      analysis={v012Analysis("ALL", true)}
      aggregate
      dimensions
      ability
    />
  ),
};
export const UserNotGenerated: Story = {
  render: () => <EmptyState title="画像尚未生成 / Aggregate not ready" />,
};
export const CurrentReport: Story = {
  render: () => <PersonalReportView report={v012Report()} />,
};
export const FrozenHistoricalReport: Story = {
  render: () => <PersonalReportView report={v012Report(true)} />,
};
export const CoachAnalysis: Story = {
  render: () => <TeamAnalysisView analysis={v012TeamAnalysis()} />,
};
export const MemberAnalysis: Story = {
  render: () => (
    <TeamAnalysisView analysis={v012TeamAnalysis(undefined, "MEMBER")} />
  ),
};
export const NoSharing: Story = {
  render: () => (
    <TeamAnalysisView analysis={v012TeamAnalysis(undefined, "MEMBER", true)} />
  ),
};
export const MemberRecommendation: Story = {
  render: () => <TeamBatchView batch={v012TeamBatch(undefined, "MEMBER")} />,
};
export const CoachRecommendation: Story = {
  render: () => <TeamBatchView batch={v012TeamBatch()} />,
};
export const EmptyCandidates: Story = {
  render: () => (
    <TeamBatchView batch={v012TeamBatch(undefined, "MEMBER", true)} />
  ),
};
export const SharedTrainingOnly: Story = {
  render: () => (
    <SharedTrainingView data={sharedTrainingSchema.parse(v012Analysis())} />
  ),
};
export const SharedAbilityOnly: Story = {
  render: () => (
    <SharedProfileView data={sharedProfileSchema.parse(v012Analysis())} />
  ),
};
export const PrivacyDenied: Story = {
  render: () => <ErrorNotice error={new ApiError("PRIVACY_DENIED", 403)} />,
};
export const JobStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["QUEUED", "RUNNING", "SUCCESS", "FAILED"].map((status) => (
        <Status key={status} value={status} />
      ))}
    </div>
  ),
};
export const ApplicationStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => (
        <Status key={status} value={status} />
      ))}
    </div>
  ),
};
export const InvitationStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].map(
        (status) => (
          <Status key={status} value={status} />
        ),
      )}
    </div>
  ),
};
export const Mobile: Story = {
  globals: mobile,
  render: () => <TeamAnalysisView analysis={v012TeamAnalysis()} />,
};
export const English: Story = {
  globals: { locale: "en" },
  render: () => (
    <TeamAnalysisView analysis={v012TeamAnalysis(undefined, "MEMBER")} />
  ),
};
