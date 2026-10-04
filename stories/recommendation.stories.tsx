import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  RecommendationCard,
  BatchView,
} from "@/components/workspace/recommendation-card";
import { LoadingState, ErrorNotice } from "@/components/workspace/feedback";
import { demoBatch } from "@/lib/demo/fixtures";
import { ApiError } from "@/lib/api/errors";
import { fn } from "storybook/test";
import { StoryFrame, mobile } from "./helpers";

const batch = demoBatch();
const item = batch.recommendations[0];
const meta = {
  title: "Workspace/Recommendation",
  component: RecommendationCard,
  args: { item, targetRating: batch.targetRating },
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
          "The same recommendation card used by the workspace and public showcase. Rank and original problem metadata remain intact after completion. Outbound links are validated by the production helper. Loading/error/empty stories compose the batch boundary; they never generate a recommendation.",
      },
    },
  },
} satisfies Meta<typeof RecommendationCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Hover: Story = {};
export const Featured: Story = {};
export const Secondary: Story = { args: { item: batch.recommendations[1] } };
export const MatchedDimension: Story = { args: { item } };
export const NoMatchedDimension: Story = {
  args: { item: { ...item, matchedDimension: null } },
};
export const Unrated: Story = {
  args: { item: { ...item, problem: { ...item.problem, difficulty: null } } },
};
export const MissingMetadata: Story = {
  args: {
    item: {
      ...item,
      matchedDimension: null,
      problem: {
        ...item.problem,
        title: null,
        difficulty: null,
        solvedCount: null,
        tags: [],
        url: null,
      },
    },
  },
};
export const CompletedSecondary: Story = {
  args: { item: { ...batch.recommendations[1], solvedSinceGeneration: true } },
};
export const OrderedBatch: Story = {
  render: () => <BatchView batch={batch} />,
};
export const Completed: Story = {
  args: { item: { ...item, solvedSinceGeneration: true } },
};
export const Disabled: Story = {
  args: { item: { ...item, problem: { ...item.problem, url: null } } },
};
export const LongContent: Story = {
  args: {
    item: {
      ...item,
      problem: {
        ...item.problem,
        title:
          "A deliberately long programming problem title that should wrap naturally on narrow screens",
        tags: [
          "dynamic programming",
          "data structures",
          "implementation",
          "divide and conquer",
        ],
      },
    },
  },
};
export const Loading: Story = { render: () => <LoadingState /> };
export const Empty: Story = { render: () => <BatchView batch={null} /> };
export const NoCandidates: Story = {
  render: () => (
    <BatchView
      batch={{
        ...batch,
        resultCount: 0,
        candidateCount: 0,
        recommendations: [],
      }}
    />
  ),
};
export const Stale: Story = {
  render: () => <BatchView batch={{ ...batch, stale: true }} firstOnly />,
};
export const Error: Story = {
  render: () => (
    <ErrorNotice error={new ApiError("NETWORK_ERROR")} retry={fn()} dataError />
  ),
};
export const Mobile: Story = { globals: mobile };
