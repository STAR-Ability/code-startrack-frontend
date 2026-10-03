import { Suspense } from "react";
import { TeamsPage } from "@/components/workspace/teams-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { CoachGate } from "@/components/workspace/v012-shared";
export default function Page() {
  return (
    <WorkspacePage title="v12.manage" requireAccount={false} showSync={false}>
      <Suspense>
        <CoachGate>
          <TeamsPage managed />
        </CoachGate>
      </Suspense>
    </WorkspacePage>
  );
}
