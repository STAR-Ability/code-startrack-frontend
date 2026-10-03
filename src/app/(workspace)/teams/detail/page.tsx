import { Suspense } from "react";
import { TeamDetailPage } from "@/components/workspace/team-detail-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage
      title="v12.teamDetail"
      requireAccount={false}
      showSync={false}
    >
      <Suspense>
        <TeamDetailPage />
      </Suspense>
    </WorkspacePage>
  );
}
