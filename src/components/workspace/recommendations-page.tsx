"use client";
import { Spinner } from "@/components/ui/spinner";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentBinding } from "@/lib/query/session";
import {
  type RecommendationMode,
  type RecommendationBatchDto,
  type ProblemDto,
} from "@/lib/api/schemas";
import { safeProblemUrl } from "@/lib/charts/data";
import { useLocale } from "@/components/layout/locale-provider";
import { useAccounts } from "./account-provider";
import { useAccountQuery } from "./use-account-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PracticeModePicker } from "./practice-mode-picker";
import { FormInput } from "@/components/auth/auth-form";
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
import { AnalysisView } from "./analysis-view";

export function ProblemLink({ problem }: { problem: ProblemDto }) {
  const { t } = useLocale();
  const url = safeProblemUrl(problem.url);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "outline", wrap: true })}
    >
      <span>
        {t("recommendation.openExternal", { platform: "Codeforces" })}
      </span>
      <ExternalLinkIcon data-icon="inline-end" />
      <span className="sr-only">{t("recommendation.newTab")}</span>
    </a>
  ) : (
    <Button disabled variant="outline" wrap>
      {t("recommendation.linkUnavailable")}
    </Button>
  );
}
export function BatchView({
  batch,
  firstOnly = false,
}: {
  batch: RecommendationBatchDto | null;
  firstOnly?: boolean;
}) {
  const { t } = useLocale();
  if (!batch)
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("practice.forYou")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t("practice.noData")}
            description={t("v.noBatch")}
          />
        </CardContent>
      </Card>
    );
  return (
    <>
      {batch.stale && (
        <Alert>
          <AlertDescription>
            <Badge variant="secondary">{t("v.stale")}</Badge>
            <p>{t("v.staleNote")}</p>
          </AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        {t("recommendation.generatedAt")}: {batch.generatedAt} ·{" "}
        {t(`v.mode.${batch.mode}`)} · {t("v.targetRating")}:{" "}
        {batch.targetRating} · {t("v.candidateCount")}: {batch.candidateCount} ·{" "}
        {t("v.resultCount")}: {batch.resultCount}
      </p>
      {!batch.recommendations.length && (
        <EmptyState
          title={t("practice.noData")}
          description={t("v.noCandidates")}
        />
      )}
      {(firstOnly
        ? batch.recommendations.slice(0, 1)
        : batch.recommendations
      ).map((item) => (
        <Card key={item.rank} interaction="lift" className="feedback-enter">
          <CardHeader>
            <CardTitle>
              <h2 className="wrap-anywhere">
                <span className="mr-3 font-mono text-muted-foreground">
                  #{item.rank}
                </span>{" "}
                {item.problem.title ?? item.problem.externalProblemKey}
              </h2>
            </CardTitle>
            <CardDescription>
              {item.problem.externalProblemKey} ·{" "}
              {t("recommendation.difficulty")}:{" "}
              {item.problem.difficulty ?? t("v.unrated")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p>{t(`v.reason.${item.reasonCode}`)}</p>
            <div className="flex flex-wrap gap-2">
              {item.problem.tags.map((tag) => (
                <Badge variant="outline" key={tag} wrap>
                  {tag}
                </Badge>
              ))}
              {item.solvedSinceGeneration && (
                <Badge>{t("v.solvedSince")}</Badge>
              )}
              {item.problem.isGym && <Badge variant="outline">Gym</Badge>}
              {item.problem.catalogSource === "INFERRED" && (
                <Badge variant="outline">INFERRED</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("v.cfSolved")}:{" "}
              {item.problem.solvedCount ?? t("v.unavailable")}
            </p>
          </CardContent>
          <CardFooter>
            <ProblemLink problem={item.problem} />
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
export function RecommendationsPage({
  initialMode = "HYBRID",
}: {
  initialMode?: RecommendationMode;
}) {
  const { t } = useLocale();
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
      <p className="text-sm text-muted-foreground">
        {t("v.recommendationNote")}
      </p>
      {account?.bindStatus === "ACTIVE" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48 max-w-full">
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
          </div>
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
        </div>
      )}
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
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("v.recommendationHistory")}</h2>
          </CardTitle>
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
          {history.data?.data.map((item) => (
            <div
              key={item.batchId}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span className="text-sm">
                {item.generatedAt} · {t(`v.mode.${item.mode}`)} ·{" "}
                {item.resultCount}
              </span>
              <Button
                variant="outline"
                onClick={() => setBatchId(item.batchId)}
              >
                {t("v.batch")}
              </Button>
            </div>
          ))}
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
