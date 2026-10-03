import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRightIcon } from "lucide-react";
import { mobile } from "./helpers";

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
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(
        [
          "default",
          "outline",
          "secondary",
          "ghost",
          "destructive",
          "link",
        ] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Hover with a pointer or use Tab for the native focus ring. Playwright checks actual pointer styles and reduced-motion behavior.",
      },
    },
  },
};
export const Loading: Story = {
  args: {
    disabled: true,
    "aria-busy": true,
    children: (
      <>
        <Spinner aria-hidden="true" /> Preparing…
      </>
    ),
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = {
  args: {
    children: (
      <>
        Start practice{" "}
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </>
    ),
  },
};
export const Mobile: Story = {
  globals: mobile,
  args: {
    wrap: true,
    children: "Continue to your next recommended programming problem",
  },
};
