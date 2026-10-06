import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PracticeModePicker } from "@/components/workspace/practice-mode-picker";
import type { RecommendationMode } from "@/lib/api/schemas";
import { StoryFrame, mobile } from "./helpers";

function Example(props: React.ComponentProps<typeof PracticeModePicker>) {
  const [mode, setMode] = useState<RecommendationMode>(props.mode);
  return (
    <PracticeModePicker
      {...props}
      mode={mode}
      onChange={(next) => {
        setMode(next);
        props.onChange(next);
      }}
    />
  );
}
function CompactExample(
  props: React.ComponentProps<typeof PracticeModePicker>,
) {
  return (
    <div className="practice-controls">
      <Example {...props} />
    </div>
  );
}
const meta = {
  title: "Workspace/PracticeMode",
  component: PracticeModePicker,
  args: { mode: "HYBRID", onChange: fn() },
  render: (args) => <Example {...args} />,
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
          "Single-choice training policy with persistent selection. Switching a mode reads existing recommendations; generating a batch is a separate explicit action in the feature container. The compact presentation uses wrapping text labels while its feature container supplies the mode explanation through a secondary practice guide.",
      },
    },
  },
} satisfies Meta<typeof PracticeModePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Weakness: Story = { args: { mode: "WEAKNESS" } };
export const Mobile: Story = { globals: mobile };
export const Compact: Story = {
  args: { compact: true },
  render: (args) => <CompactExample {...args} />,
};
export const CompactMobile: Story = {
  ...Compact,
  globals: mobile,
};
