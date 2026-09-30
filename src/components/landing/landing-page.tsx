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
  ActivityIcon,
  OrbitIcon,
  PauseIcon,
  PlayIcon,
  CheckIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductPreview } from "./product-preview";
import { Journey } from "./journey";
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
      <main id="main-content" tabIndex={-1} ref={main}>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-24 lg:pb-28">
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
            <p className="text-xs text-muted-foreground">
              {t("landing.currentSource")}{" "}
              <span className="ml-2 font-medium text-foreground">
                Codeforces
              </span>
            </p>
            <div className="marquee-window min-w-0 flex-1" data-paused={paused}>
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
          <p className="section-eyebrow">{t("landing.flowEyebrow")}</p>
          <h2 id="flow-title" className="section-title">
            {t("landing.flowTitle")}
          </h2>
          <p className="section-description mt-4">
            {t("landing.flowDescription")}
          </p>
          <div className="flow-grid mt-12">
            {flow.map(([key, Icon], index) => (
              <Card key={key} interaction="lift" className="flow-card">
                <CardHeader>
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="font-mono text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <CardTitle>
                    <h3>{t(`flow.${key}`)}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t(`flow.${key}Note`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <div className="border-y bg-muted/60">
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
            <div className="bento-grid mt-12">
              {(
                [
                  ["profile", FingerprintIcon],
                  ["recommend", RouteIcon],
                  ["sources", LayersIcon],
                  ["activity", ActivityIcon],
                  ["journey", OrbitIcon],
                ] as const
              ).map(([key, Icon]) => (
                <Card
                  key={key}
                  interaction="lift"
                  className={cn(
                    "bento-card [--card-spacing:--spacing(6)]",
                    `bento-${key}`,
                  )}
                >
                  <CardHeader>
                    <Icon
                      className="mb-6 size-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <CardTitle>
                      <h3>{t(`feature.${key}`)}</h3>
                    </CardTitle>
                    <CardDescription>{t(`feature.${key}Note`)}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    {key === "profile" && (
                      <div className="profile-illustration" aria-hidden="true">
                        <div className="profile-orbit">
                          <FingerprintIcon className="size-10" />
                        </div>
                        <span className="profile-source">Codeforces</span>
                        <div className="illustration-line" />
                        <span className="profile-one">01</span>
                      </div>
                    )}
                    {key === "recommend" && (
                      <Link
                        href="/practice"
                        prefetch={false}
                        className={buttonVariants({
                          variant: "link",
                          wrap: true,
                        })}
                      >
                        <span className="min-w-0">{t("nav.practice")}</span>
                        <ArrowUpRightIcon
                          data-icon="inline-end"
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                    {key === "sources" && (
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Codeforces</Badge>
                        <Badge variant="secondary" wrap>
                          {t("landing.futureSources")}
                        </Badge>
                      </div>
                    )}
                    {key === "activity" && (
                      <div className="flex flex-wrap gap-2" aria-hidden="true">
                        {[7, 30].map((day) => (
                          <span
                            className="flex flex-1 flex-col rounded-lg border bg-muted p-4 font-mono text-3xl"
                            key={day}
                          >
                            {day}
                            <span className="mt-2 text-xs text-muted-foreground">
                              {t("landing.days")}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    {key === "journey" && (
                      <svg
                        className="bento-track"
                        viewBox="0 0 500 100"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M10 80 C120 80 110 20 220 50 S330 65 490 10" />
                        {[
                          [10, 80],
                          [160, 45],
                          [300, 55],
                          [490, 10],
                        ].map(([x, y]) => (
                          <circle key={x} cx={x} cy={y} r="5" />
                        ))}
                      </svg>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
              href="/practice"
              prefetch={false}
              className={buttonVariants({ size: "lg", wrap: true })}
            >
              <span className="min-w-0">{t("entry.openDemo")}</span>
              <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
            <Link
              href="/profile"
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
        <p>V0.1 · {t("demo.label")}</p>
      </footer>
    </>
  );
}
