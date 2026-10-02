import { AccountsPage } from "@/components/workspace/accounts-page";
import { WorkspacePage } from "@/components/workspace/workspace-page";
export default function Page() {
  return (
    <WorkspacePage title="v.accounts" requireAccount={false} showSync>
      <AccountsPage />
    </WorkspacePage>
  );
}
