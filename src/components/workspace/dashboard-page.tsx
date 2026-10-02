"use client";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobLock } from "./use-job-lock";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentBinding } from "@/lib/query/session";
import type { SyncStatusDto } from "@/lib/api/schemas";
import { useAccounts } from "./account-provider";
import { useAccountQuery } from "./use-account-query";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QueryFeedback, ErrorNotice, useCountdown } from "./feedback";
import { BatchView } from "./recommendations-page";
import { AnalysisView } from "./analysis-view";

export function DashboardPage() {
  const { account, user } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const dashboard = useAccountQuery("dashboard", {}, api.dashboard);
  const locked = useJobLock(user.publicId, account!.accountId);
  const action = useMutation({
    meta: {
      publicId: user.publicId,
      accountId: account!.accountId,
      operation: "job",
    },
    mutationFn: (kind: "SYNC" | "REBUILD_ANALYSIS") =>
      kind === "SYNC"
        ? api.sync(account!.accountId)
        : api.rebuild(account!.accountId),
    onSuccess: (job) => {
      if (!isCurrentBinding(client, user.publicId, account!.accountId)) return;
      const id = account!.accountId;
      client.setQueryData(
        keys.resource(user.publicId, id, "job", { jobId: job.jobId }),
        job,
      );
      client.setQueryData<SyncStatusDto>(
        keys.resource(user.publicId, id, "sync-status"),
        (previous) => ({
          accountId: id,
          lastSyncedAt: previous
            ? previous.lastSyncedAt
            : account!.lastSyncedAt,
          lastSyncStatus: job.status,
          nextSyncAt: previous ? previous.nextSyncAt : account!.nextSyncAt,
          latestJob: job,
        }),
      );
      void client.invalidateQueries({
        queryKey: keys.resource(user.publicId, id, "dashboard"),
      });
    },
  });
  const remaining = useCountdown(
    action.error instanceof ApiError ? action.error.retryAt : 0,
  );
  const next = dashboard.data?.nextAction;
  return (
    <>
      <QueryFeedback query={dashboard} />
      {dashboard.data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("v.nextAction")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              {next === "WAIT_SYNC" ? (
                <p role="status">{t("v.syncing")}</p>
              ) : next === "SYNC" || next === "REBUILD_ANALYSIS" ? (
                <Button
                  disabled={
                    locked ||
                    action.isPending ||
                    !!remaining ||
                    account?.bindStatus === "UNBOUND"
                  }
                  onClick={() => action.mutate(next)}
                >
                  {action.isPending && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t(next === "SYNC" ? "v.sync" : "v.rebuild")}
                </Button>
              ) : (
                <>
                  <p>{t(next === "NONE" ? "v.ready" : "v.noBatch")}</p>
                  <Link href="/practice" className={buttonVariants()}>
                    {t(
                      next === "GENERATE_RECOMMENDATIONS"
                        ? "v.generate"
                        : "nav.practice",
                    )}
                  </Link>
                </>
              )}
              <ErrorNotice error={action.error} />
            </CardContent>
          </Card>
          <BatchView batch={dashboard.data.recommendationBatch} firstOnly />
          <AnalysisView analysis={dashboard.data.analysis} />
        </>
      )}
    </>
  );
}
