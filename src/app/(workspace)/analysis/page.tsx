import { AnalysisPage } from "@/components/workspace/analysis-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.analysis" requireAccount={true} showSync={true}>
      <AnalysisPage />
    </WorkspacePage>
  );
}
