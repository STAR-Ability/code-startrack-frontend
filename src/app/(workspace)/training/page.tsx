import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { LoadingState } from "@/components/workspace/feedback";
import { TrainingPage } from "@/components/workspace/v02/training-page";

export default function Page() {
  return (
    <WorkspacePage title="v02.training" requireAccount={false}>
      <Suspense fallback={<LoadingState />}>
        <TrainingPage />
      </Suspense>
    </WorkspacePage>
  );
}
