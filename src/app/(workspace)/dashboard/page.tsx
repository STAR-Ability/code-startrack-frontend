import { UserDashboardPage } from "@/components/workspace/user-dashboard-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.dashboard" requireAccount={false}>
      <UserDashboardPage />
    </WorkspacePage>
  );
}
