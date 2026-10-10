"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { v02 } from "@/lib/api/v02";
import { modes, uuidSchema, type RecommendationMode } from "@/lib/api/schemas";
import {
  generateRecommendationsSchema,
  recommendationSources,
  type GenerateRecommendationsInput,
  type RecommendationSource,
} from "@/lib/api/v02-schemas";
import { useV02Mutation, useV02Query } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EmptyState,
  ErrorNotice,
  Pagination,
  QueryFeedback,
} from "../feedback";
import { Panel } from "../v012-shared";
import { LearningRecommendationView } from "./learning-recommendation-view";

export function LearningRecommendationPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const raw = useSearchParams().get("batchId");
  const valid = uuidSchema.safeParse(raw);
  const [selection, setSelection] = useState<string | null>(
    valid.success ? valid.data : null,
  );
  const [selectionUrl, setSelectionUrl] = useState(raw);
  const [ignoreInvalid, setIgnoreInvalid] = useState(false);
  if (selectionUrl !== raw) {
    setSelectionUrl(raw);
    setSelection(valid.success ? valid.data : null);
    setIgnoreInvalid(false);
  }
  const [source, setSource] = useState<RecommendationSource>("ALL");
  const [mode, setMode] = useState<RecommendationMode>("HYBRID");
  const [historyAll, setHistoryAll] = useState(false);
  const [page, setPage] = useState(1);
  const selectionVersion = useRef(0);
  const generationSelection = useRef<{
    version: number;
    urlBatchId: string | null;
  } | null>(null);
  const form = useForm<{ limit: number }>({ defaultValues: { limit: 10 } });
  const latest = useV02Query("recommendations", { source, mode }, (signal) =>
    v02.recommendations(source, mode, signal),
  );
  const history = useV02Query(
    "recommendation-history",
    {
      source: historyAll ? undefined : source,
      mode: historyAll ? undefined : mode,
      page,
    },
    (signal) =>
      v02.recommendationHistory(
        { ...(historyAll ? {} : { source, mode }), page },
        signal,
      ),
  );
  const batch = useV02Query(
    "recommendation-batch",
    { batchId: selection },
    (signal) => v02.recommendationBatch(selection!, signal),
    !!selection,
  );
  const current = selection ? batch : latest;
  const invalid = !!raw && !valid.success && !ignoreInvalid;
  const generation = useV02Mutation(
    "generate-recommendations",
    (body: GenerateRecommendationsInput, key) =>
      v02.generateRecommendations(body, key),
    (result) => {
      const requested = generationSelection.current;
      if (
        !requested ||
        requested.version !== selectionVersion.current ||
        requested.urlBatchId !== raw
      )
        return;
      setSelection(result.batchId);
      setIgnoreInvalid(true);
    },
  );
  const changeScope = () => {
    selectionVersion.current++;
    setPage(1);
    setSelection(null);
    setIgnoreInvalid(true);
    router.replace("/learning-recommendations", { scroll: false });
  };
  return (
    <>
      <Panel
        title="v02.generation"
        description={t("v02.generationNote")}
        variant="supporting"
        tone="info"
      >
        <FieldGroup className="grid min-w-0 gap-5 lg:grid-cols-2">
          <Field>
            <FieldLabel>{t("v02.problemSource")}</FieldLabel>
            <ToggleGroup
              aria-label={t("v02.problemSource")}
              value={[source]}
              className="max-w-full flex-wrap"
              onValueChange={(values) => {
                const next = recommendationSources.find(
                  (item) => item === values[0],
                );
                if (next) {
                  setSource(next);
                  changeScope();
                }
              }}
            >
              {recommendationSources.map((item) => (
                <ToggleGroupItem
                  key={item}
                  value={item}
                  className="h-auto max-w-full min-w-0 py-2 whitespace-normal"
                >
                  {t(`v02.source.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>{t("v02.mode")}</FieldLabel>
            <ToggleGroup
              aria-label={t("v02.mode")}
              value={[mode]}
              className="max-w-full flex-wrap"
              onValueChange={(values) => {
                const next = modes.find((item) => item === values[0]);
                if (next) {
                  setMode(next);
                  changeScope();
                }
              }}
            >
              {modes.map((item) => (
                <ToggleGroupItem
                  key={item}
                  value={item}
                  className="h-auto max-w-full min-w-0 py-2 whitespace-normal"
                >
                  {t(`v.mode.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldGroup>
        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              const body = generateRecommendationsSchema.safeParse({
                source,
                mode,
                limit: values.limit,
              });
              if (!body.success) {
                form.setError("limit", { message: t("v02.limitError") });
                return;
              }
              form.clearErrors();
              generationSelection.current = {
                version: selectionVersion.current,
                urlBatchId: raw,
              };
              generation.mutate(body.data);
            })(event);
          }}
          className="flex min-w-0 flex-col gap-4 border-t pt-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <FieldGroup className="min-w-0 max-w-xs">
            <Field
              className="min-w-0 max-w-xs"
              data-invalid={!!form.formState.errors.limit}
            >
              <FieldLabel htmlFor="learning-limit">{t("v02.limit")}</FieldLabel>
              <Input
                id="learning-limit"
                type="number"
                min={1}
                max={50}
                step={1}
                aria-invalid={!!form.formState.errors.limit}
                {...form.register("limit", { valueAsNumber: true })}
              />
              <FieldError>{form.formState.errors.limit?.message}</FieldError>
            </Field>
          </FieldGroup>
          <div className="max-w-full shrink-0">
            <Button wrap type="submit" disabled={generation.blocked}>
              {generation.isPending && <Spinner aria-hidden="true" />}
              {t(generation.isPending ? "v02.generating" : "v02.generate")}
            </Button>
          </div>
        </form>
        <ErrorNotice
          error={generation.error}
          retry={
            generation.variables
              ? () => generation.mutate(generation.variables!)
              : undefined
          }
          pending={generation.isPending}
        />
        {generation.data && (
          <p role="status">
            {t("v02.generatedAt")}:{" "}
            {formatTimestamp(generation.data.generatedAt, locale)}
          </p>
        )}
      </Panel>
      {(selection || invalid) && (
        <div>
          <Link
            href="/learning-recommendations"
            className={buttonVariants({ variant: "outline", wrap: true })}
            onClick={() => {
              selectionVersion.current++;
              setSelection(null);
              setIgnoreInvalid(true);
            }}
          >
            {t("v02.latest")}
          </Link>
        </div>
      )}
      {invalid ? (
        <EmptyState title={t("v02.invalidBatchId")} />
      ) : (
        <>
          <QueryFeedback query={current} />
          {current.data ? (
            <LearningRecommendationView batch={current.data} />
          ) : (
            current.data === null && (
              <EmptyState
                title={t("v02.recommendationNull")}
                description={t("v02.recommendationNullNote")}
                href="/learning-profile"
                action={t("v02.openLearningProfile")}
              />
            )
          )}
        </>
      )}
      <Panel title="v02.history" variant="supporting">
        <ToggleGroup
          aria-label={t("v02.history")}
          className="max-w-full flex-wrap"
          value={[historyAll ? "ALL" : "SCOPE"]}
          onValueChange={(values) => {
            if (values[0] === "ALL" || values[0] === "SCOPE") {
              selectionVersion.current++;
              setHistoryAll(values[0] === "ALL");
              setPage(1);
            }
          }}
        >
          <ToggleGroupItem
            value="SCOPE"
            className="h-auto max-w-full min-w-0 py-2 whitespace-normal"
          >
            {t(`v02.source.${source}`)} · {t(`v.mode.${mode}`)}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ALL"
            className="h-auto max-w-full min-w-0 py-2 whitespace-normal"
          >
            {t("v02.historyAll")}
          </ToggleGroupItem>
        </ToggleGroup>
        <QueryFeedback query={history} />
        {history.data?.data.length === 0 && (
          <EmptyState embedded title={t("v.noRecords")} />
        )}
        {history.data?.data.map((item) => (
          <div
            key={item.batchId}
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <time dateTime={item.generatedAt}>
                {formatTimestamp(item.generatedAt, locale)}
              </time>
              <p className="text-sm">
                {t(`v02.source.${item.source}`)} · {t(`v.mode.${item.mode}`)} ·{" "}
                {t("v02.results")}: {item.resultCount}
                {item.stale && (
                  <>
                    {" "}
                    · <Badge variant="warning">{t("v.stale")}</Badge>
                  </>
                )}
              </p>
            </div>
            <Link
              href={`/learning-recommendations?batchId=${item.batchId}`}
              scroll={false}
              className={buttonVariants({ variant: "outline", wrap: true })}
              onClick={() => {
                selectionVersion.current++;
                setSelection(item.batchId);
                setIgnoreInvalid(true);
              }}
            >
              {t("v02.viewBatch")}
            </Link>
          </div>
        ))}
        <Pagination
          meta={history.data?.meta}
          page={page}
          setPage={(next) => {
            selectionVersion.current++;
            setPage(next);
          }}
          pending={history.isFetching}
        />
      </Panel>
    </>
  );
}
