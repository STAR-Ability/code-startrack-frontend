"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { v012 } from "@/lib/api/v012";
import type { TeamDetailDto, TeamMemberDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
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
            <h3 className="break-words font-medium">
              {member.user.displayName ?? member.user.username}
            </h3>
            <span>
              {t(member.role === "OWNER" ? "v12.owner" : "v12.member")}
            </span>
          </div>
          <Status value={member.status} />
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
        <DialogContent>
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
          <ErrorNotice error={mutation.error} />
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
export function TeamManagement({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const [applicationPage, setApplicationPage] = useState(1);
  const [invitationPage, setInvitationPage] = useState(1);
  const [invitationStatus, setInvitationStatus] = useState<string>("PENDING");
  const applications = useTeamQuery(
    team.teamId,
    "applications",
    { page: applicationPage, status: "PENDING" },
    (signal) =>
      v012.applications(
        team.teamId,
        { page: applicationPage, status: "PENDING" },
        signal,
      ),
  );
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
          <TeamForm key={team.updatedAt} team={team} />
          <Panel title="v12.manage">
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
      <Panel title="v12.applications">
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
      <Panel title="v12.invitations">
        {active && <InviteForm teamId={team.teamId} />}
        <Field className="max-w-sm">
          <FieldLabel htmlFor={`${id}-status`}>{t("v12.status")}</FieldLabel>
          <NativeSelect
            id={`${id}-status`}
            value={invitationStatus}
            onChange={(event) => {
              setInvitationStatus(event.target.value);
              setInvitationPage(1);
            }}
          >
            <NativeSelectOption value="">{t("v12.all")}</NativeSelectOption>
            {["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].map(
              (status) => (
                <NativeSelectOption key={status} value={status}>
                  {t(`v12.status.${status}` as Parameters<typeof t>[0])}
                </NativeSelectOption>
              ),
            )}
          </NativeSelect>
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
            <DialogDescription>{team.name}</DialogDescription>
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
              <NativeSelect
                id={`${id}-owner`}
                value={newOwner}
                onChange={(event) => setNewOwner(event.target.value)}
              >
                <NativeSelectOption value="">
                  {t("v12.newOwner")}
                </NativeSelectOption>
                {members.data?.data
                  .filter(
                    (member) =>
                      member.role !== "OWNER" && member.status === "ACTIVE",
                  )
                  .map((member) => (
                    <NativeSelectOption
                      key={member.membershipId}
                      value={member.user.publicId}
                    >
                      {member.user.displayName ?? member.user.username}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
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
          <ErrorNotice error={mutation.error} />
        </DialogContent>
      </Dialog>
    </>
  );
}
