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
      <section className="landing-section grid items-center gap-12 pt-10 lg:grid-cols-2 lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="insight">{t("showcase.profile.label")}</Badge>
          <h1 className="hero-title">{t("showcase.profile.title")}</h1>
          <p className="section-description">
            {t("showcase.profile.description")}
          </p>
        </div>
        <div className="profile-exhibit flex min-w-0 flex-col gap-5">
          <div className="flex items-center gap-3">
            <FingerprintIcon
              className="size-8 text-insight"
              aria-hidden="true"
            />
            <p className="text-sm">{t("showcase.profile.caption")}</p>
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
            label={t("v.activityStats")}
            option={trendOption(previewActivity.labels, [
              { name: t("v.submissions"), values: previewActivity.values },
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
        <div className="flex flex-col divide-y">
          {(
            [
              ["window", Clock3Icon],
              ["account", LayersIcon],
              ["evidence", ScanLineIcon],
            ] as const
          ).map(([key, Icon]) => (
            <article className="flex gap-5 py-6 first:pt-0" key={key}>
              <Icon
                className="mt-1 size-5 shrink-0 text-insight"
                aria-hidden="true"
              />
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
          <div className="mb-10 flex flex-col gap-4">
            <h2 className="section-title">
              {t("showcase.profile.dimensions")}
            </h2>
            <p className="section-description">
              {t("showcase.profile.dimensionNote")}
            </p>
          </div>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.dimensions.map((item) => (
              <div key={item.code} className="flex flex-col gap-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-sm">
                    {t(`data.dimension.${item.code}`)}
                  </dt>
                  <dd className="font-mono text-sm text-insight">
                    {item.score}/100
                  </dd>
                </div>
                <div className="h-1 rounded-full bg-border" aria-hidden="true">
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
