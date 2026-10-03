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
      <section className="landing-section pt-10 text-center lg:pt-14">
        <Badge variant="info" className="mx-auto">
          {t("showcase.recommendations.label")}
        </Badge>
        <h1 className="hero-title mx-auto mt-6 max-w-4xl">
          {t("showcase.recommendations.title")}
        </h1>
        <p className="section-description mx-auto mt-6">
          {t("showcase.recommendations.description")}
        </p>
        <ol className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
          {(["choose", "understand", "practice"] as const).map((key, index) => (
            <li
              className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs"
              key={key}
            >
              <span className="font-mono text-muted-foreground">
                0{index + 1}
              </span>
              {t(`showcase.recommendations.${key}`)}
            </li>
          ))}
        </ol>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-32">
            <RouteIcon className="size-8 text-info" aria-hidden="true" />
            <h2 className="section-title">
              {t("showcase.recommendations.try")}
            </h2>
            <p className="section-description">
              {t("showcase.recommendations.tryNote")}
            </p>
            <PracticeModePicker mode={mode} onChange={setMode} />
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
      <section className="landing-section grid gap-10 md:grid-cols-3">
        {(
          [
            ["reason", RouteIcon],
            ["source", ExternalLinkIcon],
            ["history", HistoryIcon],
          ] as const
        ).map(([key, Icon]) => (
          <article key={key} className="flex flex-col gap-4">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xl font-medium tracking-tight">
              {t(`showcase.recommendations.${key}`)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`showcase.recommendations.${key}Note`)}
            </p>
          </article>
        ))}
      </section>
    </ProductShell>
  );
}
