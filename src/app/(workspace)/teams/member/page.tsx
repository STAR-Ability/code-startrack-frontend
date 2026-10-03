import { Suspense } from "react";
import { TeamMemberPage } from "@/components/workspace/team-member-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage
      title="v12.memberData"
      requireAccount={false}
      showSync={false}
    >
      <Suspense>
        <TeamMemberPage />
      </Suspense>
    </WorkspacePage>
  );
}
