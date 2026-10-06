"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { LocaleSwitch } from "./locale-switch";
import { Brand, SkipLink } from "./brand";
import { LoginDialog } from "./login-dialog";
import { usePathname } from "next/navigation";
import { productLinks } from "@/lib/ui/product-navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppHeader() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = (mobile = false) =>
    productLinks.map(([href, key]) => (
      <Link
        key={href}
        href={href}
        className={mobile ? "nav-link border-b py-3 last:border-0" : "nav-link"}
        aria-current={pathname === href ? "page" : undefined}
        onClick={mobile ? () => setMenuOpen(false) : undefined}
      >
        {t(`showcase.${key}.label`)}
      </Link>
    ));
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 80rem)");
    const closeDesktopMenu = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    const sync = () =>
      header.current?.toggleAttribute("data-scrolled", window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    desktop.addEventListener("change", closeDesktopMenu);
    return () => {
      window.removeEventListener("scroll", sync);
      desktop.removeEventListener("change", closeDesktopMenu);
    };
  }, []);
  return (
    <>
      <SkipLink />
      <header ref={header} className="landing-header xl:sticky xl:top-0">
        <div className="public-header-frame mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-8">
          <div className="public-header-brand-row flex w-full min-w-0 items-center justify-between gap-3 xl:w-auto">
            <Brand />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="xl:hidden"
                    aria-label={t("showcase.menu")}
                  />
                }
              >
                <MenuIcon aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="top"
                showCloseButton={false}
                className="max-h-[50svh] gap-0 overflow-hidden px-5 pb-4 sm:px-8"
              >
                <SheetHeader className="flex-row items-start justify-between gap-3 px-0 py-4">
                  <SheetTitle>{t("showcase.menu")}</SheetTitle>
                  <SheetClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("ui.close")}
                      />
                    }
                  >
                    <XIcon aria-hidden="true" />
                  </SheetClose>
                </SheetHeader>
                <nav
                  aria-label={t("showcase.menu")}
                  className="flex min-h-0 flex-col overflow-y-auto overscroll-contain pr-1 text-sm text-muted-foreground"
                >
                  {links(true)}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <nav
            aria-label={t("nav.features")}
            className="hidden items-center gap-6 text-sm text-muted-foreground xl:flex"
          >
            {links()}
          </nav>
          <div className="public-header-controls flex w-full min-w-0 flex-wrap items-center justify-between gap-3 xl:w-auto">
            <LocaleSwitch />
            <div className="public-header-actions flex min-w-0 max-w-full flex-wrap items-center gap-2">
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
        </div>
      </header>
    </>
  );
}
