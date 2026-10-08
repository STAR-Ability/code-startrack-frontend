"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/i18n/locale";
import { idSchema } from "@/lib/api/schemas";
import { v02 } from "@/lib/api/v02";
import type {
  StaticAnalysisResult,
  SubmissionView,
} from "@/lib/api/v02-schemas";
import {
  useV02Submission,
  useV02Analysis,
  useV02Mutation,
} from "@/lib/query/v02-hooks";
import { EmptyState, QueryFeedback, ErrorNotice } from "../feedback";
import { SubmissionJudge } from "./submission-judge";
import { SubmissionSourceReveal } from "./submission-source";
import { StaticAnalysisView, analysisCanRetry } from "./static-analysis-view";

export function SubmissionDetail() {
  const params = useSearchParams();
  const { t } = useLocale();
  const submissionId = params.get("submissionId") ?? "";
  if (!idSchema.safeParse(submissionId).success)
    return (
      <EmptyState
        title={t("v02.invalidSubmissionLink")}
        href="/submissions"
        action={t("v02.backToSubmissions")}
      />
    );
  return (
    <SubmissionDetailContent key={submissionId} submissionId={submissionId} />
  );
}

export function SubmissionDetailContent({
  submissionId,
}: {
  submissionId: string;
}) {
  const { t } = useLocale();
  const query = useV02Submission(submissionId);
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Link
        href="/submissions"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          wrap: true,
          className: "self-start",
        })}
      >
        {t("v02.backToSubmissions")}
      </Link>
      <QueryFeedback query={query} />
      {query.data && <SubmissionDetailResults submission={query.data} />}
    </div>
  );
}

function SubmissionDetailResults({
  submission,
}: {
  submission: SubmissionView;
}) {
  const { t, locale } = useLocale();
  return (
    <>
      <header className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-medium wrap-anywhere">
          {submission.problem.title ?? submission.problem.problemRef.problemId}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("v02.submissionId")}</dt>
            <dd className="font-mono break-all">{submission.submissionId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v.language")}</dt>
            <dd>{submission.languageId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v.lastSubmitted")}</dt>
            <dd>
              <time dateTime={submission.submittedAt}>
                {formatTimestamp(submission.submittedAt, locale)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v02.frozenVersion")}</dt>
            <dd className="font-mono break-all">
              {submission.problem.problemRef.problemVersionId ??
                t("v.unavailable")}
            </dd>
          </div>
        </dl>
      </header>
      <SubmissionJudge submission={submission} />
      <SubmissionAnalysis submission={submission} />
      <SubmissionSourceReveal
        key={submission.submissionId}
        submissionId={submission.submissionId}
      />
    </>
  );
}

export function SubmissionAnalysis({
  submission,
}: {
  submission: SubmissionView;
}) {
  const analysis = useV02Analysis(submission.submissionId, submission);
  const [previousResult, setPreviousResult] =
    useState<StaticAnalysisResult | null>(null);
  const retry = useV02Mutation(
    "analysis-retry",
    (submissionId: string, key) => v02.retryAnalysis(submissionId, key),
    (result) => analysis.accept(result),
  );
  const eligible = analysis.data
    ? analysisCanRetry(analysis.data, submission)
    : false;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <QueryFeedback query={analysis} compact />
      <ErrorNotice error={retry.error} pending={retry.isPending} />
      {analysis.data && (
        <StaticAnalysisView
          analysis={analysis.data}
          previousResult={previousResult}
          retry={
            eligible
              ? () => {
                  if (analysis.data?.result)
                    setPreviousResult(analysis.data.result);
                  retry.mutate(submission.submissionId);
                }
              : undefined
          }
          retrying={retry.isPending}
          retryBlocked={retry.blocked}
        />
      )}
    </div>
  );
}
