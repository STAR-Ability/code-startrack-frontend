import { CoachPage } from "@/components/workspace/coach-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { CoachGate } from "@/components/workspace/v012-shared";
export default function Page() {
  return (
    <WorkspacePage title="v12.coach" requireAccount={false} showSync={false}>
      <CoachGate>
        <CoachPage />
      </CoachGate>
    </WorkspacePage>
  );
}
