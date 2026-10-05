"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, GraduationCapIcon } from "lucide-react";
import { v012 } from "@/lib/api/v012";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { MetricPanel } from "./metric-panel";
import { Panel, useCollaborationMutation } from "./v012-shared";
import { useUserQuery } from "./use-user-query";
import { ErrorNotice, QueryFeedback, EmptyState } from "./feedback";
import { TeamCard } from "./team-records";
import { NotificationRow } from "./notifications-page";
export function CoachPage() {
  const { t } = useLocale();
  const query = useUserQuery("coach-dashboard", {}, (_id, signal) =>
    v012.coachDashboard(signal),
  );
  const teams = useUserQuery(
    "teams",
    { endpoint: "mine", scope: "MANAGED", page: 1 },
    (_id, signal) => v012.mine("MANAGED", { page: 1 }, signal),
  );
  return (
    <>
      <QueryFeedback query={query} />
      <section className="workspace-context-header coach-direction">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-3">
          <h2 className="flex items-start gap-3 text-xl font-semibold tracking-tight">
            <GraduationCapIcon
              className="size-6 shrink-0 text-support"
              aria-hidden="true"
            />
            {t("coach.focusTitle")}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("v12.coachNote")}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Link
            href={
              query.data?.pendingApplicationCount
                ? "/coach/teams?task=applications"
                : "/coach/teams"
            }
            className={buttonVariants({ wrap: true })}
          >
            {t(
              query.data?.pendingApplicationCount
                ? "v12.pendingApplications"
                : "v12.manage",
            )}
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
          {!!query.data?.pendingApplicationCount && (
            <Link
              href="/coach/teams"
              className={buttonVariants({ variant: "outline", wrap: true })}
            >
              {t("v12.manage")}
            </Link>
          )}
          <Link
            href="/coach/teams/create"
            className={buttonVariants({ variant: "outline", wrap: true })}
          >
            {t("v12.createTeam")}
          </Link>
        </div>
      </section>
      <MetricPanel
        title="v12.coachStats"
        loading={query.isFetching && query.data === undefined}
        metrics={[
          ["v12.managedTeams", query.data?.managedTeamCount ?? null],
          ["v12.activeMembers", query.data?.activeMemberCount ?? null],
          [
            "v12.pendingApplications",
            query.data?.pendingApplicationCount ?? null,
          ],
        ]}
      />
      <div className="grid min-w-0 gap-5 xl:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("v12.manage")}</h2>
            <Link
              href="/coach/teams?task=applications"
              className="text-sm underline"
            >
              {t("v12.pendingApplications")} ·{" "}
              {query.data?.pendingApplicationCount ?? "—"}
            </Link>
          </div>
          <QueryFeedback query={teams} />
          {teams.data?.data.map((team) => (
            <TeamCard key={team.teamId} team={team} />
          ))}
          {teams.data?.data.length === 0 && (
            <EmptyState
              title={t("v12.noTeams")}
              href="/coach/teams/create"
              action={t("v12.createTeam")}
            />
          )}
        </section>
        <Panel
          title="v12.recentNotifications"
          variant="supporting"
          tone="support"
        >
          {query.data?.recentNotifications.map((notification) => (
            <NotificationRow
              key={notification.notificationId}
              notification={notification}
            />
          ))}
          {query.data?.recentNotifications.length === 0 && (
            <EmptyState title={t("v12.noNotifications")} embedded />
          )}
        </Panel>
      </div>
    </>
  );
}
export function CoachRedemption() {
  const { t } = useLocale();
  const [code, setCode] = useState("");
  const id = useId();
  const mutation = useCollaborationMutation("redeem", () =>
    v012.redeemCoachCode(code),
  );
  return (
    <Panel title="v12.redeem">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Field>
          <FieldLabel htmlFor={id}>{t("v12.code")}</FieldLabel>
          <Input
            id={id}
            value={code}
            required
            onChange={(event) => setCode(event.target.value)}
            disabled={mutation.blocked}
          />
        </Field>
        <Button
          wrap
          type="submit"
          className="self-start"
          disabled={mutation.blocked}
        >
          {t("v12.redeem")}
        </Button>
      </form>
      <ErrorNotice error={mutation.error} />
      {mutation.isSuccess && <p role="status">{t("v12.saved")}</p>}
    </Panel>
  );
}
