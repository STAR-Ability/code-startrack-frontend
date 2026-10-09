"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import type { CreateSubmissionInput } from "@/lib/api/v02-schemas";
import { formatTimestamp } from "@/lib/i18n/locale";
import { isCurrentUser } from "@/lib/query/session";
import { deniedV02 } from "@/lib/query/v02";
import { useV02Submission } from "@/lib/query/v02-hooks";
import { useWorkspaceSession } from "../account-provider";
import { QueryFeedback } from "../feedback";
import { SubmissionJudgeStatus, TaskErrorView } from "./submission-judge";

export interface EditorSubmissionAttempt {
  publicId: string;
  submissionId: string;
  languageId: string;
  problemVersionId: CreateSubmissionInput["problemRef"]["problemVersionId"];
  sourceCode: string;
  requestNumber: number;
}

export function EditorSubmissionResult({
  attempt,
  pending,
  previous,
  draftChanged,
}: {
  attempt: EditorSubmissionAttempt | null;
  pending: boolean;
  previous: boolean;
  draftChanged: boolean;
}) {
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const owned =
    !!attempt &&
    attempt.publicId === user?.publicId &&
    isCurrentUser(client, attempt.publicId);
  if (!owned)
    return (
      <p role="status" className="text-xs text-muted-foreground">
        {t(
          pending ? "v02.problem.submitting" : "v02.problem.noSubmissionResult",
        )}
      </p>
    );
  return (
    <EditorSubmissionResultContent
      key={`${attempt.publicId}:${attempt.submissionId}`}
      attempt={attempt}
      previous={previous}
      draftChanged={draftChanged}
    />
  );
}

function EditorSubmissionResultContent({
  attempt,
  previous,
  draftChanged,
}: {
  attempt: EditorSubmissionAttempt;
  previous: boolean;
  draftChanged: boolean;
}) {
  const { t, locale } = useLocale();
  const query = useV02Submission(attempt.submissionId);
  const submission =
    !deniedV02(query.error) && query.data?.submissionId === attempt.submissionId
      ? query.data
      : undefined;
  const result = submission?.judgeResult;
  const judging =
    submission &&
    ["QUEUED", "DISPATCHING", "RUNNING"].includes(submission.judgeStatus);
  const recovery =
    submission?.judgeStatus === "FAILED" &&
    !submission.judgeTaskId &&
    submission.judgeError?.retryable;
  const number = (value: number | null) =>
    value === null
      ? t("v.unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          value,
        );

  return (
    <div className="flex min-w-0 flex-col gap-3 text-xs">
      <QueryFeedback query={query} compact />
      {submission && (
        <>
          {previous && (
            <p className="font-medium">{t("v02.problem.previousResult")}</p>
          )}
          <div role="status" aria-live="polite" className="grid gap-2">
            <SubmissionJudgeStatus submission={submission} />
            {judging && (
              <p className="text-muted-foreground">
                {t("v02.judgePendingNote")}
              </p>
            )}
            {recovery && <p>{t("v02.judgeRecoveryNote")}</p>}
            {submission.judgeStatus === "FAILED" && !recovery && (
              <p>
                {t(
                  submission.judgeTaskId
                    ? "v02.judgeFailureNote"
                    : "v02.judgeRejectedNote",
                )}
              </p>
            )}
            {submission.judgeStatus === "CANCELLED" && (
              <p>{t("v02.judgeCancelledNote")}</p>
            )}
          </div>
          {submission.judgeError && (
            <TaskErrorView error={submission.judgeError} />
          )}
          {result && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">
                    {t("v02.timeUsage")}
                  </dt>
                  <dd className="mt-1 font-medium">
                    {result.timeMs === null
                      ? t("v.unavailable")
                      : `${number(result.timeMs)} ms`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("v02.memoryUsage")}
                  </dt>
                  <dd className="mt-1 font-medium">
                    {result.memoryBytes === null
                      ? t("v.unavailable")
                      : `${number(result.memoryBytes / 1048576)} MiB (${number(result.memoryBytes)} B)`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("v02.testsPassed")}
                  </dt>
                  <dd className="mt-1 font-medium">
                    {number(result.passedTestCount)} /{" "}
                    {number(result.totalTestCount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("v02.score")}</dt>
                  <dd className="mt-1 font-medium">{number(result.score)}</dd>
                </div>
              </dl>
              <p className="text-muted-foreground">
                {t("v02.judgedAt")}:{" "}
                <time dateTime={result.judgedAt}>
                  {formatTimestamp(result.judgedAt, locale)}
                </time>
              </p>
              {result.diagnosticCode && (
                <p className="wrap-anywhere">
                  {t("v02.diagnosticCode")}:{" "}
                  <code>{result.diagnosticCode}</code>
                </p>
              )}
              {result.compileLog !== null && (
                <DetailsDisclosure
                  title={t("v02.compileLog")}
                  defaultOpen={result.verdict === "CE"}
                >
                  <pre
                    className="max-h-40 overflow-auto rounded-lg border bg-surface-supporting p-3 text-xs whitespace-pre-wrap wrap-anywhere"
                    tabIndex={0}
                    aria-label={t("v02.compileLog")}
                  >
                    {result.compileLog}
                  </pre>
                </DetailsDisclosure>
              )}
            </>
          )}
          {draftChanged && (
            <p className="text-muted-foreground">
              {t("v02.problem.draftChanged")}
            </p>
          )}
          <dl className="grid min-w-0 gap-1 text-muted-foreground">
            <div className="flex min-w-0 flex-wrap gap-x-2">
              <dt>{t("v02.problem.language")}</dt>
              <dd className="font-mono wrap-anywhere">
                {submission.languageId ?? t("v.unavailable")}
              </dd>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-2">
              <dt>{t("v02.frozenVersion")}</dt>
              <dd className="font-mono wrap-anywhere">
                {submission.problem.problemRef.problemVersionId ??
                  t("v.unavailable")}
              </dd>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-2">
              <dt>{t("v02.submissionId")}</dt>
              <dd className="font-mono wrap-anywhere">
                {submission.submissionId}
              </dd>
            </div>
          </dl>
          <Link
            href={`/submissions/detail?submissionId=${encodeURIComponent(submission.submissionId)}`}
            prefetch={false}
            className={buttonVariants({
              variant: "outline",
              size: "xs",
              wrap: true,
              className: "self-start",
            })}
          >
            {t("v02.openSubmission")}
          </Link>
        </>
      )}
    </div>
  );
}
