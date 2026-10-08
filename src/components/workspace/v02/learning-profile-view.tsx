"use client";
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
        description={`${t(`v.window.${profile.window}`)} · ${profile.timezone}`}
        metrics={[
          ["v.attempted", summary.attemptedProblemCount],
          ["v.solved", summary.solvedCount],
          ["v.submissions", summary.submissionCount],
          ["v.activeDays", summary.activeDays],
        ]}
        secondary={[
          ["v.unsolved", summary.unsolvedProblemCount],
          ["v.accepted", summary.acceptedSubmissionCount],
          ["v.failed", summary.failedSubmissionCount],
          ["v.pendingCount", summary.pendingSubmissionCount],
        ]}
      />
      <p className="text-sm text-muted-foreground">
        {t("v.cutoff")}:{" "}
        <time dateTime={profile.dataCutoffAt}>
          {formatTimestamp(profile.dataCutoffAt, locale)}
        </time>
        {profile.stale && (
          <>
            {" "}
            · <Badge variant="warning">{t("v.stale")}</Badge>
          </>
        )}
      </p>
      {summary.submissionCount === 0 && (
        <EmptyState title={t("v02.profileZero")} embedded />
      )}
      <MetricPanel
        title="v02.sources"
        metrics={[
          ["v02.platformSubmissions", profile.sources.platformSubmissionCount],
          ["v02.externalSubmissions", profile.sources.externalSubmissionCount],
          ["v02.codeAnalyses", profile.sources.codeAnalysisCount],
        ]}
      />
      {!compact && (
        <>
          <Panel
            title="v.dimensions"
            variant="analysis"
            description={t("profile.dimensionNote")}
          >
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
                    className="analysis-dimension-row"
                    data-weakest={item.code === profile.weakestDimension}
                  >
                    <dt>
                      {t(`data.dimension.${item.code}`)}
                      {item.code === profile.weakestDimension && (
                        <Badge variant="outline">{t("v.weakest")}</Badge>
                      )}
                    </dt>
                    <dd>
                      {formatNumber(item.score, locale, 2)} / 100 ·{" "}
                      {t("v.solved")}: {item.solvedCount}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <p>
              {t("v.overallScore")}:{" "}
              {formatNumber(profile.overallScore, locale, 2)} / 100
            </p>
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
          <Panel
            title="v02.difficulty"
            variant="analysis"
            description={t("v02.difficultyNote")}
          >
            {!profile.difficultyStats.length && (
              <EmptyState embedded title={t("v.noRecords")} />
            )}
            {groupLearningDifficulty(profile.difficultyStats).map(
              ({ scale, buckets }) => (
                <section
                  key={scale}
                  className="flex min-w-0 flex-col gap-3"
                  aria-label={t(`v02.scale.${scale}`)}
                >
                  <h3 className="font-medium">{t(`v02.scale.${scale}`)}</h3>
                  <Chart
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
          </Panel>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Panel title="v.activityStats" variant="analysis">
              {activity.length ? (
                <Chart
                  label={t("v.activityStats")}
                  option={trendOption(
                    activity.map((item) => item.date),
                    [
                      {
                        name: t("v.submissions"),
                        values: activity.map((item) => item.submissionCount),
                      },
                      {
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
