import { DataPage } from "@/components/workspace/data-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.data" requireAccount={true} showSync={true}>
      <DataPage />
    </WorkspacePage>
  );
}
