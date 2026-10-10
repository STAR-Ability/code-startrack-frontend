import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { SubmissionDetail } from "@/components/workspace/v02/submission-detail";

export default function Page() {
  return (
    <WorkspacePage title="v02.submissionDetail" requireAccount={false}>
      <Suspense>
        <SubmissionDetail />
      </Suspense>
    </WorkspacePage>
  );
}
