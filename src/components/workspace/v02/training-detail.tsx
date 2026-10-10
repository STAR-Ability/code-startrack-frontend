"use client";
import Link from "next/link";
import { ArrowLeftIcon, CheckCheckIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { v02 } from "@/lib/api/v02";
import { uuidSchema } from "@/lib/api/schemas";
import { useV02Query } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, QueryFeedback } from "../feedback";
import { Panel } from "../v012-shared";
import { MetricPanel } from "../metric-panel";
import { TrainingProblem, TrainingProblemAction } from "./training-problem";

export function TrainingDetail() {
  const { t, locale } = useLocale();
  const raw = useSearchParams().get("trainingRecordId");
  const parsed = uuidSchema.safeParse(raw);
  const id = parsed.success ? parsed.data : "";
  const query = useV02Query(
    "training-record",
    { id },
    (signal) => v02.trainingRecord(id, signal),
    !!id,
  );
  const record = query.data;
  return (
    <>
      <div>
        <Link
          href="/training"
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          {t("v02.backTraining")}
        </Link>
      </div>
      {!id ? (
        <EmptyState title={t("v02.invalidTrainingId")} />
      ) : (
        <QueryFeedback query={query} />
      )}
      {record && (
        <>
          <Panel
            title="v02.trainingDetail"
            description={t("v02.trainingFactsNote")}
            variant="metric"
            tone="support"
          >
            <TrainingProblem problem={record.problem} />
            <div>
              <Badge
                variant={
                  record.status === "COMPLETED" ? "success" : "secondary"
                }
              >
                {record.status === "COMPLETED" && (
                  <CheckCheckIcon aria-hidden="true" />
                )}
                {t(`v02.status.${record.status}`)}
              </Badge>
            </div>
            <div>
              <TrainingProblemAction problem={record.problem} record={record} />
            </div>
            {record.problem.problemRef.source === "EXTERNAL" && (
              <p className="text-muted-foreground">
                {t("v02.externalCompletionNote")}
              </p>
            )}
            {record.problem.problemRef.source === "PLATFORM" &&
              record.lastSubmissionId && (
                <Link
                  className="auth-text-link"
                  href={`/submissions/detail?submissionId=${record.lastSubmissionId}`}
                >
                  {t("v02.lastPlatformSubmission")}
                </Link>
              )}
          </Panel>
          <MetricPanel
            title="v02.trainingFacts"
            metrics={[
              ["v02.attemptCount", record.attemptCount],
              ["v02.acceptedCount", record.acceptedSubmissionCount],
            ]}
            secondary={[
              ["v02.lastSubmissionId", record.lastSubmissionId],
              [
                "v02.firstSubmission",
                record.firstSubmittedAt
                  ? formatTimestamp(record.firstSubmittedAt, locale)
                  : null,
              ],
              [
                "v02.lastSubmission",
                record.lastSubmittedAt
                  ? formatTimestamp(record.lastSubmittedAt, locale)
                  : null,
              ],
              [
                "v02.completedAt",
                record.completedAt
                  ? formatTimestamp(record.completedAt, locale)
                  : null,
              ],
              ["v02.createdAt", formatTimestamp(record.createdAt, locale)],
              [
                "v02.trainingUpdatedAt",
                formatTimestamp(record.updatedAt, locale),
              ],
            ]}
          />
          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Panel title="v02.reference" variant="supporting">
              <dl className="metric-details">
                <div>
                  <dt>{t("v02.trainingId")}</dt>
                  <dd className="break-all">{record.trainingRecordId}</dd>
                </div>
                <div>
                  <dt>{t("v02.problemSource")}</dt>
                  <dd>{t(`v02.source.${record.problem.problemRef.source}`)}</dd>
                </div>
                <div>
                  <dt>{t("v02.platform")}</dt>
                  <dd>{record.problem.problemRef.platform}</dd>
                </div>
                <div>
                  <dt>{t("v02.problemId")}</dt>
                  <dd>{record.problem.problemRef.problemId}</dd>
                </div>
                <div>
                  <dt>{t("v02.problemVersion")}</dt>
                  <dd className="break-all">
                    {record.problem.problemRef.problemVersionId ??
                      t("v.unavailable")}
                  </dd>
                </div>
              </dl>
            </Panel>
            <Panel
              title="v02.attribution"
              variant="supporting"
              description={t("v02.attributionNote")}
            >
              {record.recommendationBatchId ? (
                <Link
                  href={`/learning-recommendations?batchId=${record.recommendationBatchId}`}
                  className="auth-text-link break-all"
                >
                  {record.recommendationBatchId}
                </Link>
              ) : (
                <p>{t("v02.attributionNone")}</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
