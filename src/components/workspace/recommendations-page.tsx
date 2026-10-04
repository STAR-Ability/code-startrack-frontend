"use client";
import { Spinner } from "@/components/ui/spinner";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentBinding } from "@/lib/query/session";
import { type RecommendationMode } from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { useAccounts } from "./account-provider";
import { useAccountQuery } from "./use-account-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PracticeModePicker } from "./practice-mode-picker";
import { FormInput } from "@/components/ui/form-input";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  ErrorNotice,
  Pagination,
  QueryFeedback,
  DataRegion,
  useCountdown,
  useSlowRequest,
} from "./feedback";
import { BatchView } from "./recommendation-card";
import { AnalysisView } from "./analysis-view";

export function RecommendationsPage({
  initialMode = "HYBRID",
}: {
  initialMode?: RecommendationMode;
}) {
  const { t, locale } = useLocale();
  const { user, account } = useAccounts();
  const client = useQueryClient();
  const [mode, setMode] = useState<RecommendationMode>(initialMode);
  const [limit, setLimit] = useState("10");
  const [page, setPage] = useState(1);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [allModes, setAllModes] = useState(false);
  const attempt = useRef<{
    mode: RecommendationMode;
    limit: number;
    key: string;
  } | null>(null);
  const latest = useAccountQuery("recommendations", { mode }, (id, signal) =>
    api.recommendations(id, mode, signal),
  );
  const history = useAccountQuery(
    "recommendation-history",
    { mode: allModes ? undefined : mode, page },
    (id, signal) =>
      api.recommendationHistory(id, allModes ? undefined : mode, page, signal),
  );
  const batch = useAccountQuery(
    "batch",
    { batchId },
    (id, signal) => api.batch(id, batchId!, signal),
    !!batchId,
  );
  const snapshot = useAccountQuery(
    "snapshot",
    { snapshotId },
    (id, signal) => api.snapshot(id, snapshotId!, signal),
    !!snapshotId,
  );
  const generate = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: (operation: {
      mode: RecommendationMode;
      limit: number;
      key: string;
    }) =>
      api.generate(
        account!.accountId,
        operation.mode,
        operation.limit,
        operation.key,
      ),
    onSuccess: (result, operation) => {
      if (!isCurrentBinding(client, user.publicId, result.accountId)) return;
      client.setQueryData(
        keys.resource(user.publicId, result.accountId, "recommendations", {
          mode: operation.mode,
        }),
        result,
      );
      void client.invalidateQueries({
        queryKey: keys.account(user.publicId, result.accountId),
        predicate: (query) =>
          ["recommendation-history", "dashboard"].includes(
            String(query.queryKey[4]),
          ),
      });
      attempt.current = null;
      setBatchId(null);
    },
  });
  const remaining = useCountdown(
    generate.error instanceof ApiError ? generate.error.retryAt : 0,
  );
  function run() {
    const count = Number(limit);
    if (!Number.isInteger(count) || count < 1 || count > 50) return;
    if (
      !attempt.current ||
      attempt.current.mode !== mode ||
      attempt.current.limit !== count
    )
      attempt.current = { mode, limit: count, key: crypto.randomUUID() };
    generate.mutate(attempt.current);
  }
  useSlowRequest(generate.isPending);
  const displayed = batchId ? batch : latest;
  return (
    <>
      <Card
        interaction="none"
        variant="supporting"
        className="@container/practice-controls"
      >
        <CardHeader>
          <CardTitle>
            <h2>{t("practice.controls")}</h2>
          </CardTitle>
          <CardDescription>{t("v.recommendationNote")}</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 items-start gap-4 @3xl/practice-controls:grid-cols-[minmax(0,1fr)_19rem]">
          <PracticeModePicker
            mode={mode}
            disabled={generate.isPending}
            onChange={(value) => {
              setMode(value);
              setPage(1);
              setBatchId(null);
              attempt.current = null;
              generate.reset();
            }}
          />
          {account?.bindStatus === "ACTIVE" && (
            <FieldGroup className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-end gap-3">
              <FormInput
                label={t("v.limit")}
                type="number"
                min={1}
                max={50}
                step={1}
                disabled={generate.isPending}
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
              <Button
                wrap
                disabled={
                  generate.isPending ||
                  (generate.error instanceof ApiError &&
                    generate.error.status === 403) ||
                  !!remaining ||
                  !Number.isInteger(Number(limit)) ||
                  Number(limit) < 1 ||
                  Number(limit) > 50
                }
                onClick={run}
              >
                {generate.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t(generate.isPending ? "v.generating" : "v.generate")}
              </Button>
            </FieldGroup>
          )}
        </CardContent>
      </Card>
      <ErrorNotice
        error={generate.error}
        retry={run}
        pending={generate.isPending || account?.bindStatus !== "ACTIVE"}
      />
      {batchId && (
        <Button
          wrap
          variant="outline"
          className="self-start"
          onClick={() => setBatchId(null)}
        >
          {t("v.latest")}
        </Button>
      )}
      <DataRegion
        query={displayed}
        name={t("practice.forYou")}
        empty={!displayed.data?.recommendations.length}
      >
        <BatchView batch={displayed.data ?? null} />
      </DataRegion>
      {displayed.data && (
        <Button
          wrap
          variant="outline"
          className="self-start"
          onClick={() => setSnapshotId(displayed.data!.analysisSnapshotId)}
        >
          {t("v.snapshotLink")}
        </Button>
      )}
      <Card variant="supporting" interaction="none">
        <CardHeader>
          <CardTitle>
            <h2>{t("v.recommendationHistory")}</h2>
          </CardTitle>
          <CardDescription>{t("practice.historyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allModes}
              onChange={(event) => {
                setAllModes(event.target.checked);
                setPage(1);
              }}
            />
            {t("v.allModes")}
          </label>
          <QueryFeedback query={history} />
          {!history.isFetching && !history.data?.data.length && (
            <EmptyState
              title={t("practice.noData")}
              description={t("v.noRecords")}
            />
          )}
          <ul className="flex min-w-0 flex-col divide-y">
            {history.data?.data.map((item) => (
              <li
                key={item.batchId}
                data-recommendation-history-row
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <time dateTime={item.generatedAt} className="text-sm">
                    {formatTimestamp(item.generatedAt, locale)}
                  </time>
                  <p className="text-xs text-muted-foreground">
                    {t(`v.mode.${item.mode}`)} · {t("v.resultCount")}:{" "}
                    {item.resultCount}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBatchId(item.batchId)}
                >
                  {t("v.batch")}
                </Button>
              </li>
            ))}
          </ul>
          <Pagination
            meta={history.data?.meta}
            page={page}
            setPage={setPage}
            pending={history.isFetching}
          />
        </CardContent>
      </Card>
      <Dialog
        open={!!snapshotId}
        onOpenChange={(open) => {
          if (!open) setSnapshotId(null);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("v.snapshotLink")}</DialogTitle>
          </DialogHeader>
          <QueryFeedback query={snapshot} />
          <AnalysisView
            analysis={snapshot.data ?? null}
            dimensions
            loading={snapshot.isFetching && snapshot.data === undefined}
            unavailable={!!snapshot.error}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
