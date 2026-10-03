"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { v012 } from "@/lib/api/v012";
import { uuidSchema } from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/errors";
import { Panel, useCollaborationMutation, useTeamQuery } from "./v012-shared";
import { EmptyState, ErrorNotice, QueryFeedback } from "./feedback";
import { TeamCard } from "./team-records";
import { TeamMembers, TeamManagement } from "./team-management";
import { TeamInsights } from "./team-insights";
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
  return <TeamDetailContent key={teamId} teamId={teamId} />;
}
function TeamDetailContent({ teamId }: { teamId: string }) {
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
          <Panel title="v12.teamDetail">
            <TeamCard team={team} searchable={!team.myMembershipRole} />
            {team.status !== "ACTIVE" && (
              <Alert>
                <AlertDescription>{t("v12.readonlyTeam")}</AlertDescription>
              </Alert>
            )}
            {team.canLeave && team.myMembershipRole !== "OWNER" && (
              <Button
                wrap
                className="self-start"
                variant="outline"
                disabled={mutation.blocked}
                onClick={() => setConfirm(true)}
              >
                {t("v12.leave")}
              </Button>
            )}
          </Panel>
          {(team.myMembershipRole || team.canManage) && (
            <>
              <TeamMembers team={team} />
              <TeamInsights team={team} />
            </>
          )}
          {team.canManage && <TeamManagement team={team} />}
        </>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!mutation.isPending) setConfirm(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("v12.confirmLeave")}</DialogTitle>
            <DialogDescription>{team?.name}</DialogDescription>
          </DialogHeader>
          <Button
            wrap
            variant="destructive"
            disabled={mutation.blocked}
            onClick={() => mutation.mutate()}
          >
            {t("v12.leave")}
          </Button>
          <ErrorNotice error={mutation.error} />
        </DialogContent>
      </Dialog>
    </>
  );
}
