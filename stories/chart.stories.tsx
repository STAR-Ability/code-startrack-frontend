import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Chart } from "@/components/workspace/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  EmptyState,
  LoadingState,
  ErrorNotice,
} from "@/components/workspace/feedback";
import { trendOption, distributionOption } from "@/lib/charts/options";
import { ApiError } from "@/lib/api/errors";
import { fn } from "storybook/test";
import { StoryFrame, mobile } from "./helpers";

const activity = trendOption(
  ["09-25", "09-26", "09-27", "09-28", "09-29", "09-30"],
  [
    { name: "Submissions", values: [3, 6, 4, 8, 5, 9] },
    { name: "Solved", values: [1, 3, 2, 5, 4, 6] },
    { name: "Pending", values: [0, 1, 0, 0, 1, 0] },
  ],
);
const meta = {
  title: "Workspace/Chart",
  component: Chart,
  args: {
    label:
      "Synthetic training activity: submissions, solved problems and pending results",
    palette: "activity",
    option: activity,
  },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Card interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>Training activity</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Story />
          </CardContent>
        </Card>
      </StoryFrame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "ECharts SVG rendering reads semantic CSS tokens. Activity uses blue/green/amber; distributions use gray/green. Theme changes and resizing rebuild or resize the existing chart. Reduced motion disables chart animation. Loading/empty/error are owner-level compositions; production analysis also exposes text values.",
      },
    },
  },
} satisfies Meta<typeof Chart>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Distribution: Story = {
  args: {
    palette: "distribution",
    label: "Synthetic attempted and solved distribution",
    option: distributionOption(
      ["implementation", "math", "graphs"],
      [12, 8, 6],
      [10, 5, 2],
      ["Attempted", "Solved"],
      true,
    ),
  },
};
export const Loading: Story = { render: () => <LoadingState /> };
export const Empty: Story = {
  render: () => (
    <EmptyState
      title="No training activity"
      description="No submissions are available in this window."
    />
  ),
};
export const Error: Story = {
  render: () => (
    <ErrorNotice error={new ApiError("NETWORK_ERROR")} retry={fn()} dataError />
  ),
};
export const Mobile: Story = { globals: mobile };
export const Dark: Story = { globals: { theme: "dark" } };
