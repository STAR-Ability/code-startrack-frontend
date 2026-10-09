"use client";
import Link from "next/link";
import {
  DatabaseIcon,
  FingerprintIcon,
  RouteIcon,
  ArrowUpRightIcon,
  LayersIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductShell } from "./product-shell";
import { cn } from "@/lib/utils";

export function CapabilitiesPage() {
  const { t } = useLocale();
  const steps = [
    ["data", "input", DatabaseIcon, "/about"],
    ["profile", "context", FingerprintIcon, "/product/profile"],
    ["next", "output", RouteIcon, "/product/recommendations"],
  ] as const;
  return (
    <ProductShell>
      <section className="landing-section brand-hero grid gap-10 pt-10 lg:grid-cols-[1.3fr_1fr] lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="info">{t("showcase.features.label")}</Badge>
          <h1 className="hero-title">{t("showcase.features.title")}</h1>
          <p className="section-description">
            {t("showcase.features.description")}
          </p>
        </div>
        <div
          className="capability-map relative self-center overflow-hidden rounded-3xl border border-info/15 bg-surface-supporting shadow-raised before:pointer-events-none before:absolute before:-top-20 before:-right-16 before:size-64 before:rounded-full before:border before:border-info/15 before:bg-info-soft/40"
          aria-hidden="true"
        >
          {steps.map(([key, label, Icon], index) => (
            <div key={key} className="capability-node">
              <span className="font-mono text-xs text-muted-foreground">
                0{index + 1}
              </span>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info",
                  key === "profile" && "bg-insight-soft text-insight",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span>{t(`showcase.features.${label}`)}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section flex flex-col gap-0">
          {steps.map(([key, , Icon, href], index) => (
            <article
              key={key}
              className="grid min-w-0 items-start gap-6 border-b border-surface-border py-9 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[auto_1fr] lg:grid-cols-[0.4fr_1fr_auto] lg:gap-12 lg:py-12"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-4xl tracking-tight text-muted-foreground/50 sm:text-5xl">
                  0{index + 1}
                </span>
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-info-soft text-info",
                    key === "profile" && "bg-insight-soft text-insight",
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t(`showcase.features.${key}`)}
                </h2>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t(`showcase.features.${key}Note`)}
                </p>
              </div>
              <div className="sm:col-start-2 lg:col-start-auto">
                <Link
                  href={href}
                  className={buttonVariants({ variant: "link" })}
                >
                  {t("showcase.explore")}
                  <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
      <section className="landing-section grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-surface-border bg-surface-reading shadow-surface">
            <LayersIcon className="size-7 text-info" aria-hidden="true" />
          </span>
          <p className="section-eyebrow mt-4">codeStartrack</p>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="section-title">{t("showcase.features.boundary")}</h2>
          <p className="section-description">
            {t("showcase.features.boundaryNote")}
          </p>
          <p className="text-sm text-warning">{t("showcase.service")}</p>
        </div>
      </section>
    </ProductShell>
  );
}
