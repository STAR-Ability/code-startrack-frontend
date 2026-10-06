import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SubmissionRecords } from "@/components/workspace/submission-records";
import { demoSubmissions } from "@/lib/demo/fixtures";
import { mobile } from "./helpers";

const records = demoSubmissions();
const meta = {
  title: "Workspace/Submission records",
  component: SubmissionRecords,
  args: { items: records },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Account submission presentation used by the data workspace and problem Sheet. Synthetic records retain their supplied order, exact IDs, verdicts, UTC timestamps, time in milliseconds and memory in MiB. A native comparison table appears only when its container has enough width; narrow containers show readable list rows and keyboard-accessible details. External problem actions remain available in both layouts.",
      },
    },
  },
} satisfies Meta<typeof SubmissionRecords>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {};
export const Mobile: Story = { globals: mobile };
export const NarrowSheet: Story = {
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};
export const MissingAndZero: Story = {
  args: {
    items: [
      {
        ...records[0],
        programmingLanguage: null,
        timeMs: null,
        memoryBytes: null,
        problem: { ...records[0].problem, title: null, url: null },
      },
      { ...records[1], timeMs: 0, memoryBytes: 0 },
    ],
  },
};
export const LongContent: Story = {
  args: {
    items: [
      {
        ...records[0],
        problem: {
          ...records[0].problem,
          title:
            "A long problem title that stays readable while submission measurements align for comparison",
        },
        programmingLanguage:
          "An extended programming language name and version",
        teamName: "ExtendedTrainingTeamNameWithoutSpaces".repeat(2),
        memberHandles: ["TrainingPartnerWithAnExtendedHandle", "DemoBeta"],
      },
      ...records.slice(1),
    ],
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
