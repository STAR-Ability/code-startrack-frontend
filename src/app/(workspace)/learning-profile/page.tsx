import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { LoadingState } from "@/components/workspace/feedback";
import { LearningProfilePage } from "@/components/workspace/v02/learning-profile-page";

export default function Page() {
  return (
    <WorkspacePage title="v02.learningProfile" requireAccount={false}>
      <Suspense fallback={<LoadingState />}>
        <LearningProfilePage />
      </Suspense>
    </WorkspacePage>
  );
}
