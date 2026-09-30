"use client";

import { useQuery } from "@tanstack/react-query";
import { readProfile, readRecommendation } from "@/lib/api/client";
import { ProfileSection } from "./profile-section";
import { RecommendationSection } from "./recommendation-section";

export function TrainingResults({ userId }: { userId: number }) {
  const profile = useQuery({
    queryKey: ["training", userId, "profile"],
    queryFn: ({ signal }) => readProfile(signal),
  });
  const recommendation = useQuery({
    queryKey: ["training", userId, "recommendation", { limit: 1 }],
    queryFn: ({ signal }) => readRecommendation(signal),
    // Retained successful data keeps this enabled even if a later E1 read fails.
    // There is no invalidation/refetch coupling between these two operations.
    enabled: profile.data !== undefined,
  });
  return (
    <>
      <ProfileSection query={profile} />
      <RecommendationSection query={recommendation} />
    </>
  );
}
