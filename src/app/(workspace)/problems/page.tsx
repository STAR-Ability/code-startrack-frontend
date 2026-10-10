import { WorkspacePage } from "@/components/workspace/workspace-page";
import { ProblemBankPage } from "@/components/workspace/v02/problem-bank-page";

export default function Page() {
  return (
    <WorkspacePage
      title="v02.problems"
      requireAccount={false}
      requireStudent={false}
    >
      <ProblemBankPage />
    </WorkspacePage>
  );
}
