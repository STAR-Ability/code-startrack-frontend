import { PrivacyPage } from "@/components/workspace/privacy-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v12.privacy" requireAccount={false} showSync={false}>
      <PrivacyPage />
    </WorkspacePage>
  );
}
