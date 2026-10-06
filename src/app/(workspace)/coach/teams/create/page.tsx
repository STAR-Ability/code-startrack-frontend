import { TeamForm } from "@/components/workspace/team-forms";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { CoachGate } from "@/components/workspace/v012-shared";
export default function Page() {
  return (
    <WorkspacePage
      title="v12.createTeam"
      requireAccount={false}
      showSync={false}
      measure="form"
    >
      <CoachGate>
        <TeamForm />
      </CoachGate>
    </WorkspacePage>
  );
}
