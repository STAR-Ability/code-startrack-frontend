"use client";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  FingerprintIcon,
  HistoryIcon,
  RouteIcon,
  SparklesIcon,
} from "lucide-react";
import { v02 } from "@/lib/api/v02";
import { useV02LatestProfile, useV02Query } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      className="flex min-w-0 flex-col gap-5"
      aria-label={t("v02.learningOverview")}
    >
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
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card
          variant="recommendation"
          interaction="none"
          className="learning-practice-lead"
        >
          <CardHeader className="gap-4">
            <span className="flex size-11 items-center justify-center rounded-xl border border-info/15 bg-info-soft text-info">
              <BookOpenIcon className="size-5" aria-hidden="true" />
            </span>
            <CardDescription className="flex items-center gap-2 text-xs font-medium text-info">
              <SparklesIcon className="size-3.5" aria-hidden="true" />
              {t("dashboard.nextStep")}
            </CardDescription>
            <CardTitle>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("v02.problemBank")}
              </h2>
            </CardTitle>
            <CardDescription className="max-w-md text-sm leading-relaxed">
              {t("v02.learningNote")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-start">
            <Link
              href="/problems"
              className={buttonVariants({ wrap: true, size: "lg" })}
            >
              {t("v02.problemBank")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-x-4 gap-y-2">
            {(
              [
                ["/training", "v02.training", HistoryIcon],
                [
                  "/learning-profile",
                  "v02.openLearningProfile",
                  FingerprintIcon,
                ],
                [
                  "/learning-recommendations",
                  "v02.openRecommendations",
                  RouteIcon,
                ],
              ] as const
            ).map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                  wrap: true,
                  className: "justify-start px-0 text-muted-foreground",
                })}
              >
                <Icon data-icon="inline-start" aria-hidden="true" />
                {t(label)}
              </Link>
            ))}
          </CardFooter>
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
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
        </div>
      </div>
    </section>
  );
}
