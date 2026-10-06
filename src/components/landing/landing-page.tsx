"use client";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  DatabaseIcon,
  LayersIcon,
  FingerprintIcon,
  RouteIcon,
  CodeXmlIcon,
  OrbitIcon,
  CheckIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductPreview } from "./product-preview";
import { Journey } from "./journey";
import { ProductIndex } from "@/components/showcase/product-index";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { t } = useLocale();
  const flow = [
    ["data", DatabaseIcon],
    ["unify", LayersIcon],
    ["profile", FingerprintIcon],
    ["recommend", RouteIcon],
    ["practice", CodeXmlIcon],
  ] as const;
  return (
    <>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="brand-surface">
        <section className="public-page-hero brand-hero mx-auto grid max-w-workspace items-center gap-12 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-24 lg:pb-28">
          <div className="flex min-w-0 flex-col items-start gap-7">
            <Badge variant="outline" wrap>
              <span className="size-1.5 shrink-0 rounded-full bg-link" />
              {t("landing.eyebrow")}
            </Badge>
            <h1 className="hero-title">
              {t("landing.title")}
              <span className="mt-2 block text-muted-foreground">
                {t("landing.titleEnd")}
              </span>
            </h1>
            <p className="max-w-lg text-base leading-loose text-muted-foreground">
              {t("landing.description")}
            </p>
            <div className="flex w-full max-w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href="/practice"
                prefetch={false}
                className={cn(
                  buttonVariants({ size: "lg", wrap: true }),
                  "px-6 py-3",
                )}
              >
                <span className="min-w-0">{t("nav.start")}</span>
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
              <a
                href="#product-preview"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                    wrap: true,
                  }),
                  "px-6 py-3",
                )}
              >
                <span className="min-w-0">{t("landing.preview")}</span>
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </a>
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
              {t("landing.trust")}
            </p>
          </div>
          <ProductPreview />
        </section>
        <div className="border-y bg-muted/50">
          <div className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <p className="text-xs text-muted-foreground">
              {t("landing.currentSource")}{" "}
              <span className="ml-2 font-medium text-foreground">
                Codeforces
              </span>
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span>{t("landing.unified")}</span>
              <OrbitIcon className="size-4 shrink-0" aria-hidden="true" />
              <span>{t("landing.futureSources")}</span>
            </div>
          </div>
        </div>
        <section className="landing-section" aria-labelledby="flow-title">
          <p className="section-eyebrow">{t("landing.flowEyebrow")}</p>
          <h2 id="flow-title" className="section-title">
            {t("landing.flowTitle")}
          </h2>
          <p className="section-description mt-4">
            {t("landing.flowDescription")}
          </p>
          <ol className="public-process mt-10">
            {flow.map(([key, Icon], index) => (
              <li key={key} className="public-step">
                <span className="public-marker" aria-hidden="true">
                  0{index + 1}
                </span>
                <div className="public-body">
                  <h3 className="flex min-w-0 items-start gap-3 text-base font-semibold">
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 wrap-anywhere">
                      {t(`flow.${key}`)}
                    </span>
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`flow.${key}Note`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="section-wash border-y">
          <section
            id="features"
            className="landing-section scroll-mt-32"
            aria-labelledby="features-title"
          >
            <h2 id="features-title" className="section-title">
              {t("landing.featuresTitle")}
            </h2>
            <p className="section-description mt-4">
              {t("landing.featuresDescription")}
            </p>
            <ProductIndex />
          </section>
        </div>
        <Journey />
        <section
          id="about"
          className="landing-section scroll-mt-32 border-t text-center"
          aria-labelledby="cta-title"
        >
          <OrbitIcon
            className="mx-auto mb-6 size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 id="cta-title" className="section-title">
            {t("landing.ctaTitle")}
          </h2>
          <p className="section-description mx-auto mt-4">
            {t("landing.ctaNote")}
          </p>
          <div className="mx-auto mt-8 flex max-w-lg flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/demo"
              prefetch={false}
              className={buttonVariants({ size: "lg", wrap: true })}
            >
              <span className="min-w-0">{t("entry.openDemo")}</span>
              <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
            <Link
              href="/product/profile"
              prefetch={false}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                wrap: true,
              })}
            >
              {t("landing.viewProfile")}
            </Link>
          </div>
          <div className="mx-auto mt-8 max-w-lg text-left">
            <Alert role="note">
              <CodeXmlIcon aria-hidden="true" />
              <AlertDescription>{t("entry.readOnly")}</AlertDescription>
            </Alert>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-workspace flex-wrap items-center justify-between gap-3 border-t px-5 py-6 text-xs text-muted-foreground sm:px-8">
        <p>{t("landing.footer")}</p>
        <p>{t("demo.label")}</p>
      </footer>
    </>
  );
}
