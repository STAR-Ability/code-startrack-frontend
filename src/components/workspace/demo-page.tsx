"use client";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  FlaskConicalIcon,
  DatabaseIcon,
  FingerprintIcon,
  RouteIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { demoAnalysis, demoBatch } from "@/lib/demo/fixtures";
import { AnalysisView } from "./analysis-view";
import { BatchView } from "./recommendation-card";
export function DemoPage() {
  const { t } = useLocale();
  return (
    <>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="brand-surface flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
          <header className="relative grid min-w-0 items-center gap-8 overflow-hidden rounded-3xl border border-info/15 bg-surface-reading p-6 shadow-raised sm:p-8 lg:grid-cols-[1.4fr_0.6fr]">
            <span
              className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full border border-info/15 bg-info-soft/50"
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 flex-col items-start gap-4">
              <Badge variant="info" wrap>
                <FlaskConicalIcon aria-hidden="true" />
                {t("v.demoNote")}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t("v.demoTitle")}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("showcase.note")}
              </p>
              <Link
                href="/practice"
                className={buttonVariants({
                  wrap: true,
                  size: "lg",
                  className: "shrink-0",
                })}
              >
                {t("nav.start")}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </div>
            <ol className="relative flex flex-col gap-4 border-t border-surface-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              {(
                [
                  ["data", DatabaseIcon],
                  ["profile", FingerprintIcon],
                  ["recommend", RouteIcon],
                ] as const
              ).map(([key, Icon], index) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-info shadow-surface">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium">
                    {t(`flow.${key}`)}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                </li>
              ))}
            </ol>
          </header>
          <AnalysisView analysis={demoAnalysis()} dimensions statistics />
          <BatchView batch={demoBatch()} firstOnly />
        </div>
      </main>
    </>
  );
}
