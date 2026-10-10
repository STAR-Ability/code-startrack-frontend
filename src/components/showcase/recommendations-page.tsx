"use client";
import { useState } from "react";
import {
  RouteIcon,
  ArrowDownIcon,
  ExternalLinkIcon,
  HistoryIcon,
} from "lucide-react";
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
      <section className="landing-section grid items-center gap-10 pt-10 lg:grid-cols-[1.3fr_0.7fr] lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="info">{t("showcase.recommendations.label")}</Badge>
          <h1 className="hero-title">{t("showcase.recommendations.title")}</h1>
          <p className="section-description">
            {t("showcase.recommendations.description")}
          </p>
        </div>
        <ol className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-info/15 bg-surface-reading p-5 shadow-raised before:pointer-events-none before:absolute before:-top-20 before:-right-20 before:size-64 before:rounded-full before:border before:border-info/15 before:bg-info-soft/50 sm:p-7">
          {(["choose", "understand", "practice"] as const).map((key, index) => (
            <li
              className="relative flex items-center gap-5 border-b border-surface-border py-5 last:border-b-0"
              key={key}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft font-mono text-sm text-info">
                0{index + 1}
              </span>
              <span className="text-sm font-medium">
                {t(`showcase.recommendations.${key}`)}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-32">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-info/15 bg-card text-info shadow-surface">
              <RouteIcon className="size-6" aria-hidden="true" />
            </span>
            <h2 className="section-title">
              {t("showcase.recommendations.try")}
            </h2>
            <p className="section-description">
              {t("showcase.recommendations.tryNote")}
            </p>
            <div className="rounded-2xl border border-info/15 bg-surface-reading p-4 shadow-surface">
              <PracticeModePicker mode={mode} onChange={setMode} />
            </div>
            <ArrowDownIcon
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-warning">
              {t("showcase.service")}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <SampleNotice />
            <BatchView batch={demoBatch(undefined, mode)} firstOnly />
          </div>
        </section>
      </div>
      <section className="landing-section">
        <div className="grid gap-8 rounded-3xl border border-surface-border bg-surface-reading p-6 shadow-surface sm:p-8 md:grid-cols-3 md:gap-10">
          {(
            [
              ["reason", RouteIcon],
              ["source", ExternalLinkIcon],
              ["history", HistoryIcon],
            ] as const
          ).map(([key, Icon]) => (
            <article key={key} className="flex flex-col gap-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-info-soft text-info">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                {t(`showcase.recommendations.${key}`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`showcase.recommendations.${key}Note`)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}
