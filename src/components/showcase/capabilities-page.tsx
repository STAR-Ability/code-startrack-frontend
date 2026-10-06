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

export function CapabilitiesPage() {
  const { t } = useLocale();
  const steps = [
    ["data", "input", DatabaseIcon, "/about"],
    ["profile", "context", FingerprintIcon, "/product/profile"],
    ["next", "output", RouteIcon, "/product/recommendations"],
  ] as const;
  return (
    <ProductShell>
      <section className="landing-section public-page-hero grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-start gap-4">
          <Badge variant="info">{t("showcase.features.label")}</Badge>
          <h1 className="hero-title">{t("showcase.features.title")}</h1>
          <p className="section-description">
            {t("showcase.features.description")}
          </p>
        </div>
        <ol className="public-process" data-layout="vertical">
          {steps.map(([key, label, Icon], index) => (
            <li key={key} className="public-step">
              <span className="public-marker" aria-hidden="true">
                <Icon />
              </span>
              <div className="public-body">
                <span className="meta-label">0{index + 1}</span>
                <p>{t(`showcase.features.${label}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="landing-section public-capabilities border-t">
        {steps.map(([key, , Icon, href], index) => (
          <article key={key} className="public-capability-item">
            <span className="public-marker" aria-hidden="true">
              <Icon />
            </span>
            <div className="public-body">
              <p className="meta-label">0{index + 1}</p>
              <h2 className="section-heading">
                {t(`showcase.features.${key}`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`showcase.features.${key}Note`)}
              </p>
              <Link
                href={href}
                className={buttonVariants({ variant: "link", wrap: true })}
              >
                {t("showcase.explore")}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </section>
      <section className="landing-section public-evidence grid items-start gap-5 border-t md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="public-marker" aria-hidden="true">
          <LayersIcon />
        </span>
        <div className="public-body max-w-reading">
          <h2 className="section-heading">{t("showcase.features.boundary")}</h2>
          <p className="section-description">
            {t("showcase.features.boundaryNote")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("showcase.service")}
          </p>
        </div>
      </section>
    </ProductShell>
  );
}
