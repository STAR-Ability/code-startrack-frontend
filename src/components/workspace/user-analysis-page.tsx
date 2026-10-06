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
import { formatNumber, formatTimestamp } from "@/lib/i18n/locale";
import { Button } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { useAccounts } from "./account-provider";
import { useUserQuery } from "./use-user-query";
import {
  AnalysisView,
  AnalysisStatistics,
  ProfileDirection,
} from "./analysis-view";
export { ProfileDirection } from "./analysis-view";
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
export function UserSources({
  analysis,
  showSummary = true,
}: {
  analysis: UserAnalysisDto;
  showSummary?: boolean;
}) {
  const { t, locale } = useLocale();
  const { selectAccount } = useAccounts();
  return (
    <Panel
      title="v12.sourceAccounts"
      variant="supporting"
      description={
        showSummary
          ? `${t("v12.sources")}: ${formatNumber(analysis.sourceAccountCount, locale)}`
          : undefined
      }
    >
      <dl className="flex min-w-0 flex-col divide-y">
        {analysis.ratingAccounts.map((account) => (
          <div
            key={account.accountId}
            className="flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0"
          >
            <dt className="min-w-0">
              <Link
                href="/accounts"
                onClick={() => selectAccount(account.accountId)}
                className="auth-text-link wrap-anywhere font-medium"
              >
                {account.username}
              </Link>
            </dt>
            <dd className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>
                {t("v.rating")}:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {account.currentRating === null
                    ? "—"
                    : formatNumber(account.currentRating, locale)}
                </span>
              </span>
              <span>
                {t("v.maxRating")}:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {account.maxRating === null
                    ? "—"
                    : formatNumber(account.maxRating, locale)}
                </span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {!analysis.ratingAccounts.length && (
        <EmptyState title={t("v.noRecords")} embedded />
      )}
    </Panel>
  );
}
export function UserRebuild({ secondary = false }: { secondary?: boolean }) {
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
        variant={secondary ? "outline" : "default"}
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
export function UserAnalysisEmpty({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { accounts } = useAccounts();
  const { t } = useLocale();
  return (
    <EmptyState
      embedded={embedded}
      title={t(accounts.length ? "v12.sourcePending" : "v12.bindGuide")}
      href="/accounts"
      action={t("v.accounts")}
    />
  );
}
export function UserProfilePage() {
  const { t, locale } = useLocale();
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
      {displayed.data && (
        <ProfileDirection analysis={displayed.data} historical={!!snapshotId} />
      )}
      <div className="profile-controls">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {t("v12.aggregateNote")}
          </p>
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
        </div>
        <div className="flex min-w-0 flex-wrap items-start gap-3">
          {snapshotId && (
            <Button wrap variant="outline" onClick={() => setSnapshotId(null)}>
              {t("v.latest")}
            </Button>
          )}
          <UserRebuild secondary />
        </div>
      </div>
      <QueryFeedback
        query={displayed}
        showInitialLoading={false}
        resource={t("metrics.ability")}
      />
      {!displayed.data && (
        <AnalysisView
          analysis={null}
          aggregate
          dimensions
          ability
          loading={displayed.isFetching}
          unavailable={!!displayed.error}
          metricTitle="metrics.ability"
          emptyState={
            displayed.isSuccess && !displayed.error ? (
              <UserAnalysisEmpty embedded />
            ) : undefined
          }
        />
      )}
      {displayed.data && (
        <>
          <AnalysisView
            analysis={displayed.data}
            aggregate
            dimensions
            ability
            metricTitle={snapshotId ? "metrics.snapshot" : "metrics.ability"}
            sourceCount={displayed.data.sourceAccountCount}
          />
          <DetailsDisclosure
            title={t("profile.supportingEvidence")}
            variant="panel"
            keepMounted={false}
          >
            <p className="text-sm text-muted-foreground">
              {t("profile.supportingEvidenceNote")}
            </p>
            <AnalysisStatistics analysis={displayed.data} aggregate />
          </DetailsDisclosure>
        </>
      )}
      <div className="profile-supporting-region">
        <div
          className="profile-supporting-grid"
          data-has-sources={!!displayed.data}
        >
          {displayed.data && (
            <UserSources analysis={displayed.data} showSummary={false} />
          )}
          <Panel title="v12.analysisHistory" variant="supporting">
            <QueryFeedback
              query={history}
              resource={t("v12.analysisHistory")}
            />
            <ul className="flex min-w-0 flex-col divide-y">
              {history.data?.data.map((item) => (
                <li
                  key={item.snapshotId}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <time dateTime={item.createdAt}>
                      {formatTimestamp(item.createdAt, locale)}
                    </time>
                    <p className="text-xs text-muted-foreground">
                      {t("v.overallScore")}:{" "}
                      {formatNumber(item.overallScore, locale, 2)} / 100
                    </p>
                  </div>
                  <Button
                    wrap
                    variant="outline"
                    size="sm"
                    aria-pressed={snapshotId === item.snapshotId}
                    onClick={() => setSnapshotId(item.snapshotId)}
                  >
                    {t("v.snapshot")}
                  </Button>
                </li>
              ))}
            </ul>
            {history.data?.data.length === 0 && (
              <EmptyState title={t("v.noRecords")} embedded />
            )}
            <Pagination
              meta={history.data?.meta}
              page={page}
              setPage={setPage}
              pending={history.isFetching}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
