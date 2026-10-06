"use client";
import { Spinner } from "@/components/ui/spinner";
import { useId, useRef, useState } from "react";
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
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PracticeModePicker } from "./practice-mode-picker";
import { FormInput } from "@/components/ui/form-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  const allModesId = useId();
  const controlsId = useId();
  const historyId = useId();
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
      <section className="practice-controls" aria-labelledby={controlsId}>
        <h2 id={controlsId} className="sr-only">
          {t("practice.controls")}
        </h2>
        <PracticeModePicker
          compact
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
          <FieldGroup className="practice-generation grid w-full max-w-md min-w-0 items-end gap-3 [&>[data-slot=field]]:min-w-0">
            <FormInput
              label={t("practice.countLabel")}
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
              className="min-w-0"
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
        <DetailsDisclosure title={t("practice.guideTitle")}>
          <p className="font-medium text-foreground">
            {t("practice.introTitle")}
          </p>
          <p>{t("practice.introDescription")}</p>
          <p>{t("v.recommendationNote")}</p>
          <p aria-live="polite">{t(`practice.mode.${mode}`)}</p>
        </DetailsDisclosure>
      </section>
      <ErrorNotice
        error={generate.error}
        retry={run}
        pending={generate.isPending || account?.bindStatus !== "ACTIVE"}
      />
      <div className="recommendation-batch" data-compact="true">
        {batchId && (
          <div className="recommendation-selection">
            <Badge variant="secondary" wrap>
              {t("recommendation.historicalBatch")}
            </Badge>
            <Button
              wrap
              variant="outline"
              className="self-start"
              onClick={() => setBatchId(null)}
            >
              {t("v.latest")}
            </Button>
          </div>
        )}
        <DataRegion
          query={displayed}
          name={t("practice.forYou")}
          empty={!displayed.data?.recommendations.length}
        >
          {(displayed.data ||
            (!displayed.error && displayed.data === null)) && (
            <BatchView batch={displayed.data ?? null} compact />
          )}
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
      </div>
      <section className="recommendation-history" aria-labelledby={historyId}>
        <header className="flex flex-col gap-1">
          <h2 id={historyId} className="section-heading">
            {t("v.recommendationHistory")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("practice.historyDescription")}
          </p>
        </header>
        <div className="flex min-w-0 flex-col gap-4">
          <Field orientation="horizontal">
            <FieldLabel
              htmlFor={allModesId}
              className="min-h-11 cursor-pointer gap-3 py-2"
            >
              <input
                id={allModesId}
                name="allModes"
                type="checkbox"
                checked={allModes}
                className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                onChange={(event) => {
                  setAllModes(event.target.checked);
                  setPage(1);
                }}
              />
              {t("v.allModes")}
            </FieldLabel>
          </Field>
          <QueryFeedback query={history} />
          {!history.isFetching &&
            !history.error &&
            history.data?.data.length === 0 && (
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
        </div>
      </section>
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
