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
      <section className="landing-section public-page-hero grid items-center gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-start gap-4">
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
      <section className="landing-section public-evidence border-t">
        <p className="section-eyebrow">01 / {t("showcase.label")}</p>
        <h2 className="section-heading mt-3 max-w-reading">
          {t("showcase.about.manifesto")}
        </h2>
        <p className="mt-4 max-w-reading text-base leading-relaxed text-muted-foreground">
          {t("showcase.about.manifestoNote")}
        </p>
      </section>
      <section className="landing-section public-capabilities border-t">
        {([1, 2, 3] as const).map((n) => (
          <article key={n} className="public-capability-item">
            <span className="public-marker" aria-hidden="true">
              0{n}
            </span>
            <div className="public-body">
              <h2 className="section-heading">
                {t(`showcase.about.principle${n}`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`showcase.about.principle${n}Note`)}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="landing-section grid items-start gap-8 border-t lg:grid-cols-2">
        <div className="public-body">
          <h2 className="section-heading">{t("showcase.about.now")}</h2>
          <p className="section-description">{t("showcase.about.nowNote")}</p>
          <Link
            href="/demo"
            className={buttonVariants({ variant: "link", wrap: true })}
          >
            {t("ui.exploreDemo")}
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
        <ul className="public-example-list">
          {(
            [
              ["accounts", "success", "available"],
              ["analysis", "success", "available"],
              ["agent", "secondary", "planned"],
            ] as const
          ).map(([key, variant, state]) => (
            <li className="public-example-row" key={key}>
              <Badge variant={variant} wrap>
                {t(`showcase.${state}`)}
              </Badge>
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
