import { CoachRedemption } from "@/components/workspace/coach-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v12.redeem" requireAccount={false} showSync={false}>
      <CoachRedemption />
    </WorkspacePage>
  );
}
