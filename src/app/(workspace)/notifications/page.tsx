import { NotificationsPage } from "@/components/workspace/notifications-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage
      title="v12.notifications"
      requireAccount={false}
      showSync={false}
    >
      <NotificationsPage />
    </WorkspacePage>
  );
}
