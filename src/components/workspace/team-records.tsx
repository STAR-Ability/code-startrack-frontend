"use client";
import { useState, useId } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { v012 } from "@/lib/api/v012";
import type {
  JoinApplicationDto,
  TeamInvitationDto,
  TeamSummaryDto,
} from "@/lib/api/v012-schemas";
import { ApiError } from "@/lib/api/errors";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "./feedback";
import { Status, useCollaborationMutation } from "./v012-shared";
export function TeamCard({
  team,
  searchable = false,
  section = "overview",
}: {
  team: TeamSummaryDto;
  searchable?: boolean;
  section?: string;
}) {
  const { t } = useLocale();
  const [message, setMessage] = useState("");
  const id = useId();
  const mutation = useCollaborationMutation(
    "apply",
    () => v012.apply(team.teamId, message || undefined),
    team.teamId,
  );
  const canApply =
    searchable &&
    team.status === "ACTIVE" &&
    !team.myMembershipRole &&
    team.myJoinApplicationStatus !== "PENDING" &&
    team.myInvitationStatus !== "PENDING" &&
    !(
      mutation.error instanceof ApiError &&
      mutation.error.code === "TEAM_NOT_JOINABLE"
    );
  const href = `/teams/detail?teamId=${team.teamId}&tab=${section}`;
  return (
    <article className="workspace-team-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {team.avatarUrl && <AvatarImage src={team.avatarUrl} alt="" />}
              <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="break-words font-semibold">
              <Link
                href={href}
                className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {team.name}
              </Link>
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {team.owner.displayName ?? team.owner.username} · {t("v12.members")}
            : {team.memberCount}
          </p>
        </div>
        <Status value={team.status} />
      </div>
      {team.description && (
        <p className="whitespace-pre-wrap break-words text-sm">
          {team.description}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          href={href}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("v12.openTeam")}{" "}
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </Link>
        {team.myMembershipRole && (
          <Badge variant="secondary">
            {t(team.myMembershipRole === "OWNER" ? "v12.owner" : "v12.member")}
          </Badge>
        )}
        {team.myMembershipRole && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${team.name} · ${t("v12.teamActions")}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                render={
                  <Link
                    href={`/teams/detail?teamId=${team.teamId}&tab=members`}
                  />
                }
              >
                {t("v12.members")}
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link
                    href={`/teams/detail?teamId=${team.teamId}&tab=analysis`}
                  />
                }
              >
                {t("v12.teamAnalysis")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {team.myJoinApplicationStatus === "PENDING" && (
          <Link href="/teams?tab=applications">
            {t("v12.pendingApplication")}
          </Link>
        )}
        {team.myInvitationStatus === "PENDING" && (
          <Link href="/teams?tab=invitations">
            {t("v12.pendingInvitation")}
          </Link>
        )}
      </div>
      {canApply && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <Field>
            <FieldLabel htmlFor={id}>{t("v12.message")}</FieldLabel>
            <Input
              id={id}
              name="message"
              autoComplete="off"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </Field>
          <Button
            wrap
            type="submit"
            className="self-start"
            disabled={mutation.blocked}
          >
            {t("v12.apply")}
          </Button>
        </form>
      )}
      <ErrorNotice error={mutation.error} />
    </article>
  );
}
export function ApplicationRow({
  application,
  manage = false,
  readonly = false,
}: {
  application: JoinApplicationDto;
  manage?: boolean;
  readonly?: boolean;
}) {
  const { t, locale } = useLocale();
  const [reason, setReason] = useState("");
  const id = useId();
  const mutation = useCollaborationMutation(
    "application",
    (operation: "cancel" | "approve" | "reject") =>
      operation === "cancel"
        ? v012.cancelApplication(application.applicationId)
        : operation === "approve"
          ? v012.approveApplication(application.applicationId)
          : v012.rejectApplication(
              application.applicationId,
              reason || undefined,
            ),
    application.team.teamId,
  );
  const disabled =
    readonly || mutation.blocked || application.status !== "PENDING";
  return (
    <article className="flex flex-col gap-3 border-b py-4 last:border-0">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="break-words font-medium">
          {manage
            ? (application.applicant.displayName ??
              application.applicant.username)
            : application.team.name}
        </h3>
        <Status value={application.status} />
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">
        {application.message}
      </p>
      {application.decisionReason && (
        <p className="text-sm">{application.decisionReason}</p>
      )}
      <time
        className="text-xs text-muted-foreground"
        dateTime={application.createdAt}
      >
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(application.createdAt))}
      </time>
      {manage && application.status === "PENDING" && (
        <Field>
          <FieldLabel htmlFor={id}>{t("v12.reason")}</FieldLabel>
          <Input
            id={id}
            name="decisionReason"
            autoComplete="off"
            value={reason}
            disabled={disabled}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        {manage ? (
          <>
            <Button
              wrap
              disabled={disabled}
              onClick={() => mutation.mutate("approve")}
            >
              {t("v12.approve")}
            </Button>
            <Button
              wrap
              variant="outline"
              disabled={disabled}
              onClick={() => mutation.mutate("reject")}
            >
              {t("v12.reject")}
            </Button>
          </>
        ) : (
          <Button
            wrap
            variant="outline"
            disabled={disabled}
            onClick={() => mutation.mutate("cancel")}
          >
            {t("v12.cancel")}
          </Button>
        )}
      </div>
      <ErrorNotice error={mutation.error} />
    </article>
  );
}
export function InvitationRow({
  invitation,
  manage = false,
  readonly = false,
}: {
  invitation: TeamInvitationDto;
  manage?: boolean;
  readonly?: boolean;
}) {
  const { t, locale } = useLocale();
  const mutation = useCollaborationMutation(
    manage ? "invite" : "invitation",
    (operation: "cancel" | "resend" | "accept" | "reject") =>
      operation === "cancel"
        ? v012.cancelInvitation(invitation.invitationId)
        : operation === "resend"
          ? v012.resendInvitation(invitation.invitationId)
          : operation === "accept"
            ? v012.acceptInvitation(invitation.invitationId)
            : v012.rejectInvitation(invitation.invitationId),
    invitation.team.teamId,
  );
  const disabled =
    readonly || mutation.blocked || invitation.status !== "PENDING";
  return (
    <article className="flex min-w-0 flex-col gap-3 border-b py-4 last:border-0">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="break-words font-medium">
          {manage
            ? (invitation.inviteeEmail ??
              invitation.invitee?.displayName ??
              invitation.invitee?.username)
            : invitation.team.name}
        </h3>
        <Status value={invitation.status} />
      </div>
      <p className="text-sm">
        {invitation.inviter.displayName ?? invitation.inviter.username}
      </p>
      <time
        className="text-xs text-muted-foreground"
        dateTime={invitation.expiresAt}
      >
        {t("v12.expires")}:{" "}
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(invitation.expiresAt))}
      </time>
      {manage && (
        <p>
          {t("v12.delivery")}: <Status value={invitation.emailDeliveryStatus} />
          {invitation.emailDeliveryErrorCode && (
            <span className="ml-2">{invitation.emailDeliveryErrorCode}</span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {manage ? (
          <>
            <Button
              wrap
              variant="outline"
              disabled={disabled}
              onClick={() => mutation.mutate("resend")}
            >
              {t("v12.resend")}
            </Button>
            <Button
              wrap
              variant="outline"
              disabled={disabled}
              onClick={() => mutation.mutate("cancel")}
            >
              {t("v12.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              wrap
              disabled={disabled}
              onClick={() => mutation.mutate("accept")}
            >
              {t("v12.accept")}
            </Button>
            <Button
              wrap
              variant="outline"
              disabled={disabled}
              onClick={() => mutation.mutate("reject")}
            >
              {t("v12.reject")}
            </Button>
          </>
        )}
      </div>
      <ErrorNotice error={mutation.error} />
    </article>
  );
}
