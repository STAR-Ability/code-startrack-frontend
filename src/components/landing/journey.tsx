"use client";
import { ArrowUpRightIcon, CircleDotIcon } from "lucide-react";
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
      <div className="mb-8 flex flex-col items-start gap-3">
        <Badge variant="outline" wrap>
          {t("landing.sample")}
        </Badge>
        <h2 id="journey-title" className="section-title">
          {t("landing.journeyTitle")}
        </h2>
        <p className="section-description">{t("landing.journeyNote")}</p>
      </div>
      <ol className="public-example-list">
        {previewProblems.map((problem, index) => (
          <li key={problem.id} className="public-example-row">
            <span className="public-marker" aria-hidden="true">
              0{index + 1}
            </span>
            <div className="public-body flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <p className="font-mono whitespace-nowrap">
                  {t("landing.day", { day: String(problem.day) })}
                </p>
                <p className="min-w-0 wrap-anywhere">
                  {problem.id} · Codeforces · {problem.difficulty}
                </p>
              </div>
              <h3 className="text-base font-semibold wrap-anywhere">
                {problem.title}
              </h3>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" wrap />}>
                    <CircleDotIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                    {problem.tags[0]}
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>{problem.title}</PopoverTitle>
                      <PopoverDescription>
                        {t("landing.sample")}
                      </PopoverDescription>
                    </PopoverHeader>
                    <p className="text-sm wrap-anywhere">
                      {problem.tags.join(" · ")} / {problem.difficulty}
                    </p>
                  </PopoverContent>
                </Popover>
                {problem.tags.slice(1).map((tag) => (
                  <Badge key={tag} variant="secondary" wrap>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex min-w-0 flex-wrap items-end justify-between gap-5 border-t pt-6">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="meta-label">{t("landing.today")}</p>
          <h3 className="section-heading">{t("landing.stackTitle")}</h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("landing.stackNote")}
          </p>
        </div>
        <Link
          href="/practice"
          prefetch={false}
          className={buttonVariants({ wrap: true })}
        >
          <span className="min-w-0">{t("nav.start")}</span>
          <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
