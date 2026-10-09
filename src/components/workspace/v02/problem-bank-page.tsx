"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import "./problem-workspace.css";
import { EmptyState, Pagination, QueryFeedback } from "../feedback";
import { v02 } from "@/lib/api/v02";
import { useV02Query } from "@/lib/query/v02-hooks";
import type { PlatformProblemSummary } from "@/lib/api/v02-schemas";
import {
  emptyProblemFilters,
  parseProblemFilters,
  problemHref,
  type ProblemFilterValues,
} from "./problem-state";

export function ProblemDifficulty({
  problem,
}: {
  problem: Pick<PlatformProblemSummary, "difficulty" | "difficultyScale">;
}) {
  const { t } = useLocale();
  return (
    <Badge variant="secondary" wrap>
      {t(`v02.problem.scale.${problem.difficultyScale}`)}
      {problem.difficulty !== null && ` · ${problem.difficulty}`}
    </Badge>
  );
}

export function ProblemBankPage() {
  const { t } = useLocale();
  const [filters, setFilters] = useState<
    NonNullable<ReturnType<typeof parseProblemFilters>["filters"]>
  >({
    status: "PUBLISHED",
    q: undefined,
    tag: undefined,
    minDifficulty: undefined,
    maxDifficulty: undefined,
  });
  const [page, setPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filterError, setFilterError] =
    useState<ReturnType<typeof parseProblemFilters>["error"]>();
  const form = useForm<ProblemFilterValues>({
    defaultValues: emptyProblemFilters,
  });
  const query = useV02Query("problems", { ...filters, page }, (signal) =>
    v02.problems({ ...filters, page }, signal),
  );
  const errorMessages = {
    keyword: "v02.problem.invalidKeyword",
    tag: "v02.problem.invalidTag",
    difficulty: "v02.problem.invalidDifficulty",
  } as const;

  function applyFilters(values: ProblemFilterValues) {
    const parsed = parseProblemFilters(values);
    setFilterError(parsed.error);
    if (parsed.error && parsed.error !== "keyword") setAdvancedOpen(true);
    if (parsed.filters) {
      setFilters(parsed.filters);
      setPage(1);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="problem-library-banner">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-info">
            <BookOpenIcon className="size-4" aria-hidden="true" />
            {t("v02.problem.catalog")}
          </p>
          <h2 className="hidden text-xl font-semibold tracking-tight sm:block sm:text-2xl">
            {t("v02.problem.catalogHint")}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("v02.problem.bankDescription")}
          </p>
        </div>
        {query.data && (
          <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-start sm:gap-1">
            <span className="text-xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {query.data.meta.total}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("v02.problem.problemCount", {
                count: String(query.data.meta.total),
              })}
            </span>
          </div>
        )}
      </div>
      <form
        onSubmit={form.handleSubmit(applyFilters)}
        className="min-w-0 rounded-xl border border-surface-border bg-surface-reading p-4 sm:p-5"
      >
        <FieldGroup className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-end gap-3">
            <Field
              className="min-w-0 flex-1 basis-full sm:basis-0"
              data-invalid={filterError === "keyword"}
            >
              <FieldLabel htmlFor="problem-q">
                {t("v02.problem.search")}
              </FieldLabel>
              <Input
                id="problem-q"
                {...form.register("q")}
                aria-invalid={filterError === "keyword"}
                aria-describedby={
                  filterError === "keyword" ? "problem-filter-error" : undefined
                }
              />
            </Field>
            <Button type="submit" wrap>
              <SearchIcon data-icon="inline-start" aria-hidden="true" />
              {t("v02.problem.filter")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              wrap
              onClick={() => {
                form.reset(emptyProblemFilters);
                applyFilters(emptyProblemFilters);
              }}
            >
              {t("v02.problem.resetFilters")}
            </Button>
          </div>
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group/filter"
                />
              }
            >
              <SlidersHorizontalIcon
                data-icon="inline-start"
                aria-hidden="true"
              />
              {t("v02.problem.advancedFilters")}
              <ChevronDownIcon
                data-icon="inline-end"
                aria-hidden="true"
                className="transition-transform group-data-panel-open/filter:rotate-180 motion-reduce:transition-none"
              />
            </CollapsibleTrigger>
            <CollapsibleContent keepMounted>
              <FieldGroup className="grid min-w-0 grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                <Field data-invalid={filterError === "tag"}>
                  <FieldLabel htmlFor="problem-tag">
                    {t("v02.problem.tag")}
                  </FieldLabel>
                  <Input
                    id="problem-tag"
                    {...form.register("tag")}
                    aria-invalid={filterError === "tag"}
                    aria-describedby={
                      filterError === "tag" ? "problem-filter-error" : undefined
                    }
                  />
                </Field>
                {(["minDifficulty", "maxDifficulty"] as const).map((field) => (
                  <Field
                    key={field}
                    data-invalid={filterError === "difficulty"}
                  >
                    <FieldLabel htmlFor={`problem-${field}`}>
                      {t(`v02.problem.${field}`)}
                    </FieldLabel>
                    <Input
                      id={`problem-${field}`}
                      type="text"
                      inputMode="numeric"
                      {...form.register(field)}
                      aria-invalid={filterError === "difficulty"}
                      aria-describedby={
                        filterError === "difficulty"
                          ? "problem-filter-error"
                          : "problem-filter-hint"
                      }
                    />
                  </Field>
                ))}
                <Field className="sm:col-span-3">
                  <FieldDescription id="problem-filter-hint">
                    {t("v02.problem.filterHint")}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>
          {filterError && (
            <p
              role="alert"
              id="problem-filter-error"
              className="text-sm text-destructive"
            >
              {t(errorMessages[filterError])}
            </p>
          )}
        </FieldGroup>
      </form>
      {(filters.q ||
        filters.tag ||
        filters.minDifficulty ||
        filters.maxDifficulty) && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label={t("v02.problem.activeFilters")}
        >
          <span className="text-xs text-muted-foreground">
            {t("v02.problem.activeFilters")}
          </span>
          {filters.q && (
            <Badge variant="secondary" wrap>
              {t("v02.problem.search")}: {filters.q}
            </Badge>
          )}
          {filters.tag && (
            <Badge variant="secondary" wrap>
              {t("v02.problem.tag")}: {filters.tag}
            </Badge>
          )}
          {filters.minDifficulty && (
            <Badge variant="secondary">
              {t("v02.problem.minDifficulty")}: {filters.minDifficulty}
            </Badge>
          )}
          {filters.maxDifficulty && (
            <Badge variant="secondary">
              {t("v02.problem.maxDifficulty")}: {filters.maxDifficulty}
            </Badge>
          )}
        </div>
      )}
      <QueryFeedback query={query} />
      {query.data && (
        <>
          {query.data.data.length ? (
            <ul className="problem-library-list divide-y divide-surface-border">
              {query.data.data.map((problem, index) => (
                <li
                  key={`${problem.problemRef.problemId}:${problem.problemRef.problemVersionId}`}
                  className="problem-library-row"
                >
                  <span className="problem-row-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <Link
                      href={problemHref(
                        problem.problemRef.problemId,
                        problem.problemRef.problemVersionId,
                      )}
                      className="text-lg font-semibold wrap-anywhere underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {problem.title ?? t("v02.problem.untitled")}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <ProblemDifficulty problem={problem} />
                      {problem.tags.map((tag) => (
                        <Badge key={tag} variant="outline" wrap>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="min-w-0 text-xs wrap-anywhere text-muted-foreground">
                      #{problem.problemRef.problemId} · {problem.timeLimitMs} ms
                      · {problem.memoryLimitBytes} B
                    </p>
                  </div>
                  <Link
                    href={problemHref(
                      problem.problemRef.problemId,
                      problem.problemRef.problemVersionId,
                    )}
                    className={buttonVariants({
                      variant: "outline",
                      wrap: true,
                      className: "self-start sm:self-center",
                    })}
                  >
                    {t("v02.problem.open")}
                    <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={t("v02.problem.noResults")}
              description={t("v02.problem.noResultsDescription")}
            />
          )}
          <Pagination
            meta={query.data.meta}
            page={page}
            setPage={setPage}
            pending={query.isFetching}
          />
        </>
      )}
    </div>
  );
}
