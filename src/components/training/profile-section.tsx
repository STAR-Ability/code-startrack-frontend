"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  CircleAlertIcon,
  RotateCcwIcon,
  CheckCheckIcon,
  GaugeIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  ActivityIcon,
  UserRoundIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingProfile } from "@/lib/api/schemas";
import { ApiReadError } from "@/lib/api/errors";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";

export function ProfileSection({
  query,
  compact = false,
}: {
  query: UseQueryResult<TrainingProfile, Error>;
  compact?: boolean;
}) {
  const { t, locale } = useLocale();
  const profile = query.data;
  const showRetry =
    query.isError || (query.isFetching && query.errorUpdatedAt > 0);
  const updated = profile && (
    <time dateTime={profile.updatedAt}>
      {formatTimestamp(profile.updatedAt, locale)}
    </time>
  );
  return (
    <section
      aria-labelledby="profile-title"
      aria-busy={query.isFetching}
      className="flex min-w-0 flex-col gap-6"
    >
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            {!compact && (
              <span className="profile-avatar flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                <UserRoundIcon className="size-7" aria-hidden="true" />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <CardTitle>
                <h2 id="profile-title">{t("profile.title")}</h2>
              </CardTitle>
              {!compact && (
                <CardDescription>
                  {t("demo.learner")} · {t("profile.identity")}
                </CardDescription>
              )}
            </div>
            {!compact && (
              <Badge variant="outline" wrap>
                Codeforces
              </Badge>
            )}
          </div>
        </CardHeader>
        {(query.isFetching || query.isError || showRetry) && (
          <CardContent className="flex flex-col gap-4">
            {query.isFetching && (
              <div className="flex flex-col gap-4" role="status">
                <p>{t("profile.loading")}</p>
                {!profile && (
                  <div
                    className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-5"
                    aria-hidden="true"
                  >
                    {Array.from({ length: compact ? 1 : 5 }, (_, index) => (
                      <Skeleton key={index} className="h-24" />
                    ))}
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
                wrap
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                {t("profile.retry")}
              </Button>
            )}
          </CardContent>
        )}
        {!compact && (
          <CardFooter className="flex-wrap justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("source.label")} · Codeforces
            </p>
            {profile && (
              <p className="text-xs text-muted-foreground">
                {t("profile.updatedAt")} · {updated}
              </p>
            )}
          </CardFooter>
        )}
      </Card>
      {!compact && profile && (
        <>
          <dl className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-5">
            {(
              [
                ["profile.totalSolved", profile.totalSolved, 0, CheckCheckIcon],
                [
                  "profile.averageDifficulty",
                  profile.averageDifficulty,
                  1,
                  GaugeIcon,
                ],
                [
                  "profile.maxDifficulty",
                  profile.maxDifficulty,
                  0,
                  TrendingUpIcon,
                ],
                [
                  "profile.last7Days",
                  profile.recentActivity.last_7_days,
                  0,
                  ActivityIcon,
                ],
                [
                  "profile.last30Days",
                  profile.recentActivity.last_30_days,
                  0,
                  CalendarDaysIcon,
                ],
              ] as const
            ).map(([label, value, digits, Icon]) => (
              <Card key={label} interaction="lift" className="metric-card">
                <dt>
                  <CardHeader>
                    <Icon
                      className="mb-4 size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {t(label)}
                    </span>
                  </CardHeader>
                </dt>
                <dd>
                  <CardContent>
                    <span className="text-3xl font-semibold tabular-nums tracking-tight wrap-anywhere">
                      {formatNumber(value, locale, digits)}
                    </span>
                  </CardContent>
                </dd>
              </Card>
            ))}
          </dl>
          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle>
                <h3>{t("profile.activityTitle")}</h3>
              </CardTitle>
              <CardDescription>{t("profile.activityNote")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {(
                [
                  ["profile.last7Days", profile.recentActivity.last_7_days],
                  ["profile.last30Days", profile.recentActivity.last_30_days],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-muted/60 p-5"
                >
                  <p className="text-sm text-muted-foreground">{t(label)}</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatNumber(value, locale)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader>
                <CardTitle>
                  <h3>{t("profile.overview")}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("profile.sourceNote")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("profile.difficultyNote")}
                </p>
              </CardContent>
            </Card>
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader>
                <CardTitle>
                  <h3>{t("profile.dataStatus")}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Badge className="self-start" variant="secondary" wrap>
                  {t("profile.loaded")}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {t("accounts.unavailable")}
                </p>
                <Collapsible>
                  <CollapsibleTrigger render={<Button variant="ghost" wrap />}>
                    <span className="min-w-0">
                      {t("profile.accountDetails")}
                    </span>
                    <ChevronDownIcon
                      data-icon="inline-end"
                      aria-hidden="true"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 text-sm leading-relaxed text-muted-foreground">
                    {t("profile.accountNote")}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
