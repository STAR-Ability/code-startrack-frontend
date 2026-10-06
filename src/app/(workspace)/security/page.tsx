import { SecurityPage } from "@/components/auth/security-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage
      title="v.security"
      requireAccount={false}
      showSync={false}
      measure="reading"
    >
      <SecurityPage />
    </WorkspacePage>
  );
}
