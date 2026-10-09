import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import {
  EmptyState,
  LoadingState,
  ErrorNotice,
} from "@/components/workspace/feedback";
import { ApiError } from "@/lib/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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

function ToastQueueDemo() {
  const [actionComplete, setActionComplete] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          wrap
          onClick={() => {
            for (let index = 1; index <= 3; index++) {
              toast.add({
                title: `Notification ${index}`,
                description: "This notification stays open until dismissed.",
                type: "info",
                timeout: 0,
              });
            }
          }}
        >
          Add three notifications
        </Button>
        <Button
          variant="outline"
          wrap
          onClick={() => {
            setActionComplete(false);
            toast.add({
              title: "Long notification",
              description:
                "Review the complete notification before confirming. The original page remains available while this message is open. ".repeat(
                  8,
                ),
              type: "info",
              timeout: 0,
              actionProps: {
                children: "Confirm notification",
                onClick: () => setActionComplete(true),
              },
            });
          }}
        >
          Add a long notification
        </Button>
      </div>
      {actionComplete && (
        <p role="status">Notification action completed locally.</p>
      )}
    </>
  );
}

export const ToastQueue: Story = { render: () => <ToastQueueDemo /> };
