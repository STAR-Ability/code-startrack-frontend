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
      size={compact ? "default" : "lg"}
      className={compact ? "h-full" : undefined}
    >
      {batch.stale && (
        <Alert>
          <AlertDescription>{t("v02.recommendationStale")}</AlertDescription>
        </Alert>
      )}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-b border-info/15 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge wrap variant="outline">
              {t(`v02.source.${batch.source}`)}
            </Badge>
            <Badge wrap variant="secondary">
              {t(`v.mode.${batch.mode}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            <time dateTime={batch.generatedAt}>
              {formatTimestamp(batch.generatedAt, locale)}
            </time>
          </p>
        </div>
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
            "recommendation-entry flex min-w-0 flex-col gap-4 py-5",
            compact
              ? "py-1"
              : item.rank === 1
                ? "rounded-2xl border border-info/15 bg-info-soft/40 px-4 sm:px-6"
                : "border-b last:border-0 last:pb-0",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border font-mono text-base tabular-nums",
                  item.rank === 1
                    ? "border-info/20 bg-info-soft text-info"
                    : "bg-surface-panel text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {item.rank === 1 ? (
                  <SparklesIcon className="size-4" />
                ) : (
                  item.rank
                )}
              </span>
              <h3
                className={cn(
                  "text-sm font-medium",
                  item.rank === 1 && "text-info",
                )}
              >
                {t("v02.rank", { rank: String(item.rank) })}
              </h3>
            </div>
            {item.solvedSinceGeneration && (
              <Badge wrap variant="success">
                {t("v02.solvedSinceGeneration")}
              </Badge>
            )}
          </div>
          <div
            className={cn(
              "grid min-w-0 items-start gap-5",
              !compact && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]",
            )}
          >
            <div className="flex min-w-0 flex-col gap-4">
              <TrainingProblem problem={item.problem} />
              <p className="wrap-anywhere text-sm leading-relaxed text-muted-foreground">
                {item.reason}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <dl className="flex items-baseline gap-2">
                  <dt className="text-xs text-muted-foreground">
                    {t("v02.recommendationScore")}
                  </dt>
                  <dd className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-info">
                    {formatNumber(item.score, locale, 2)}
                  </dd>
                </dl>
                {item.matchedDimension && (
                  <Badge wrap variant="insight">
                    <TargetIcon aria-hidden="true" />
                    {t(`data.dimension.${item.matchedDimension}`)}
                  </Badge>
                )}
              </div>
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
