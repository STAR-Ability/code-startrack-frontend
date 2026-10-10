"use client";
import {
  FingerprintIcon,
  Clock3Icon,
  LayersIcon,
  ScanLineIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { MetricPanel } from "@/components/workspace/metric-panel";
import { Chart } from "@/components/workspace/chart";
import { trendOption } from "@/lib/charts/options";
import { previewProfile, previewActivity } from "@/lib/demo/preview";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { Badge } from "@/components/ui/badge";
import { ProductShell, SampleNotice } from "./product-shell";

export function ProfileShowcasePage() {
  const { t } = useLocale();
  const analysis = demoAnalysis();
  return (
    <ProductShell>
      <section className="landing-section grid items-center gap-10 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="insight">{t("showcase.profile.label")}</Badge>
          <h1 className="hero-title">{t("showcase.profile.title")}</h1>
          <p className="section-description">
            {t("showcase.profile.description")}
          </p>
        </div>
        <div className="profile-exhibit relative flex min-w-0 flex-col gap-5 overflow-hidden">
          <span
            className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full border border-insight/15 bg-insight-soft/45"
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-insight/15 bg-card text-insight shadow-surface">
              <FingerprintIcon className="size-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">
              {t("showcase.profile.caption")}
            </p>
          </div>
          <MetricPanel
            title="profile.overview"
            metrics={[
              ["v.solved", previewProfile.solved],
              ["v.activeDays", previewProfile.activeDays],
              ["v.submissions", previewProfile.submissions],
              ["v.rating", previewProfile.rating],
            ]}
          />
          <Chart
            palette="activity"
            label={t("v.activityStats")}
            option={trendOption(previewActivity.labels, [
              {
                id: "submissions",
                name: t("v.submissions"),
                values: previewActivity.values,
              },
            ])}
          />
          <SampleNotice />
        </div>
      </section>
      <section className="landing-section grid gap-12 border-t lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-5">
          <p className="section-eyebrow">{t("showcase.profile.read")}</p>
          <h2 className="section-title">{t("showcase.profile.focus")}</h2>
          <p className="section-description">
            {t("showcase.profile.focusNote")}
          </p>
        </div>
        <div className="flex flex-col divide-y rounded-3xl border border-surface-border bg-surface-reading p-6 shadow-surface sm:p-8">
          {(
            [
              ["window", Clock3Icon],
              ["account", LayersIcon],
              ["evidence", ScanLineIcon],
            ] as const
          ).map(([key, Icon]) => (
            <article className="flex gap-5 py-6 first:pt-0" key={key}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-insight-soft text-insight">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium">{t(`showcase.profile.${key}`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`showcase.profile.${key}Note`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section">
          <div className="mb-10 grid items-end gap-5 lg:grid-cols-[1fr_1fr]">
            <h2 className="section-title">
              {t("showcase.profile.dimensions")}
            </h2>
            <p className="section-description lg:max-w-lg lg:justify-self-end">
              {t("showcase.profile.dimensionNote")}
            </p>
          </div>
          <dl className="grid gap-x-12 gap-y-7 rounded-3xl border border-insight/15 bg-surface-reading p-6 shadow-surface sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            {analysis.dimensions.map((item) => (
              <div key={item.code} className="flex min-w-0 flex-col gap-4">
                <div className="flex justify-between gap-3">
                  <dt className="text-sm">
                    {t(`data.dimension.${item.code}`)}
                  </dt>
                  <dd className="shrink-0 font-mono text-lg text-insight">
                    {item.score}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      / 100
                    </span>
                  </dd>
                </div>
                <div
                  className="h-1.5 rounded-full bg-insight-soft"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-insight/70"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <SampleNotice />
          </div>
          <p className="mt-5 text-sm text-warning">{t("showcase.service")}</p>
        </section>
      </div>
    </ProductShell>
  );
}
