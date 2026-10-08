"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { uuidSchema } from "@/lib/api/schemas";
import type {
  SharedAbilityProfileDto,
  SharedTrainingOverviewDto,
} from "@/lib/api/v012-schemas";
import { keys } from "@/lib/query/keys";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Panel, useTeamQuery } from "./v012-shared";
import { EmptyState, Pagination, QueryFeedback } from "./feedback";
import { MetricPanel } from "./metric-panel";
import { Chart } from "./chart";
import {
  trendOption,
  distributionOption,
  radarOption,
} from "@/lib/charts/options";
import { formatTimestamp } from "@/lib/i18n/locale";
import { PersonalReportView } from "./personal-reports-page";
import { useAccounts } from "./account-provider";
const views = [
  "basicTraining",
  "abilityProfile",
  "detailedSubmissions",
  "analysisReport",
] as const;
type MemberView = (typeof views)[number];
export function SharedTrainingView({
  data,
}: {
  data: SharedTrainingOverviewDto | null;
}) {
  const { t, locale } = useLocale();
  if (data === null) return <EmptyState title={t("v.noAnalysis")} />;
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  return (
    <>
      <MetricPanel
        title="v12.basicTraining"
        metrics={[
          ["v.attempted", data.summary.attemptedProblemCount],
          ["v.solved", data.summary.solvedCount],
          ["v.submissions", data.summary.submissionCount],
          ["v.activeDays", data.summary.activeDays],
        ]}
        secondary={[
          ["v12.highestRating", data.currentRating],
          ["v12.highestMaxRating", data.maxRating],
          ["v12.sources", data.sourceAccountCount],
          ["profile.averageDifficulty", data.summary.averageSolvedDifficulty],
          ["profile.maxDifficulty", data.summary.maxSolvedDifficulty],
          ["v.unsolved", data.summary.unsolvedProblemCount],
          ["v.accepted", data.summary.acceptedSubmissionCount],
          ["v.failed", data.summary.failedSubmissionCount],
          ["v.pendingCount", data.summary.pendingSubmissionCount],
          ["v.ratedSolved", data.summary.ratedSolvedCount],
          ["v.unratedSolved", data.summary.unratedSolvedCount],
        ]}
      />
      {data.stale && <p>{t("v12.staleNote")}</p>}
      <Panel
        title="v.activityStats"
        variant="analysis"
        description={t("v12.activityNote")}
      >
        {data.activityStats.length ? (
          <>
            <Chart
              palette="activity"
              label={t("v.activityStats")}
              option={trendOption(
                data.activityStats.map((item) => item.date),
                [
                  {
                    name: t("v.submissions"),
                    values: data.activityStats.map(
                      (item) => item.submissionCount,
                    ),
                  },
                  {
                    name: t("v.solved"),
                    values: data.activityStats.map((item) => item.solvedCount),
                  },
                ],
              )}
            />
            <DetailsDisclosure
              title={t("metrics.chartValues")}
              keepMounted={false}
            >
              <dl className="flex flex-col gap-2">
                {data.activityStats.map((item) => (
                  <div
                    key={item.date}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt>
                      <time dateTime={item.date}>{item.date}</time>
                    </dt>
                    <dd>
                      {t("v.submissions")}: {number(item.submissionCount)} ·{" "}
                      {t("v.solved")}: {number(item.solvedCount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailsDisclosure>
          </>
        ) : (
          <EmptyState embedded title={t("v.noRecords")} />
        )}
      </Panel>
      <Panel
        title="v.tagStats"
        variant="analysis"
        description={
          data.tagStats.length > 10 ? t("v.chartTagLimit") : undefined
        }
      >
        {data.tagStats.length ? (
          <>
            <Chart
              palette="distribution"
              label={t("v.tagStats")}
              option={distributionOption(
                data.tagStats.slice(0, 10).map((item) => item.tag),
                data.tagStats
                  .slice(0, 10)
                  .map((item) => item.attemptedProblemCount),
                data.tagStats.slice(0, 10).map((item) => item.solvedCount),
                [t("v.attempted"), t("v.solved")],
                true,
              )}
            />
            <DetailsDisclosure
              title={t("metrics.chartValues")}
              keepMounted={false}
            >
              <dl className="flex flex-col gap-2">
                {data.tagStats.map((item) => (
                  <div
                    key={item.tag}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt>{item.tag}</dt>
                    <dd>
                      {t("v.solved")}: {number(item.solvedCount)} /{" "}
                      {t("v.attempted")}: {number(item.attemptedProblemCount)} ·{" "}
                      {t("v.submissions")}: {number(item.submissionCount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailsDisclosure>
          </>
        ) : (
          <EmptyState embedded title={t("v.noRecords")} />
        )}
      </Panel>
      <Panel title="v.difficultyStats" variant="analysis">
        {data.difficultyStats.length ? (
          <>
            <Chart
              palette="distribution"
              label={t("v.difficultyStats")}
              option={distributionOption(
                data.difficultyStats.map(
                  (item) => item.difficulty ?? t("v.unrated"),
                ),
                data.difficultyStats.map((item) => item.attemptedProblemCount),
                data.difficultyStats.map((item) => item.solvedCount),
                [t("v.attempted"), t("v.solved")],
              )}
            />
            <DetailsDisclosure
              title={t("metrics.chartValues")}
              keepMounted={false}
            >
              <dl className="flex flex-col gap-2">
                {data.difficultyStats.map((item) => (
                  <div
                    key={item.difficulty ?? "unrated"}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt>{item.difficulty ?? t("v.unrated")}</dt>
                    <dd>
                      {t("v.solved")}: {number(item.solvedCount)} /{" "}
                      {t("v.attempted")}: {number(item.attemptedProblemCount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailsDisclosure>
          </>
        ) : (
          <EmptyState embedded title={t("v.noRecords")} />
        )}
      </Panel>
    </>
  );
}
export function SharedProfileView({
  data,
}: {
  data: SharedAbilityProfileDto | null;
}) {
  const { t } = useLocale();
  if (data === null) return <EmptyState title={t("v.noAnalysis")} />;
  const dimensions = [...data.dimensions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <Panel title="v12.abilityProfile" variant="analysis">
      <p>
        {t("v.overallScore")}: {data.overallScore} / 100 · {t("v.weakest")}:{" "}
        {t(`data.dimension.${data.weakestDimension}`)}
      </p>
      {data.stale && <p>{t("v12.staleNote")}</p>}
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
      <dl className="grid gap-2 sm:grid-cols-2">
        {dimensions.map((item) => (
          <div key={item.code} className="flex flex-wrap justify-between gap-2">
            <dt>{t(`data.dimension.${item.code}`)}</dt>
            <dd>{item.score} / 100</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
export function TeamMemberPage() {
  const params = useSearchParams();
  const { t } = useLocale();
  const teamId = params.get("teamId") ?? "";
  const publicId = params.get("memberPublicId") ?? "";
  const view = params.get("view") as MemberView;
  if (
    !uuidSchema.safeParse(teamId).success ||
    !uuidSchema.safeParse(publicId).success ||
    !views.includes(view)
  )
    return (
      <EmptyState
        title={t("v12.invalidRoute")}
        href="/teams"
        action={t("v12.teams")}
      />
    );
  return (
    <MemberAccess
      key={`${teamId}:${publicId}:${view}`}
      teamId={teamId}
      publicId={publicId}
      view={view}
    />
  );
}
function MemberAccess({
  teamId,
  publicId,
  view,
}: {
  teamId: string;
  publicId: string;
  view: MemberView;
}) {
  const { t } = useLocale();
  const { user } = useAccounts();
  const client = useQueryClient();
  // Resolve capabilities for THIS team; never reuse another team's member record.
  const query = useTeamQuery(
    teamId,
    "member-access",
    { publicId },
    async (signal) => {
      let page = 1;
      while (true) {
        const result = await v012.members(
          teamId,
          { page, pageSize: 100 },
          signal,
        );
        const member = result.data.find(
          (item) => item.user.publicId === publicId && item.status === "ACTIVE",
        );
        if (member) return member;
        if (!result.meta.hasNext) return null;
        if (result.meta.page !== page || !result.data.length)
          throw new Error("Invalid member pagination");
        page++;
      }
    },
  );
  return (
    <>
      <Link href={`/teams/detail?teamId=${teamId}`} className="underline">
        {t("v12.teamDetail")}
      </Link>
      <QueryFeedback query={query} />
      {query.data?.dataAccess[view] ? (
        <MemberData
          teamId={teamId}
          publicId={publicId}
          view={view}
          refreshAccess={() => {
            client.removeQueries({
              queryKey: keys.team(user.publicId, teamId, "member-data"),
            });
            client.removeQueries({
              queryKey: keys.team(user.publicId, teamId, "member-report"),
            });
            void client.invalidateQueries({
              queryKey: keys.team(user.publicId, teamId, "member-access"),
            });
            void client.invalidateQueries({
              queryKey: keys.team(user.publicId, teamId, "members"),
            });
            void client.invalidateQueries({
              queryKey: keys.team(user.publicId, teamId, "detail"),
            });
          }}
        />
      ) : (
        !query.isFetching &&
        !query.error &&
        query.data !== undefined && (
          <EmptyState title={t("v12.PRIVATE_DENIED")} />
        )
      )}
    </>
  );
}
function MemberData({
  teamId,
  publicId,
  view,
  refreshAccess,
}: {
  teamId: string;
  publicId: string;
  view: MemberView;
  refreshAccess: () => void;
}) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [reportId, setReportId] = useState<string | null>(null);
  const params = { publicId, view, page, reportId };
  const training = useTeamQuery(
    teamId,
    "member-data",
    { ...params, endpoint: "training" },
    (signal) => v012.memberTraining(teamId, publicId, signal),
    view === "basicTraining",
  );
  const profile = useTeamQuery(
    teamId,
    "member-data",
    { ...params, endpoint: "profile" },
    (signal) => v012.memberProfile(teamId, publicId, signal),
    view === "abilityProfile",
  );
  const submissions = useTeamQuery(
    teamId,
    "member-data",
    { ...params, endpoint: "submissions" },
    (signal) => v012.memberSubmissions(teamId, publicId, { page }, signal),
    view === "detailedSubmissions",
  );
  const reports = useTeamQuery(
    teamId,
    "member-data",
    { ...params, endpoint: "reports" },
    (signal) => v012.memberReports(teamId, publicId, { page }, signal),
    view === "analysisReport" && !reportId,
  );
  const report = useTeamQuery(
    teamId,
    "member-report",
    { publicId, reportId },
    (signal) => v012.memberReport(teamId, publicId, reportId!, signal),
    view === "analysisReport" && !!reportId,
  );
  // Each permission domain has its own query key, DTO and rendering boundary.
  const query =
    view === "basicTraining"
      ? training
      : view === "abilityProfile"
        ? profile
        : view === "detailedSubmissions"
          ? submissions
          : reportId
            ? report
            : reports;
  return (
    <>
      <QueryFeedback query={query} />
      {!!query.error && (
        <Button wrap variant="outline" onClick={refreshAccess}>
          {t("v.retry")}
        </Button>
      )}
      {view === "basicTraining" && training.data !== undefined && (
        <SharedTrainingView data={training.data} />
      )}{" "}
      {view === "abilityProfile" && profile.data !== undefined && (
        <SharedProfileView data={profile.data} />
      )}{" "}
      {view === "detailedSubmissions" && (
        <Panel title="v12.detailedSubmissions">
          {submissions.data?.data.map(({ submission: item, sourceAccount }) => (
            <article
              key={item.submissionId}
              className="flex flex-col gap-2 border-b py-3"
            >
              <h3>{item.problem.title ?? item.problem.externalProblemKey}</h3>
              <p>
                {item.verdict === "PENDING" ? t("v.pending") : item.verdict} ·{" "}
                {item.programmingLanguage ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {sourceAccount.username}
              </p>
              <time dateTime={item.submittedAt}>{item.submittedAt}</time>
            </article>
          ))}
          {submissions.data?.data.length === 0 && (
            <EmptyState title={t("v.noRecords")} />
          )}
          <Pagination
            meta={submissions.data?.meta}
            page={page}
            setPage={setPage}
            pending={submissions.isFetching}
          />
        </Panel>
      )}{" "}
      {view === "analysisReport" && (
        <>
          {reportId ? (
            <>
              <Button wrap variant="outline" onClick={() => setReportId(null)}>
                {t("v12.reportHistory")}
              </Button>
              {report.data && <PersonalReportView report={report.data} />}
            </>
          ) : (
            <Panel title="v12.reports">
              {reports.data?.data.map((item) => (
                <div
                  key={item.reportId}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <time dateTime={item.generatedAt}>
                    {formatTimestamp(item.generatedAt, locale)}
                  </time>
                  <Button
                    wrap
                    variant="outline"
                    onClick={() => setReportId(item.reportId)}
                  >
                    {t("v12.open")}
                  </Button>
                </div>
              ))}
              {reports.data?.data.length === 0 && (
                <EmptyState title={t("v12.noReport")} />
              )}
              <Pagination
                meta={reports.data?.meta}
                page={page}
                setPage={setPage}
                pending={reports.isFetching}
              />
            </Panel>
          )}
        </>
      )}
    </>
  );
}
