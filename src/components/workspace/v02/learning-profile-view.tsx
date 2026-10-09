"use client";
import { FingerprintIcon, TargetIcon } from "lucide-react";
import type { LearningProfile } from "@/lib/api/v02-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
import { activitySeries } from "@/lib/charts/data";
import {
  distributionOption,
  radarOption,
  trendOption,
} from "@/lib/charts/options";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Chart } from "../chart";
import { EmptyState } from "../feedback";
import { MetricPanel } from "../metric-panel";
import { Panel } from "../v012-shared";
import { groupLearningDifficulty } from "./learning-model";

export function LearningProfileView({
  profile,
  compact = false,
}: {
  profile: LearningProfile;
  compact?: boolean;
}) {
  const { t, locale } = useLocale();
  const summary = profile.summary;
  const dimensions = [...profile.dimensions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const activity = activitySeries(profile);
  const chartTags = profile.tagStats.slice(0, 10);
  return (
    <>
      {profile.stale && (
        <Alert>
          <AlertDescription>{t("v02.profileStale")}</AlertDescription>
        </Alert>
      )}
      <MetricPanel
        title="v02.learningOverview"
        description={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>
              {t(`v.window.${profile.window}`)} · {profile.timezone}
            </span>
            <span className="text-xs">
              {t("v.cutoff")}:{" "}
              <time dateTime={profile.dataCutoffAt}>
                {formatTimestamp(profile.dataCutoffAt, locale)}
              </time>
              {profile.stale && (
                <Badge variant="warning" className="ml-2">
                  {t("v.stale")}
                </Badge>
              )}
            </span>
          </div>
        }
        metrics={[
          ["v.solved", summary.solvedCount],
          ["v.attempted", summary.attemptedProblemCount],
          ["v.submissions", summary.submissionCount],
          ["v.activeDays", summary.activeDays],
        ]}
        secondary={
          compact
            ? undefined
            : [
                ["v.unsolved", summary.unsolvedProblemCount],
                ["v.accepted", summary.acceptedSubmissionCount],
                ["v.failed", summary.failedSubmissionCount],
                ["v.pendingCount", summary.pendingSubmissionCount],
              ]
        }
      />
      {summary.submissionCount === 0 && (
        <EmptyState title={t("v02.profileZero")} embedded />
      )}
      {!compact && (
        <>
          <Panel
            title="v.dimensions"
            variant="analysis"
            description={t("profile.dimensionNote")}
          >
            <div className="ability-score-summary flex min-w-0 flex-wrap items-end justify-between gap-5 border-b border-insight/15 pb-6">
              <div className="min-w-0">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-insight">
                  <FingerprintIcon className="size-4" aria-hidden="true" />
                  {t("v.overallScore")}
                </p>
                <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums text-insight sm:text-6xl">
                  {formatNumber(profile.overallScore, locale, 2)}
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    / 100
                  </span>
                </p>
              </div>
              <Badge wrap variant="insight">
                <TargetIcon aria-hidden="true" />
                {t("v.weakest")} ·{" "}
                {t(`data.dimension.${profile.weakestDimension}`)}
              </Badge>
            </div>
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <Chart
                label={t("v.dimensions")}
                palette="ability"
                size="ability"
                option={radarOption(
                  dimensions.map((item) => ({
                    name: t(`data.dimension.${item.code}`),
                    score: item.score,
                  })),
                  t("v.overallScore"),
                )}
              />
              <dl className="analysis-dimension-list">
                {dimensions.map((item) => (
                  <div
                    key={item.code}
                    className="analysis-dimension-row grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]"
                    data-weakest={item.code === profile.weakestDimension}
                  >
                    <dt>
                      {t(`data.dimension.${item.code}`)}
                      {item.code === profile.weakestDimension && (
                        <Badge wrap variant="outline">
                          {t("v.weakest")}
                        </Badge>
                      )}
                    </dt>
                    <dd>{formatNumber(item.score, locale, 2)} / 100</dd>
                    <div
                      className="col-span-full h-1.5 overflow-hidden rounded-full bg-insight/10"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full bg-linear-to-r from-insight/60 to-insight"
                        style={{
                          width: `${Math.max(0, Math.min(100, item.score))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <DetailsDisclosure title={t("v02.dimensionEvidence")}>
              <dl className="flex flex-col gap-3">
                {dimensions.map((item) => (
                  <div key={item.code} className="flex flex-col gap-1">
                    <dt className="font-medium">
                      {t(`data.dimension.${item.code}`)}
                    </dt>
                    <dd>
                      {t("v.attempted")}: {item.attemptedProblemCount} ·{" "}
                      {t("v.solved")}: {item.solvedCount} · {t("v.submissions")}
                      : {item.submissionCount} · CF_RATING{" "}
                      {t("profile.averageDifficulty")}:{" "}
                      {item.averageSolvedDifficulty === null
                        ? t("v.unavailable")
                        : formatNumber(item.averageSolvedDifficulty, locale, 2)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailsDisclosure>
          </Panel>
          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
            <MetricPanel
              title="v02.codeQuality"
              description={t("v02.codeQualityNote")}
              metrics={[
                [
                  "v02.analyzedSubmissions",
                  profile.codeQuality.analyzedSubmissionCount,
                ],
                ["v02.warnings", profile.codeQuality.warningCount],
                ["v02.errors", profile.codeQuality.errorCount],
                [
                  "v02.maxCyclomatic",
                  profile.codeQuality.maxCyclomaticComplexity,
                ],
              ]}
            />
            <MetricPanel
              title="v02.cfStatistics"
              description={t("v02.cfStatisticsNote")}
              metrics={[
                ["v.rating", profile.currentRating],
                ["v.maxRating", profile.maxRating],
                ["profile.averageDifficulty", summary.averageSolvedDifficulty],
                ["profile.maxDifficulty", summary.maxSolvedDifficulty],
              ]}
              secondary={[
                ["v.ratedSolved", summary.ratedSolvedCount],
                ["v.unratedSolved", summary.unratedSolvedCount],
              ]}
            />
          </div>
          <Panel
            title="v02.difficulty"
            variant="analysis"
            description={t("v02.difficultyNote")}
          >
            {!profile.difficultyStats.length && (
              <EmptyState embedded title={t("v.noRecords")} />
            )}
            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              {groupLearningDifficulty(profile.difficultyStats).map(
                ({ scale, buckets }) => (
                  <section
                    key={scale}
                    className="flex min-w-0 flex-col gap-3"
                    aria-label={t(`v02.scale.${scale}`)}
                  >
                    <h3 className="font-medium">{t(`v02.scale.${scale}`)}</h3>
                    <Chart
                      palette="distribution"
                      label={`${t("v02.difficulty")} · ${t(`v02.scale.${scale}`)}`}
                      option={distributionOption(
                        buckets.map((stat) =>
                          stat.difficulty === null
                            ? t("v02.scale.UNRATED")
                            : String(stat.difficulty),
                        ),
                        buckets.map((stat) => stat.attemptedProblemCount),
                        buckets.map((stat) => stat.solvedCount),
                        [t("v.attempted"), t("v.solved")],
                      )}
                    />
                    <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      {buckets.map((stat) => (
                        <div key={`${scale}:${stat.difficulty}`}>
                          <dt>
                            {t(`v02.scale.${scale}`)} ·{" "}
                            {stat.difficulty ?? t("v02.scale.UNRATED")}
                          </dt>
                          <dd>
                            {t("v.attempted")}: {stat.attemptedProblemCount} ·{" "}
                            {t("v.solved")}: {stat.solvedCount}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ),
              )}
            </div>
          </Panel>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Panel title="v.activityStats" variant="analysis">
              {activity.length ? (
                <Chart
                  palette="activity"
                  label={t("v.activityStats")}
                  option={trendOption(
                    activity.map((item) => item.date),
                    [
                      {
                        id: "submissions",
                        name: t("v.submissions"),
                        values: activity.map((item) => item.submissionCount),
                      },
                      {
                        id: "accepted",
                        name: t("v.accepted"),
                        values: activity.map(
                          (item) => item.acceptedSubmissionCount,
                        ),
                      },
                    ],
                  )}
                />
              ) : (
                <EmptyState embedded title={t("v.noRecords")} />
              )}
              {activity.length > 0 && (
                <DetailsDisclosure
                  title={t("v02.activityEvidence")}
                  keepMounted={false}
                >
                  <dl className="flex flex-col gap-3">
                    {activity.map((item) => (
                      <div key={item.date} className="flex flex-col gap-1">
                        <dt>
                          <time dateTime={item.date}>{item.date}</time>
                        </dt>
                        <dd>
                          {t("v.submissions")}: {item.submissionCount} ·{" "}
                          {t("v.accepted")}: {item.acceptedSubmissionCount} ·{" "}
                          {t("v.failed")}: {item.failedSubmissionCount} ·{" "}
                          {t("v.pendingCount")}: {item.pendingSubmissionCount} ·{" "}
                          {t("v.solved")}: {item.solvedCount}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </DetailsDisclosure>
              )}
            </Panel>
            <Panel title="v.tagStats" variant="analysis">
              {profile.tagStats.length ? (
                <>
                  <Chart
                    palette="distribution"
                    label={t("v.tagStats")}
                    option={distributionOption(
                      chartTags.map((item) => item.tag),
                      chartTags.map((item) => item.attemptedProblemCount),
                      chartTags.map((item) => item.solvedCount),
                      [t("v.attempted"), t("v.solved")],
                      true,
                    )}
                  />
                  <dl className="flex flex-col gap-2 text-xs">
                    {profile.tagStats.map((item) => (
                      <div key={item.tag}>
                        <dt>{item.tag}</dt>
                        <dd>
                          {t("v.attempted")}: {item.attemptedProblemCount} ·{" "}
                          {t("v.solved")}: {item.solvedCount} ·{" "}
                          {t("v.submissions")}: {item.submissionCount}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <EmptyState embedded title={t("v.noRecords")} />
              )}
            </Panel>
          </div>
          <MetricPanel
            title="v02.sources"
            metrics={[
              [
                "v02.platformSubmissions",
                profile.sources.platformSubmissionCount,
              ],
              [
                "v02.externalSubmissions",
                profile.sources.externalSubmissionCount,
              ],
              ["v02.codeAnalyses", profile.sources.codeAnalysisCount],
            ]}
          />
          <Panel title="v02.snapshotMetadata" variant="supporting">
            <dl className="metric-details">
              <div>
                <dt>{t("v02.periodStart")}</dt>
                <dd>
                  {profile.period.start
                    ? formatTimestamp(profile.period.start, locale)
                    : t("v02.periodAll")}
                </dd>
              </div>
              <div>
                <dt>{t("v02.periodEnd")}</dt>
                <dd>{formatTimestamp(profile.period.end, locale)}</dd>
              </div>
              <div>
                <dt>{t("v02.snapshotId")}</dt>
                <dd className="break-all">{profile.snapshotId}</dd>
              </div>
              <div>
                <dt>{t("v02.profileJobId")}</dt>
                <dd className="break-all">{profile.profileJobId}</dd>
              </div>
              <div>
                <dt>{t("v02.createdAt")}</dt>
                <dd>{formatTimestamp(profile.createdAt, locale)}</dd>
              </div>
              <div>
                <dt>{t("v02.algorithmVersion")}</dt>
                <dd>{profile.algorithmVersion}</dd>
              </div>
              <div>
                <dt>{t("v02.mappingVersion")}</dt>
                <dd>{profile.mappingVersion}</dd>
              </div>
            </dl>
            <p>
              {t("v02.sourceAccounts")}:{" "}
              {profile.sources.sourceAccountIds.length
                ? profile.sources.sourceAccountIds.join(", ")
                : t("v02.sourceAccountsNone")}
            </p>
            <DetailsDisclosure title={t("v02.fingerprint")}>
              <p className="break-all font-mono">{profile.sourceFingerprint}</p>
            </DetailsDisclosure>
          </Panel>
        </>
      )}
    </>
  );
}
