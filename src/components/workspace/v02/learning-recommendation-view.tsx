"use client";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon, TargetIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningRecommendationBatch } from "@/lib/api/v02-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { EmptyState } from "../feedback";
import { Panel } from "../v012-shared";
import { TrainingPlanAction, TrainingProblem } from "./training-problem";

export function LearningRecommendationView({
  batch,
  compact = false,
}: {
  batch: LearningRecommendationBatch;
  compact?: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <Panel
      title="v02.batch"
      variant="recommendation"
      description={t("v02.frozenRanking")}
    >
      {batch.stale && (
        <Alert>
          <AlertDescription>{t("v02.recommendationStale")}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Badge wrap variant="outline">
          {t(`v02.source.${batch.source}`)}
        </Badge>
        <Badge wrap variant="secondary">
          {t(`v.mode.${batch.mode}`)}
        </Badge>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-info/15 pb-4">
        <p className="text-xs text-muted-foreground">
          <time dateTime={batch.generatedAt}>
            {formatTimestamp(batch.generatedAt, locale)}
          </time>
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-baseline gap-2">
            <dt>{t("v02.candidates")}</dt>
            <dd className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatNumber(batch.candidateCount, locale)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt>{t("v02.results")}</dt>
            <dd className="font-mono text-lg font-semibold tabular-nums text-info">
              {formatNumber(batch.resultCount, locale)}
            </dd>
          </div>
        </dl>
      </div>
      {batch.recommendations.length === 0 && (
        <EmptyState embedded title={t("v02.recommendationEmpty")} />
      )}
      {(compact
        ? batch.recommendations.slice(0, 1)
        : batch.recommendations
      ).map((item) => (
        <article
          key={`${batch.batchId}:${item.problem.problemRef.source}:${item.problem.problemRef.platform}:${item.problem.problemRef.problemId}`}
          className={cn(
            "flex min-w-0 flex-col gap-4 py-5",
            item.rank === 1
              ? "rounded-xl border border-info/15 bg-info-soft/40 px-4 sm:px-5"
              : "border-b last:border-0 last:pb-0",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                item.rank === 1 && "text-info",
              )}
            >
              {item.rank === 1 && (
                <SparklesIcon className="size-4 shrink-0" aria-hidden="true" />
              )}
              {t("v02.rank", { rank: String(item.rank) })}
            </h3>
            {item.solvedSinceGeneration && (
              <Badge wrap variant="success">
                {t("v02.solvedSinceGeneration")}
              </Badge>
            )}
          </div>
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <TrainingProblem problem={item.problem} />
              <p className="wrap-anywhere text-sm leading-relaxed text-muted-foreground">
                {item.reason}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <TargetIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {t("v02.recommendationScore")}:{" "}
                {formatNumber(item.score, locale, 2)}
                {item.matchedDimension && (
                  <> · {t(`data.dimension.${item.matchedDimension}`)}</>
                )}
              </p>
              {!compact && (
                <DetailsDisclosure title={t("v02.reasonCode")}>
                  <p>{item.reasonCode}</p>
                </DetailsDisclosure>
              )}
              <TrainingPlanAction
                problem={item.problem}
                batchId={batch.batchId}
              />
            </div>
          </div>
        </article>
      ))}
      {compact && batch.recommendations.length > 0 && (
        <Link
          href={`/learning-recommendations?batchId=${batch.batchId}`}
          className={buttonVariants({
            variant: "link",
            wrap: true,
            className: "self-start",
          })}
        >
          {t("v02.viewBatch")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      )}
      {!compact && (
        <DetailsDisclosure title={t("v02.snapshotMetadata")}>
          <dl className="metric-details">
            <div>
              <dt>{t("v02.batchId")}</dt>
              <dd className="break-all">{batch.batchId}</dd>
            </div>
            <div>
              <dt>{t("v02.snapshotId")}</dt>
              <dd className="break-all">{batch.analysisSnapshotId}</dd>
            </div>
            <div>
              <dt>{t("v02.algorithmVersion")}</dt>
              <dd>{batch.algorithmVersion}</dd>
            </div>
            <div>
              <dt>{t("v02.mappingVersion")}</dt>
              <dd>{batch.mappingVersion}</dd>
            </div>
            <div>
              <dt>{t("v02.fingerprint")}</dt>
              <dd className="break-all font-mono">{batch.sourceFingerprint}</dd>
            </div>
          </dl>
        </DetailsDisclosure>
      )}
    </Panel>
  );
}
