"use client";
import { ArrowUpRightIcon, CircleDotIcon, RouteIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { previewProblems } from "@/lib/demo/preview";

export function Journey() {
  const { t } = useLocale();
  return (
    <section className="landing-section" aria-labelledby="journey-title">
      <div className="mb-12 flex flex-col items-start gap-3">
        <Badge variant="outline" wrap>
          {t("landing.sample")}
        </Badge>
        <h2 id="journey-title" className="section-title">
          {t("landing.journeyTitle")}
        </h2>
        <p className="section-description">{t("landing.journeyNote")}</p>
      </div>
      <div className="grid min-w-0 gap-0 rounded-3xl border border-surface-border bg-surface-reading shadow-surface sm:grid-cols-3">
        {previewProblems.map((problem, index) => (
          <Popover key={problem.id}>
            <div className="relative flex min-w-0 flex-col items-start gap-5 border-b border-surface-border p-6 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 sm:p-8">
              <div className="flex w-full items-center justify-between gap-3">
                <p className="font-mono text-xs text-muted-foreground">
                  {t("landing.day", { day: String(problem.day) })}
                </p>
                <span className="font-mono text-xs text-info">
                  0{index + 1}
                </span>
              </div>
              <PopoverTrigger render={<Button variant="outline" wrap />}>
                <CircleDotIcon data-icon="inline-start" aria-hidden="true" />
                {problem.tags[0]}
              </PopoverTrigger>
              <p className="text-lg font-semibold tracking-tight">
                {problem.title}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{problem.difficulty}</Badge>
                <span className="text-xs text-muted-foreground">
                  Codeforces
                </span>
              </div>
            </div>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>{problem.title}</PopoverTitle>
                <PopoverDescription>{t("landing.sample")}</PopoverDescription>
              </PopoverHeader>
              <p>
                {problem.tags.join(" · ")} / {problem.difficulty}
              </p>
            </PopoverContent>
          </Popover>
        ))}
      </div>
      <div className="mt-6 flex min-w-0 flex-col gap-6 rounded-3xl border border-info/15 bg-info-soft/60 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-card text-info sm:flex">
            <RouteIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="flex flex-col items-start gap-3">
            <p className="font-mono text-xs text-info">{t("landing.today")}</p>
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t("landing.stackTitle")}
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("landing.stackNote")}
            </p>
          </div>
        </div>
        <Link
          href="/practice"
          prefetch={false}
          className={buttonVariants({
            wrap: true,
            size: "lg",
            className: "shrink-0",
          })}
        >
          <span className="min-w-0">{t("nav.start")}</span>
          <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
