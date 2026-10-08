"use client";
import { OrbitIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProductShell } from "./product-shell";

export function AboutPage() {
  const { t } = useLocale();
  return (
    <ProductShell>
      <section className="landing-section grid gap-12 pt-10 lg:grid-cols-[1.6fr_1fr] lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <p className="section-eyebrow">
            {t("showcase.about.label")} / codeStartrack
          </p>
          <h1 className="hero-title">{t("showcase.about.title")}</h1>
          <p className="section-description">
            {t("showcase.about.description")}
          </p>
        </div>
        <div className="brand-emblem" aria-hidden="true">
          <div className="brand-emblem-orbit" />
          <OrbitIcon className="size-16" />
          <span className="absolute bottom-8 font-mono text-xs tracking-widest text-muted-foreground">
            PRACTICE / REFLECT / REPEAT
          </span>
        </div>
      </section>
      <section className="landing-section border-y bg-canvas">
        <p className="section-eyebrow">01 / {t("showcase.label")}</p>
        <h2 className="max-w-4xl text-4xl leading-snug font-medium tracking-tight sm:text-5xl">
          {t("showcase.about.manifesto")}
        </h2>
        <p className="mt-8 max-w-2xl text-lg leading-loose text-muted-foreground">
          {t("showcase.about.manifestoNote")}
        </p>
      </section>
      <section className="landing-section">
        <div className="grid gap-10 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <article key={n} className="flex flex-col gap-5">
              <span className="font-mono text-xs text-muted-foreground">
                0{n}
              </span>
              <h2 className="text-xl font-medium">
                {t(`showcase.about.principle${n}`)}
              </h2>
              <p className="text-sm leading-loose text-muted-foreground">
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
        <ul className="flex flex-col divide-y">
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
