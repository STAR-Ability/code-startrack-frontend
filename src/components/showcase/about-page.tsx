"use client";
import {
  OrbitIcon,
  ArrowUpRightIcon,
  LayersIcon,
  ScanLineIcon,
  RouteIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductShell } from "./product-shell";

export function AboutPage() {
  const { t } = useLocale();
  return (
    <ProductShell>
      <section className="landing-section grid items-center gap-12 pt-10 lg:grid-cols-[1.6fr_1fr] lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <p className="section-eyebrow">
            {t("showcase.about.label")} / codeStartrack
          </p>
          <h1 className="hero-title">{t("showcase.about.title")}</h1>
          <p className="section-description">
            {t("showcase.about.description")}
          </p>
        </div>
        <div
          className="brand-emblem border border-support/15 bg-support-soft/50 shadow-raised"
          aria-hidden="true"
        >
          <span className="absolute -top-14 -right-12 size-48 rounded-full border border-support/20" />
          <span className="absolute -bottom-12 -left-10 size-40 rounded-full border border-info/20 bg-info-soft/40" />
          <div className="brand-emblem-orbit" />
          <span className="flex size-24 items-center justify-center rounded-3xl border border-surface-border bg-card shadow-raised">
            <OrbitIcon className="size-12 text-support" />
          </span>
          <span className="absolute bottom-8 font-mono text-xs tracking-widest text-muted-foreground">
            PRACTICE / REFLECT / REPEAT
          </span>
        </div>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section grid gap-8 lg:grid-cols-[0.5fr_1.5fr]">
          <p className="section-eyebrow">01 / {t("showcase.label")}</p>
          <div className="flex flex-col gap-7">
            <h2 className="max-w-4xl text-4xl leading-snug font-semibold tracking-tight sm:text-5xl">
              {t("showcase.about.manifesto")}
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("showcase.about.manifestoNote")}
            </p>
          </div>
        </section>
      </div>
      <section className="landing-section">
        <div className="flex flex-col gap-0">
          {([1, 2, 3] as const).map((n) => (
            <article
              key={n}
              className="grid items-start gap-5 border-b border-surface-border py-8 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[auto_1fr] lg:grid-cols-[0.5fr_0.65fr_0.85fr] lg:gap-10"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-4xl text-muted-foreground/50">
                  0{n}
                </span>
                {n === 1 ? (
                  <LayersIcon className="size-6 text-info" aria-hidden="true" />
                ) : n === 2 ? (
                  <ScanLineIcon
                    className="size-6 text-insight"
                    aria-hidden="true"
                  />
                ) : (
                  <RouteIcon
                    className="size-6 text-support"
                    aria-hidden="true"
                  />
                )}
              </div>
              <h2 className="text-xl leading-snug font-semibold tracking-tight">
                {t(`showcase.about.principle${n}`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:col-start-2 lg:col-start-auto">
                {t(`showcase.about.principle${n}Note`)}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-section grid gap-10 border-t lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="section-title">{t("showcase.about.now")}</h2>
          <p className="section-description">{t("showcase.about.nowNote")}</p>
          <Link href="/demo" className={buttonVariants({ variant: "link" })}>
            {t("ui.exploreDemo")}
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
        <ul className="flex flex-col divide-y rounded-3xl border border-surface-border bg-surface-reading p-6 shadow-surface sm:p-8">
          {(
            [
              ["accounts", "success", "available"],
              ["analysis", "success", "available"],
              ["synthesis", "warning", "planned"],
              ["agent", "secondary", "planned"],
            ] as const
          ).map(([key, variant, state]) => (
            <li
              className="flex flex-col items-start gap-3 py-5 first:pt-0"
              key={key}
            >
              <Badge variant={variant}>{t(`showcase.${state}`)}</Badge>
              <p className="text-sm leading-relaxed">
                {t(`showcase.about.${key}`)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ProductShell>
  );
}
