"use client";

import Link from "next/link";
import {
  ArrowUpRightIcon,
  BracesIcon,
  ChartNoAxesCombinedIcon,
  CompassIcon,
  OrbitIcon,
} from "lucide-react";
import { Brand, SkipLink } from "@/components/layout/brand";
import { LocaleSwitch } from "@/components/layout/locale-switch";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="auth-shell flex min-h-svh flex-col">
      <SkipLink />
      <header className="mx-auto flex w-full max-w-workspace flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Brand />
        <div className="flex max-w-full flex-wrap items-center gap-3">
          <LocaleSwitch />
          <Link
            href="/demo"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              wrap: true,
            })}
          >
            {t("ui.exploreDemo")}
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="auth-layout mx-auto flex w-full max-w-workspace flex-1 items-center px-5 py-6 sm:px-8 sm:py-10"
      >
        <div className="auth-composition">
          <section
            className="auth-story min-w-0 flex-col gap-7"
            aria-label={t("ui.storyLabel")}
          >
            <Badge variant="outline" className="w-fit gap-2">
              <OrbitIcon aria-hidden="true" />
              {t("ui.storyEyebrow")}
            </Badge>
            <h2 className="auth-story-title">
              {t("ui.storyTitle")}
              <span>{t("ui.storyTitleEnd")}</span>
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              {t("ui.storyDescription")}
            </p>
            <div className="auth-orbit" aria-hidden="true">
              <svg
                viewBox="0 0 480 270"
                fill="none"
                className="absolute inset-0 size-full"
              >
                <ellipse
                  cx="240"
                  cy="135"
                  rx="198"
                  ry="75"
                  transform="rotate(-24 240 135)"
                  className="auth-orbit-line"
                />
                <ellipse
                  cx="240"
                  cy="135"
                  rx="150"
                  ry="110"
                  transform="rotate(24 240 135)"
                  className="auth-orbit-line"
                />
                <path
                  d="M52 213C146 243 170 58 260 91S360 192 439 58"
                  className="auth-orbit-path"
                  strokeWidth="1.5"
                  strokeDasharray="5 7"
                />
                <circle cx="84" cy="174" r="4" className="auth-orbit-dot" />
                <circle cx="403" cy="65" r="4" className="auth-orbit-dot" />
                <circle cx="350" cy="213" r="3" className="auth-orbit-dot" />
              </svg>
              <div className="auth-orbit-core">
                <BracesIcon className="size-12" />
              </div>
              <div className="auth-orbit-label auth-orbit-label-first">
                <ChartNoAxesCombinedIcon className="size-4" />
                {t("ui.insight")}
              </div>
              <div className="auth-orbit-label auth-orbit-label-last">
                <CompassIcon className="size-4" />
                {t("ui.nextStep")}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              {(["practice", "understand", "advance"] as const).map(
                (step, index) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="font-mono text-link">0{index + 1}</span>
                    {t(`ui.step.${step}`)}
                  </span>
                ),
              )}
            </div>
          </section>
          <div className="auth-form-enter mx-auto w-full min-w-0 max-w-auth">
            {children}
          </div>
        </div>
      </main>
      <footer className="px-5 pb-6 pt-4 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-2xl text-balance leading-relaxed">
          {t("ui.footer")}
        </p>
      </footer>
    </div>
  );
}
