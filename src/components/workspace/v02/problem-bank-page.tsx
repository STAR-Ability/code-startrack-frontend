"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { SearchIcon } from "lucide-react";
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
    if (parsed.filters) {
      setFilters(parsed.filters);
      setPage(1);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <p className="max-w-3xl text-muted-foreground">
        {t("v02.problem.bankDescription")}
      </p>
      <form
        onSubmit={form.handleSubmit(applyFilters)}
        className="min-w-0 rounded-xl border bg-card p-5"
      >
        <FieldGroup className="grid min-w-0 grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field className="min-w-0" data-invalid={filterError === "keyword"}>
            <FieldLabel
              htmlFor="problem-q"
              className="max-w-full wrap-anywhere"
            >
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
          <Field className="min-w-0" data-invalid={filterError === "tag"}>
            <FieldLabel
              htmlFor="problem-tag"
              className="max-w-full wrap-anywhere"
            >
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
              className="min-w-0"
              data-invalid={filterError === "difficulty"}
            >
              <FieldLabel
                htmlFor={`problem-${field}`}
                className="max-w-full wrap-anywhere"
              >
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
          <Field className="min-w-0 md:col-span-2 xl:col-span-4">
            <FieldDescription id="problem-filter-hint">
              {t("v02.problem.filterHint")}
            </FieldDescription>
            {filterError && (
              <p
                role="alert"
                id="problem-filter-error"
                className="text-sm text-destructive"
              >
                {t(errorMessages[filterError])}
              </p>
            )}
            <div className="flex min-w-0 flex-wrap gap-2">
              <Button type="submit" wrap>
                <SearchIcon data-icon="inline-start" aria-hidden="true" />
                {t("v02.problem.filter")}
              </Button>
              <Button
                type="button"
                variant="outline"
                wrap
                onClick={() => {
                  form.reset(emptyProblemFilters);
                  applyFilters(emptyProblemFilters);
                }}
              >
                {t("v02.problem.resetFilters")}
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </form>
      <QueryFeedback query={query} />
      {query.data && (
        <>
          {query.data.data.length ? (
            <ul className="flex min-w-0 flex-col divide-y rounded-xl border bg-card">
              {query.data.data.map((problem) => (
                <li
                  key={`${problem.problemRef.problemId}:${problem.problemRef.problemVersionId}`}
                  className="flex min-w-0 flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
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
                    })}
                  >
                    {t("v02.problem.open")}
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
