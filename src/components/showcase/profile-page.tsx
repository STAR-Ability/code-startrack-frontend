"use client";
import {
  FingerprintIcon,
  Clock3Icon,
  LayersIcon,
  ScanLineIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { AnalysisView } from "@/components/workspace/analysis-view";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { Badge } from "@/components/ui/badge";
import { ProductShell, SampleNotice } from "./product-shell";

export function ProfileShowcasePage() {
  const { t } = useLocale();
  const analysis = demoAnalysis(undefined, "30D");
  return (
    <ProductShell>
      <section className="landing-section public-page-hero">
        <div className="flex min-w-0 max-w-reading flex-col items-start gap-4">
          <Badge variant="insight">{t("showcase.profile.label")}</Badge>
          <h1 className="hero-title">{t("showcase.profile.title")}</h1>
          <p className="section-description">
            {t("showcase.profile.description")}
          </p>
        </div>
      </section>
      <section className="landing-section public-evidence border-t">
        <header className="mb-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <FingerprintIcon
                className="size-4 text-insight"
                aria-hidden="true"
              />
              {t("showcase.profile.caption")}
            </p>
            <h2 className="section-heading">
              {t("showcase.profile.dimensions")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("showcase.profile.dimensionNote")}
            </p>
          </div>
          <SampleNotice />
        </header>
        <div className="flex min-w-0 flex-col gap-5">
          <AnalysisView
            analysis={analysis}
            dimensions
            statistics
            distributions={false}
          />
        </div>
      </section>
      <section className="landing-section grid items-start gap-8 border-t lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="public-body">
          <p className="section-eyebrow">{t("showcase.profile.read")}</p>
          <h2 className="section-heading">{t("showcase.profile.focus")}</h2>
          <p className="section-description">
            {t("showcase.profile.focusNote")}
          </p>
        </div>
        <div className="public-example-list">
          {(
            [
              ["window", Clock3Icon],
              ["account", LayersIcon],
              ["evidence", ScanLineIcon],
            ] as const
          ).map(([key, Icon]) => (
            <article className="public-example-row" key={key}>
              <span className="public-marker" aria-hidden="true">
                <Icon />
              </span>
              <div className="public-body flex-1">
                <h3 className="font-medium">{t(`showcase.profile.${key}`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`showcase.profile.${key}Note`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-section border-t">
        <p className="max-w-reading text-sm leading-relaxed text-muted-foreground">
          {t("showcase.service")}
        </p>
      </section>
    </ProductShell>
  );
}
