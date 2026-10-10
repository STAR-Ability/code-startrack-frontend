import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { ProblemDetailPage } from "@/components/workspace/v02/problem-detail-page";

export default function Page() {
  return (
    <WorkspacePage
      title="v02.problemDetail"
      requireAccount={false}
      requireStudent={false}
    >
      <Suspense>
        <ProblemDetailPage />
      </Suspense>
    </WorkspacePage>
  );
}
