"use client";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { ArrowRightIcon, RouteIcon } from "lucide-react";
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
import { DataRegion, ErrorNotice, useCountdown } from "./feedback";
import { BatchView } from "./recommendation-card";
import { AccountPortfolio } from "./account-portfolio";
import { PersonalDataGate } from "./personal-data-gate";
import { SyncPanel } from "./sync-panel";
import { Badge } from "@/components/ui/badge";
import { AccountSwitcher } from "./workspace-page";
import { Separator } from "@/components/ui/separator";

export function DashboardPage() {
  const { t } = useLocale();
  return (
    <>
      <AccountPortfolio />
      <div className="flex items-center gap-3 pt-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("portfolio.selected")}
        </h2>
        <Separator className="flex-1" />
      </div>
      <PersonalDataGate>
        <SelectedTraining />
      </PersonalDataGate>
    </>
  );
}
function SelectedTraining() {
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
      <div className="flex flex-wrap items-end gap-3">
        <AccountSwitcher inline />
        {account!.bindStatus !== "ACTIVE" && (
          <Badge variant="secondary">
            {t(
              account!.bindStatus === "UNBOUND"
                ? "v.readOnly"
                : "v.invalidAccount",
            )}
          </Badge>
        )}
      </div>
      <DataRegion query={dashboard} name={t("v.dashboard")}>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card variant="recommendation" interaction="none" className="h-full">
            <CardHeader className="gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl border border-info/15 bg-info-soft text-info">
                <RouteIcon className="size-5" aria-hidden="true" />
              </span>
              <CardTitle>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("v.nextAction")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-start gap-4">
              {!dashboard.data ? (
                <p>{t("v.unavailable")}</p>
              ) : next === "WAIT_SYNC" ? (
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
                  size="lg"
                >
                  {action.isPending && (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  )}
                  {t(next === "SYNC" ? "v.sync" : "v.rebuild")}
                </Button>
              ) : (
                <>
                  <p>{t(next === "NONE" ? "v.ready" : "v.noBatch")}</p>
                  <Link
                    href="/practice"
                    className={buttonVariants({ size: "lg", wrap: true })}
                  >
                    {t(
                      next === "GENERATE_RECOMMENDATIONS"
                        ? "v.generate"
                        : "nav.practice",
                    )}
                    <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </>
              )}
              <ErrorNotice error={action.error} />
            </CardContent>
          </Card>
          <div className="flex min-w-0 flex-col gap-3">
            <BatchView
              batch={dashboard.data?.recommendationBatch ?? null}
              firstOnly
            />
          </div>
        </div>
      </DataRegion>
      <SyncPanel account={account!} />
    </>
  );
}
