"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  DatabaseIcon,
  LayersIcon,
  FingerprintIcon,
  RouteIcon,
  CodeXmlIcon,
  OrbitIcon,
  PauseIcon,
  PlayIcon,
  CheckIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductPreview } from "./product-preview";
import { Journey } from "./journey";
import { ProductIndex } from "@/components/showcase/product-index";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { t } = useLocale();
  const main = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    main.current
      ?.querySelectorAll(".landing-section")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
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
      <main
        id="main-content"
        tabIndex={-1}
        ref={main}
        className="brand-surface"
      >
        <section className="brand-hero mx-auto grid max-w-7xl items-center gap-12 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20 lg:pb-24">
          <div className="flex min-w-0 flex-col items-start gap-7">
            <Badge variant="outline" wrap>
              <span className="size-1.5 shrink-0 rounded-full bg-link" />
              {t("landing.eyebrow")}
            </Badge>
            <h1 className="hero-title">
              {t("landing.title")}
              <span className="mt-2 block text-info">
                {t("landing.titleEnd")}
              </span>
            </h1>
            <p className="max-w-lg text-base leading-loose text-muted-foreground">
              {t("landing.description")}
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
            <p className="min-w-0 flex-1 text-xs text-muted-foreground sm:flex-none">
              {t("landing.currentSource")}{" "}
              <span className="ml-2 font-medium text-foreground">
                {t("landing.sources")}
              </span>
            </p>
            <div
              className="marquee-window order-last w-full min-w-0 basis-full sm:order-none sm:w-auto sm:flex-1 sm:basis-auto"
              data-paused={paused}
            >
              <div className="marquee-track">
                <span>{t("landing.unified")}</span>
                <OrbitIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>{t("landing.futureSources")}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t(paused ? "motion.play" : "motion.pause")}
              onClick={() => setPaused(!paused)}
            >
              {paused ? (
                <PlayIcon aria-hidden="true" />
              ) : (
                <PauseIcon aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
        <section className="landing-section" aria-labelledby="flow-title">
          <div className="grid items-end gap-5 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="section-eyebrow">{t("landing.flowEyebrow")}</p>
              <h2 id="flow-title" className="section-title">
                {t("landing.flowTitle")}
              </h2>
            </div>
            <p className="section-description lg:max-w-sm lg:justify-self-end">
              {t("landing.flowDescription")}
            </p>
          </div>
          <ol className="mt-10 grid min-w-0 gap-2 rounded-3xl border border-surface-border bg-surface-supporting p-3 shadow-surface sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
            {flow.map(([key, Icon], index) => (
              <li
                key={key}
                className={cn(
                  "relative flex min-w-0 flex-col gap-4 rounded-2xl p-4 sm:p-5",
                  key === "profile" &&
                    "bg-insight-soft shadow-surface ring-1 ring-insight/15",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl bg-card text-info",
                      key === "profile" && "text-insight",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="font-semibold">{t(`flow.${key}`)}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(`flow.${key}Note`)}
                </p>
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
            <div className="grid items-end gap-5 lg:grid-cols-[1.3fr_1fr]">
              <h2 id="features-title" className="section-title">
                {t("landing.featuresTitle")}
              </h2>
              <p className="section-description lg:max-w-sm lg:justify-self-end">
                {t("landing.featuresDescription")}
              </p>
            </div>
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
          <div className="mx-auto mt-8 flex max-w-lg flex-col justify-center gap-3 sm:flex-row">
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
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t px-5 py-6 text-xs text-muted-foreground sm:px-8">
        <p>{t("landing.footer")}</p>
        <p>{t("demo.label")}</p>
      </footer>
    </>
  );
}
