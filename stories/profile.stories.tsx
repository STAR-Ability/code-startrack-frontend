import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnalysisView } from "@/components/workspace/analysis-view";
import { ErrorNotice } from "@/components/workspace/feedback";
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
  args: { analysis: null, loading: true, dimensions: false },
};
export const Empty: Story = { args: { analysis: null } };
export const ZeroEvidence: Story = {
  args: { analysis: demoAnalysis(undefined, "ALL", true) },
};
export const Stale: Story = {
  args: { analysis: { ...snapshot, stale: true } },
};
export const Error: Story = {
  args: { analysis: null, unavailable: true, dimensions: false },
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
export const Mobile: Story = { globals: mobile };
