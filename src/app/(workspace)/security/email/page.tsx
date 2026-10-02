import { SecurityChangePage } from "@/components/auth/security-change-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.changeEmail" requireAccount={false}>
      <SecurityChangePage kind="email" />
    </WorkspacePage>
  );
}
