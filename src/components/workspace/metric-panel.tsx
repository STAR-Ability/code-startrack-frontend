"use client";
import {
  ActivityIcon,
  CheckCheckIcon,
  CircleCheckIcon,
  Clock3Icon,
  CodeXmlIcon,
  FingerprintIcon,
  FlameIcon,
  LayersIcon,
  TrophyIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
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
  "v.attempted": "info",
  "v.submissions": "support",
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
  "v02.warnings": "warning",
  "v02.errors": "danger",
  "v02.analyzedSubmissions": "insight",
  "v02.codeAnalyses": "insight",
  "v02.platformSubmissions": "info",
  "v02.externalSubmissions": "support",
};
const metricIcons: Partial<Record<CopyKey, LucideIcon>> = {
  "v.solved": CircleCheckIcon,
  "v.accepted": CheckCheckIcon,
  "v.attempted": CodeXmlIcon,
  "v.submissions": LayersIcon,
  "v.activeDays": FlameIcon,
  "v.overallScore": FingerprintIcon,
  "v.rating": TrophyIcon,
  "v.maxRating": TrophyIcon,
  "v12.highestRating": TrophyIcon,
  "v12.highestMaxRating": TrophyIcon,
  "v.pendingCount": Clock3Icon,
  "v12.sources": LayersIcon,
  "v12.managedTeams": UsersIcon,
  "v12.activeMembers": UsersIcon,
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
      <CardHeader className="metric-panel-heading">
        <CardTitle>
          <h2>{t(title)}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="metric-strip" data-metric-count={metrics.length}>
          {metrics.map(([label, v], index) => {
            const Icon = metricIcons[label] ?? ActivityIcon;
            return (
              <div
                key={label}
                data-tone={v === null ? undefined : metricTones[label]}
                data-value-type={v === null ? "unknown" : typeof v}
                data-metric-priority={index === 0 ? "primary" : undefined}
              >
                <dt className="metric-label-row">
                  {t(label)}
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </dt>
                <dd className="metric-value">
                  {loading ? <Skeleton className="h-10 w-20" /> : value(v)}
                </dd>
              </div>
            );
          })}
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
