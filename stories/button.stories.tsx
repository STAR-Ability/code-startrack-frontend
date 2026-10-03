import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Start practice", onClick: fn() },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The production Base UI/Nova button. Primary actions stay neutral; use destructive only for irreversible actions. Change language and theme in the toolbar.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: { control: "select", options: ["xs", "sm", "default", "lg", "xl"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
