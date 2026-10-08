"use client";

import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { formatTimestamp } from "@/lib/i18n/locale";
import type { SubmissionView, TaskError } from "@/lib/api/v02-schemas";
import { Panel } from "../v012-shared";

export function submittedProblemHref(submission: SubmissionView) {
  const ref = submission.problem.problemRef;
  const params = new URLSearchParams({ problemId: ref.problemId });
  if (ref.problemVersionId)
    params.set("problemVersionId", ref.problemVersionId);
  return `/problems/detail?${params}`;
}

export function TaskErrorView({ error }: { error: TaskError }) {
  const { t } = useLocale();
  return (
    <Alert>
      <AlertTitle className="wrap-anywhere">{error.code}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 wrap-anywhere">
        <p>{error.message}</p>
        <p>{t(error.retryable ? "v02.retryable" : "v02.notRetryable")}</p>
      </AlertDescription>
    </Alert>
  );
}

export function SubmissionJudgeStatus({
  submission,
}: {
  submission: SubmissionView;
}) {
  const { t } = useLocale();
  const result = submission.judgeResult;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        wrap
        variant={submission.judgeStatus === "FAILED" ? "warning" : "secondary"}
      >
        {t(`v02.judge.${submission.judgeStatus}`)}
      </Badge>
      {result && (
        <Badge
          wrap
          variant={
            result.verdict === "AC"
              ? "success"
              : result.verdict === "IE"
                ? "warning"
                : "outline"
          }
        >
          {result.verdict} · {t(`v02.verdict.${result.verdict}`)}
        </Badge>
      )}
    </div>
  );
}

export function SubmissionJudge({
  submission,
}: {
  submission: SubmissionView;
}) {
  const { t, locale } = useLocale();
  const result = submission.judgeResult;
  const pending = ["QUEUED", "DISPATCHING", "RUNNING"].includes(
    submission.judgeStatus,
  );
  const recovery =
    submission.judgeStatus === "FAILED" &&
    !submission.judgeTaskId &&
    submission.judgeError?.retryable;
  const number = (value: number | null) =>
    value === null
      ? t("v.unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          value,
        );
  return (
    <Panel title="v02.judgeResult">
      <div role="status" aria-live="polite">
        <SubmissionJudgeStatus submission={submission} />
      </div>
      {pending && <p>{t("v02.judgePendingNote")}</p>}
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
      {result?.verdict === "AC" && <p>{t("v02.judgeAcceptedNote")}</p>}
      {submission.judgeError && <TaskErrorView error={submission.judgeError} />}
      {result && (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("v02.timeUsage")}</dt>
              <dd>
                {result.timeMs === null
                  ? t("v.unavailable")
                  : `${number(result.timeMs)} ms`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("v02.memoryUsage")}</dt>
              <dd>
                {result.memoryBytes === null
                  ? t("v.unavailable")
                  : `${number(result.memoryBytes / 1048576)} MiB (${number(result.memoryBytes)} B)`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("v02.testsPassed")}</dt>
              <dd>
                {number(result.passedTestCount)} /{" "}
                {number(result.totalTestCount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("v02.score")}</dt>
              <dd>{number(result.score)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("v02.judgedAt")}</dt>
              <dd>
                <time dateTime={result.judgedAt}>
                  {formatTimestamp(result.judgedAt, locale)}
                </time>
              </dd>
            </div>
          </dl>
          {result.diagnosticCode && (
            <p className="wrap-anywhere">
              {t("v02.diagnosticCode")}: <code>{result.diagnosticCode}</code>
            </p>
          )}
          {result.compileLog !== null && (
            <DetailsDisclosure title={t("v02.compileLog")} variant="panel">
              <pre
                className="max-h-80 overflow-auto rounded-lg border bg-surface-supporting p-4 text-xs whitespace-pre-wrap wrap-anywhere"
                tabIndex={0}
                aria-label={t("v02.compileLog")}
              >
                {result.compileLog}
              </pre>
            </DetailsDisclosure>
          )}
        </>
      )}
      <DetailsDisclosure title={t("v02.taskIdentity")}>
        <dl className="grid gap-2">
          <div>
            <dt>{t("v02.judgeTaskId")}</dt>
            <dd className="font-mono break-all">
              {submission.judgeTaskId ?? t("v.unavailable")}
            </dd>
          </div>
          <div>
            <dt>{t("v02.revision")}</dt>
            <dd>{submission.judgeRevision}</dd>
          </div>
          <div>
            <dt>{t("v02.updatedAt")}</dt>
            <dd>
              <time dateTime={submission.updatedAt}>
                {formatTimestamp(submission.updatedAt, locale)}
              </time>
            </dd>
          </div>
        </dl>
      </DetailsDisclosure>
      <div className="flex flex-wrap gap-3">
        <Link
          href={submittedProblemHref(submission)}
          className={buttonVariants({ variant: "outline", wrap: true })}
        >
          {t("v02.viewFrozenProblem")}
        </Link>
        <Link
          href="/training?source=PLATFORM"
          className={buttonVariants({ variant: "ghost", wrap: true })}
        >
          {t("v02.viewTrainingRecords")}
        </Link>
      </div>
    </Panel>
  );
}
