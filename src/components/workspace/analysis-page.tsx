"use client";
import { useState } from "react";
import { api } from "@/lib/api/endpoints";
import { windows, type AnalysisWindow } from "@/lib/api/schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAccountQuery } from "./use-account-query";
import { AnalysisView } from "./analysis-view";
import { EmptyState, QueryFeedback, DataRegion, Pagination } from "./feedback";
import { Chart } from "./chart";
import { trendOption } from "@/lib/charts/options";

export function WindowSelector({
  value,
  onChange,
}: {
  value: AnalysisWindow;
  onChange: (value: AnalysisWindow) => void;
}) {
  const { t } = useLocale();
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        if (windows.includes(values[0] as AnalysisWindow))
          onChange(values[0] as AnalysisWindow);
      }}
      aria-label={t("v.window")}
      className="max-w-full flex-wrap"
    >
      {windows.map((window) => (
        <ToggleGroupItem key={window} value={window}>
          {t(`v.window.${window}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
export function AnalysisPage({
  profileOnly = false,
}: {
  profileOnly?: boolean;
}) {
  const { t } = useLocale();
  const [window, setWindow] = useState<AnalysisWindow>("ALL");
  const [page, setPage] = useState(1);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const latest = useAccountQuery("analysis", { window }, (id, signal) =>
    api.analysis(id, window, signal),
  );
  const history = useAccountQuery(
    "analysis-history",
    { window, page },
    (id, signal) => api.analysisHistory(id, window, page, signal),
    !profileOnly,
  );
  const snapshot = useAccountQuery(
    "snapshot",
    { snapshotId },
    (id, signal) => api.snapshot(id, snapshotId!, signal),
    !!snapshotId,
  );
  const displayed = snapshotId ? snapshot : latest;
  const trend = [...(history.data?.data ?? [])].sort((a, b) =>
    a.dataCutoffAt.localeCompare(b.dataCutoffAt),
  );
  return (
    <>
      {!profileOnly && (
        <WindowSelector
          value={window}
          onChange={(value) => {
            setWindow(value);
            setPage(1);
            setSnapshotId(null);
          }}
        />
      )}
      {snapshotId && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setSnapshotId(null)}
        >
          {t("v.latest")}
        </Button>
      )}
      <DataRegion
        query={displayed}
        name={t(profileOnly ? "metrics.ability" : "metrics.analysis")}
        empty={!displayed.data || displayed.data.summary.submissionCount === 0}
      >
        <AnalysisView
          analysis={displayed.data ?? null}
          loading={displayed.isFetching && displayed.data === undefined}
          unavailable={!!displayed.error}
          dimensions
          statistics={!profileOnly}
          ability
          metricTitle={
            snapshotId
              ? "metrics.snapshot"
              : profileOnly
                ? "metrics.ability"
                : "metrics.analysis"
          }
          trend={
            !profileOnly ? (
              <Card size="sm" interaction="none">
                <CardHeader>
                  <CardTitle>
                    <h2>{t("v.trend")}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryFeedback query={history} />
                  {trend.length > 1 ? (
                    <Chart
                      label={t("v.trend")}
                      option={trendOption(
                        trend.map((item) => item.dataCutoffAt),
                        [
                          {
                            name: t("v.overallScore"),
                            values: trend.map((item) => item.overallScore),
                          },
                        ],
                        true,
                      )}
                    />
                  ) : (
                    <EmptyState title={t("v.noRecords")} />
                  )}
                </CardContent>
              </Card>
            ) : undefined
          }
        />
      </DataRegion>
      {!profileOnly && (
        <Card size="sm" interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{t("v.analysisHistory")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!history.isFetching && !history.data?.data.length && (
              <EmptyState title={t("v.noRecords")} />
            )}
            {history.data?.data.map((item) => (
              <div
                key={item.snapshotId}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-sm">
                  {item.dataCutoffAt} · {item.overallScore} / 100
                  {item.stale ? ` · ${t("v.stale")}` : ""}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setSnapshotId(item.snapshotId)}
                >
                  {t("v.snapshot")}
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
      )}
    </>
  );
}
