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
          "Single-choice training policy with persistent selection. Switching a mode only changes local presentation; generating a batch is a separate explicit action in the feature container.",
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
