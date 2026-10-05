"use client";
import type { AnalysisDto } from "@/lib/api/schemas";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./feedback";
import { MetricPanel } from "./metric-panel";
import { Chart } from "./chart";
import { useAccountTimezone } from "./account-provider";
import { CompatibilityNotice } from "./compatibility-notice";

export type AnalysisPresentation = Pick<
  AnalysisDto,
  | "window"
  | "timezone"
  | "dataCutoffAt"
  | "stale"
  | "summary"
  | "currentRating"
  | "maxRating"
  | "overallScore"
  | "dimensions"
  | "weakestDimension"
  | "period"
  | "tagStats"
  | "difficultyStats"
  | "activityStats"
> &
  Partial<Pick<AnalysisDto, "algorithmVersion">>;

export function AnalysisView({
  analysis,
  dimensions = false,
  statistics = false,
  loading = false,
  unavailable = false,
  metricTitle = "profile.overview",
  ability = false,
  trend,
  aggregate = false,
  activity = true,
  ratings = true,
  distributions = true,
  emptyState,
}: {
  analysis: AnalysisPresentation | null;
  aggregate?: boolean;
  activity?: boolean;
  ratings?: boolean;
  distributions?: boolean;
  dimensions?: boolean;
  statistics?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  metricTitle?: CopyKey;
  ability?: boolean;
  trend?: React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  const { t, locale } = useLocale();
  const accountTimezone = useAccountTimezone();
  const timezone = aggregate && analysis ? analysis.timezone : accountTimezone;
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
  const scores = [...(analysis?.dimensions ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const summary = analysis?.summary;
  const daily = statistics && analysis ? activitySeries(analysis) : [];
  const tags = analysis?.tagStats ?? [];
  const difficulty = analysis?.difficultyStats ?? [];
  const weakest = analysis
    ? t(`data.dimension.${analysis.weakestDimension}`)
    : t("v.unavailable");
  return (
    <>
      {analysis?.algorithmVersion && (
        <CompatibilityNotice
          version={analysis.algorithmVersion}
          family={aggregate ? "user-profile" : "account-profile"}
        />
      )}
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
                ["v.overallScore", analysis?.overallScore ?? null],
                [
                  aggregate ? "v12.highestRating" : "v.rating",
                  analysis?.currentRating ?? null,
                ],
                [
                  aggregate ? "v12.highestMaxRating" : "v.maxRating",
                  analysis?.maxRating ?? null,
                ],
                ["v.solved", summary?.solvedCount ?? null],
              ]
            : [
                ["v.attempted", summary?.attemptedProblemCount ?? null],
                ["v.solved", summary?.solvedCount ?? null],
                ["v.submissions", summary?.submissionCount ?? null],
                ["v.activeDays", summary?.activeDays ?? null],
              ]
        }
        secondary={
          ability
            ? [
                ["v.weakest", weakest],
                ["v.submissions", summary?.submissionCount ?? null],
                ["v.attempted", summary?.attemptedProblemCount ?? null],
              ]
            : [
                ["v.unsolved", summary?.unsolvedProblemCount ?? null],
                ["v.accepted", summary?.acceptedSubmissionCount ?? null],
                ["v.failed", summary?.failedSubmissionCount ?? null],
                ["v.pendingCount", summary?.pendingSubmissionCount ?? null],
                [
                  "profile.averageDifficulty",
                  summary?.averageSolvedDifficulty ?? null,
                ],
                ["profile.maxDifficulty", summary?.maxSolvedDifficulty ?? null],
                ["v.ratedSolved", summary?.ratedSolvedCount ?? null],
                ["v.unratedSolved", summary?.unratedSolvedCount ?? null],
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
          {!ability && ratings && (
            <>
              {" "}
              · {t(aggregate ? "v12.highestRating" : "v.rating")}:{" "}
              {number(analysis?.currentRating ?? null)} ·{" "}
              {t(aggregate ? "v12.highestMaxRating" : "v.maxRating")}:{" "}
              {number(analysis?.maxRating ?? null)}
            </>
          )}
        </p>
        {analysis?.stale && <Badge variant="warning">{t("v.stale")}</Badge>}
      </div>
      {analysis?.stale && (
        <Alert>
          <AlertDescription>
            {t(aggregate ? "v12.staleNote" : "v.staleNote")}
          </AlertDescription>
        </Alert>
      )}
      {!analysis && !loading && !dimensions && (
        <EmptyState
          title={t(unavailable ? "practice.noData" : "v.noAnalysis")}
        />
      )}
      {analysis && !analysis.summary.submissionCount && (
        <EmptyState title={t("v.noEvidence")} />
      )}
      {trend}
      {statistics && (
        <>
          {activity && (
            <Card variant="analysis" interaction="none">
              <CardHeader>
                <CardTitle>
                  <h2>{t("v.activityStats")}</h2>
                </CardTitle>
                <CardDescription>
                  {t(aggregate ? "v12.activityNote" : "v.windowNote")}
                  {daily.length > 0 && <> {t("v.activityChartNote")}</>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && !analysis ? (
                  <Skeleton className="h-64 w-full" />
                ) : daily.length ? (
                  <>
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
                    <DetailsDisclosure
                      title={t("metrics.chartValues")}
                      keepMounted={false}
                    >
                      <dl className="flex flex-col gap-2">
                        {daily.map((item) => (
                          <div
                            key={item.date}
                            className="flex flex-wrap justify-between gap-2"
                          >
                            <dt>
                              <time dateTime={item.date}>{item.date}</time>
                            </dt>
                            <dd>
                              {t("v.submissions")}:{" "}
                              {number(item.submissionCount)} · {t("v.solved")}:{" "}
                              {number(item.solvedCount)} · {t("v.pendingCount")}
                              : {number(item.pendingSubmissionCount)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </DetailsDisclosure>
                  </>
                ) : (
                  <EmptyState embedded title={t("v.noRecords")} />
                )}
              </CardContent>
            </Card>
          )}
          {distributions && (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <Card variant="analysis" interaction="none">
                <CardHeader>
                  <CardTitle>
                    <h2>{t("v.tagStats")}</h2>
                  </CardTitle>
                  <CardDescription>
                    {t("v.statsNote")}
                    {tags.length > 10 && <> {t("v.chartTagLimit")}</>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading && !analysis ? (
                    <Skeleton className="h-64 w-full" />
                  ) : tags.length ? (
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
                      <DetailsDisclosure
                        title={t("metrics.chartValues")}
                        keepMounted={false}
                      >
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
                    <EmptyState embedded title={t("v.noRecords")} />
                  )}
                </CardContent>
              </Card>
              <Card variant="analysis" interaction="none">
                <CardHeader>
                  <CardTitle>
                    <h2>{t("v.difficultyStats")}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading && !analysis ? (
                    <Skeleton className="h-64 w-full" />
                  ) : difficulty.length ? (
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
                      <DetailsDisclosure
                        title={t("metrics.chartValues")}
                        keepMounted={false}
                      >
                        <dl className="flex flex-col gap-1">
                          {difficulty.map((item) => (
                            <div
                              key={item.difficulty ?? "unrated"}
                              className="flex flex-wrap justify-between gap-2"
                            >
                              <dt>{item.difficulty ?? t("v.unrated")}</dt>
                              <dd>
                                {t("v.solved")}: {number(item.solvedCount)} /{" "}
                                {t("v.attempted")}:{" "}
                                {number(item.attemptedProblemCount)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </DetailsDisclosure>
                    </>
                  ) : (
                    <EmptyState embedded title={t("v.noRecords")} />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      {dimensions && (
        <Card variant="analysis" interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{t("v.dimensions")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid min-w-0 items-center gap-4 lg:grid-cols-2">
            {!analysis ? (
              loading ? (
                <>
                  <Skeleton className="h-64 w-full" />
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 6 }, (_, index) => (
                      <Skeleton key={index} className="h-7 w-full" />
                    ))}
                  </div>
                </>
              ) : (
                <div className="min-w-0 lg:col-span-2">
                  {emptyState ?? (
                    <EmptyState
                      embedded
                      title={t(
                        unavailable ? "practice.noData" : "v.noAnalysis",
                      )}
                    />
                  )}
                </div>
              )
            ) : (
              <>
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
                <div className="flex min-w-0 flex-col gap-3">
                  {scores.map((item) => (
                    <div key={item.code} className="flex flex-col gap-1">
                      <dl className="flex flex-wrap items-center justify-between gap-2">
                        <dt className="text-sm">
                          {t(`data.dimension.${item.code}`)}
                          {item.code === analysis?.weakestDimension && (
                            <Badge variant="outline" wrap className="ml-2">
                              {t("v.weakest")}
                            </Badge>
                          )}
                        </dt>
                        <dd className="font-mono text-sm tabular-nums">
                          {number(item.score)} / 100
                        </dd>
                      </dl>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
