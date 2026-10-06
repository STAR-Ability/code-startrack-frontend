"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { v012 } from "@/lib/api/v012";
import type { TeamDetailDto, TeamMemberDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ChoiceSelect } from "@/components/ui/choice-select";
import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogTitle as DialogTitle,
  AlertDialogDescription as DialogDescription,
  AlertDialogHeader as DialogHeader,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Panel,
  Status,
  useCollaborationMutation,
  useTeamQuery,
} from "./v012-shared";
import { QueryFeedback, Pagination, ErrorNotice, EmptyState } from "./feedback";
import { TeamForm, InviteForm } from "./team-forms";
import { ApplicationRow, InvitationRow } from "./team-records";
export function TeamMembers({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const query = useTeamQuery(team.teamId, "members", { page }, (signal) =>
    v012.members(team.teamId, { page }, signal),
  );
  const [remove, setRemove] = useState<TeamMemberDto | null>(null);
  const cancelRemoveRef = useRef<HTMLButtonElement>(null);
  const mutation = useCollaborationMutation(
    "membership",
    (member: TeamMemberDto) =>
      v012.removeMember(team.teamId, member.user.publicId),
    team.teamId,
    () => setRemove(null),
  );
  return (
    <Panel title="v12.members">
      <QueryFeedback query={query} />
      {query.data?.data.map((member) => (
        <article
          key={member.membershipId}
          className="flex flex-col gap-3 border-b py-3 last:border-0"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                {member.user.avatarUrl && (
                  <AvatarImage src={member.user.avatarUrl} alt="" />
                )}
                <AvatarFallback>
                  {(member.user.displayName ?? member.user.username).slice(
                    0,
                    2,
                  )}
                </AvatarFallback>
              </Avatar>
              <h3 className="break-words font-medium">
                {member.user.displayName ?? member.user.username}
              </h3>
            </div>
            <Badge variant="outline">
              {t(member.role === "OWNER" ? "v12.owner" : "v12.member")}
            </Badge>
          </div>
          <Status value={member.status} />
          {!Object.values(member.dataAccess).some(Boolean) && (
            <p className="text-sm text-muted-foreground">
              {t("v12.PRIVATE_DENIED")}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {(
              [
                "basicTraining",
                "abilityProfile",
                "detailedSubmissions",
                "analysisReport",
              ] as const
            )
              .filter((key) => member.dataAccess[key])
              .map((key) => (
                <Link
                  key={key}
                  href={`/teams/member?teamId=${team.teamId}&memberPublicId=${member.user.publicId}&view=${key}`}
                  className="text-sm underline underline-offset-4"
                >
                  {t(`v12.${key}`)}
                </Link>
              ))}
            {team.canManage &&
              team.status === "ACTIVE" &&
              member.role !== "OWNER" &&
              member.status === "ACTIVE" && (
                <Button
                  wrap
                  variant="outline"
                  disabled={mutation.blocked}
                  onClick={() => setRemove(member)}
                >
                  {t("v12.remove")}
                </Button>
              )}
          </div>
        </article>
      ))}
      {query.data?.data.length === 0 && (
        <EmptyState
          title={t(
            team.status === "DISSOLVED" ? "v.noRecords" : "v12.membersAnomaly",
          )}
          description={query.data.requestId}
        />
      )}
      <Pagination
        page={page}
        setPage={setPage}
        meta={query.data?.meta}
        pending={query.isFetching}
      />
      <Dialog
        open={!!remove}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setRemove(null);
        }}
      >
        <DialogContent initialFocus={cancelRemoveRef}>
          <DialogHeader>
            <DialogTitle>{t("v12.confirmRemove")}</DialogTitle>
            <DialogDescription>
              {remove?.user.displayName ?? remove?.user.username}
            </DialogDescription>
          </DialogHeader>
          <Button
            wrap
            variant="destructive"
            disabled={mutation.blocked}
            onClick={() => remove && mutation.mutate(remove)}
          >
            {t("v12.remove")}
          </Button>
          <AlertDialogCancel
            ref={cancelRemoveRef}
            disabled={mutation.isPending}
          >
            {t("v12.cancel")}
          </AlertDialogCancel>
          <ErrorNotice error={mutation.error} />
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
export function TeamApplications({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationStatus, setApplicationStatus] = useState<string>("PENDING");
  const id = useId();
  const applications = useTeamQuery(
    team.teamId,
    "applications",
    { page: applicationPage, status: applicationStatus },
    (signal) =>
      v012.applications(
        team.teamId,
        {
          page: applicationPage,
          status: (applicationStatus as "PENDING") || undefined,
        },
        signal,
      ),
  );
  const active = team.status === "ACTIVE";
  return (
    <Panel title="v12.applications">
      <Field className="max-w-sm">
        <FieldLabel htmlFor={`${id}-status`}>{t("v12.status")}</FieldLabel>
        <ChoiceSelect
          id={`${id}-status`}
          value={applicationStatus}
          onValueChange={(value) => {
            setApplicationStatus(value);
            setApplicationPage(1);
          }}
          options={[
            { value: "", label: t("v12.all") },
            ...(["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const).map(
              (value) => ({ value, label: t(`v12.status.${value}`) }),
            ),
          ]}
        />
      </Field>
      <QueryFeedback query={applications} />
      {applications.data?.data.map((application) => (
        <ApplicationRow
          key={application.applicationId}
          application={application}
          manage
          readonly={!active}
        />
      ))}
      {applications.data?.data.length === 0 && (
        <EmptyState title={t("v12.noApplications")} />
      )}
      <Pagination
        meta={applications.data?.meta}
        page={applicationPage}
        setPage={setApplicationPage}
        pending={applications.isFetching}
      />
    </Panel>
  );
}
export function TeamInvitations({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const [invitationPage, setInvitationPage] = useState(1);
  const [invitationStatus, setInvitationStatus] = useState<string>("PENDING");
  const invitations = useTeamQuery(
    team.teamId,
    "invitations",
    { page: invitationPage, status: invitationStatus },
    (signal) =>
      v012.invitations(
        team.teamId,
        {
          page: invitationPage,
          status: (invitationStatus as "PENDING") || undefined,
        },
        signal,
      ),
  );
  const id = useId();
  const active = team.status === "ACTIVE";
  return (
    <Panel title="v12.invitations">
      {active && <InviteForm teamId={team.teamId} />}
      <Field className="max-w-sm">
        <FieldLabel htmlFor={`${id}-status`}>{t("v12.status")}</FieldLabel>
        <ChoiceSelect
          id={`${id}-status`}
          value={invitationStatus}
          onValueChange={(value) => {
            setInvitationStatus(value);
            setInvitationPage(1);
          }}
          options={[
            { value: "", label: t("v12.all") },
            ...(
              [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "EXPIRED",
                "CANCELLED",
              ] as const
            ).map((value) => ({ value, label: t(`v12.status.${value}`) })),
          ]}
        />
      </Field>
      <QueryFeedback query={invitations} />
      {invitations.data?.data.map((invitation) => (
        <InvitationRow
          key={invitation.invitationId}
          invitation={invitation}
          manage
          readonly={!active}
        />
      ))}
      {invitations.data?.data.length === 0 && (
        <EmptyState title={t("v12.noInvitations")} />
      )}
      <Pagination
        meta={invitations.data?.meta}
        page={invitationPage}
        setPage={setInvitationPage}
        pending={invitations.isFetching}
      />
    </Panel>
  );
}
export function TeamSettings({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const [ownerPage, setOwnerPage] = useState(1);
  const members = useTeamQuery(
    team.teamId,
    "members",
    { page: ownerPage },
    (signal) => v012.members(team.teamId, { page: ownerPage }, signal),
  );
  const [operation, setOperation] = useState<
    "archive" | "activate" | "dissolve" | "transfer" | null
  >(null);
  const [confirmation, setConfirmation] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const id = useId();
  const mutation = useCollaborationMutation(
    "team",
    () =>
      operation === "archive"
        ? v012.archiveTeam(team.teamId)
        : operation === "activate"
          ? v012.activateTeam(team.teamId)
          : operation === "dissolve"
            ? v012.dissolveTeam(team.teamId, confirmation)
            : v012.transferTeam(team.teamId, newOwner),
    team.teamId,
    () => setOperation(null),
  );
  const active = team.status === "ACTIVE";
  return (
    <>
      {team.status !== "DISSOLVED" && (
        <>
          <TeamForm key={team.teamId} team={team} />
          <Panel title="v12.dangerZone" description={t("v12.dangerNote")}>
            <div className="flex flex-wrap gap-3">
              {(active
                ? ["archive", "transfer", "dissolve"]
                : ["activate", "transfer", "dissolve"]
              ).map((action) => (
                <Button
                  wrap
                  key={action}
                  variant="outline"
                  disabled={mutation.blocked}
                  onClick={() => {
                    setOperation(action as typeof operation);
                    setConfirmation("");
                  }}
                >
                  {t(
                    action === "transfer"
                      ? "v12.transfer"
                      : action === "archive"
                        ? "v12.archive"
                        : action === "activate"
                          ? "v12.activate"
                          : "v12.dissolve",
                  )}
                </Button>
              ))}
            </div>
          </Panel>
        </>
      )}
      <Dialog
        open={!!operation}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setOperation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                operation === "dissolve"
                  ? "v12.dissolve"
                  : operation === "transfer"
                    ? "v12.transfer"
                    : operation === "activate"
                      ? "v12.activate"
                      : "v12.archive",
              )}
            </DialogTitle>
            <DialogDescription>
              {team.name} · {t("v12.dangerNote")}
            </DialogDescription>
          </DialogHeader>
          {operation === "dissolve" && (
            <Field>
              <FieldLabel htmlFor={`${id}-confirm`}>
                {t("v12.confirmation")}
              </FieldLabel>
              <Input
                id={`${id}-confirm`}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Field>
          )}
          {operation === "transfer" && (
            <Field>
              <FieldLabel htmlFor={`${id}-owner`}>
                {t("v12.newOwner")}
              </FieldLabel>
              <ChoiceSelect
                id={`${id}-owner`}
                value={newOwner}
                onValueChange={setNewOwner}
                options={[
                  { value: "", label: t("v12.newOwner") },
                  ...(members.data?.data
                    .filter(
                      (member) =>
                        member.role !== "OWNER" && member.status === "ACTIVE",
                    )
                    .map((member) => ({
                      value: member.user.publicId,
                      label: member.user.displayName ?? member.user.username,
                    })) ?? []),
                ]}
              />
              <p className="text-sm text-muted-foreground">
                {t("v12.transferNote")}
              </p>
              <QueryFeedback query={members} />
              <Pagination
                page={ownerPage}
                setPage={setOwnerPage}
                meta={members.data?.meta}
                pending={members.isFetching}
              />
            </Field>
          )}
          <Button
            wrap
            variant={operation === "dissolve" ? "destructive" : "default"}
            disabled={
              mutation.blocked ||
              (operation === "dissolve" && confirmation !== team.name) ||
              (operation === "transfer" && !newOwner)
            }
            onClick={() => mutation.mutate()}
          >
            {t("v12.save")}
          </Button>
          <AlertDialogCancel disabled={mutation.isPending}>
            {t("v12.cancel")}
          </AlertDialogCancel>
          <ErrorNotice error={mutation.error} />
        </DialogContent>
      </Dialog>
    </>
  );
}
