"use client";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { TrainingResults } from "./training-results";

export function TrainingPage({
  userId,
  view,
}: {
  userId: number;
  view: "profile" | "practice";
}) {
  const { t } = useLocale();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12"
    >
      <header className="flex flex-col items-start gap-3">
        <p className="text-xs font-medium tracking-widest text-muted-foreground">
          {t(view === "profile" ? "profile.identity" : "practice.focus")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight wrap-anywhere sm:text-4xl">
          {t(view === "profile" ? "profile.pageTitle" : "practice.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(view === "profile" ? "profile.pageNote" : "practice.description")}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" wrap>
            {t("demo.label")}
          </Badge>
          <span>{t("demo.context")}</span>
        </div>
      </header>
      <TrainingResults userId={userId} view={view} />
    </main>
  );
}
