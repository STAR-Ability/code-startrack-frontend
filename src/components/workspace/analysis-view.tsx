"use client";
import { emptySummary } from "@/lib/api/data-state";
import { dimensionCodes } from "@/lib/api/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalysisDto } from "@/lib/api/schemas";
import { activitySeries } from "@/lib/charts/data";
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
import { EmptyState } from "./feedback";
import { Chart } from "./chart";
import { useAccountTimezone } from "./account-provider";

export function AnalysisView({
  analysis,
  dimensions = false,
  statistics = false,
  loading = false,
  unavailable = false,
}: {
  analysis: AnalysisDto | null;
  dimensions?: boolean;
  statistics?: boolean;
  loading?: boolean;
  unavailable?: boolean;
}) {
  const { t, locale } = useLocale();
  const timezone = useAccountTimezone();
  const number = (value: number | null) =>
    value === null
      ? t("v.unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          value,
        );

  const scores = [
    ...(analysis?.dimensions ??
      dimensionCodes.map((code, index) => ({
        code,
        name: t(`data.dimension.${code}`),
        displayOrder: index + 1,
        score: 0,
      }))),
  ].sort((a, b) => a.displayOrder - b.displayOrder);
  const summary = analysis?.summary ?? emptySummary;
  const metrics = [
    ["v.attempted", summary.attemptedProblemCount],
    ["v.solved", summary.solvedCount],
    ["v.unsolved", summary.unsolvedProblemCount],
    ["v.submissions", summary.submissionCount],
    ["v.accepted", summary.acceptedSubmissionCount],
    ["v.failed", summary.failedSubmissionCount],
    ["v.pendingCount", summary.pendingSubmissionCount],
    ["profile.averageDifficulty", summary.averageSolvedDifficulty],
    ["profile.maxDifficulty", summary.maxSolvedDifficulty],
    ["v.ratedSolved", summary.ratedSolvedCount],
    ["v.unratedSolved", summary.unratedSolvedCount],
    ["v.activeDays", summary.activeDays],
  ] as const;
  const daily = statistics && analysis ? activitySeries(analysis) : [];
  return (
    <>
      {analysis?.stale && (
        <Alert>
          <AlertDescription>
            <Badge variant="secondary">{t("v.stale")}</Badge>
            <p>{t("v.staleNote")}</p>
          </AlertDescription>
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
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("profile.overview")}</h2>
          </CardTitle>
          <CardDescription>
            {analysis ? t(`v.window.${analysis.window}`) : t("v.unavailable")} ·{" "}
            {t("v.analysisZone")}: {analysis?.timezone ?? t("v.unavailable")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-2">
                <dt className="text-xs text-muted-foreground">{t(label)}</dt>
                <dd className="font-mono text-2xl tabular-nums">
                  {loading ? <Skeleton className="h-8 w-12" /> : number(value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("v.cutoff")}:{" "}
        {analysis ? (
          <time dateTime={analysis.dataCutoffAt}>
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: timezone,
            }).format(new Date(analysis.dataCutoffAt))}
          </time>
        ) : (
          t("v.unavailable")
        )}{" "}
        · {t("v.rating")}: {number(analysis?.currentRating ?? null)} ·{" "}
        {t("v.maxRating")}: {number(analysis?.maxRating ?? null)}
        <br />
        {t("v.windowNote")}
      </p>
      {dimensions && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("v.dimensions")}</h2>
            </CardTitle>
            <CardDescription>
              {t("v.overallScore")}: {number(analysis?.overallScore ?? 0)} ·{" "}
              {t("v.weakest")}:{" "}
              {scores.find((item) => item.code === analysis?.weakestDimension)
                ?.name ?? t("v.unavailable")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Chart
              label={t("v.dimensions")}
              option={{
                radar: {
                  indicator: scores.map((item) => ({
                    name: item.name,
                    max: 100,
                  })),
                  radius: "58%",
                },
                series: [
                  {
                    type: "radar",
                    data: [{ value: scores.map((item) => item.score) }],
                  },
                ],
              }}
            />
            <dl className="flex flex-col gap-3">
              {scores.map((item) => (
                <div
                  key={item.code}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-2"
                >
                  <dt>
                    {item.name}
                    {item.code === analysis?.weakestDimension && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t("v.weakest")}
                      </span>
                    )}
                  </dt>
                  <dd className="font-mono">{number(item.score)} / 100</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
      {statistics && (
        <>
          <p className="text-xs text-muted-foreground">{t("v.statsNote")}</p>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{t("v.tagStats")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(analysis?.tagStats ?? []).length ? (
                  <dl className="flex flex-col gap-2">
                    {(analysis?.tagStats ?? []).map((item) => (
                      <div
                        key={item.tag}
                        className="flex flex-wrap justify-between gap-3"
                      >
                        <dt>{item.tag}</dt>
                        <dd>
                          {t("v.solved")}: {item.solvedCount} /{" "}
                          {t("v.attempted")}: {item.attemptedProblemCount} ·{" "}
                          {t("v.submissions")}: {item.submissionCount}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <EmptyState title={t("v.noRecords")} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{t("v.difficultyStats")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(analysis?.difficultyStats ?? []).length ? (
                  <>
                    <Chart
                      label={t("v.difficultyStats")}
                      option={{
                        grid: { left: 50, right: 15, bottom: 45 },
                        xAxis: {
                          type: "category",
                          data: (analysis?.difficultyStats ?? []).map(
                            (item) => item.difficulty ?? t("v.unrated"),
                          ),
                        },
                        yAxis: { type: "value", minInterval: 1 },
                        series: [
                          {
                            type: "bar",
                            name: t("v.solved"),
                            data: (analysis?.difficultyStats ?? []).map(
                              (item) => item.solvedCount,
                            ),
                          },
                        ],
                      }}
                    />
                    <dl className="flex flex-col gap-1">
                      {(analysis?.difficultyStats ?? []).map((item) => (
                        <div
                          key={item.difficulty ?? "unrated"}
                          className="flex justify-between gap-3"
                        >
                          <dt>{item.difficulty ?? t("v.unrated")}</dt>
                          <dd>
                            {item.solvedCount} / {item.attemptedProblemCount}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <EmptyState title={t("v.noRecords")} />
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("v.activityStats")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {daily.length ? (
                <Chart
                  label={t("v.activityStats")}
                  option={{
                    legend: {},
                    tooltip: { trigger: "axis" },
                    grid: { left: 50, right: 15, bottom: 45 },
                    xAxis: {
                      type: "category",
                      data: daily.map((item) => item.date),
                    },
                    yAxis: { type: "value", minInterval: 1 },
                    series: [
                      {
                        type: "line",
                        name: t("v.submissions"),
                        data: daily.map((item) => item.submissionCount),
                      },
                      {
                        type: "line",
                        name: t("v.solved"),
                        data: daily.map((item) => item.solvedCount),
                      },
                      {
                        type: "line",
                        name: t("v.pendingCount"),
                        data: daily.map((item) => item.pendingSubmissionCount),
                      },
                    ],
                  }}
                />
              ) : (
                <EmptyState title={t("v.noRecords")} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
