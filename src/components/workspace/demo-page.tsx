"use client";
import { AppHeader } from "@/components/layout/app-header";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { demoAnalysis, demoBatch } from "@/lib/demo/fixtures";
import { AnalysisView } from "./analysis-view";
import { BatchView } from "./recommendation-card";
export function DemoPage() {
  const { t } = useLocale();
  return (
    <>
      <AppHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-workspace min-w-0 flex-col gap-5 px-5 py-6 sm:px-8"
      >
        <h1 className="page-title">{t("v.demoTitle")}</h1>
        <Badge variant="outline" wrap>
          {t("v.demoNote")}
        </Badge>
        <section
          className="flex min-w-0 flex-col gap-4"
          aria-label={t("practice.forYou")}
        >
          <BatchView batch={demoBatch()} firstOnly compact />
        </section>
        <section
          className="flex min-w-0 flex-col gap-4"
          aria-label={t("v.profile")}
        >
          <AnalysisView analysis={demoAnalysis()} dimensions statistics />
        </section>
      </main>
    </>
  );
}
