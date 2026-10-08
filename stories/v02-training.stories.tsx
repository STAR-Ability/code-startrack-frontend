import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceSessionProvider } from "@/components/workspace/account-provider";
import { TrainingPage } from "@/components/workspace/v02/training-page";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/V02 Training",
  parameters: {
    mockScenario: "v02-pure-platform",
    docs: {
      description: {
        component:
          "Production training list and source/status/date filters using public offline fixtures through the production data-access layer. Judge and synchronization transitions are exercised separately against the isolated HTTP backend.",
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
  render: () => <TrainingPage />,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: mobile };
export const English: Story = { globals: { locale: "en" } };
export const EnglishMobile: Story = { globals: { ...mobile, locale: "en" } };
export const Empty: Story = { parameters: { mockScenario: "v02-new-learner" } };
export const ServiceError: Story = {
  parameters: { mockScenario: "server-error" },
};
