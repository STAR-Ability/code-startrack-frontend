"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { ArrowUpRightIcon, UsersRoundIcon } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { keys } from "@/lib/query/keys";
import { isMissingResource } from "@/lib/api/errors";
import { createReadQueue, portfolioTotals } from "@/lib/api/portfolio";
import type { AnalysisWindow } from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { useAccounts } from "./account-provider";
import { DataRegion, EmptyState } from "./feedback";
import { WindowSelector } from "./analysis-page";
import { MetricPanel } from "./metric-panel";

const read = createReadQueue();
export function AccountPortfolio() {
  const { accounts, user, query: accountQuery, selectAccount } = useAccounts();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [window, setWindow] = useState<AnalysisWindow>("30D");
  const queries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: keys.resource(
        user.publicId,
        account.accountId,
        "portfolio-overview",
        { window },
      ),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        read(signal, () => api.overview(account.accountId, window, signal)),
    })),
  });
  const snapshots = queries.flatMap((q) =>
    !isMissingResource(q.error) && q.data ? [q.data] : [],
  );
  const totals = portfolioTotals(accounts, snapshots, window);
  const fetching = accountQuery.isFetching || queries.some((q) => q.isFetching);
  const error = accountQuery.error ?? queries.find((q) => q.error)?.error;
  const state = {
    data: totals,
    isPending: accountQuery.isPending || queries.some((q) => q.isPending),
    isFetching: fetching,
    error,
    refetch: () =>
      Promise.all([accountQuery.refetch(), ...queries.map((q) => q.refetch())]),
  };
  const number = (v: number) => new Intl.NumberFormat(locale).format(v);
  return (
    <DataRegion
      query={state}
      name={t("portfolio.title")}
      empty={!snapshots.length || totals.submissionCount === 0}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WindowSelector value={window} onChange={setWindow} />
        <Link
          href="/accounts"
          prefetch={false}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            wrap: true,
          })}
        >
          <UsersRoundIcon data-icon="inline-start" aria-hidden="true" />
          {t("portfolio.manage")}
        </Link>
      </div>
      <MetricPanel
        title="portfolio.title"
        loading={fetching && !snapshots.length}
        description={t("portfolio.coverage", {
          loaded: number(totals.analysedCount),
          total: number(totals.accountCount),
        })}
        metrics={[
          ["portfolio.accounts", totals.accountCount],
          ["v.submissions", totals.submissionCount],
          ["v.accepted", totals.acceptedSubmissionCount],
          ["portfolio.solved", totals.solvedOccurrences],
        ]}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("portfolio.note")}
        {totals.staleCount > 0 && <> · {t("v.staleNote")}</>}
      </p>
      <Card size="sm" interaction="none">
        <CardHeader>
          <CardTitle>
            <h2>{t("portfolio.bindings")}</h2>
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">{number(accounts.length)}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!accounts.length && <EmptyState title={t("v.noAccount")} />}
          <ul className="flex flex-col divide-y">
            {accounts.slice(0, 6).map((account, index) => {
              const snapshot = isMissingResource(queries[index].error)
                ? undefined
                : queries[index].data;
              return (
                <li key={account.accountId} className="portfolio-account">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="wrap-anywhere font-medium">
                      {account.username}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{account.bindStatus}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {t("v.rating")}:{" "}
                        {account.rating === null
                          ? t("v.unrated")
                          : number(account.rating)}
                      </span>
                    </div>
                  </div>
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <div>
                      <dt className="text-muted-foreground">
                        {t("v.submissions")}
                      </dt>
                      <dd className="tabular-nums">
                        {number(snapshot?.summary.submissionCount ?? 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("v.solved")}</dt>
                      <dd className="tabular-nums">
                        {number(snapshot?.summary.solvedCount ?? 0)}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2">
                    {queries[index].error ? (
                      <Badge variant="outline">{t("portfolio.failed")}</Badge>
                    ) : !queries[index].isFetching && !snapshot ? (
                      <Badge variant="secondary">{t("v.noAnalysis")}</Badge>
                    ) : snapshot?.stale ? (
                      <Badge variant="secondary">{t("v.stale")}</Badge>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      wrap
                      onClick={() => {
                        selectAccount(account.accountId);
                        router.push("/data");
                      }}
                    >
                      {t("portfolio.details")}
                      <ArrowUpRightIcon
                        data-icon="inline-end"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          {accounts.length > 6 && (
            <Link
              href="/accounts"
              className="text-sm underline underline-offset-4"
            >
              {t("portfolio.viewAll", { count: number(accounts.length) })}
            </Link>
          )}
        </CardContent>
      </Card>
    </DataRegion>
  );
}
