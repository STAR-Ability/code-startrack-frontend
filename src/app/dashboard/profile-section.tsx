"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingProfile } from "@/lib/api/schemas";
import { ApiReadError } from "@/lib/api/errors";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";

export function ProfileSection({
  query,
}: {
  query: UseQueryResult<TrainingProfile, Error>;
}) {
  const { t, locale } = useLocale();
  const profile = query.data;
  const showRetry =
    query.isError || (query.isFetching && query.errorUpdatedAt > 0);

  return (
    <section aria-labelledby="profile-title" aria-busy={query.isFetching}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="profile-title">{t("profile.title")}</h2>
          </CardTitle>
          <CardDescription>{t("profile.difficultyNote")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {query.isFetching && (
            <div className="flex flex-col gap-3" role="status">
              <p>{t("profile.loading")}</p>
              {!profile && (
                <div
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                  aria-hidden="true"
                >
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              )}
            </div>
          )}
          {query.isError && (
            <Alert>
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>
                <p>
                  {t(
                    query.error instanceof ApiReadError &&
                      query.error.detail.category === "timeout"
                      ? "profile.timeout"
                      : "profile.error",
                  )}
                </p>
                {profile && <p>{t("data.previous")}</p>}
              </AlertDescription>
            </Alert>
          )}
          {showRetry && (
            <Button
              className="self-start"
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
              {t("profile.retry")}
            </Button>
          )}
          {profile && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
              {(
                [
                  ["profile.totalSolved", profile.totalSolved, 0],
                  ["profile.averageDifficulty", profile.averageDifficulty, 1],
                  ["profile.maxDifficulty", profile.maxDifficulty, 0],
                  ["profile.last7Days", profile.recentActivity.last_7_days, 0],
                  [
                    "profile.last30Days",
                    profile.recentActivity.last_30_days,
                    0,
                  ],
                ] as const
              ).map(([label, value, digits]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatNumber(value, locale, digits)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
        {profile && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              {t("profile.updatedAt")} ·{" "}
              <time dateTime={profile.updatedAt}>
                {formatTimestamp(profile.updatedAt, locale)}
              </time>
            </p>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
