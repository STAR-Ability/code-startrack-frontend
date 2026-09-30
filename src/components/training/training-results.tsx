"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, LayersIcon } from "lucide-react";
import { readProfile, readRecommendation } from "@/lib/api/client";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { ProfileSection } from "./profile-section";
import { RecommendationSection } from "./recommendation-section";

export function TrainingResults({
  userId,
  view,
}: {
  userId: number;
  view: "profile" | "practice";
}) {
  const { t } = useLocale();
  const profile = useQuery({
    queryKey: ["training", userId, "profile"],
    queryFn: ({ signal }) => readProfile(signal),
  });
  const recommendation = useQuery({
    queryKey: ["training", userId, "recommendation", { limit: 1 }],
    queryFn: ({ signal }) => readRecommendation(signal),
    // The practice route alone enables E2. Successful E1 data survives later failures.
    enabled: view === "practice" && profile.data !== undefined,
  });
  if (view === "profile") return <ProfileSection query={profile} />;
  return (
    <>
      {(profile.isPending || profile.isError || profile.isFetching) && (
        <ProfileSection query={profile} compact />
      )}
      <RecommendationSection query={recommendation} />
      {profile.data && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{t("practice.profileReady")}</p>
          <Link
            href="/profile"
            prefetch={false}
            className={buttonVariants({ variant: "link", wrap: true })}
          >
            <span className="min-w-0">{t("practice.viewContext")}</span>
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      )}
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t("practice.queue")}</EmptyTitle>
          <EmptyDescription>{t("practice.queueNote")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
