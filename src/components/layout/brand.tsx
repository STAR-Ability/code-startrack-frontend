"use client";

import Link from "next/link";
import { OrbitIcon } from "lucide-react";
import { useLocale } from "./locale-provider";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <Link
      href="/"
      prefetch={false}
      className="brand-link flex min-w-0 items-center gap-3 rounded-lg"
      aria-label={t("nav.home")}
    >
      <span className="brand-mark flex size-10 shrink-0 items-center justify-center rounded-xl bg-info text-primary-foreground">
        <OrbitIcon className="size-6" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold tracking-tight">码练星轨</span>
          <span
            translate="no"
            className="font-mono text-xs wrap-anywhere text-muted-foreground"
          >
            codeStartrack
          </span>
        </span>
      )}
    </Link>
  );
}

export function SkipLink() {
  const { t } = useLocale();
  return (
    <a
      href="#main-content"
      className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-lg focus:bg-background focus:p-3 focus:text-link"
    >
      {t("navigation.skip")}
    </a>
  );
}
