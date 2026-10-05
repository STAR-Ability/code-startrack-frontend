import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceSessionProvider } from "@/components/workspace/account-provider";
import { TeamCard, ApplicationRow } from "@/components/workspace/team-records";
import {
  TeamMembers,
  TeamApplications,
  TeamInvitations,
  TeamSettings,
} from "@/components/workspace/team-management";
import { TeamOverview } from "@/components/workspace/team-detail-page";
import { CoachPage } from "@/components/workspace/coach-page";
import { PrivacyPage } from "@/components/workspace/privacy-page";
import { NotificationsPage } from "@/components/workspace/notifications-page";
import { collaborationFixture } from "@/lib/demo/v012-scenarios";
import { StoryFrame, mobile } from "./helpers";
const owner = collaborationFixture({ coach: true });
const member = collaborationFixture();
const meta = {
  title: "Workspace/Collaboration",
  parameters: {
    mockScenario: "coach-owner-member",
    docs: {
      description: {
        component:
          "Offline interactive production components. Requests are intercepted only in Storybook and handled by the same deterministic DTO builders, validation and business state machine as the development HTTP service. No live backend or external API.",
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
export const Default: Story = {
  render: () => <TeamCard team={owner.teams[0]} />,
};
export const Mobile: Story = {
  globals: mobile,
  render: () => <TeamCard team={owner.teams[0]} />,
};
export const Member: Story = {
  parameters: { mockScenario: "student" },
  render: () => <TeamCard team={member.teams[1]} />,
};
export const OwnerOverview: Story = {
  render: () => <TeamOverview team={owner.teams[0]} />,
};
export const Members: Story = {
  render: () => <TeamMembers team={owner.teams[0]} />,
};
export const PrivacyRestricted: Story = {
  parameters: { mockScenario: "member-private" },
  render: () => <TeamMembers team={owner.teams[0]} />,
};
export const Applications: Story = {
  render: () => <TeamApplications team={owner.teams[0]} />,
};
export const ApplicationProcessed: Story = {
  render: () => <ApplicationRow application={owner.applications[1]} manage />,
};
export const ApplicationEmpty: Story = {
  parameters: { mockScenario: "applications-empty" },
  render: () => <TeamApplications team={owner.teams[0]} />,
};
export const ApplicationMany: Story = {
  parameters: { mockScenario: "applications-many" },
  render: () => <TeamApplications team={owner.teams[0]} />,
};
export const Invitations: Story = {
  render: () => <TeamInvitations team={owner.teams[0]} />,
};
export const InvitationDeliveryFailed: Story = {
  parameters: { mockScenario: "owner-delivery-failed" },
  render: () => <TeamInvitations team={owner.teams[0]} />,
};
export const Settings: Story = {
  render: () => <TeamSettings team={owner.teams[0]} />,
};
export const CoachDashboard: Story = { render: () => <CoachPage /> };
export const CoachDashboardMobile: Story = {
  globals: { ...mobile, locale: "en" },
  render: () => <CoachPage />,
};
export const LongTeamName: Story = {
  globals: { ...mobile, locale: "en" },
  render: () => (
    <TeamCard
      team={{
        ...owner.teams[0],
        name: "A collaborative programming team with a deliberately long name",
        owner: {
          ...owner.teams[0].owner,
          displayName: "A coach with a deliberately long display name",
        },
      }}
    />
  ),
};
export const CoachNoTeams: Story = {
  parameters: { mockScenario: "coach-no-teams" },
  render: () => <CoachPage />,
};
export const PrivacySettings: Story = { render: () => <PrivacyPage /> };
export const Notifications: Story = { render: () => <NotificationsPage /> };
export const NotificationsEmpty: Story = {
  parameters: { mockScenario: "notifications-empty" },
  render: () => <NotificationsPage />,
};
export const Loading: Story = {
  parameters: { mockScenario: "slow-coach" },
  render: () => <TeamMembers team={owner.teams[0]} />,
};
export const Error: Story = {
  parameters: { mockScenario: "members-server-error" },
  render: () => <TeamMembers team={owner.teams[0]} />,
};
export const Archived: Story = {
  parameters: { mockScenario: "team-archived" },
  render: () => (
    <TeamSettings
      team={
        collaborationFixture({ coach: true, teamState: "ARCHIVED" }).teams[0]
      }
    />
  ),
};
export const Stale: Story = {
  parameters: { mockScenario: "stale-coach" },
  render: () => <TeamOverview team={owner.teams[0]} />,
};
