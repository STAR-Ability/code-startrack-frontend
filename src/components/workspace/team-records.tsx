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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { v012 } from "@/lib/api/v012";
import type {
  JoinApplicationDto,
  TeamInvitationDto,
  TeamSummaryDto,
  UserSubmissionDto,
} from "@/lib/api/v012-schemas";
import { ApiError } from "@/lib/api/errors";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "./feedback";
import { Status, useCollaborationMutation } from "./v012-shared";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { formatTimestamp } from "@/lib/i18n/locale";
import { verdictTone } from "@/lib/ui/status";
import { ProblemLink } from "./recommendation-card";

export function MemberSubmissionRecords({
  items,
}: {
  items: UserSubmissionDto[];
}) {
  const { t, locale } = useLocale();
  if (!items.length) return null;
  return (
    <ul
      className="team-record-list member-submission-list"
      aria-label={t("v12.detailedSubmissions")}
    >
      {items.map(({ submission: item, sourceAccount }) => (
        <li
          key={`${sourceAccount.accountId}:${item.submissionId}`}
          data-member-submission-id={item.submissionId}
          data-source-account-id={sourceAccount.accountId}
        >
          <article className="member-submission-record flex min-w-0 flex-col gap-3">
            <div className="team-record-summary flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 basis-40">
                <h3 className="wrap-anywhere font-medium">
                  {item.problem.title ?? item.problem.externalProblemKey}
                </h3>
                {item.problem.title && (
                  <p className="wrap-anywhere text-xs text-muted-foreground">
                    {item.problem.externalProblemKey}
                  </p>
                )}
              </div>
              <Badge wrap variant={verdictTone[item.verdict]}>
                {item.verdict === "PENDING" ? t("v.pending") : item.verdict}
              </Badge>
            </div>
            <dl className="member-submission-metadata grid min-w-0 gap-3">
              <div className="member-submission-source min-w-0">
                <dt className="text-xs text-muted-foreground">
                  {t("v12.sourceAccount")}
                </dt>
                <dd className="wrap-anywhere text-sm">
                  {sourceAccount.username} · {sourceAccount.platform}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  {t("v.language")}
                </dt>
                <dd className="wrap-anywhere text-sm">
                  {item.programmingLanguage ?? t("v.unavailable")}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  {t("v.lastSubmitted")}
                </dt>
                <dd className="wrap-anywhere text-sm">
                  <time dateTime={item.submittedAt}>
                    {formatTimestamp(item.submittedAt, locale)}
                  </time>
                </dd>
              </div>
            </dl>
            <div className="team-record-actions flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <DetailsDisclosure
                  title={t("v.submissionDetails")}
                  accessibleLabel={t("v.submissionDetailsFor", {
                    problem:
                      item.problem.title ?? item.problem.externalProblemKey,
                    id: item.externalSubmissionId,
                  })}
                >
                  <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt>{t("v.time")}</dt>
                      <dd className="tabular-nums">
                        {item.timeMs ?? t("v.unavailable")}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt>{t("v.memory")}</dt>
                      <dd className="tabular-nums">
                        {item.memoryBytes === null
                          ? t("v.unavailable")
                          : (item.memoryBytes / 1048576).toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                  {(item.teamName || item.memberHandles.length > 1) && (
                    <p className="wrap-anywhere">
                      {t("v.team")}: {item.teamName} ·{" "}
                      {item.memberHandles.join(", ")}
                    </p>
                  )}
                  <p className="wrap-anywhere font-mono">
                    ID: {item.submissionId} · CF: {item.externalSubmissionId}
                  </p>
                  <p className="wrap-anywhere font-mono">
                    {t("v12.sourceAccount")}: {sourceAccount.accountId}
                  </p>
                </DetailsDisclosure>
              </div>
              <ProblemLink problem={item.problem} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
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
    <article
      className="workspace-team-card team-directory-record"
      data-team-card
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="lg">
              {team.avatarUrl && <AvatarImage src={team.avatarUrl} alt="" />}
              <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="min-w-0 text-lg font-semibold wrap-anywhere">
              <Link
                href={href}
                className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {team.name}
              </Link>
            </h3>
          </div>
          <dl className="team-card-details">
            <div>
              <dt>{t("v12.owner")}</dt>
              <dd>{team.owner.displayName ?? team.owner.username}</dd>
            </div>
            <div>
              <dt>{t("v12.members")}</dt>
              <dd>{team.memberCount}</dd>
            </div>
          </dl>
        </div>
        <Status value={team.status} />
      </div>
      {team.description && (
        <p className="whitespace-pre-wrap break-words text-sm">
          {team.description}
        </p>
      )}
      <div className="team-record-actions flex min-w-0 flex-wrap items-center gap-3">
        <Link
          href={href}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            wrap: true,
          })}
        >
          {t("v12.openTeam")}{" "}
          <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
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
              <DropdownMenuGroup>
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
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {team.myJoinApplicationStatus === "PENDING" && (
          <Link
            href="/teams?tab=applications"
            className="auth-text-link text-sm wrap-anywhere"
          >
            {t("v12.pendingApplication")}
          </Link>
        )}
        {team.myInvitationStatus === "PENDING" && (
          <Link
            href="/teams?tab=invitations"
            className="auth-text-link text-sm wrap-anywhere"
          >
            {t("v12.pendingInvitation")}
          </Link>
        )}
      </div>
      {canApply && (
        <form
          className="team-application-form flex min-w-0 flex-col gap-3"
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
    <article className="team-queue-record flex min-w-0 flex-col gap-3">
      <div className="team-record-summary flex min-w-0 flex-wrap justify-between gap-2">
        <h3 className="min-w-0 wrap-anywhere font-medium">
          {manage
            ? (application.applicant.displayName ??
              application.applicant.username)
            : application.team.name}
        </h3>
        <Status value={application.status} />
      </div>
      <p className="whitespace-pre-wrap wrap-anywhere text-sm">
        {application.message}
      </p>
      {application.decisionReason && (
        <p className="wrap-anywhere text-sm">{application.decisionReason}</p>
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
      <div className="team-record-controls grid min-w-0 items-end gap-3">
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
        <div className="team-record-actions flex min-w-0 flex-wrap gap-2">
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
    <article className="team-queue-record flex min-w-0 flex-col gap-3">
      <div className="team-record-summary flex min-w-0 flex-wrap justify-between gap-2">
        <h3 className="min-w-0 wrap-anywhere font-medium">
          {manage
            ? (invitation.inviteeEmail ??
              invitation.invitee?.displayName ??
              invitation.invitee?.username)
            : invitation.team.name}
        </h3>
        <Status value={invitation.status} />
      </div>
      <p className="wrap-anywhere text-sm">
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
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          {t("v12.delivery")}: <Status value={invitation.emailDeliveryStatus} />
          {invitation.emailDeliveryErrorCode && (
            <span className="wrap-anywhere">
              {invitation.emailDeliveryErrorCode}
            </span>
          )}
        </p>
      )}
      <div className="team-record-actions flex min-w-0 flex-wrap gap-2">
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
