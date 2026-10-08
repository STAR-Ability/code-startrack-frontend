import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { LoadingState } from "@/components/workspace/feedback";
import { TrainingDetail } from "@/components/workspace/v02/training-detail";

export default function Page() {
  return (
    <WorkspacePage title="v02.trainingDetail" requireAccount={false}>
      <Suspense fallback={<LoadingState />}>
        <TrainingDetail />
      </Suspense>
    </WorkspacePage>
  );
}
