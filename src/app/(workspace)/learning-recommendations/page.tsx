import { Suspense } from "react";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { LoadingState } from "@/components/workspace/feedback";
import { LearningRecommendationPage } from "@/components/workspace/v02/learning-recommendation-page";

export default function Page() {
  return (
    <WorkspacePage title="v02.learningRecommendations" requireAccount={false}>
      <Suspense fallback={<LoadingState />}>
        <LearningRecommendationPage />
      </Suspense>
    </WorkspacePage>
  );
}
