import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  EmptyState,
  LoadingState,
  ErrorNotice,
} from "@/components/workspace/feedback";
import { ApiError } from "@/lib/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/Feedback",
  component: EmptyState,
  args: {
    title: "No training history",
    description: "Connect an account and sync its training records.",
  },
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
          "Missing data, pending requests and connection failures must stay distinguishable. ErrorNotice preserves recovery and request details and uses the real toast provider. All errors here are synthetic; Retry only logs an action.",
      },
    },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const WithAction: Story = {
  args: { href: "/accounts", action: "Connect an account" },
};
export const Embedded: Story = {
  args: { embedded: true, href: "/accounts", action: "Connect an account" },
  render: (args) => (
    <Card variant="supporting" interaction="none">
      <CardHeader>
        <CardTitle>
          <h2>Account sources</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState {...args} />
      </CardContent>
    </Card>
  ),
};
export const EmbeddedMobile: Story = { ...Embedded, globals: mobile };
export const Loading: Story = { render: () => <LoadingState /> };
export const CompactLoading: Story = { render: () => <LoadingState compact /> };
export const Error: Story = {
  render: () => (
    <ErrorNotice
      error={new ApiError("NETWORK_ERROR", 0, "storybook-synthetic-request")}
      retry={fn()}
      dataError
    />
  ),
};
export const Forbidden: Story = {
  render: () => (
    <ErrorNotice error={new ApiError("FORBIDDEN", 403)} retry={fn()} />
  ),
};
export const Mobile: Story = { globals: mobile };
