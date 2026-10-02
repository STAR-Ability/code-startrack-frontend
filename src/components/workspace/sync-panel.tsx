"use client";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import { useJobLock } from "./use-job-lock";
import { api } from "@/lib/api/endpoints";
import { ApiError, isMissingResource } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentBinding } from "@/lib/query/session";
import type {
  OjAccountDto,
  SyncJobDto,
  SyncStatusDto,
} from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccounts } from "./account-provider";
import { ErrorNotice, QueryFeedback, useCountdown } from "./feedback";

export const jobIsActive = (job?: SyncJobDto | null) =>
  !!job && (job.status === "QUEUED" || job.status === "RUNNING");
export function pollingInterval(failures: number) {
  return Math.min(30_000, 3000 * 2 ** Math.min(failures, 4));
}

export function SyncPanel({ account }: { account: OjAccountDto }) {
  const { user } = useAccounts();
  const { t, locale } = useLocale();
  const client = useQueryClient();
  const id = account.accountId;
  const statusKey = keys.resource(user.publicId, id, "sync-status");
  const status = useQuery({
    queryKey: statusKey,
    queryFn: ({ signal }) => api.syncStatus(id, signal),
    refetchInterval: (query) => {
      if (
        query.state.error instanceof ApiError &&
        [401, 403, 404].includes(query.state.error.status)
      )
        return false;
      return query.state.error
        ? pollingInterval(
            query.state.fetchFailureCount || query.state.errorUpdateCount,
          )
        : 30_000;
    },
    refetchIntervalInBackground: false,
  });
  const missingStatus = isMissingResource(status.error);
  const jobId = missingStatus ? undefined : status.data?.latestJob?.jobId;
  const job = useQuery({
    queryKey: keys.resource(user.publicId, id, "job", { jobId }),
    queryFn: ({ signal }) => api.job(id, jobId!, signal),
    enabled: !!jobId,
    initialData: () => status.data?.latestJob ?? undefined,
    refetchInterval: (query) => {
      if (
        query.state.error instanceof ApiError &&
        [401, 403, 404].includes(query.state.error.status)
      )
        return false;
      return jobIsActive(query.state.data) || query.state.error
        ? pollingInterval(query.state.error ? query.state.errorUpdateCount : 0)
        : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  const missingJob = isMissingResource(job.error);
  const latestJob =
    missingStatus || missingJob
      ? undefined
      : (job.data ?? status.data?.latestJob);
  const terminalSeen = useRef<string | null>(null);
  useEffect(() => {
    if (
      !latestJob ||
      jobIsActive(latestJob) ||
      terminalSeen.current === latestJob.jobId
    )
      return;
    terminalSeen.current = latestJob.jobId;
    void client.invalidateQueries({
      queryKey: keys.account(user.publicId, id),
      predicate: (query) => query.queryKey[4] !== "job",
    });
    void client.invalidateQueries({ queryKey: keys.accounts(user.publicId) });
  }, [latestJob, client, user.publicId, id]); // account ownership is captured by this mounted panel
  const locked = useJobLock(user.publicId, id);
  const action = useMutation({
    meta: { publicId: user.publicId, accountId: id, operation: "job" },
    mutationFn: (kind: "sync" | "rebuild") =>
      kind === "sync" ? api.sync(id) : api.rebuild(id),
    onSuccess: (next) => {
      if (!isCurrentBinding(client, user.publicId, id)) return;
      client.setQueryData(
        keys.resource(user.publicId, id, "job", { jobId: next.jobId }),
        next,
      );
      client.setQueryData<SyncStatusDto>(statusKey, (previous) => ({
        accountId: id,
        lastSyncedAt: previous ? previous.lastSyncedAt : account.lastSyncedAt,
        lastSyncStatus: next.status,
        nextSyncAt: previous ? previous.nextSyncAt : account.nextSyncAt,
        latestJob: next,
      }));
      void client.invalidateQueries({
        queryKey: keys.resource(user.publicId, id, "dashboard"),
      });
    },
  });
  const remaining = useCountdown(
    action.error instanceof ApiError ? action.error.retryAt : 0,
  );
  const pending =
    locked || action.isPending || jobIsActive(latestJob) || remaining > 0;
  const format = (value: string | null | undefined) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: user.timezone,
        }).format(new Date(value))
      : t("v.never");
  return (
    <Card size="sm" interaction="none">
      <CardHeader>
        <CardTitle>
          <h2>{t("v.syncStatus")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <QueryFeedback query={status} />
        {jobId && <QueryFeedback query={job} showLoading={false} />}
        {
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("v.lastSync")}</dt>
              <dd>
                {format(
                  !missingStatus && status.data
                    ? status.data.lastSyncedAt
                    : missingStatus
                      ? null
                      : account.lastSyncedAt,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("v.nextSync")}</dt>
              <dd>
                {format(
                  !missingStatus && status.data
                    ? status.data.nextSyncAt
                    : missingStatus
                      ? null
                      : account.nextSyncAt,
                )}
              </dd>
            </div>
          </dl>
        }
        {latestJob ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <div className="flex flex-wrap gap-2">
              <Badge>{t(`v.job.${latestJob.status}`)}</Badge>
              {latestJob.stage && (
                <Badge variant="outline">
                  {t(`v.stage.${latestJob.stage}`)}
                </Badge>
              )}
            </div>
            {jobIsActive(latestJob) && (
              <p className="flex items-center gap-2">
                <Spinner aria-hidden="true" />
                {t("v.syncing")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {t("v.jobCounts", {
                fetched: String(latestJob.itemsFetched),
                inserted: String(latestJob.itemsInserted),
                updated: String(latestJob.itemsUpdated),
              })}
            </p>
            {latestJob.status === "PARTIAL" && (
              <Alert>
                <AlertDescription>{t("v.partial")}</AlertDescription>
              </Alert>
            )}
            {latestJob.errors.map((error, index) => (
              <Alert key={index}>
                <AlertDescription>
                  <p>{t(`v.stage.${error.stage}`)}</p>
                  <p>{t(error.retryable ? "v.retryable" : "v.notRetryable")}</p>
                  <DetailsDisclosure title={t("ui.details")}>
                    <p className="break-all font-mono">{error.code}</p>
                  </DetailsDisclosure>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : !status.isPending && !status.error && !missingJob ? (
          <p>{t("v.noJob")}</p>
        ) : null}
        {account.bindStatus !== "UNBOUND" && (
          <div className="flex flex-wrap gap-2">
            <Button
              wrap
              disabled={pending}
              onClick={() => action.mutate("sync")}
            >
              {action.isPending ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {t("v.sync")}
            </Button>
            <Button
              wrap
              variant="outline"
              disabled={pending || account.bindStatus !== "ACTIVE"}
              onClick={() => action.mutate("rebuild")}
            >
              {action.isPending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("v.rebuild")}
            </Button>
          </div>
        )}
        <ErrorNotice error={action.error} />
      </CardContent>
    </Card>
  );
}
