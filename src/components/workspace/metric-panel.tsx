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
  "v.overallScore": "insight",
  "v.rating": "info",
  "v.maxRating": "info",
  "v12.highestRating": "info",
  "v12.highestMaxRating": "info",
  "v.activeDays": "support",
  "v12.managedTeams": "support",
  "v12.activeMembers": "support",
  "v12.pendingApplications": "warning",
  "v12.included": "support",
  "v12.trainingMembers": "support",
  "v12.levelMembers": "info",
};
const panelTones: Partial<Record<CopyKey, "info" | "insight" | "support">> = {
  "metrics.ability": "insight",
  "metrics.analysis": "insight",
  "metrics.snapshot": "insight",
  "v12.abilitySummary": "insight",
  "v12.teamAnalysis": "support",
  "v12.coachStats": "support",
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
    <Card
      variant="metric"
      tone={panelTones[title]}
      interaction="none"
      data-metric-panel
    >
      <CardHeader>
        <CardTitle titleRole="section">
          <h2>{t(title)}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="metric-strip">
          {metrics.map(([label, v]) => (
            <div
              key={label}
              data-tone={v === null ? undefined : metricTones[label]}
              data-value-type={v === null ? "unknown" : typeof v}
            >
              <dt>{t(label)}</dt>
              <dd>{loading ? <Skeleton className="h-7 w-12" /> : value(v)}</dd>
            </div>
          ))}
        </dl>
        {!!secondary.length && (
          <dl className="metric-details">
            {secondary.map(([label, v]) => (
              <div
                key={label}
                data-value-type={v === null ? "unknown" : typeof v}
              >
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
