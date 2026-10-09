"use client";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  FingerprintIcon,
  HistoryIcon,
  RouteIcon,
} from "lucide-react";
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
      <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-info/15 bg-surface-panel p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("v02.learningNote")}
        </p>
        <Link
          href="/problems"
          className={buttonVariants({
            wrap: true,
            size: "lg",
            className: "self-start shrink-0",
          })}
        >
          <BookOpenIcon data-icon="inline-start" aria-hidden="true" />
          {t("v02.problemBank")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Link
          href="/training"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          <HistoryIcon data-icon="inline-start" aria-hidden="true" />
          {t("v02.training")}
        </Link>
        <Link
          href="/learning-profile"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          <FingerprintIcon data-icon="inline-start" aria-hidden="true" />
          {t("v02.openLearningProfile")}
        </Link>
        <Link
          href="/learning-recommendations"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          <RouteIcon data-icon="inline-start" aria-hidden="true" />
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
