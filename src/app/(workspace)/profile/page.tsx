import { UserProfilePage } from "@/components/workspace/user-analysis-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.profile" requireAccount={false}>
      <UserProfilePage />
    </WorkspacePage>
  );
}
