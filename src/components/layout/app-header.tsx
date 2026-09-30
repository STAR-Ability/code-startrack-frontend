"use client";

import { OrbitIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function AppHeader() {
  const { locale, setLocale, t } = useLocale();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-lg focus:bg-background focus:p-3 focus:text-link"
      >
        {t("navigation.skip")}
      </a>
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <OrbitIcon className="size-5" aria-hidden="true" />
          <span>codeStartrack</span>
        </div>
        <ToggleGroup
          aria-label={t("language.label")}
          value={[locale]}
          onValueChange={(values) => {
            const value = values[0];
            if (value === "zh-CN" || value === "en") setLocale(value);
          }}
          size="sm"
        >
          <ToggleGroupItem value="zh-CN" lang="zh-CN">
            {t("language.zhCN")}
          </ToggleGroupItem>
          <ToggleGroupItem value="en" lang="en">
            {t("language.en")}
          </ToggleGroupItem>
        </ToggleGroup>
      </header>
    </>
  );
}
