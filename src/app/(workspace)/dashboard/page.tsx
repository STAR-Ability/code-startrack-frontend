import { DashboardPage } from "@/components/workspace/dashboard-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.dashboard" requireAccount={true} showSync={true}>
      <DashboardPage />
    </WorkspacePage>
  );
}
