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
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10"
      >
        <h1 className="text-3xl font-semibold">{t("v.demoTitle")}</h1>
        <Badge variant="outline" wrap>
          {t("v.demoNote")}
        </Badge>
        <BatchView batch={demoBatch()} firstOnly />
        <AnalysisView analysis={demoAnalysis()} dimensions statistics />
      </main>
    </>
  );
}
