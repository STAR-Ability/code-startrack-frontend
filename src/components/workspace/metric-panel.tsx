"use client";
import type { CopyKey } from "@/lib/i18n/messages";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metricTones: Partial<Record<CopyKey, string>> = {
  "v.solved": "success",
  "v.accepted": "success",
  "v.failed": "danger",
  "v.pendingCount": "warning",
  "v.overallScore": "info",
  "v.rating": "info",
};
export type Metric = readonly [CopyKey, number | string | null];
export function MetricPanel({
  title,
  description,
  metrics,
  secondary = [],
  loading = false,
}: {
  title: CopyKey;
  description?: React.ReactNode;
  metrics: readonly Metric[];
  secondary?: readonly Metric[];
  loading?: boolean;
}) {
  const { t, locale } = useLocale();
  const value = (v: Metric[1]) =>
    v === null
      ? t("v.unavailable")
      : typeof v === "number"
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v)
        : v;
  return (
    <Card size="sm" interaction="none" data-metric-panel>
      <CardHeader>
        <CardTitle>
          <h2>{t(title)}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="metric-strip">
          {metrics.map(([label, v]) => (
            <div key={label} data-tone={metricTones[label]}>
              <dt>{t(label)}</dt>
              <dd>{loading ? <Skeleton className="h-7 w-12" /> : value(v)}</dd>
            </div>
          ))}
        </dl>
        {!!secondary.length && (
          <dl className="metric-details">
            {secondary.map(([label, v]) => (
              <div key={label}>
                <dt>{t(label)}</dt>
                <dd>{loading ? <Skeleton className="h-4 w-8" /> : value(v)}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
