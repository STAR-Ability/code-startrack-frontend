import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { SubmissionList } from "@/components/workspace/v02/submission-list";

export default function Page() {
  return (
    <WorkspacePage title="v02.submissions" requireAccount={false}>
      <Suspense>
        <SubmissionList />
      </Suspense>
    </WorkspacePage>
  );
}
