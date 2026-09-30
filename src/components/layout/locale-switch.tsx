"use client";

import { useLocale } from "./locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <ToggleGroup
      className="max-w-full flex-wrap"
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
  );
}
