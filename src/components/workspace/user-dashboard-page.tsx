"use client";
import Link from "next/link";
import { v012 } from "@/lib/api/v012";
import { useLocale } from "@/components/layout/locale-provider";
import { useUserQuery } from "./use-user-query";
import { AnalysisView } from "./analysis-view";
import { QueryFeedback, EmptyState, DataRegion } from "./feedback";
import { Panel } from "./v012-shared";
import {
  UserSources,
  UserAnalysisEmpty,
  UserRebuild,
} from "./user-analysis-page";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetricPanel } from "./metric-panel";
export function UserDashboardPage() {
  const { t, locale } = useLocale();
  const overview = useUserQuery(
    "user-analysis",
    { endpoint: "overview", window: "30D" },
    (id, signal) => v012.userOverview(id, "30D", signal),
  );
  const analysis = useUserQuery(
    "user-analysis",
    { endpoint: "latest", window: "ALL" },
    (id, signal) => v012.userAnalysis(id, "ALL", signal),
  );
  const report = useUserQuery(
    "reports",
    { endpoint: "latest" },
    (_id, signal) => v012.latestReport(signal),
  );
  const teams = useUserQuery(
    "teams",
    { endpoint: "mine", scope: "JOINED", page: 1, pageSize: 5 },
    (_id, signal) => v012.mine("JOINED", { page: 1, pageSize: 5 }, signal),
  );
  const invitations = useUserQuery(
    "team-invitations",
    { status: "PENDING", page: 1, pageSize: 5 },
    (_id, signal) =>
      v012.myInvitations({ status: "PENDING", page: 1, pageSize: 5 }, signal),
  );
  const unread = useUserQuery("unread-count", {}, (_id, signal) =>
    v012.unreadCount(signal),
  );
  return (
    <>
      <DataRegion
        query={overview}
        name={t("v12.aggregate")}
        empty={!!overview.data && overview.data.summary.submissionCount === 0}
      >
        <p className="text-sm text-muted-foreground">
          {t("v12.aggregateNote")}
        </p>

        {overview.data ? (
          <AnalysisView
            analysis={overview.data}
            statistics
            aggregate
            distributions={false}
            ratings={false}
          />
        ) : (
          !overview.isFetching && <UserAnalysisEmpty />
        )}
      </DataRegion>
      <QueryFeedback query={analysis} />
      {analysis.data && (
        <>
          <MetricPanel
            title="v12.abilitySummary"
            description={
              <>
                {t("v.window.ALL")} · {t("v.cutoff")}:{" "}
                <time dateTime={analysis.data.dataCutoffAt}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: analysis.data.timezone,
                  }).format(new Date(analysis.data.dataCutoffAt))}
                </time>
                {analysis.data.stale && (
                  <Badge variant="warning" className="ml-2">
                    {t("v.stale")}
                  </Badge>
                )}
              </>
            }
            metrics={[
              ["v.overallScore", analysis.data.overallScore],
              [
                "v.weakest",
                t(`data.dimension.${analysis.data.weakestDimension}`),
              ],
              ["v12.highestRating", analysis.data.currentRating],
              ["v12.highestMaxRating", analysis.data.maxRating],
            ]}
          />
          {analysis.data.stale && (
            <Alert>
              <AlertDescription>{t("v12.staleNote")}</AlertDescription>
            </Alert>
          )}
          {!analysis.data.summary.submissionCount && (
            <EmptyState title={t("v.noEvidence")} />
          )}
          <Link
            href="/profile"
            className={buttonVariants({
              variant: "outline",
              wrap: true,
              className: "self-start",
            })}
          >
            {t("v12.openProfile")}
          </Link>
          <UserSources analysis={analysis.data} />
        </>
      )}
      <UserRebuild />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="v12.reports" variant="analysis">
          <QueryFeedback query={report} />
          {report.data ? (
            <>
              <p className="whitespace-pre-wrap break-words">
                {report.data.content.overview}
              </p>
              <time dateTime={report.data.generatedAt}>
                {report.data.generatedAt}
              </time>
            </>
          ) : (
            <EmptyState title={t("v12.noReport")} />
          )}
          <Link
            href="/analysis"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("v12.open")}
          </Link>
        </Panel>
        <Panel title="v12.myTeams" variant="supporting">
          <QueryFeedback query={teams} />
          {teams.data?.data.map((team) => (
            <Link
              key={team.teamId}
              href={`/teams/detail?teamId=${team.teamId}`}
              className="underline"
            >
              {team.name} · {team.memberCount}
            </Link>
          ))}
          {teams.data?.data.length === 0 && (
            <EmptyState title={t("v12.noTeams")} />
          )}
          <Link href="/teams">{t("v12.teams")}</Link>
        </Panel>
        <Panel title="v12.invitations" variant="supporting">
          <QueryFeedback query={invitations} />
          {invitations.data?.data.map((invite) => (
            <p key={invite.invitationId}>
              {invite.team.name} ·{" "}
              {invite.inviter.displayName ?? invite.inviter.username}
            </p>
          ))}
          {invitations.data?.data.length === 0 && (
            <EmptyState title={t("v12.noInvitations")} />
          )}
          <Link href="/teams?tab=invitations">{t("v12.open")}</Link>
        </Panel>
        <Panel title="v12.notifications" variant="supporting">
          <QueryFeedback query={unread} />
          <p>
            {t("v12.unread")}: {unread.data?.count ?? "—"}
          </p>
          <Link href="/notifications">{t("v12.open")}</Link>
        </Panel>
      </div>
    </>
  );
}
