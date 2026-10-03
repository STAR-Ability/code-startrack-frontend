"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { v012 } from "@/lib/api/v012";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { MetricPanel } from "./metric-panel";
import { Panel, useCollaborationMutation } from "./v012-shared";
import { useUserQuery } from "./use-user-query";
import { ErrorNotice, QueryFeedback, EmptyState } from "./feedback";
import { NotificationRow } from "./notifications-page";
export function CoachPage() {
  const { t } = useLocale();
  const query = useUserQuery("coach-dashboard", {}, (_id, signal) =>
    v012.coachDashboard(signal),
  );
  return (
    <>
      <QueryFeedback query={query} />
      <MetricPanel
        title="v12.coach"
        loading={query.isFetching && query.data === undefined}
        metrics={[
          ["v12.managedTeams", query.data?.managedTeamCount ?? 0],
          ["v12.activeMembers", query.data?.activeMemberCount ?? 0],
          ["v12.pendingApplications", query.data?.pendingApplicationCount ?? 0],
        ]}
      />
      <div className="flex flex-wrap gap-4">
        <Link href="/coach/teams" className="underline">
          {t("v12.manage")}
        </Link>
        <Link href="/coach/teams/create" className="underline">
          {t("v12.createTeam")}
        </Link>
      </div>
      <Panel title="v12.recentNotifications">
        {query.data?.recentNotifications.map((notification) => (
          <NotificationRow
            key={notification.notificationId}
            notification={notification}
          />
        ))}
        {query.data?.recentNotifications.length === 0 && (
          <EmptyState title={t("v12.noNotifications")} />
        )}
      </Panel>
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
