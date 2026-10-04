"use client";
import { ExternalLinkIcon, OrbitIcon, RouteIcon } from "lucide-react";
import { cn } from "cn";
import type { RecommendationBatchDto, ProblemDto } from "@/lib/api/schemas";
import { safeProblemUrl } from "@/lib/charts/data";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "./feedback";

export function ProblemLink({
  problem,
  primary = false,
}: {
  problem: ProblemDto;
  primary?: boolean;
}) {
  const { t } = useLocale();
  const url = safeProblemUrl(problem.url);
  const variant = primary ? "default" : "outline";
  return url ? (
    <a
      href={url}
      data-slot="button"
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({
        variant,
        size: primary ? "lg" : "sm",
        wrap: true,
      })}
    >
      <span>
        {t("recommendation.openExternal", { platform: "Codeforces" })}
      </span>
      <ExternalLinkIcon data-icon="inline-end" />
      <span className="sr-only">{t("recommendation.newTab")}</span>
    </a>
  ) : (
    <Button disabled variant={variant} size={primary ? "lg" : "sm"} wrap>
      {t("recommendation.linkUnavailable")}
    </Button>
  );
}
export function BatchView({
  batch,
  firstOnly = false,
}: {
  batch: RecommendationBatchDto | null;
  firstOnly?: boolean;
}) {
  const { t, locale } = useLocale();
  if (!batch)
    return (
      <Card interaction="none">
        <CardHeader>
          <CardTitle>
            <h2>{t("practice.forYou")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t("practice.noData")}
            description={t("v.noBatch")}
          />
        </CardContent>
      </Card>
    );
  return (
    <>
      {batch.stale && (
        <Alert>
          <AlertDescription>
            <Badge variant="warning">{t("v.stale")}</Badge>
            <p>{t("v.staleNote")}</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="recommendation-context">
        <Badge variant="info" wrap>
          {t(`v.mode.${batch.mode}`)}
        </Badge>
        <p>
          {t("recommendation.generatedAt")}:{" "}
          <time dateTime={batch.generatedAt}>
            {formatTimestamp(batch.generatedAt, locale)}
          </time>
        </p>
        <p>
          {t("v.candidateCount")}: {batch.candidateCount} · {t("v.resultCount")}
          : {batch.resultCount}
        </p>
        {!batch.recommendations.some((item) => item.rank === 1) && (
          <p>
            {t("v.targetRating")}: {batch.targetRating}
          </p>
        )}
      </div>
      {!batch.recommendations.length && (
        <EmptyState
          title={t("practice.noData")}
          description={t("v.noCandidates")}
        />
      )}
      {(firstOnly
        ? batch.recommendations.slice(0, 1)
        : batch.recommendations
      ).map((item) => (
        <RecommendationCard
          key={item.rank}
          item={item}
          targetRating={batch.targetRating}
        />
      ))}
    </>
  );
}

export function RecommendationCard({
  item,
  targetRating,
}: {
  item: RecommendationBatchDto["recommendations"][number];
  targetRating?: number;
}) {
  const { t } = useLocale();
  const featured = item.rank === 1;
  return (
    <Card
      variant={featured ? "recommendation" : "supporting"}
      size={featured ? "lg" : "sm"}
      interaction="none"
      className="recommendation-card feedback-enter @container/recommendation"
      data-recommendation-rank={item.rank}
    >
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {featured && (
            <Badge variant="info" wrap>
              <OrbitIcon aria-hidden="true" />
              {t("recommendation.featured")}
            </Badge>
          )}
          <Badge variant="outline">Codeforces</Badge>
          {item.solvedSinceGeneration && (
            <Badge variant="success" wrap>
              {t("v.solvedSince")}
            </Badge>
          )}
        </div>
        <CardTitle>
          <h2
            className={cn(
              "recommendation-heading",
              featured && "recommendation-title",
            )}
          >
            <span className="recommendation-rank">#{item.rank}</span>{" "}
            <span className="min-w-0 wrap-anywhere">
              {item.problem.title ?? item.problem.externalProblemKey}
            </span>
          </h2>
        </CardTitle>
        <CardDescription>
          {item.problem.externalProblemKey}
          {!featured && (
            <>
              {" "}
              · {t("recommendation.difficulty")}:{" "}
              {item.problem.difficulty ?? t("v.unrated")}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-4", featured && "gap-5")}>
        <div
          className={cn(
            "grid min-w-0 gap-4",
            featured &&
              "@xl/recommendation:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
          )}
        >
          <div className="recommendation-reason">
            {featured && (
              <h3>
                <RouteIcon className="size-4" aria-hidden="true" />
                {t("recommendation.reason")}
              </h3>
            )}
            <p>{t(`v.reason.${item.reasonCode}`)}</p>
            {item.matchedDimension !== null && (
              <div className="flex flex-col gap-2">
                <div className="recommendation-coverage">
                  <span>{t("recommendation.matchedDimension")}</span>
                  <Badge variant="insight" wrap>
                    {t(`data.dimension.${item.matchedDimension}`)}
                  </Badge>
                </div>
                {featured && (
                  <p className="text-xs text-muted-foreground">
                    {t("recommendation.coverageNote")}
                  </p>
                )}
              </div>
            )}
          </div>
          {featured && (
            <dl className="recommendation-facts">
              <div>
                <dt>{t("recommendation.difficulty")}</dt>
                <dd>{item.problem.difficulty ?? t("v.unrated")}</dd>
              </div>
              {targetRating !== undefined && (
                <div>
                  <dt>{t("v.targetRating")}</dt>
                  <dd>{targetRating}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.problem.tags.map((tag) => (
            <Badge variant="outline" key={tag} wrap>
              {tag}
            </Badge>
          ))}
          {item.problem.isGym && <Badge variant="outline">Gym</Badge>}
          {item.problem.catalogSource === "INFERRED" && (
            <Badge variant="outline">INFERRED</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter
        className={cn(
          "recommendation-footer flex-wrap justify-between gap-3",
          !featured && "border-0 bg-transparent pt-0",
        )}
      >
        <p className="text-xs text-muted-foreground">
          {t("v.cfSolved")}: {item.problem.solvedCount ?? t("v.unavailable")}
        </p>
        <ProblemLink problem={item.problem} primary={featured} />
      </CardFooter>
    </Card>
  );
}
