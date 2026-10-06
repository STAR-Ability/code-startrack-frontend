import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceSessionProvider } from "@/components/workspace/account-provider";
import { PrivacyPage } from "@/components/workspace/privacy-page";
import {
  NotificationRow,
  NotificationsPage,
} from "@/components/workspace/notifications-page";
import { v012Notifications } from "@/lib/demo/v012-fixtures";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/Settings",
  parameters: {
    mockScenario: "coach-owner-member",
    docs: {
      description: {
        component:
          "Production privacy and notification components using the configured offline transport. The four sharing domains remain independent; notification destinations and read state come from supplied structured references. No live backend is contacted.",
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
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Privacy: Story = { render: () => <PrivacyPage /> };
export const PrivacyMobile: Story = {
  ...Privacy,
  globals: { ...mobile, locale: "en" },
};
export const PrivacyWithoutBinding: Story = {
  ...Privacy,
  parameters: { mockScenario: "no-accounts" },
};
export const MixedPrivacy: Story = {
  ...Privacy,
  parameters: { mockScenario: "mixed-privacy" },
};
export const Notifications: Story = {
  render: () => <NotificationsPage />,
};
export const NotificationsMobile: Story = {
  ...Notifications,
  globals: { ...mobile, locale: "en" },
};
export const EmptyNotifications: Story = {
  ...Notifications,
  parameters: { mockScenario: "notifications-empty" },
};
export const LongNotification: Story = {
  globals: { ...mobile, locale: "en" },
  render: () => (
    <div className="notification-list">
      <NotificationRow
        notification={{
          ...v012Notifications[0],
          title:
            "A synthetic notification with a long title about your training team application and membership update",
          body: "This offline specimen keeps the entire notification readable while the timestamp, destination link and read action wrap at narrow widths. Its destination still uses the supplied reference fields.",
        }}
      />
    </div>
  ),
};
