import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Chart } from "@/components/workspace/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  EmptyState,
  LoadingState,
  ErrorNotice,
} from "@/components/workspace/feedback";
import {
  trendOption,
  distributionOption,
  radarOption,
} from "@/lib/charts/options";
import { ApiError } from "@/lib/api/errors";
import { expect, fn, userEvent, within } from "storybook/test";
import { StoryFrame, mobile } from "./helpers";

const activity = trendOption(
  ["09-25", "09-26", "09-27", "09-28", "09-29", "09-30"],
  [
    { name: "Submissions", values: [3, 6, 4, 8, 5, 9] },
    { name: "Solved", values: [1, 3, 2, 5, 4, 6] },
    { name: "Pending", values: [0, 1, 0, 0, 1, 0] },
  ],
);
const ability = radarOption(
  [
    { name: "Implementation", score: 62 },
    { name: "Algorithms", score: 47 },
    { name: "Data structures", score: 55 },
    { name: "Dynamic programming", score: 35 },
    { name: "Graphs", score: 41 },
    { name: "Math", score: 49 },
  ],
  "Current ability · synthetic",
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
    (Story, context) => (
      <StoryFrame>
        <Card interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{context.parameters.chartTitle ?? "Training activity"}</h2>
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
          "ECharts SVG rendering reads semantic CSS tokens with restrained gradients. Activity uses blue/green/amber with circle/diamond/square marks and a dashed pending line; team activity uses blue/green/teal; distributions use neutral/green. Native legend buttons support keyboard toggles and preserve selection through theme/data/locale updates. Dense horizontal distributions grow by category count and display solved values. Responsive radars show supplied scores beside axis names with the 0–100 scale. Reduced motion disables animation. Loading/empty/error stay owner-level compositions; production analysis exposes full text values. All story data is synthetic.",
      },
    },
  },
} satisfies Meta<typeof Chart>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const KeyboardLegend: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const solved = await canvas.findByRole("button", {
      name: "Solved",
      pressed: true,
    });
    solved.focus();
    await userEvent.keyboard("{Enter}");
    await expect(solved).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(solved).toHaveAttribute("aria-pressed", "true");
  },
};
export const Distribution: Story = {
  parameters: { chartTitle: "Practice coverage" },
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
export const Ability: Story = {
  parameters: { chartTitle: "Ability structure" },
  args: {
    palette: "ability",
    size: "ability",
    label: "Synthetic ability across six dimensions, scored from 0 to 100",
    option: ability,
  },
};
export const MobileAbility: Story = {
  ...Ability,
  globals: mobile,
};
export const DarkAbility: Story = {
  ...Ability,
  globals: { theme: "dark" },
};
export const TeamActivity: Story = {
  parameters: { chartTitle: "Team training rhythm" },
  args: {
    palette: "teamActivity",
    label:
      "Synthetic team activity: submissions, accepted submissions and active members",
    option: trendOption(
      ["09-25", "09-26", "09-27", "09-28", "09-29", "09-30"],
      [
        { name: "Submissions", values: [12, 18, 8, 22, 15, 26] },
        { name: "Accepted", values: [5, 11, 4, 14, 10, 19] },
        { name: "Active members", values: [3, 5, 2, 6, 4, 7] },
      ],
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
export const DenseDistribution: Story = {
  parameters: { chartTitle: "Topic coverage · ten supplied categories" },
  args: {
    palette: "distribution",
    label: "Synthetic attempted and solved counts across ten categories",
    option: distributionOption(
      [
        "implementation",
        "dynamic programming",
        "data structures",
        "graphs",
        "number theory",
        "binary search",
        "combinatorics",
        "geometry",
        "strings",
        "greedy",
      ],
      [180, 75, 120, 45, 52, 80, 38, 32, 60, 110],
      [156, 35, 98, 26, 22, 63, 17, 9, 43, 82],
      ["Attempted", "Solved"],
      true,
    ),
  },
};
export const MobileDenseDistribution: Story = {
  ...DenseDistribution,
  globals: mobile,
};
export const ZeroActivity: Story = {
  parameters: { chartTitle: "A valid zero-activity snapshot" },
  args: {
    option: trendOption(
      ["10-01", "10-02", "10-03"],
      [
        { name: "Submissions", values: [0, 0, 0] },
        { name: "Solved", values: [0, 0, 0] },
      ],
    ),
    label:
      "Synthetic valid snapshot: zero submissions and solved problems on all three dates",
  },
};
