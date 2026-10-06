"use client";
import { useState } from "react";
import { RouteIcon, ExternalLinkIcon, HistoryIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { PracticeModePicker } from "@/components/workspace/practice-mode-picker";
import { BatchView } from "@/components/workspace/recommendation-card";
import { demoBatch } from "@/lib/demo/fixtures";
import type { RecommendationMode } from "@/lib/api/schemas";
import { Badge } from "@/components/ui/badge";
import { ProductShell, SampleNotice } from "./product-shell";

export function RecommendationsShowcasePage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<RecommendationMode>("HYBRID");
  return (
    <ProductShell>
      <section className="landing-section public-page-hero">
        <div className="flex min-w-0 max-w-reading flex-col items-start gap-4">
          <Badge variant="info">{t("showcase.recommendations.label")}</Badge>
          <h1 className="hero-title">{t("showcase.recommendations.title")}</h1>
          <p className="section-description">
            {t("showcase.recommendations.description")}
          </p>
        </div>
        <ol className="public-process mt-6" data-step-count="3">
          {(["choose", "understand", "practice"] as const).map((key, index) => (
            <li className="public-step" key={key}>
              <span className="public-marker" aria-hidden="true">
                0{index + 1}
              </span>
              <div className="public-body">
                <p>{t(`showcase.recommendations.${key}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="landing-section public-evidence grid items-start gap-8 border-t lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="public-body">
          <h2 className="section-heading">
            {t("showcase.recommendations.try")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("showcase.recommendations.tryNote")}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <PracticeModePicker compact mode={mode} onChange={setMode} />
          <p
            className="text-sm leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
            {t(`practice.mode.${mode}`)}
          </p>
          <SampleNotice />
          <BatchView batch={demoBatch(undefined, mode)} firstOnly compact />
        </div>
      </section>
      <section className="landing-section public-capabilities border-t">
        {(
          [
            ["reason", RouteIcon],
            ["source", ExternalLinkIcon],
            ["history", HistoryIcon],
          ] as const
        ).map(([key, Icon]) => (
          <article key={key} className="public-capability-item">
            <span className="public-marker" aria-hidden="true">
              <Icon />
            </span>
            <div className="public-body">
              <h2 className="section-heading">
                {t(`showcase.recommendations.${key}`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`showcase.recommendations.${key}Note`)}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="landing-section border-t">
        <p className="max-w-reading text-sm leading-relaxed text-muted-foreground">
          {t("showcase.service")}
        </p>
      </section>
    </ProductShell>
  );
}
