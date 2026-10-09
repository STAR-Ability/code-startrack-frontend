"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRightIcon, CheckCheckIcon, ListFilterIcon } from "lucide-react";
import { v02 } from "@/lib/api/v02";
import {
  problemSources,
  trainingStatuses,
  trainingFiltersSchema,
  type TrainingFilters,
  type TrainingRecord,
} from "@/lib/api/v02-schemas";
import { useV02Query } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Panel } from "../v012-shared";
import { EmptyState, Pagination, QueryFeedback } from "../feedback";
import { TrainingProblem } from "./training-problem";
import { utcDateBoundary } from "./learning-model";

type FilterForm = { source: string; status: string; from: string; to: string };
export function TrainingPage() {
  const params = useSearchParams();
  return (
    <TrainingList key={params.toString()} urlSource={params.get("source")} />
  );
}

function TrainingList({ urlSource }: { urlSource: string | null }) {
  const { t } = useLocale();
  const initial = trainingFiltersSchema.safeParse({
    source: urlSource ?? undefined,
  });
  const [filters, setFilters] = useState<TrainingFilters>(
    initial.success ? initial.data : {},
  );
  const [page, setPage] = useState(1);
  const form = useForm<FilterForm>({
    defaultValues: {
      source: filters.source ?? "",
      status: "",
      from: "",
      to: "",
    },
  });
  const query = useV02Query(
    "training-records",
    { ...filters, page },
    (signal) => v02.trainingRecords({ ...filters, page }, signal),
  );
  return (
    <>
      <Panel
        title="v02.training"
        description={t("v02.trainingFactsNote")}
        tone="support"
      >
        <form
          className="min-w-0 rounded-xl border border-surface-border bg-surface-supporting p-4 sm:p-5"
          onSubmit={form.handleSubmit((values) => {
            const parsed = trainingFiltersSchema.safeParse({
              source: values.source || undefined,
              status: values.status || undefined,
              from: utcDateBoundary(values.from),
              to: utcDateBoundary(values.to),
            });
            if (!parsed.success) {
              form.setError("to", { message: t("v02.dateRangeError") });
              return;
            }
            form.clearErrors();
            setPage(1);
            setFilters(parsed.data);
          })}
        >
          <FieldGroup className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Field className="min-w-0">
              <FieldLabel htmlFor="training-source">
                {t("v02.problemSource")}
              </FieldLabel>
              <NativeSelect
                className="w-full min-w-0"
                id="training-source"
                {...form.register("source")}
              >
                <NativeSelectOption value="">
                  {t("v02.source.ALL")}
                </NativeSelectOption>
                {problemSources.map((source) => (
                  <NativeSelectOption key={source} value={source}>
                    {t(`v02.source.${source}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="training-status">
                {t("v02.status")}
              </FieldLabel>
              <NativeSelect
                className="w-full min-w-0"
                id="training-status"
                {...form.register("status")}
              >
                <NativeSelectOption value="">
                  {t("v02.status.ALL")}
                </NativeSelectOption>
                {trainingStatuses.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {t(`v02.status.${status}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="training-from">{t("v02.from")}</FieldLabel>
              <Input
                id="training-from"
                type="date"
                {...form.register("from")}
              />
            </Field>
            <Field
              className="min-w-0"
              data-invalid={!!form.formState.errors.to}
            >
              <FieldLabel htmlFor="training-to">{t("v02.to")}</FieldLabel>
              <Input
                id="training-to"
                type="date"
                aria-invalid={!!form.formState.errors.to}
                {...form.register("to")}
              />
              <FieldError>{form.formState.errors.to?.message}</FieldError>
            </Field>
            <FieldDescription className="sm:col-span-2 lg:col-span-4">
              {t("v02.dateFilterNote")}
            </FieldDescription>
          </FieldGroup>
          <Button
            wrap
            type="submit"
            className="mt-4"
            disabled={query.isFetching}
          >
            <ListFilterIcon data-icon="inline-start" aria-hidden="true" />
            {t("v02.applyFilters")}
          </Button>
        </form>
        <QueryFeedback query={query} />
        {query.data?.data.map((record) => (
          <TrainingRow key={record.trainingRecordId} record={record} />
        ))}
        {query.data?.data.length === 0 && (
          <EmptyState
            title={t("v02.trainingEmpty")}
            description={t("v02.trainingEmptyNote")}
            href="/problems"
            action={t("v02.problemBank")}
          />
        )}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
      </Panel>
    </>
  );
}

function TrainingRow({ record }: { record: TrainingRecord }) {
  const { t, locale } = useLocale();
  return (
    <article className="flex min-w-0 flex-col gap-4 border-b py-5 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TrainingProblem problem={record.problem} />
        <Badge
          wrap
          variant={record.status === "COMPLETED" ? "success" : "secondary"}
        >
          {record.status === "COMPLETED" && (
            <CheckCheckIcon aria-hidden="true" />
          )}
          {t(`v02.status.${record.status}`)}
        </Badge>
      </div>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <dl className="flex min-w-0 flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("v02.attemptCount")}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {record.attemptCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v02.acceptedCount")}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-success">
              {record.acceptedSubmissionCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v02.lastSubmission")}</dt>
            <dd className="mt-1 text-xs">
              {record.lastSubmittedAt
                ? formatTimestamp(record.lastSubmittedAt, locale)
                : t("v.unavailable")}
            </dd>
          </div>
        </dl>
        <div>
          <Link
            href={`/training/detail?trainingRecordId=${record.trainingRecordId}`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              wrap: true,
            })}
          >
            {t("v02.trainingDetail")}
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
