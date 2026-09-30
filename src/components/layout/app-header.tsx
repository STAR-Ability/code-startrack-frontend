"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { LocaleSwitch } from "./locale-switch";
import { Brand, SkipLink } from "./brand";
import { LoginDialog } from "./login-dialog";
import { buttonVariants } from "@/components/ui/button";

export function AppHeader() {
  const { t } = useLocale();
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () =>
      header.current?.toggleAttribute("data-scrolled", window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);
  return (
    <>
      <SkipLink />
      <header ref={header} className="landing-header sticky top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <Brand />
          <nav
            aria-label={t("nav.features")}
            className="hidden items-center gap-6 text-sm text-muted-foreground xl:flex"
          >
            <a className="nav-link" href="#features">
              {t("nav.features")}
            </a>
            <Link className="nav-link" href="/profile" prefetch={false}>
              {t("profile.title")}
            </Link>
            <Link className="nav-link" href="/practice" prefetch={false}>
              {t("recommendation.title")}
            </Link>
            <a className="nav-link" href="#about">
              {t("nav.about")}
            </a>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <LocaleSwitch />
            <LoginDialog />
            <Link
              href="/practice"
              prefetch={false}
              className={buttonVariants({ wrap: true })}
            >
              <span className="min-w-0">{t("nav.start")}</span>
              <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
