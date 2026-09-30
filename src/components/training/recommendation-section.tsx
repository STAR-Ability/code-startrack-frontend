"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  InfoIcon,
  SearchIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiReadError } from "@/lib/api/errors";
import type { TrainingRecommendations } from "@/lib/api/schemas";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export function RecommendationSection({
  query,
}: {
  query: UseQueryResult<TrainingRecommendations, Error>;
}) {
  const { t, locale } = useLocale();
  const batch = query.data;
  const problem = batch?.recommendations[0];
  const platform =
    problem?.platform === "codeforces"
      ? "Codeforces"
      : (problem?.platform ?? "");
  const tags = problem?.tags?.filter((tag) => tag.trim());
  const showRetry =
    query.isError || (query.isFetching && query.errorUpdatedAt > 0);

  return (
    <section
      aria-labelledby="recommendation-title"
      aria-busy={query.isFetching}
    >
      <Card
        interaction="lift"
        className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]"
      >
        <CardHeader>
          <CardTitle>
            <h2 id="recommendation-title">{t("recommendation.title")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-5">
          <Alert role="note">
            <InfoIcon aria-hidden="true" />
            <AlertDescription>
              {t("recommendation.placeholder")}
            </AlertDescription>
          </Alert>
          {query.isPending && !query.isFetching && (
            <p className="text-sm text-muted-foreground">
              {t("recommendation.waiting")}
            </p>
          )}
          {query.isFetching && (
            <div role="status" className="flex flex-col gap-3">
              <p>{t("recommendation.loading")}</p>
              {!batch && <Skeleton className="h-24" aria-hidden="true" />}
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
                      ? "recommendation.timeout"
                      : "recommendation.error",
                  )}
                </p>
                {batch && <p>{t("data.previous")}</p>}
              </AlertDescription>
            </Alert>
          )}
          {showRetry && (
            <Button
              variant="outline"
              className="self-start"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
              {t("recommendation.retry")}
            </Button>
          )}
          {batch && !problem && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{t("recommendation.empty")}</EmptyTitle>
                <EmptyDescription>
                  {t("recommendation.emptyNext")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {problem && (
            <div className="flex min-w-0 flex-col gap-5 wrap-anywhere">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  {t("recommendation.platform")} · {platform}
                </p>
                <h3 className="py-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {problem.title?.trim()
                    ? problem.title
                    : problem.externalProblemId}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("recommendation.externalId")} ·{" "}
                  <span className="font-mono">{problem.externalProblemId}</span>
                </p>
              </div>
              <p className="text-sm">
                {t("recommendation.difficulty")} ·{" "}
                {problem.difficulty == null
                  ? t("recommendation.difficultyUnavailable")
                  : formatNumber(problem.difficulty, locale)}
              </p>
              {!!tags?.length && (
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label={t("recommendation.tags")}
                >
                  {tags.map((tag, index) => (
                    <li key={`${index}-${tag}`} className="max-w-full">
                      <Badge variant="secondary" wrap>
                        {tag}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/70 p-5">
                <h4 className="text-sm font-medium">
                  {t("recommendation.reason")}
                </h4>
                <p className="text-sm leading-relaxed">
                  {problem.reason.trim()
                    ? problem.reason
                    : t("recommendation.reasonUnavailable")}
                </p>
                {!!problem.reason.trim() && (
                  <p className="text-xs text-muted-foreground">
                    {t("recommendation.originalText")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                {problem.url ? (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby="new-tab-notice"
                    className={cn(
                      buttonVariants({ size: "lg", wrap: true }),
                      "w-full sm:w-auto",
                    )}
                  >
                    <span className="min-w-0">
                      {t("recommendation.openExternal", { platform })}
                    </span>
                    <ExternalLinkIcon
                      data-icon="inline-end"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <Button size="lg" wrap className="w-full sm:w-auto" disabled>
                    {t("recommendation.linkUnavailable")}
                  </Button>
                )}
                {problem.url && (
                  <p
                    id="new-tab-notice"
                    className="text-xs text-muted-foreground"
                  >
                    {t("recommendation.newTab")}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        {batch && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              {t("recommendation.generatedAt")} ·{" "}
              <time dateTime={batch.generatedAt}>
                {formatTimestamp(batch.generatedAt, locale)}
              </time>
            </p>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
