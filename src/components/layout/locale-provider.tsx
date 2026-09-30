"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { saveLocale, translate, type Locale } from "@/lib/i18n/locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: Parameters<typeof translate>[1],
    parameters?: Record<string, string>,
  ) => string;
} | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [announcement, setAnnouncement] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(
      locale,
      pathname === "/dashboard"
        ? "metadata.dashboardTitle"
        : "metadata.homeTitle",
    );
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", translate(locale, "metadata.description"));
  }, [locale, pathname]);

  function setLocale(next: Locale) {
    if (next === locale) return;
    const saved = saveLocale(next);
    setLocaleState(next);
    setAnnouncement(
      saved
        ? translate(next, "language.changed", {
            language: next === "en" ? "English" : "简体中文",
          })
        : translate(next, "language.notSaved"),
    );
  }

  return (
    <LocaleContext
      value={{
        locale,
        setLocale,
        t: (key, parameters) => translate(locale, key, parameters),
      }}
    >
      {children}
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </LocaleContext>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is required");
  return context;
}
