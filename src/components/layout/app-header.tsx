"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUpRightIcon, MenuIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { LocaleSwitch } from "./locale-switch";
import { Brand, SkipLink } from "./brand";
import { LoginDialog } from "./login-dialog";
import { usePathname } from "next/navigation";
import { productLinks } from "@/lib/ui/product-navigation";
import { buttonVariants } from "@/components/ui/button";

export function AppHeader() {
  const { t } = useLocale();
  const pathname = usePathname();
  const links = productLinks.map(([href, key]) => (
    <Link
      key={href}
      href={href}
      className="nav-link"
      aria-current={pathname === href ? "page" : undefined}
    >
      {t(`showcase.${key}.label`)}
    </Link>
  ));
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
            {links}
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
          <details
            className="w-full rounded-lg border bg-card px-3 py-2 xl:hidden"
            key={pathname}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
              <span>{t("showcase.menu")}</span>
              <MenuIcon className="size-4" aria-hidden="true" />
            </summary>
            <nav
              aria-label={t("showcase.menu")}
              className="grid grid-cols-2 gap-x-4 gap-y-1 pt-3 text-sm text-muted-foreground"
            >
              {links}
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
