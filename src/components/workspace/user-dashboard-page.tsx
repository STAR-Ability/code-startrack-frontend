"use client";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChartNoAxesCombinedIcon,
  TargetIcon,
} from "lucide-react";
import { v012 } from "@/lib/api/v012";
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MetricPanel } from "./metric-panel";
import type { UserAnalysisDto } from "@/lib/api/v012-schemas";
import { Skeleton } from "@/components/ui/skeleton";
function DashboardDirection({
  analysis,
  loading,
  failed,
}: {
  analysis: UserAnalysisDto | null;
  loading: boolean;
  failed: boolean;
}) {
  const { t } = useLocale();
  if (failed && !analysis) return null;
  const ready = !!analysis && analysis.summary.submissionCount > 0;
  return (
    <Card
      variant="recommendation"
      interaction="none"
      size="lg"
      data-dashboard-direction
    >
      <CardHeader>
        <CardDescription>{t("dashboard.nextStep")}</CardDescription>
        <CardTitle>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-48 max-w-full" />
            ) : (
              t(ready ? "dashboard.readyTitle" : "dashboard.startTitle")
            )}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 flex-col gap-3">
          {ready && (
            <Badge variant="insight" wrap className="self-start">
              <TargetIcon aria-hidden="true" />
              {t("v.weakest")} ·{" "}
              {t(`data.dimension.${analysis.weakestDimension}`)}
            </Badge>
          )}
          {loading ? (
            <Skeleton className="h-5 w-64 max-w-full" />
          ) : (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t(ready ? "dashboard.readyNote" : "dashboard.startNote")}
            </p>
          )}
        </div>
        {!loading && (
          <div className="flex min-w-0 flex-wrap gap-3">
            <Link
              href={ready ? "/practice" : "/accounts"}
              className={buttonVariants({ wrap: true, size: "lg" })}
            >
              {t(ready ? "dashboard.openPractice" : "v.accounts")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
            <Link
              href="/profile"
              className={buttonVariants({ variant: "outline", wrap: true })}
            >
              {t("v12.openProfile")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <DashboardDirection
        analysis={analysis.data ?? null}
        loading={analysis.isFetching && !analysis.data}
        failed={!!analysis.error}
      />
      <QueryFeedback
        query={analysis}
        showInitialLoading={false}
        resource={t("v12.abilitySummary")}
      />
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
              ["v12.highestRating", analysis.data.currentRating],
              ["v12.highestMaxRating", analysis.data.maxRating],
              ["v12.sources", analysis.data.sourceAccountCount],
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
        </>
      )}
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
          !overview.isFetching &&
          !overview.error &&
          overview.data === null && <UserAnalysisEmpty />
        )}
      </DataRegion>
      {analysis.data && <UserSources analysis={analysis.data} />}
      <UserRebuild />
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card variant="analysis" interaction="none" className="min-w-0">
          <CardHeader className="gap-2">
            <CardTitle>
              <h2 className="flex items-center gap-2">
                <ChartNoAxesCombinedIcon
                  className="size-4 shrink-0 text-insight"
                  aria-hidden="true"
                />
                {t("v12.reports")}
              </h2>
            </CardTitle>
            <CardDescription>{t("v12.reportPreviewNote")}</CardDescription>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-col gap-4">
            <QueryFeedback query={report} resource={t("v12.reports")} />
            {report.data ? (
              <>
                <p className="whitespace-pre-wrap wrap-anywhere leading-relaxed">
                  {report.data.content.overview}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("v12.reportGeneratedAt")}:{" "}
                  <time dateTime={report.data.generatedAt}>
                    {formatTimestamp(report.data.generatedAt, locale)}
                  </time>
                </p>
              </>
            ) : (
              !report.isFetching &&
              !report.error && <EmptyState title={t("v12.noReport")} embedded />
            )}
          </CardContent>
          <CardFooter>
            <Link href="/analysis" className={buttonVariants({ wrap: true })}>
              {t("v12.openReport")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
        <Panel
          title="v12.collaborationUpdates"
          variant="supporting"
          tone="support"
        >
          <section className="flex min-w-0 flex-col gap-3">
            <h3 className="text-sm font-medium">{t("v12.myTeams")}</h3>
            <QueryFeedback query={teams} resource={t("v12.myTeams")} />
            <ul className="flex min-w-0 flex-col divide-y">
              {teams.data?.data.map((team) => (
                <li
                  key={team.teamId}
                  className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/teams/detail?teamId=${team.teamId}`}
                    className="auth-text-link wrap-anywhere font-medium"
                  >
                    {team.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t("v12.members")}: {formatNumber(team.memberCount, locale)}
                  </p>
                </li>
              ))}
            </ul>
            {teams.data?.data.length === 0 && (
              <EmptyState title={t("v12.noTeams")} embedded />
            )}
            <Link
              href="/teams"
              className={buttonVariants({
                variant: "link",
                size: "sm",
                wrap: true,
                className: "self-start",
              })}
            >
              {t("v12.openTeams")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>
          <Separator />
          <section className="flex min-w-0 flex-col gap-3">
            <h3 className="text-sm font-medium">{t("v12.invitations")}</h3>
            <QueryFeedback
              query={invitations}
              resource={t("v12.invitations")}
            />
            <ul className="flex min-w-0 flex-col divide-y">
              {invitations.data?.data.map((invite) => (
                <li
                  key={invite.invitationId}
                  className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0"
                >
                  <p className="wrap-anywhere font-medium">
                    {invite.team.name}
                  </p>
                  <p className="wrap-anywhere text-xs text-muted-foreground">
                    {t("v12.invitedBy")}:{" "}
                    {invite.inviter.displayName ?? invite.inviter.username}
                  </p>
                </li>
              ))}
            </ul>
            {invitations.data?.data.length === 0 && (
              <EmptyState title={t("v12.noInvitations")} embedded />
            )}
            <Link
              href="/teams?tab=invitations"
              className={buttonVariants({
                variant: "link",
                size: "sm",
                wrap: true,
                className: "self-start",
              })}
            >
              {t("v12.openInvitations")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>
          <Separator />
          <section className="flex min-w-0 flex-col gap-3">
            <h3 className="text-sm font-medium">{t("v12.notifications")}</h3>
            <QueryFeedback query={unread} resource={t("v12.unread")} />
            <p className="text-xs text-muted-foreground">
              {t("v12.unread")}:{" "}
              <span className="font-medium tabular-nums text-foreground">
                {unread.data ? formatNumber(unread.data.count, locale) : "—"}
              </span>
            </p>
            <Link
              href="/notifications"
              className={buttonVariants({
                variant: "link",
                size: "sm",
                wrap: true,
                className: "self-start",
              })}
            >
              {t("v12.openNotifications")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>
        </Panel>
      </div>
    </>
  );
}
