"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import type { PersonalReportDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Button } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAccounts } from "./account-provider";
import { AnalysisView } from "./analysis-view";
import { Panel, AiJobNotice } from "./v012-shared";
import { useUserQuery } from "./use-user-query";
import {
  EmptyState,
  ErrorNotice,
  Pagination,
  QueryFeedback,
  useCountdown,
} from "./feedback";
import { UserRebuild } from "./user-analysis-page";
import { isAiJobPending } from "./use-ai-job";
import { CompatibilityNotice } from "./compatibility-notice";
export function PersonalReportView({
  report,
  evidenceOpen = false,
}: {
  report: PersonalReportDto;
  evidenceOpen?: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="flex flex-col gap-4" data-report-id={report.reportId}>
      <CompatibilityNotice
        version={report.reportVersion}
        family="personal-report"
      />
      <Panel
        title="v12.reportOverview"
        description={formatTimestamp(report.generatedAt, locale)}
        variant="analysis"
        size="lg"
      >
        <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
          {report.content.overview}
        </p>
        <section className="report-actions">
          <h3 className="font-medium">{t("v12.suggestions")}</h3>
          <ul className="report-list">
            {report.content.actionSuggestions.map((line, index) => (
              <li key={index} className="whitespace-pre-wrap break-words">
                {line}
              </li>
            ))}
          </ul>
        </section>
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          {(["strengths", "weaknesses"] as const).map((key) => (
            <section key={key} className="flex min-w-0 flex-col gap-3">
              <h3 className="font-medium">{t(`v12.${key}`)}</h3>
              <ul className="report-list">
                {report.content[key].map((line, index) => (
                  <li key={index} className="whitespace-pre-wrap break-words">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <section className="flex flex-col gap-2 border-t pt-4">
          <h3 className="font-medium">{t("v12.recentTrend")}</h3>
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {report.content.recentTrend}
          </p>
        </section>
        {report.content.caution !== null && (
          <Alert>
            <AlertTitle>{t("v12.caution")}</AlertTitle>
            <AlertDescription>{report.content.caution}</AlertDescription>
          </Alert>
        )}
      </Panel>
      <DetailsDisclosure
        key={report.reportId}
        title={t("v12.reportEvidence")}
        variant="panel"
        keepMounted={false}
        defaultOpen={evidenceOpen}
      >
        <p className="text-sm text-muted-foreground">{t("v12.frozen")}</p>
        <AnalysisView
          aggregate
          dimensions
          statistics
          activity={false}
          ability
          metricTitle="metrics.snapshot"
          analysis={{
            ...report.statisticsSnapshot,
            ...report.profileSnapshot,
            window: "ALL",
            timezone: "UTC",
            period: {
              start: null,
              end: report.statisticsSnapshot.dataCutoffAt,
            },
            activityStats: [],
            stale: false,
          }}
        />
        <section
          className="flex min-w-0 flex-col gap-4"
          aria-label={t("v12.recentTraining")}
        >
          <p className="break-words text-sm text-muted-foreground">
            <time dateTime={report.recentTrainingSnapshot.period.start}>
              {formatTimestamp(
                report.recentTrainingSnapshot.period.start,
                locale,
              )}
            </time>{" "}
            —{" "}
            <time dateTime={report.recentTrainingSnapshot.period.end}>
              {formatTimestamp(
                report.recentTrainingSnapshot.period.end,
                locale,
              )}
            </time>
          </p>
          <AnalysisView
            aggregate
            statistics
            ratings={false}
            metricTitle="v12.recentTraining"
            analysis={{
              ...report.statisticsSnapshot,
              ...report.recentTrainingSnapshot,
              overallScore: report.profileSnapshot.overallScore,
              dimensions: report.profileSnapshot.dimensions,
              weakestDimension: report.profileSnapshot.weakestDimension,
              window: "30D",
              timezone: "UTC",
              stale: false,
            }}
          />
        </section>
      </DetailsDisclosure>
    </div>
  );
}
export function PersonalReportsPage() {
  const { t, locale } = useLocale();
  const { user } = useAccounts();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [reportId, setReportId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const latest = useUserQuery(
    "reports",
    { endpoint: "latest" },
    (_id, signal) => v012.latestReport(signal),
  );
  const history = useUserQuery(
    "reports",
    { endpoint: "history", page },
    (_id, signal) => v012.reports({ page }, signal),
  );
  const detail = useUserQuery(
    "reports",
    { endpoint: "detail", reportId },
    (_id, signal) => v012.report(reportId!, signal),
    !!reportId,
  );
  const all = useUserQuery(
    "user-analysis",
    { endpoint: "latest", window: "ALL" },
    (id, signal) => v012.userAnalysis(id, "ALL", signal),
  );
  const recent = useUserQuery(
    "user-analysis",
    { endpoint: "latest", window: "30D" },
    (id, signal) => v012.userAnalysis(id, "30D", signal),
  );
  const mutation = useMutation({
    mutationKey: ["private", user.publicId, "generate-report"],
    meta: { publicId: user.publicId, v012: true },
    mutationFn: v012.generateReport,
    onSuccess: (job) => {
      if (!isCurrentUser(client, user.publicId)) return;
      client.setQueryData(keys.aiJob(user.publicId, job.jobId), job);
      setJobId(job.jobId);
    },
  });
  const job = useQuery({
    queryKey: keys.aiJob(user.publicId, jobId ?? "none"),
    queryFn: ({ signal }) => v012.aiJob(jobId!, signal),
    enabled: false,
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  const displayed = reportId ? detail : latest;
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          wrap
          disabled={
            mutation.isPending ||
            remaining > 0 ||
            isAiJobPending(jobId, job.data, job.error)
          }
          onClick={() => mutation.mutate()}
        >
          {t("v12.generateReport")}
        </Button>
        {reportId && (
          <Button wrap variant="outline" onClick={() => setReportId(null)}>
            {t("v.latest")}
          </Button>
        )}
      </div>
      <ErrorNotice error={mutation.error} />
      <AiJobNotice jobId={jobId} />
      <QueryFeedback query={displayed} />
      {displayed.data ? (
        <PersonalReportView report={displayed.data} />
      ) : (
        !displayed.isFetching &&
        !displayed.error &&
        displayed.data === null && <EmptyState title={t("v12.noReport")} />
      )}
      <Panel title="v12.reportHistory" variant="supporting">
        <QueryFeedback query={history} />
        {history.data?.data.map((report) => (
          <div
            key={report.reportId}
            className="flex flex-wrap justify-between gap-3"
          >
            <time dateTime={report.generatedAt}>
              {formatTimestamp(report.generatedAt, locale)}
            </time>
            <Button
              wrap
              variant="outline"
              onClick={() => setReportId(report.reportId)}
            >
              {t("v12.open")}
            </Button>
          </div>
        ))}
        {history.data?.data.length === 0 && (
          <EmptyState title={t("v.noRecords")} />
        )}
        <Pagination
          meta={history.data?.meta}
          page={page}
          setPage={setPage}
          pending={history.isFetching}
        />
      </Panel>
      <UserRebuild />
      <Panel title="v12.aggregate" variant="supporting">
        <DetailsDisclosure
          title={t("v12.currentEvidence")}
          variant="panel"
          keepMounted={false}
        >
          <p className="text-sm text-muted-foreground">
            {t("v12.currentEvidenceNote")}
          </p>
          <QueryFeedback query={all} />
          {all.data && (
            <AnalysisView analysis={all.data} dimensions ability aggregate />
          )}
          <QueryFeedback query={recent} />
          {recent.data && (
            <AnalysisView analysis={recent.data} statistics aggregate />
          )}
        </DetailsDisclosure>
      </Panel>
    </>
  );
}
