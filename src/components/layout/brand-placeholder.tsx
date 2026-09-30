"use client";

import { useLocale } from "./locale-provider";

export function BrandPlaceholder() {
  const { t } = useLocale();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("brand.name")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("demo.label")}</p>
    </main>
  );
}
