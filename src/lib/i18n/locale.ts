import { en, zhCN, type CopyKey } from "./messages";

export type Locale = "zh-CN" | "en";
export const LOCALE_COOKIE = "codestartrack_locale";

export function resolveLocale(value: unknown): Locale {
  return value === "en" ? "en" : "zh-CN";
}

export function translate(
  locale: Locale,
  key: CopyKey,
  parameters: Record<string, string> = {},
): string {
  const message = (locale === "en" ? en[key] : zhCN[key]) || zhCN[key];
  return message.replace(
    /\{(\w+)\}/g,
    (placeholder, name: string) => parameters[name] ?? placeholder,
  );
}

export function saveLocale(locale: Locale): boolean {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=Lax; Max-Age=31536000${location.protocol === "https:" ? "; Secure" : ""}`;
    return document.cookie.split("; ").includes(`${LOCALE_COOKIE}=${locale}`);
  } catch {
    return false;
  }
}

export function formatNumber(
  value: number,
  locale: Locale,
  fractionDigits = 0,
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatTimestamp(value: string, locale: Locale): string {
  // Do not assign an undocumented zone to a backend wall-clock timestamp.
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return `${value.replace("T", " ")} · ${translate(locale, "time.zoneUnknown")}`;
  }
  return `${new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}
