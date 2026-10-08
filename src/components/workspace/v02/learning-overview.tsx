"use client";
import Link from "next/link";
import { v02 } from "@/lib/api/v02";
import { useV02LatestProfile, useV02Query } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, QueryFeedback } from "../feedback";
import { LearningProfileView } from "./learning-profile-view";
import { LearningRecommendationView } from "./learning-recommendation-view";

export function LearningOverview() {
  const { t } = useLocale();
  const profile = useV02LatestProfile("ALL");
  const recommendations = useV02Query(
    "recommendations",
    { source: "ALL", mode: "HYBRID" },
    (signal) => v02.recommendations("ALL", "HYBRID", signal),
  );
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-label={t("v02.learningOverview")}
    >
      <p className="text-muted-foreground">{t("v02.learningNote")}</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/problems" className={buttonVariants({ wrap: true })}>
          {t("v02.problemBank")}
        </Link>
        <Link
          href="/training"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          {t("v02.training")}
        </Link>
        <Link
          href="/learning-profile"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          {t("v02.openLearningProfile")}
        </Link>
        <Link
          href="/learning-recommendations"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          {t("v02.openRecommendations")}
        </Link>
      </div>
      <QueryFeedback query={profile} />
      {profile.data ? (
        <LearningProfileView profile={profile.data} compact />
      ) : (
        profile.data === null && (
          <EmptyState
            title={t("v02.profileNull")}
            description={t("v02.profileNullNote")}
            href="/learning-profile"
            action={t("v02.openLearningProfile")}
          />
        )
      )}
      <QueryFeedback query={recommendations} />
      {recommendations.data ? (
        <LearningRecommendationView batch={recommendations.data} compact />
      ) : (
        recommendations.data === null && (
          <EmptyState
            title={t("v02.recommendationNull")}
            description={t("v02.recommendationNullNote")}
            href="/learning-recommendations"
            action={t("v02.openRecommendations")}
          />
        )
      )}
    </section>
  );
}
