"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { v02 } from "@/lib/api/v02";
import {
  judgeStatuses,
  judgeVerdicts,
  submissionFiltersSchema,
  type SubmissionFilters,
  type SubmissionView,
} from "@/lib/api/v02-schemas";
import { useV02Query } from "@/lib/query/v02-hooks";
import { formatTimestamp } from "@/lib/i18n/locale";
import { QueryFeedback, EmptyState, Pagination } from "../feedback";
import { SubmissionJudgeStatus } from "./submission-judge";

export function submissionDetailHref(submissionId: string) {
  return `/submissions/detail?${new URLSearchParams({ submissionId })}`;
}

function initialFilters(
  params: Pick<URLSearchParams, "get">,
): SubmissionFilters {
  const values = Object.fromEntries(
    ["problemId", "judgeStatus", "verdict", "from", "to"].flatMap((key) =>
      params.get(key) ? [[key, params.get(key)]] : [],
    ),
  );
  const parsed = submissionFiltersSchema.safeParse(values);
  return parsed.success ? parsed.data : {};
}

function localDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

type FilterFields = {
  problemId: string;
  judgeStatus: string;
  verdict: string;
  from: string;
  to: string;
};

export function SubmissionList() {
  const params = useSearchParams();
  return (
    <SubmissionListContent
      key={params.toString()}
      initial={initialFilters(params)}
    />
  );
}

function SubmissionListContent({ initial }: { initial: SubmissionFilters }) {
  const { t } = useLocale();
  const [filters, setFilters] = useState<SubmissionFilters>(initial);
  const [page, setPage] = useState(1);
  const form = useForm<FilterFields>({
    defaultValues: {
      problemId: filters.problemId ?? "",
      judgeStatus: filters.judgeStatus ?? "",
      verdict: filters.verdict ?? "",
      from: localDate(filters.from),
      to: localDate(filters.to),
    },
  });
  const query = useV02Query(
    "submissions",
    { ...filters, page, pageSize: 20 },
    (signal) => v02.submissions({ ...filters, page, pageSize: 20 }, signal),
  );
  return (
    <section
      className="flex min-w-0 flex-col gap-5"
      aria-label={t("v02.submissions")}
    >
      <p className="text-sm text-muted-foreground">
        {t("v02.submissionListNote")}
      </p>
      <form
        className="min-w-0"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          form.clearErrors();
          if (
            (values.from && !Number.isFinite(Date.parse(values.from))) ||
            (values.to && !Number.isFinite(Date.parse(values.to)))
          ) {
            form.setError("from", {
              message: t("v02.submissionInvalidFilter"),
            });
            return;
          }
          const parsed = submissionFiltersSchema.safeParse({
            problemId: values.problemId || undefined,
            judgeStatus: values.judgeStatus || undefined,
            verdict: values.verdict || undefined,
            from: values.from ? new Date(values.from).toISOString() : undefined,
            to: values.to ? new Date(values.to).toISOString() : undefined,
          });
          if (!parsed.success) {
            const field = parsed.error.issues.some(
              (issue) => issue.path[0] === "problemId",
            )
              ? "problemId"
              : "from";
            form.setError(field, {
              message: t("v02.submissionInvalidFilter"),
            });
            return;
          }
          setFilters(parsed.data);
          setPage(1);
        })}
      >
        <FieldGroup className="grid min-w-0 grid-cols-1 gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="submission-status-filter">
              {t("v02.judgeState")}
            </FieldLabel>
            <NativeSelect
              className="w-full min-w-0"
              id="submission-status-filter"
              {...form.register("judgeStatus")}
            >
              <NativeSelectOption value="">
                {t("v.status.ALL")}
              </NativeSelectOption>
              {judgeStatuses.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {t(`v02.judge.${value}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="submission-verdict-filter">
              {t("v02.verdict")}
            </FieldLabel>
            <NativeSelect
              className="w-full min-w-0"
              id="submission-verdict-filter"
              {...form.register("verdict")}
            >
              <NativeSelectOption value="">
                {t("v.status.ALL")}
              </NativeSelectOption>
              {judgeVerdicts.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {value} · {t(`v02.verdict.${value}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field data-invalid={!!form.formState.errors.problemId}>
            <FieldLabel htmlFor="submission-problem-filter">
              {t("v02.problemIdFilter")}
            </FieldLabel>
            <Input
              id="submission-problem-filter"
              inputMode="numeric"
              aria-invalid={!!form.formState.errors.problemId}
              aria-describedby={
                form.formState.errors.problemId
                  ? "submission-problem-error"
                  : undefined
              }
              {...form.register("problemId")}
            />
            <FieldError id="submission-problem-error">
              {form.formState.errors.problemId?.message}
            </FieldError>
          </Field>
          <Field data-invalid={!!form.formState.errors.from}>
            <FieldLabel htmlFor="submission-from-filter">
              {t("v.from")}
            </FieldLabel>
            <Input
              id="submission-from-filter"
              type="datetime-local"
              aria-invalid={!!form.formState.errors.from}
              aria-describedby="submission-date-description submission-from-error"
              {...form.register("from")}
            />
            <FieldDescription id="submission-date-description">
              {t("v02.submissionDates")}
            </FieldDescription>
            <FieldError id="submission-from-error">
              {form.formState.errors.from?.message}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="submission-to-filter">{t("v.to")}</FieldLabel>
            <Input
              id="submission-to-filter"
              type="datetime-local"
              {...form.register("to")}
            />
          </Field>
          <Field className="justify-end">
            <Button type="submit" disabled={query.isFetching}>
              {t("v.filter")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <QueryFeedback query={query} />
      {query.data?.data.length === 0 && (
        <EmptyState
          title={t("v02.submissionEmpty")}
          description={t("v02.submissionEmptyNote")}
          href="/problems"
          action={t("v02.openProblemBank")}
        />
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {query.data?.data.map((submission) => (
          <SubmissionRecord
            key={submission.submissionId}
            submission={submission}
          />
        ))}
      </div>
      <Pagination
        meta={query.data?.meta}
        page={page}
        setPage={setPage}
        pending={query.isFetching}
      />
    </section>
  );
}

export function SubmissionRecord({
  submission,
}: {
  submission: SubmissionView;
}) {
  const { t, locale } = useLocale();
  return (
    <Card size="sm" interaction="none" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="wrap-anywhere">
            {submission.problem.title ??
              submission.problem.problemRef.problemId}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        <SubmissionJudgeStatus submission={submission} />
        <Badge wrap variant="outline" className="self-start">
          {t(`v02.analysis.${submission.analysisStatus}`)}
        </Badge>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("v02.submissionId")}</dt>
            <dd className="font-mono break-all">{submission.submissionId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v.language")}</dt>
            <dd className="wrap-anywhere">{submission.languageId}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{t("v.lastSubmitted")}</dt>
            <dd>
              <time dateTime={submission.submittedAt}>
                {formatTimestamp(submission.submittedAt, locale)}
              </time>
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Link
          href={submissionDetailHref(submission.submissionId)}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            wrap: true,
          })}
        >
          {t("v02.openSubmission")}
        </Link>
      </CardFooter>
    </Card>
  );
}
