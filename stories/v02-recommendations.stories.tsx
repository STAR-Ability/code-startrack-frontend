import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { WorkspaceSessionProvider } from "@/components/workspace/account-provider";
import { LearningRecommendationPage } from "@/components/workspace/v02/learning-recommendation-page";
import { LearningRecommendationView } from "@/components/workspace/v02/learning-recommendation-view";
import { v02RecommendationBatch } from "@/lib/demo/v02-fixtures";
import { StoryFrame, mobile } from "./helpers";

const levelBatch = v02RecommendationBatch("ALL", "LEVEL");
levelBatch.recommendations = levelBatch.recommendations
  .filter((item) => item.problem.difficultyScale === "CF_RATING")
  .map((item, index) => ({ ...item, rank: index + 1 }));
levelBatch.candidateCount = levelBatch.recommendations.length;
levelBatch.resultCount = levelBatch.recommendations.length;

const meta = {
  title: "Workspace/V02 Recommendations",
  component: LearningRecommendationView,
  args: { batch: v02RecommendationBatch() },
  parameters: {
    mockScenario: "v02-pure-platform",
    docs: {
      description: {
        component:
          "Production backend-ranked recommendation items. Platform and Codeforces problems may share the same numeric ID while retaining different source identities. Historical rank and reasons stay frozen; adding a training plan does not claim completion.",
      },
    },
  },
  decorators: [
    (Story) => (
      <WorkspaceSessionProvider>
        <StoryFrame>
          <Story />
        </StoryFrame>
      </WorkspaceSessionProvider>
    ),
  ],
} satisfies Meta<typeof LearningRecommendationView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <LearningRecommendationPage />,
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", {
        name: /^(?:推荐批次|Recommendation batch)$/,
      }),
    ).toBeVisible();
  },
};
export const Mobile: Story = { ...Default, globals: mobile };
export const English: Story = { ...Default, globals: { locale: "en" } };
export const EnglishMobile: Story = {
  ...Default,
  globals: { ...mobile, locale: "en" },
};
export const Platform: Story = {
  args: { batch: v02RecommendationBatch("PLATFORM") },
};
export const External: Story = {
  args: { batch: v02RecommendationBatch("EXTERNAL") },
};
export const Level: Story = {
  args: { batch: levelBatch },
};
export const Weakness: Story = {
  args: { batch: v02RecommendationBatch("ALL", "WEAKNESS") },
};
export const Empty: Story = {
  args: {
    batch: {
      ...v02RecommendationBatch(),
      candidateCount: 0,
      resultCount: 0,
      recommendations: [],
    },
  },
};
export const Stale: Story = {
  args: { batch: { ...v02RecommendationBatch(), stale: true } },
};
export const CompletedHistory: Story = {
  args: {
    batch: {
      ...v02RecommendationBatch(),
      recommendations: v02RecommendationBatch().recommendations.map(
        (item, index) => ({ ...item, solvedSinceGeneration: index === 0 }),
      ),
    },
  },
};
export const LongReason: Story = {
  globals: { ...mobile, locale: "en" },
  args: {
    batch: {
      ...v02RecommendationBatch(),
      recommendations: v02RecommendationBatch().recommendations.map((item) => ({
        ...item,
        reason:
          "The backend supplied this complete recommendation reason to explain how independent difficulty scales and shared tags contributed to training selection without changing the frozen ordering.",
      })),
    },
  },
};
