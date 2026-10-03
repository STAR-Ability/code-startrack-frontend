import { PersonalReportsPage } from "@/components/workspace/personal-reports-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.analysis" requireAccount={false}>
      <PersonalReportsPage />
    </WorkspacePage>
  );
}
