"use client";
import { emptySummary } from "@/lib/api/data-state";
import { dimensionCodes, type AnalysisDto } from "@/lib/api/schemas";
import type { CopyKey } from "@/lib/i18n/messages";
import { activitySeries } from "@/lib/charts/data";
import { distributionOption, trendOption } from "@/lib/charts/options";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { EmptyState } from "./feedback";
import { MetricPanel } from "./metric-panel";
import { Chart } from "./chart";
import { useAccountTimezone } from "./account-provider";

export function AnalysisView({
  analysis,
  dimensions = false,
  statistics = false,
  loading = false,
  unavailable = false,
  metricTitle = "profile.overview",
  ability = false,
  trend,
}: {
  analysis: AnalysisDto | null;
  dimensions?: boolean;
  statistics?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  metricTitle?: CopyKey;
  ability?: boolean;
  trend?: React.ReactNode;
}) {
  const { t, locale } = useLocale();
  const timezone = useAccountTimezone();
  const number = (v: number | null) =>
    v === null
      ? t("v.unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);
  const date = (v: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(v));
  const scores = [
    ...(analysis?.dimensions ??
      dimensionCodes.map((code, index) => ({
        code,
        displayOrder: index + 1,
        score: 0,
      }))),
  ].sort((a, b) => a.displayOrder - b.displayOrder);
  const summary = analysis?.summary ?? emptySummary;
  const daily = statistics && analysis ? activitySeries(analysis) : [];
  const tags = analysis?.tagStats ?? [];
  const difficulty = analysis?.difficultyStats ?? [];
  const weakest = analysis
    ? t(`data.dimension.${analysis.weakestDimension}`)
    : t("v.unavailable");
  return (
    <>
      <MetricPanel
        title={metricTitle}
        loading={loading}
        description={
          <>
            {analysis ? t(`v.window.${analysis.window}`) : t("v.unavailable")} ·{" "}
            {t("v.analysisZone")}: {analysis?.timezone ?? t("v.unavailable")}
          </>
        }
        metrics={
          ability
            ? [
                ["v.overallScore", analysis?.overallScore ?? 0],
                ["v.rating", analysis?.currentRating ?? null],
                ["v.maxRating", analysis?.maxRating ?? null],
                ["v.solved", summary.solvedCount],
              ]
            : [
                ["v.attempted", summary.attemptedProblemCount],
                ["v.solved", summary.solvedCount],
                ["v.submissions", summary.submissionCount],
                ["v.activeDays", summary.activeDays],
              ]
        }
        secondary={
          ability
            ? [
                ["v.weakest", weakest],
                ["v.submissions", summary.submissionCount],
                ["v.attempted", summary.attemptedProblemCount],
              ]
            : [
                ["v.unsolved", summary.unsolvedProblemCount],
                ["v.accepted", summary.acceptedSubmissionCount],
                ["v.failed", summary.failedSubmissionCount],
                ["v.pendingCount", summary.pendingSubmissionCount],
                ["profile.averageDifficulty", summary.averageSolvedDifficulty],
                ["profile.maxDifficulty", summary.maxSolvedDifficulty],
                ["v.ratedSolved", summary.ratedSolvedCount],
                ["v.unratedSolved", summary.unratedSolvedCount],
              ]
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          {t("v.cutoff")}:{" "}
          {analysis ? (
            <time dateTime={analysis.dataCutoffAt}>
              {date(analysis.dataCutoffAt)}
            </time>
          ) : (
            t("v.unavailable")
          )}
          {!ability && (
            <>
              {" "}
              · {t("v.rating")}: {number(analysis?.currentRating ?? null)} ·{" "}
              {t("v.maxRating")}: {number(analysis?.maxRating ?? null)}
            </>
          )}
        </p>
        {analysis?.stale && <Badge variant="warning">{t("v.stale")}</Badge>}
      </div>
      {analysis?.stale && (
        <Alert>
          <AlertDescription>{t("v.staleNote")}</AlertDescription>
        </Alert>
      )}
      {!analysis && !loading && (
        <EmptyState
          title={t(unavailable ? "practice.noData" : "v.noAnalysis")}
        />
      )}
      {analysis && !summary.submissionCount && (
        <EmptyState title={t("v.noEvidence")} />
      )}
      {trend}
      {statistics && (
        <>
          <Card size="sm" interaction="none">
            <CardHeader>
              <CardTitle>
                <h2>{t("v.activityStats")}</h2>
              </CardTitle>
              <CardDescription>{t("v.windowNote")}</CardDescription>
            </CardHeader>
            <CardContent>
              {daily.length ? (
                <Chart
                  palette="activity"
                  label={t("v.activityStats")}
                  option={trendOption(
                    daily.map((item) => item.date),
                    [
                      {
                        name: t("v.submissions"),
                        values: daily.map((item) => item.submissionCount),
                      },
                      {
                        name: t("v.solved"),
                        values: daily.map((item) => item.solvedCount),
                      },
                      {
                        name: t("v.pendingCount"),
                        values: daily.map(
                          (item) => item.pendingSubmissionCount,
                        ),
                      },
                    ],
                  )}
                />
              ) : (
                <EmptyState title={t("v.noRecords")} />
              )}
            </CardContent>
          </Card>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Card size="sm" interaction="none">
              <CardHeader>
                <CardTitle>
                  <h2>{t("v.tagStats")}</h2>
                </CardTitle>
                <CardDescription>{t("v.statsNote")}</CardDescription>
              </CardHeader>
              <CardContent>
                {tags.length ? (
                  <>
                    <Chart
                      palette="distribution"
                      label={t("v.tagStats")}
                      option={distributionOption(
                        tags.slice(0, 10).map((item) => item.tag),
                        tags
                          .slice(0, 10)
                          .map((item) => item.attemptedProblemCount),
                        tags.slice(0, 10).map((item) => item.solvedCount),
                        [t("v.attempted"), t("v.solved")],
                        true,
                      )}
                    />
                    <DetailsDisclosure title={t("metrics.chartValues")}>
                      <dl className="flex flex-col gap-2">
                        {tags.map((item) => (
                          <div
                            key={item.tag}
                            className="flex flex-wrap justify-between gap-2"
                          >
                            <dt>{item.tag}</dt>
                            <dd>
                              {t("v.solved")}: {number(item.solvedCount)} /{" "}
                              {t("v.attempted")}:{" "}
                              {number(item.attemptedProblemCount)} ·{" "}
                              {t("v.submissions")}:{" "}
                              {number(item.submissionCount)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </DetailsDisclosure>
                  </>
                ) : (
                  <EmptyState title={t("v.noRecords")} />
                )}
              </CardContent>
            </Card>
            <Card size="sm" interaction="none">
              <CardHeader>
                <CardTitle>
                  <h2>{t("v.difficultyStats")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {difficulty.length ? (
                  <>
                    <Chart
                      palette="distribution"
                      label={t("v.difficultyStats")}
                      option={distributionOption(
                        difficulty.map(
                          (item) => item.difficulty ?? t("v.unrated"),
                        ),
                        difficulty.map((item) => item.attemptedProblemCount),
                        difficulty.map((item) => item.solvedCount),
                        [t("v.attempted"), t("v.solved")],
                      )}
                    />
                    <DetailsDisclosure title={t("metrics.chartValues")}>
                      <dl className="flex flex-col gap-1">
                        {difficulty.map((item) => (
                          <div
                            key={item.difficulty ?? "unrated"}
                            className="flex justify-between gap-2"
                          >
                            <dt>{item.difficulty ?? t("v.unrated")}</dt>
                            <dd>
                              {number(item.solvedCount)} /{" "}
                              {number(item.attemptedProblemCount)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </DetailsDisclosure>
                  </>
                ) : (
                  <EmptyState title={t("v.noRecords")} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      {dimensions && (
        <Card size="sm" interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{t("v.dimensions")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid min-w-0 items-center gap-4 lg:grid-cols-2">
            <Chart
              palette="ability"
              label={t("v.dimensions")}
              option={{
                radar: {
                  indicator: scores.map((item) => ({
                    name: t(`data.dimension.${item.code}`),
                    max: 100,
                  })),
                  radius: "52%",
                  axisName: {
                    formatter: (name = "") => name.replaceAll(" ", "\n"),
                    fontSize: 10,
                  },
                  splitNumber: 4,
                },
                series: [
                  {
                    type: "radar",
                    symbolSize: 4,
                    lineStyle: { width: 2 },
                    areaStyle: { opacity: 0.12 },
                    data: [
                      {
                        name: t("v.overallScore"),
                        value: scores.map((item) => item.score),
                      },
                    ],
                  },
                ],
              }}
            />
            <dl className="flex min-w-0 flex-col gap-3">
              {scores.map((item) => (
                <div key={item.code} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="text-sm">
                      {t(`data.dimension.${item.code}`)}
                      {item.code === analysis?.weakestDimension && (
                        <Badge variant="outline" className="ml-2">
                          {t("v.weakest")}
                        </Badge>
                      )}
                    </dt>
                    <dd className="font-mono text-sm tabular-nums">
                      {number(item.score)} / 100
                    </dd>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-1 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-insight"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </>
  );
}
