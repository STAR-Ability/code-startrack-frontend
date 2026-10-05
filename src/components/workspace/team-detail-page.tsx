"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UsersRoundIcon,
  ClipboardListIcon,
  MailIcon,
  ActivityIcon,
  ArrowRightIcon,
} from "lucide-react";
import { v012 } from "@/lib/api/v012";
import { uuidSchema } from "@/lib/api/schemas";
import type { TeamDetailDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/errors";
import { Status, useCollaborationMutation, useTeamQuery } from "./v012-shared";
import { EmptyState, ErrorNotice, QueryFeedback } from "./feedback";
import { TeamCard } from "./team-records";
import {
  TeamMembers,
  TeamSettings,
  TeamApplications,
  TeamInvitations,
} from "./team-management";
import { TeamInsights, TeamRecommendations } from "./team-insights";
import { cn } from "@/lib/utils";

const sections = [
  "overview",
  "members",
  "analysis",
  "recommendations",
  "applications",
  "invitations",
  "settings",
] as const;
type TeamSection = (typeof sections)[number];
export function teamSectionHref(teamId: string, tab: string) {
  return `/teams/detail?teamId=${teamId}&tab=${tab}`;
}
export function TeamDetailPage() {
  const params = useSearchParams();
  const teamId = params.get("teamId") ?? "";
  const { t } = useLocale();
  if (!uuidSchema.safeParse(teamId).success)
    return (
      <EmptyState
        title={t("v12.invalidRoute")}
        href="/teams"
        action={t("v12.teams")}
      />
    );
  const chosen = params.get("tab");
  const tab = sections.includes(chosen as TeamSection)
    ? (chosen as TeamSection)
    : "overview";
  return <TeamDetailContent key={teamId} teamId={teamId} tab={tab} />;
}
function TeamDetailContent({
  teamId,
  tab,
}: {
  teamId: string;
  tab: TeamSection;
}) {
  const { t } = useLocale();
  const [confirm, setConfirm] = useState(false);
  const query = useTeamQuery(teamId, "detail", {}, (signal) =>
    v012.team(teamId, signal),
  );
  const mutation = useCollaborationMutation(
    "membership",
    () => v012.leaveTeam(teamId),
    teamId,
    () => setConfirm(false),
  );
  const team = query.data;
  const labels = {
    overview: "v12.overview",
    members: "v12.members",
    analysis: "v12.teamAnalysis",
    recommendations: "v12.teamRecommendations",
    applications: "v12.applications",
    invitations: "v12.invitations",
    settings: "v12.teamSettings",
  } as const;
  const visible = (section: TeamSection) =>
    section === "overview" ||
    (["applications", "invitations", "settings"].includes(section)
      ? !!team?.canManage
      : !!(team?.myMembershipRole || team?.canManage));
  return (
    <>
      <QueryFeedback query={query} />
      {query.error instanceof ApiError &&
        [403, 404].includes(query.error.status) && (
          <Link href="/teams" className="underline">
            {t("v12.teams")}
          </Link>
        )}
      {team && (
        <>
          <header className="workspace-context-header flex flex-wrap items-start gap-4">
            <Avatar size="lg" className="size-14">
              {team.avatarUrl && <AvatarImage src={team.avatarUrl} alt="" />}
              <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words text-2xl font-semibold tracking-tight">
                  {team.name}
                </h2>
                <Status value={team.status} />
              </div>
              {team.description && (
                <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {team.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {t("v12.members")}: {team.memberCount}
                </span>
                <span>
                  {t("v12.owner")}:{" "}
                  {team.owner.displayName ?? team.owner.username}
                </span>
                {team.myMembershipRole && (
                  <Badge variant="outline">
                    {t(
                      team.myMembershipRole === "OWNER"
                        ? "v12.owner"
                        : "v12.member",
                    )}
                  </Badge>
                )}
              </div>
            </div>
            {team.canManage && (
              <Link
                href={teamSectionHref(teamId, "applications")}
                className={buttonVariants({ variant: "outline", wrap: true })}
              >
                {t("v12.pendingApplications")}
              </Link>
            )}
            {team.canLeave && (
              <Button
                wrap
                variant="outline"
                disabled={mutation.blocked}
                onClick={() => setConfirm(true)}
              >
                {t("v12.leave")}
              </Button>
            )}
          </header>
          {team.status !== "ACTIVE" && (
            <Alert>
              <AlertDescription>
                {t(`v12.status.${team.status}`)} · {t("v12.readonlyTeam")}
              </AlertDescription>
            </Alert>
          )}
          <nav
            aria-label={t("v12.teamNavigation")}
            className="team-section-navigation z-10 md:sticky md:top-0 flex min-w-0 flex-wrap gap-1 rounded-xl border border-surface-border bg-surface-reading p-1"
          >
            {sections.filter(visible).map((section) => (
              <Link
                key={section}
                href={teamSectionHref(teamId, section)}
                prefetch={false}
                aria-current={tab === section ? "page" : undefined}
                className={cn(
                  "min-w-0 rounded-lg px-3 py-2 text-sm wrap-anywhere transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
                  tab === section &&
                    "bg-support-soft font-medium text-support hover:bg-support-soft",
                )}
              >
                {t(labels[section])}
              </Link>
            ))}
          </nav>
          <div
            key={`${teamId}:${tab}:${team.canManage}`}
            className="flex min-w-0 flex-col gap-5"
          >
            {!visible(tab) ? (
              <EmptyState
                title={t("v12.TEAM_FORBIDDEN")}
                href={teamSectionHref(teamId, "overview")}
                action={t("v12.overview")}
              />
            ) : (
              <>
                {tab === "overview" &&
                  (team.myMembershipRole || team.canManage ? (
                    <TeamOverview team={team} />
                  ) : (
                    <TeamCard team={team} searchable />
                  ))}
                {tab === "members" && <TeamMembers team={team} />}
                {tab === "analysis" && <TeamInsights team={team} />}
                {tab === "recommendations" && (
                  <TeamRecommendations team={team} />
                )}
                {tab === "applications" && team.canManage && (
                  <TeamApplications team={team} />
                )}
                {tab === "invitations" && team.canManage && (
                  <TeamInvitations team={team} />
                )}
                {tab === "settings" && team.canManage && (
                  <TeamSettings team={team} />
                )}
              </>
            )}
          </div>
        </>
      )}
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!mutation.isPending) setConfirm(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("v12.confirmLeave")}</AlertDialogTitle>
            <AlertDialogDescription>{team?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <ErrorNotice error={mutation.error} />
          <Button
            wrap
            variant="destructive"
            disabled={mutation.blocked}
            onClick={() => mutation.mutate()}
          >
            {t("v12.leave")}
          </Button>
          <AlertDialogCancel disabled={mutation.isPending}>
            {t("v12.cancel")}
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function TeamOverview({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const applications = useTeamQuery(
    team.teamId,
    "applications",
    { page: 1, status: "PENDING" },
    (signal) =>
      v012.applications(team.teamId, { page: 1, status: "PENDING" }, signal),
    team.canManage,
  );
  const invitations = useTeamQuery(
    team.teamId,
    "invitations",
    { page: 1, status: "PENDING" },
    (signal) =>
      v012.invitations(team.teamId, { page: 1, status: "PENDING" }, signal),
    team.canManage,
  );
  const analysis = useTeamQuery(
    team.teamId,
    "analysis",
    {
      endpoint: "latest",
      membershipRole: team.myMembershipRole,
      canManage: team.canManage,
    },
    (signal) => v012.teamAnalysis(team.teamId, signal),
  );
  const tasks = [
    {
      tab: "members",
      label: "v12.members" as const,
      value: team.memberCount,
      Icon: UsersRoundIcon,
    },
    ...(team.canManage
      ? [
          {
            tab: "applications",
            label: "v12.pendingApplications" as const,
            value: applications.data?.meta.total ?? "—",
            Icon: ClipboardListIcon,
          },
          {
            tab: "invitations",
            label: "v12.pendingInvitations" as const,
            value: invitations.data?.meta.total ?? "—",
            Icon: MailIcon,
          },
        ]
      : []),
    {
      tab: "analysis",
      label: "v12.teamAnalysis" as const,
      value:
        analysis.isFetching && !analysis.data
          ? t("v.loading")
          : analysis.error
            ? t("v12.unavailableState")
            : analysis.data
              ? t(analysis.data.stale ? "v12.staleState" : "v12.readyState")
              : t("v12.noTeamAnalysis"),
      Icon: ActivityIcon,
    },
  ];
  return (
    <>
      <section
        aria-label={t("v12.overview")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {tasks.map(({ tab, label, value, Icon }) => (
          <Link
            key={tab}
            href={teamSectionHref(team.teamId, tab)}
            className="workspace-task-tile group"
          >
            <Icon
              aria-hidden="true"
              className="row-span-2 size-5 text-muted-foreground"
            />
            <span className="min-w-0 text-sm wrap-anywhere text-muted-foreground">
              {t(label)}
            </span>
            <strong className="col-start-2 row-start-2 min-w-0 text-xl font-semibold wrap-anywhere tabular-nums">
              {value}
            </strong>
            <ArrowRightIcon
              aria-hidden="true"
              className="col-start-3 row-span-2 row-start-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 sm:absolute sm:right-4 sm:top-4 motion-reduce:transition-none"
            />
          </Link>
        ))}
      </section>
      {team.canManage && (
        <>
          <QueryFeedback query={applications} />
          <QueryFeedback query={invitations} />
        </>
      )}
      <QueryFeedback query={analysis} />
      <section className="rounded-xl border bg-muted/40 p-5">
        <h3 className="font-semibold">{t("v12.dataAvailability")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("v12.dataAvailabilityNote")}
        </p>
        {analysis.data && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["v12.included", analysis.data.includedMemberCount],
                ["v12.trainingMembers", analysis.data.trainingMemberCount],
                ["v12.levelMembers", analysis.data.levelMemberCount],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                <dd className="mt-1 font-semibold">
                  {value} / {analysis.data!.memberCount}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {!analysis.isFetching && !analysis.error && !analysis.data && (
          <p className="mt-3 text-sm">{t("v12.noTeamAnalysis")}</p>
        )}
        {analysis.data && analysis.data.includedMemberCount === 0 && (
          <p className="mt-3 text-sm">{t("v12.noAbilitySharing")}</p>
        )}
        {analysis.data && analysis.data.levelMemberCount === 0 && (
          <p className="mt-3 text-sm">{t("v12.noLevel")}</p>
        )}
      </section>
    </>
  );
}
