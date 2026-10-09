"use client";
import Link from "next/link";
import { ArrowUpRightIcon, FlaskConicalIcon } from "lucide-react";
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
          <header className="flex min-w-0 flex-col items-start gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col items-start gap-4">
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
            </div>
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
          </header>
          <AnalysisView analysis={demoAnalysis()} dimensions statistics />
          <BatchView batch={demoBatch()} firstOnly />
        </div>
      </main>
    </>
  );
}
