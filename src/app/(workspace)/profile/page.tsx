import { AnalysisPage } from "@/components/workspace/analysis-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.profile" requireAccount={true} showSync={true}>
      <AnalysisPage profileOnly />
    </WorkspacePage>
  );
}
