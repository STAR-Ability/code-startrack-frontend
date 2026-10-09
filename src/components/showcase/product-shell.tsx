"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeftIcon, ArrowUpRightIcon, OrbitIcon } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 },
    );
    main.current
      ?.querySelectorAll(".landing-section")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <AppHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="brand-surface flex-1"
        ref={main}
      >
        <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
          <Link
            href="/"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {t("showcase.back")}
          </Link>
        </div>
        {children}
        <section className="landing-section border-t">
          <div className="relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl border border-info/15 bg-surface-reading p-7 shadow-raised sm:p-10 lg:flex-row lg:items-center">
            <span
              className="pointer-events-none absolute -top-24 -right-10 size-72 rounded-full border border-info/15 bg-info-soft/40"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -top-12 right-2 size-48 rounded-full border border-info/20"
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 items-start gap-5">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-info-soft text-info sm:flex">
                <OrbitIcon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="section-eyebrow">codeStartrack</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("showcase.about.open")}
                </h2>
              </div>
            </div>
            <Link
              href="/practice"
              className={buttonVariants({
                size: "xl",
                wrap: true,
                className: "relative shrink-0",
              })}
            >
              {t("nav.start")}
              <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t bg-canvas px-5 py-7 text-center text-xs text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </>
  );
}

export function SampleNotice() {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="outline" wrap>
        {t("landing.sample")}
      </Badge>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("showcase.note")}
      </p>
    </div>
  );
}
