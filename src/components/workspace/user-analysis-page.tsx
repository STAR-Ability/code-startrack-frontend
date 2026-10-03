"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import type { UserAnalysisDto } from "@/lib/api/v012-schemas";
import { windows, type AnalysisWindow } from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { useAccounts } from "./account-provider";
import { useUserQuery } from "./use-user-query";
import { AnalysisView } from "./analysis-view";
import { WindowSelector } from "./analysis-page";
import {
  EmptyState,
  ErrorNotice,
  QueryFeedback,
  Pagination,
  useCountdown,
} from "./feedback";
import { Panel, AiJobNotice } from "./v012-shared";
import { ApiError } from "@/lib/api/errors";
import { isAiJobPending } from "./use-ai-job";
export function UserSources({ analysis }: { analysis: UserAnalysisDto }) {
  const { t } = useLocale();
  const { selectAccount } = useAccounts();
  return (
    <Panel
      title="v12.sourceAccounts"
      description={`${t("v12.sources")}: ${analysis.sourceAccountCount}`}
    >
      <dl className="flex flex-col gap-3">
        {analysis.ratingAccounts.map((account) => (
          <div
            key={account.accountId}
            className="flex flex-wrap justify-between gap-2"
          >
            <dt>
              <Link
                href="/accounts"
                onClick={() => selectAccount(account.accountId)}
                className="underline"
              >
                {account.username}
              </Link>
            </dt>
            <dd>
              {t("v.rating")}: {account.currentRating ?? "—"} ·{" "}
              {t("v.maxRating")}: {account.maxRating ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
export function UserRebuild() {
  const { user } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const mutation = useMutation({
    mutationKey: ["private", user.publicId, "user-rebuild"],
    meta: { publicId: user.publicId, v012: true },
    mutationFn: v012.rebuildUser,
    onSuccess: (job) => {
      if (!isCurrentUser(client, user.publicId)) return;
      client.setQueryData(keys.aiJob(user.publicId, job.jobId), job);
      setJobId(job.jobId);
    },
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  const job = useQuery({
    queryKey: keys.aiJob(user.publicId, jobId ?? "none"),
    queryFn: ({ signal }) => v012.aiJob(jobId!, signal),
    enabled: false,
  });
  const active = isAiJobPending(jobId, job.data, job.error);
  return (
    <div className="flex flex-col gap-3">
      <Button
        wrap
        className="self-start"
        disabled={mutation.isPending || remaining > 0 || active}
        onClick={() => mutation.mutate()}
      >
        {t("v12.rebuild")}
      </Button>
      <ErrorNotice error={mutation.error} />
      <AiJobNotice jobId={jobId} />
    </div>
  );
}
export function UserAnalysisEmpty() {
  const { accounts } = useAccounts();
  const { t } = useLocale();
  return (
    <EmptyState
      title={t(accounts.length ? "v12.sourcePending" : "v12.bindGuide")}
      href="/accounts"
      action={t("v.accounts")}
    />
  );
}
export function UserProfilePage() {
  const { t } = useLocale();
  const [window, setWindow] = useState<AnalysisWindow>("ALL");
  const [page, setPage] = useState(1);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const latest = useUserQuery(
    "user-analysis",
    { endpoint: "latest", window },
    (publicId, signal) => v012.userAnalysis(publicId, window, signal),
  );
  const history = useUserQuery(
    "user-analysis",
    { endpoint: "history", window, page },
    (id, signal) => v012.userAnalysisHistory(id, window, { page }, signal),
  );
  const snapshot = useUserQuery(
    "user-analysis",
    { endpoint: "snapshot", snapshotId },
    (id, signal) => v012.userSnapshot(id, snapshotId!, signal),
    !!snapshotId,
  );
  const displayed = snapshotId ? snapshot : latest;
  return (
    <>
      <p className="text-sm text-muted-foreground">{t("v12.aggregateNote")}</p>
      <WindowSelector
        value={window}
        onChange={(value) => {
          if (windows.includes(value)) {
            setWindow(value);
            setPage(1);
            setSnapshotId(null);
          }
        }}
      />
      <UserRebuild />
      {snapshotId && (
        <Button
          wrap
          variant="outline"
          className="self-start"
          onClick={() => setSnapshotId(null)}
        >
          {t("v.latest")}
        </Button>
      )}
      <QueryFeedback query={displayed} />
      {!displayed.data && (
        <AnalysisView
          analysis={null}
          aggregate
          dimensions
          ability
          loading={displayed.isFetching}
          unavailable={!!displayed.error}
          metricTitle="metrics.ability"
        />
      )}
      {displayed.data ? (
        <>
          <AnalysisView
            analysis={displayed.data}
            aggregate
            dimensions
            ability
          />
          <UserSources analysis={displayed.data} />
        </>
      ) : (
        !displayed.isFetching && <UserAnalysisEmpty />
      )}
      <Panel title="v12.analysisHistory">
        <QueryFeedback query={history} />
        {history.data?.data.map((item) => (
          <div
            key={item.snapshotId}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <span>
              {item.createdAt} · {item.overallScore} / 100
            </span>
            <Button
              wrap
              variant="outline"
              onClick={() => setSnapshotId(item.snapshotId)}
            >
              {t("v.snapshot")}
            </Button>
          </div>
        ))}
        {history.data?.data.length === 0 && (
          <EmptyState title={t("v.noRecords")} />
        )}
        <Pagination
          meta={history.data?.meta}
          page={page}
          setPage={setPage}
          pending={history.isFetching}
        />
      </Panel>
    </>
  );
}
