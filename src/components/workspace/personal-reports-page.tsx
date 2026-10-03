"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import type { PersonalReportDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
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
export function PersonalReportView({ report }: { report: PersonalReportDto }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-4" data-report-id={report.reportId}>
      <Panel title="v12.reportOverview" description={report.generatedAt}>
        <p className="whitespace-pre-wrap break-words">
          {report.content.overview}
        </p>
        {(["strengths", "weaknesses", "actionSuggestions"] as const).map(
          (key) => (
            <section key={key}>
              <h3 className="mb-2 font-medium">
                {t(
                  key === "actionSuggestions"
                    ? "v12.suggestions"
                    : `v12.${key}`,
                )}
              </h3>
              <ul className="list-disc pl-5">
                {report.content[key].map((line, index) => (
                  <li key={index} className="whitespace-pre-wrap break-words">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
        <h3 className="font-medium">{t("v12.recentTrend")}</h3>
        <p className="whitespace-pre-wrap">{report.content.recentTrend}</p>
        {report.content.caution !== null && (
          <Alert>
            <AlertTitle>{t("v12.caution")}</AlertTitle>
            <AlertDescription>{report.content.caution}</AlertDescription>
          </Alert>
        )}
      </Panel>
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
          period: { start: null, end: report.statisticsSnapshot.dataCutoffAt },
          activityStats: [],
          stale: false,
        }}
      />
      <section
        className="flex min-w-0 flex-col gap-4"
        aria-label={t("v12.recentTraining")}
      >
        <p className="break-words text-sm text-muted-foreground">
          {report.recentTrainingSnapshot.period.start} —{" "}
          {report.recentTrainingSnapshot.period.end}
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
    </div>
  );
}
export function PersonalReportsPage() {
  const { t } = useLocale();
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
        !displayed.isFetching && <EmptyState title={t("v12.noReport")} />
      )}
      <Panel title="v12.reportHistory">
        <QueryFeedback query={history} />
        {history.data?.data.map((report) => (
          <div
            key={report.reportId}
            className="flex flex-wrap justify-between gap-3"
          >
            <time dateTime={report.generatedAt}>{report.generatedAt}</time>
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
      <Panel title="v12.aggregate">
        <QueryFeedback query={all} />
        {all.data && (
          <AnalysisView analysis={all.data} dimensions ability aggregate />
        )}
        <QueryFeedback query={recent} />
        {recent.data && (
          <AnalysisView analysis={recent.data} statistics aggregate />
        )}
      </Panel>
    </>
  );
}
