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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
        <div className="workspace-context-header team-directory-context">
          <p className="min-w-0 text-sm text-muted-foreground">
            {t(task === "overview" ? "v12.coachNote" : "v12.managedQueueNote")}
          </p>
          <Link
            href="/coach/teams/create"
            className={buttonVariants({ wrap: true })}
          >
            {t("v12.createTeam")}
          </Link>
        </div>
      ) : (
        <ToggleGroup
          value={[tab]}
          className="team-directory-navigation flex-wrap"
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
          className="team-directory-controls"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
        >
          <FieldGroup className="team-directory-search-fields grid min-w-0 items-end gap-3">
            <Field className="min-w-0">
              <FieldLabel htmlFor={`${id}-q`}>
                {t("v12.searchQuery")}
              </FieldLabel>
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
          </FieldGroup>
        </form>
      )}
      {["applications", "invitations"].includes(tab) && (
        <Field className="team-directory-controls max-w-sm">
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
      <section
        className="team-directory-section flex min-w-0 flex-col gap-3"
        aria-labelledby={`${id}-directory`}
      >
        <h2
          id={`${id}-directory`}
          className="team-directory-heading text-lg font-semibold"
        >
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
          <EmptyState title={t("v12.searchGuide")} embedded />
        )}
        <QueryFeedback query={query} />
        {tab === "mine" && !!mine.data?.data.length && (
          <ul
            className="team-directory-list"
            aria-labelledby={`${id}-directory`}
          >
            {mine.data?.data.map((team) => (
              <li key={team.teamId} className="min-w-0">
                <TeamCard team={team} section={task} />
              </li>
            ))}
          </ul>
        )}
        {tab === "search" && !!results.data?.data.length && (
          <ul
            className="team-directory-list"
            aria-labelledby={`${id}-directory`}
          >
            {results.data?.data.map((team) => (
              <li key={team.teamId} className="min-w-0">
                <TeamCard team={team} searchable />
              </li>
            ))}
          </ul>
        )}
        {tab === "applications" && !!applications.data?.data.length && (
          <ul
            className="team-directory-queue"
            aria-labelledby={`${id}-directory`}
          >
            {applications.data?.data.map((application) => (
              <li key={application.applicationId} className="min-w-0">
                <ApplicationRow application={application} />
              </li>
            ))}
          </ul>
        )}
        {tab === "invitations" && !!invitations.data?.data.length && (
          <ul
            className="team-directory-queue"
            aria-labelledby={`${id}-directory`}
          >
            {invitations.data?.data.map((invitation) => (
              <li key={invitation.invitationId} className="min-w-0">
                <InvitationRow invitation={invitation} />
              </li>
            ))}
          </ul>
        )}
        {query.data?.data.length === 0 && (
          <EmptyState
            embedded
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
