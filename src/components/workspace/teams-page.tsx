"use client";
import { useState, useId } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { v012 } from "@/lib/api/v012";
import {
  applicationStatuses,
  invitationStatuses,
  type JoinApplicationStatus,
  type TeamInvitationStatus,
} from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUserQuery } from "./use-user-query";
import { Pagination, QueryFeedback, EmptyState } from "./feedback";
import { TeamCard, ApplicationRow, InvitationRow } from "./team-records";
const tabs = ["mine", "applications", "invitations", "search"] as const;
type Tab = (typeof tabs)[number];
export function TeamsPage({ managed = false }: { managed?: boolean }) {
  const params = useSearchParams();
  return (
    <TeamsContent
      key={`${managed}:${params.get("tab")}:${params.get("task")}`}
      managed={managed}
    />
  );
}
function TeamsContent({ managed }: { managed: boolean }) {
  const params = useSearchParams();
  const chosen = managed ? "mine" : params.get("tab");
  const task = ["applications", "invitations"].includes(
    params.get("task") ?? "",
  )
    ? params.get("task")!
    : "overview";
  const router = useRouter();
  const tab: Tab = tabs.includes(chosen as Tab) ? (chosen as Tab) : "mine";
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { t } = useLocale();
  const id = useId();
  const scope = managed ? "MANAGED" : "JOINED";
  const mine = useUserQuery(
    "teams",
    { endpoint: "mine", scope, page },
    (_id, signal) => v012.mine(scope, { page }, signal),
    tab === "mine",
  );
  const results = useUserQuery(
    "teams",
    { endpoint: "search", q: search, page },
    (_id, signal) => v012.searchTeams(search, { page }, signal),
    tab === "search" && !!search,
  );
  const applications = useUserQuery(
    "team-applications",
    { page, status },
    (_id, signal) =>
      v012.myApplications(
        { page, status: (status as JoinApplicationStatus) || undefined },
        signal,
      ),
    tab === "applications",
  );
  const invitations = useUserQuery(
    "team-invitations",
    { page, status },
    (_id, signal) =>
      v012.myInvitations(
        { page, status: (status as TeamInvitationStatus) || undefined },
        signal,
      ),
    tab === "invitations",
  );
  const query =
    tab === "mine"
      ? mine
      : tab === "search"
        ? results
        : tab === "applications"
          ? applications
          : invitations;
  return (
    <>
      {managed ? (
        <div className="workspace-context-header flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t(task === "overview" ? "v12.coachNote" : "v12.managedQueueNote")}
          </p>
          <Link href="/coach/teams/create" className={buttonVariants()}>
            {t("v12.createTeam")}
          </Link>
        </div>
      ) : (
        <ToggleGroup
          value={[tab]}
          className="flex-wrap"
          aria-label={t("v12.teams")}
          onValueChange={(value) => {
            if (tabs.includes(value[0] as Tab)) {
              router.push(
                `${managed ? "/coach/teams" : "/teams"}?tab=${value[0]}`,
                { scroll: false },
              );
              setPage(1);
              setStatus("");
            }
          }}
        >
          {tabs.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(
                value === "mine"
                  ? "v12.myTeams"
                  : value === "search"
                    ? "v12.searchTeams"
                    : `v12.${value}`,
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {tab === "search" && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
        >
          <Field className="max-w-md">
            <FieldLabel htmlFor={`${id}-q`}>{t("v12.searchQuery")}</FieldLabel>
            <Input
              id={`${id}-q`}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              required
            />
          </Field>
          <Button wrap type="submit">
            {t("v12.search")}
          </Button>
        </form>
      )}
      {["applications", "invitations"].includes(tab) && (
        <Field className="max-w-sm">
          <FieldLabel htmlFor={`${id}-status`}>{t("v12.status")}</FieldLabel>
          <ChoiceSelect
            id={`${id}-status`}
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "", label: t("v12.all") },
              ...(tab === "applications"
                ? applicationStatuses
                : invitationStatuses
              ).map((value) => ({ value, label: t(`v12.status.${value}`) })),
            ]}
          />
        </Field>
      )}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {t(
            managed
              ? task === "applications"
                ? "v12.pendingApplications"
                : task === "invitations"
                  ? "v12.pendingInvitations"
                  : "v12.manage"
              : tab === "mine"
                ? "v12.myTeams"
                : tab === "search"
                  ? "v12.discoverTeams"
                  : `v12.${tab}`,
          )}
        </h2>
        {tab === "search" && !search && (
          <EmptyState title={t("v12.searchGuide")} />
        )}
        <QueryFeedback query={query} />
        {tab === "mine" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {mine.data?.data.map((team) => (
              <TeamCard key={team.teamId} team={team} section={task} />
            ))}
          </div>
        )}
        {tab === "search" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {results.data?.data.map((team) => (
              <TeamCard key={team.teamId} team={team} searchable />
            ))}
          </div>
        )}
        {tab === "applications" &&
          applications.data?.data.map((application) => (
            <ApplicationRow
              key={application.applicationId}
              application={application}
            />
          ))}
        {tab === "invitations" &&
          invitations.data?.data.map((invitation) => (
            <InvitationRow
              key={invitation.invitationId}
              invitation={invitation}
            />
          ))}
        {query.data?.data.length === 0 && (
          <EmptyState
            title={t(
              tab === "mine"
                ? "v12.noTeams"
                : tab === "search"
                  ? "v12.noSearch"
                  : tab === "applications"
                    ? "v12.noApplications"
                    : "v12.noInvitations",
            )}
          />
        )}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
      </section>
    </>
  );
}
