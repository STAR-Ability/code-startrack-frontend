import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LearningProfileView } from "@/components/workspace/v02/learning-profile-view";
import { v02LearningProfile } from "@/lib/demo/v02-fixtures";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/V02 Learning Profile",
  component: LearningProfileView,
  args: { profile: v02LearningProfile() },
  parameters: {
    docs: {
      description: {
        component:
          "Production combined learning evidence: six training dimensions, source counts, independent code quality, and difficulty buckets retaining their CF_RATING / PLATFORM_RATING / UNRATED scale. Frozen snapshots and all four windows use the same presentation.",
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
} satisfies Meta<typeof LearningProfileView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: mobile };
export const English: Story = { globals: { locale: "en" } };
export const EnglishMobile: Story = { globals: { ...mobile, locale: "en" } };
export const SevenDays: Story = { args: { profile: v02LearningProfile("7D") } };
export const ThirtyDays: Story = {
  args: { profile: v02LearningProfile("30D") },
};
export const Year: Story = { args: { profile: v02LearningProfile("365D") } };
export const ZeroEvidence: Story = {
  args: { profile: v02LearningProfile("ALL", true) },
};
export const Stale: Story = {
  args: { profile: { ...v02LearningProfile(), stale: true } },
};
export const NoCodeAnalysis: Story = {
  args: {
    profile: {
      ...v02LearningProfile(),
      sources: { ...v02LearningProfile().sources, codeAnalysisCount: 0 },
      codeQuality: {
        analyzedSubmissionCount: 0,
        warningCount: 0,
        errorCount: 0,
        maxCyclomaticComplexity: null,
      },
    },
  },
};
export const Compact: Story = { args: { compact: true } };
