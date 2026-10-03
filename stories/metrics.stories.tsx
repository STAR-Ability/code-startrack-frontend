import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricPanel } from "@/components/workspace/metric-panel";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/Metrics",
  component: MetricPanel,
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
  args: {
    title: "profile.overview",
    description: "Synthetic account snapshot · 30 days",
    metrics: [
      ["v.solved", 128],
      ["v.submissions", 246],
      ["v.rating", 1520],
      ["v.activeDays", 18],
    ],
    secondary: [
      ["v.accepted", 168],
      ["v.failed", 73],
      ["v.pendingCount", 5],
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "Semantic emphasis is tied to metric meaning. Zero is valid evidence; null means unavailable. Loading preserves the panel's structure. Use the locale toolbar to check number formatting.",
      },
    },
  },
} satisfies Meta<typeof MetricPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = {
  args: {
    metrics: [
      ["v.solved", 0],
      ["v.submissions", 0],
      ["v.rating", null],
      ["v.activeDays", 0],
    ],
    secondary: [],
  },
};
export const Unavailable: Story = {
  args: {
    metrics: [
      ["v.rating", null],
      ["v.maxRating", null],
    ],
    secondary: [],
  },
};
export const Mobile: Story = { globals: mobile };
