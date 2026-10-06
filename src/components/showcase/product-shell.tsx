"use client";
import Link from "next/link";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <>
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="brand-surface flex-1">
        <div className="mx-auto max-w-workspace px-5 pt-6 sm:px-8">
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
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="section-eyebrow">codeStartrack</p>
              <h2 className="section-heading">{t("showcase.about.open")}</h2>
            </div>
            <Link
              href="/practice"
              className={buttonVariants({ size: "xl", wrap: true })}
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
