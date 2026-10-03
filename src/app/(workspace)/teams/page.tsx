import { Suspense } from "react";
import { TeamsPage } from "@/components/workspace/teams-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v12.teams" requireAccount={false} showSync={false}>
      <Suspense>
        <TeamsPage />
      </Suspense>
    </WorkspacePage>
  );
}
