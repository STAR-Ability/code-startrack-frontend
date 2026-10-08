"use client";
import type { LearningRecommendationBatch } from "@/lib/api/v02-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
        <Badge variant="outline">{t(`v02.source.${batch.source}`)}</Badge>
        <Badge variant="secondary">{t(`v.mode.${batch.mode}`)}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        <time dateTime={batch.generatedAt}>
          {formatTimestamp(batch.generatedAt, locale)}
        </time>{" "}
        · {t("v02.candidates")}: {batch.candidateCount} · {t("v02.results")}:{" "}
        {batch.resultCount}
      </p>
      {batch.recommendations.length === 0 && (
        <EmptyState embedded title={t("v02.recommendationEmpty")} />
      )}
      {batch.recommendations.map((item) => (
        <article
          key={`${batch.batchId}:${item.problem.problemRef.source}:${item.problem.problemRef.platform}:${item.problem.problemRef.problemId}`}
          className="flex min-w-0 flex-col gap-3 border-b pb-5 last:border-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">
              {t("v02.rank", { rank: String(item.rank) })}
            </h3>
            {item.solvedSinceGeneration && (
              <Badge wrap variant="success">
                {t("v02.solvedSinceGeneration")}
              </Badge>
            )}
          </div>
          <TrainingProblem problem={item.problem} />
          <p className="wrap-anywhere">{item.reason}</p>
          <p className="text-sm text-muted-foreground">
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
          <TrainingPlanAction problem={item.problem} batchId={batch.batchId} />
        </article>
      ))}
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
