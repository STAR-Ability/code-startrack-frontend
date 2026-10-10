"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api/endpoints";
import {
  idSchema,
  verdicts,
  type AnalysisWindow,
  type ProblemDto,
  type SubmissionDto,
} from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { verdictTone } from "@/lib/ui/status";
import { trendOption } from "@/lib/charts/options";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormInput } from "@/components/ui/form-input";
import { WindowSelector } from "./analysis-page";
import { AnalysisView } from "./analysis-view";
import { useAccountQuery } from "./use-account-query";
import { QueryFeedback, DataRegion, EmptyState, Pagination } from "./feedback";
import { ProblemLink } from "./recommendation-card";
import { Chart } from "./chart";
import { useAccountTimezone } from "./account-provider";

export function DataPage() {
  const { t } = useLocale();
  const [window, setWindow] = useState<AnalysisWindow>("30D");
  const [tab, setTab] = useState("problems");
  const overview = useAccountQuery("overview", { window }, (id, signal) =>
    api.overview(id, window, signal),
  );
  return (
    <>
      <WindowSelector value={window} onChange={setWindow} />
      <DataRegion
        query={overview}
        name={t("profile.overview")}
        empty={!overview.data || overview.data.summary.submissionCount === 0}
      >
        <AnalysisView
          analysis={overview.data ?? null}
          statistics
          loading={overview.isFetching && overview.data === undefined}
          unavailable={!!overview.error}
        />
      </DataRegion>
      <ToggleGroup
        aria-label={t("v.data")}
        className="w-full min-w-0 flex-wrap"
        value={[tab]}
        onValueChange={(values) => {
          if (values[0]) setTab(values[0]);
        }}
      >
        {(
          [
            ["problems", "v.problems"],
            ["submissions", "v.submissions"],
            ["ratings", "v.ratingHistory"],
          ] as const
        ).map(([value, label]) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="h-auto max-w-full min-w-0 py-2 whitespace-normal"
          >
            {t(label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {tab === "problems" ? (
        <Problems />
      ) : tab === "submissions" ? (
        <Submissions />
      ) : (
        <Ratings />
      )}
    </>
  );
}
function Problems() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");
  const [filters, setFilters] = useState<{
    tag?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
  }>({});
  const [problem, setProblem] = useState<ProblemDto | null>(null);
  const form = useForm<{ tag: string; min: string; max: string }>({
    defaultValues: { tag: "", min: "", max: "" },
  });
  const query = useAccountQuery(
    "problems",
    { page, status, ...filters },
    (id, signal) => api.problems(id, { page, status, ...filters }, signal),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("v.problems")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ToggleGroup
          aria-label={t("v.status")}
          className="w-full min-w-0 flex-wrap"
          value={[status]}
          onValueChange={(values) => {
            if (["ALL", "SOLVED", "UNSOLVED"].includes(values[0])) {
              setStatus(values[0] as typeof status);
              setPage(1);
            }
          }}
        >
          {(["ALL", "SOLVED", "UNSOLVED"] as const).map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(`v.status.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <form
          onSubmit={form.handleSubmit((values) => {
            const min = values.min === "" ? undefined : Number(values.min);
            const max = values.max === "" ? undefined : Number(values.max);
            if (
              (min !== undefined && !Number.isSafeInteger(min)) ||
              (max !== undefined && !Number.isSafeInteger(max)) ||
              (min !== undefined && max !== undefined && min > max)
            ) {
              form.setError("min", { message: t("v.invalidFilter") });
              return;
            }
            setFilters({
              tag: values.tag || undefined,
              minDifficulty: min,
              maxDifficulty: max,
            });
            setPage(1);
          })}
        >
          <FieldGroup className="sm:flex-row sm:items-end">
            <FormInput label={t("v.tag")} {...form.register("tag")} />
            <FormInput
              label={t("v.minDifficulty")}
              type="number"
              step={1}
              error={form.formState.errors.min?.message}
              {...form.register("min")}
            />
            <FormInput
              label={t("v.maxDifficulty")}
              type="number"
              step={1}
              {...form.register("max")}
            />
            <Button type="submit">{t("v.filter")}</Button>
          </FieldGroup>
        </form>
        <QueryFeedback query={query} />
        {!query.isFetching && !query.error && query.data?.data.length === 0 && (
          <EmptyState title={t("v.noRecords")} />
        )}
        {query.data?.data.map((item) => (
          <div
            key={item.problem.problemId}
            className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <p className="wrap-anywhere font-medium">
                {item.problem.title ?? item.problem.externalProblemKey}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.problem.externalProblemKey} ·{" "}
                {item.problem.difficulty ?? t("v.unrated")} · {t("v.attempts")}:{" "}
                {item.progress.attemptCount}
              </p>
              <Badge variant={item.progress.accepted ? "success" : "outline"}>
                {t(
                  item.progress.accepted
                    ? "v.status.SOLVED"
                    : "v.status.UNSOLVED",
                )}
              </Badge>
            </div>
            <Button
              variant="outline"
              wrap
              onClick={() => setProblem(item.problem)}
            >
              {t("v.problemSubmissions")}
            </Button>
          </div>
        ))}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
        <Sheet
          open={!!problem}
          onOpenChange={(open) => {
            if (!open) setProblem(null);
          }}
        >
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>
                {problem?.title ??
                  problem?.externalProblemKey ??
                  t("v.problemSubmissions")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-6">
              {problem && (
                <>
                  <ProblemLink problem={problem} />
                  <Submissions
                    key={problem.problemId}
                    problemId={problem.problemId}
                  />
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
function Submissions({ problemId }: { problemId?: string }) {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    verdict?: string;
    from?: string;
    to?: string;
    problemId?: string;
  }>({ problemId });
  const form = useForm({
    defaultValues: {
      verdict: "",
      from: "",
      to: "",
      problemId: problemId ?? "",
    },
  });
  const query = useAccountQuery(
    "submissions",
    { ...filters, page },
    (id, signal) => api.submissions(id, { ...filters, page }, signal),
  );
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">{t("v.submissions")}</h2>
      {!problemId && (
        <form
          onSubmit={form.handleSubmit((values) => {
            if (
              (values.problemId &&
                !idSchema.safeParse(values.problemId).success) ||
              (values.from && !Number.isFinite(Date.parse(values.from))) ||
              (values.to && !Number.isFinite(Date.parse(values.to))) ||
              (values.from &&
                values.to &&
                Date.parse(values.from) >= Date.parse(values.to))
            ) {
              form.setError("from", { message: t("v.invalidDates") });
              return;
            }
            setFilters({
              verdict: values.verdict || undefined,
              problemId: values.problemId || undefined,
              from: values.from
                ? new Date(values.from).toISOString()
                : undefined,
              to: values.to ? new Date(values.to).toISOString() : undefined,
            });
            setPage(1);
          })}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="verdict-filter">{t("v.verdict")}</FieldLabel>
              <NativeSelect id="verdict-filter" {...form.register("verdict")}>
                <NativeSelectOption value="">
                  {t("v.status.ALL")}
                </NativeSelectOption>
                {verdicts.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {value === "PENDING" ? t("v.pending") : value}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <FormInput
              label={t("v.problemId")}
              inputMode="numeric"
              {...form.register("problemId")}
            />
            <FormInput
              label={t("v.from")}
              type="datetime-local"
              error={form.formState.errors.from?.message}
              {...form.register("from")}
            />
            <FormInput
              label={t("v.to")}
              type="datetime-local"
              {...form.register("to")}
            />
            <Button type="submit">{t("v.filter")}</Button>
          </FieldGroup>
        </form>
      )}
      <QueryFeedback query={query} />
      {!query.isFetching && !query.error && query.data?.data.length === 0 && (
        <EmptyState title={t("v.noRecords")} />
      )}
      {query.data?.data.map((item) => (
        <Submission key={item.submissionId} item={item} />
      ))}
      <Pagination
        meta={query.data?.meta}
        page={page}
        setPage={setPage}
        pending={query.isFetching}
      />
    </section>
  );
}
function Submission({ item }: { item: SubmissionDto }) {
  const { t, locale } = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="wrap-anywhere">
            {item.problem.title ?? item.problem.externalProblemKey}
          </h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant={verdictTone[item.verdict]}>
          {item.verdict === "PENDING" ? t("v.pending") : item.verdict}
        </Badge>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt>{t("v.language")}</dt>
            <dd>{item.programmingLanguage ?? t("v.unavailable")}</dd>
          </div>
          <div>
            <dt>{t("v.time")}</dt>
            <dd>{item.timeMs ?? t("v.unavailable")}</dd>
          </div>
          <div>
            <dt>{t("v.memory")}</dt>
            <dd>
              {item.memoryBytes === null
                ? t("v.unavailable")
                : (item.memoryBytes / 1048576).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>{t("v.lastSubmitted")}</dt>
            <dd className="wrap-anywhere">
              <time dateTime={item.submittedAt}>
                {formatTimestamp(item.submittedAt, locale)}
              </time>
            </dd>
          </div>
        </dl>
        {(item.teamName || item.memberHandles.length > 1) && (
          <p>
            {t("v.team")}: {item.teamName} · {item.memberHandles.join(", ")}
          </p>
        )}
        <p className="text-xs break-all text-muted-foreground">
          ID: {item.submissionId} · CF: {item.externalSubmissionId}
        </p>
      </CardContent>
      <CardFooter>
        <ProblemLink problem={item.problem} />
      </CardFooter>
    </Card>
  );
}
function Ratings() {
  const { t, locale } = useLocale();
  const timezone = useAccountTimezone();
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: timezone,
    }).format(new Date(value));
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const [page, setPage] = useState(1);
  const query = useAccountQuery("ratings", { page }, (id, signal) =>
    api.ratings(id, page, signal),
  );
  const chronological = [...(query.data?.data ?? [])].reverse();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("v.ratingHistory")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <QueryFeedback query={query} />
        {!query.isFetching && !query.error && query.data?.data.length === 0 && (
          <EmptyState title={t("v.noRecords")} />
        )}
        {chronological.length > 0 && (
          <Chart
            label={t("v.ratingHistory")}
            option={{
              ...trendOption(
                chronological.map((item) => date(item.occurredAt)),
                [
                  {
                    id: "rating",
                    name: t("v.rating"),
                    values: chronological.map((item) => item.newRating),
                  },
                ],
              ),
              yAxis: {
                type: "value",
                scale: true,
                minInterval: 1,
                axisLabel: { fontSize: 11 },
                splitLine: { lineStyle: { type: "dashed" } },
              },
            }}
          />
        )}
        {query.data?.data.map((item) => (
          <div
            key={item.contestId}
            className="flex flex-col gap-1 border-b pb-3 text-sm"
          >
            <p className="font-medium">{item.contestName}</p>
            <p>
              {t("v.rank")}: {number(item.rank)} · {number(item.oldRating)} →{" "}
              {number(item.newRating)}
            </p>
            <time dateTime={item.occurredAt}>
              {formatTimestamp(item.occurredAt, locale)}
            </time>
          </div>
        ))}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
      </CardContent>
    </Card>
  );
}
