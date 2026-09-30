"use client";
import { ArrowUpRightIcon, CircleDotIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
      <div className="journey-track">
        {previewProblems.map((problem) => (
          <Popover key={problem.id}>
            <div className="journey-stop">
              <p className="mb-4 font-mono text-xs text-muted-foreground">
                {t("landing.day", { day: String(problem.day) })}
              </p>
              <PopoverTrigger render={<Button variant="outline" wrap />}>
                <CircleDotIcon data-icon="inline-start" aria-hidden="true" />
                {problem.tags[0]}
              </PopoverTrigger>
              <p className="mt-4 text-xs text-muted-foreground">
                {problem.difficulty} · Codeforces
              </p>
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
        <div className="journey-stop">
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            {t("landing.today")}
          </p>
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
      <div className="mt-24 grid items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <h3 className="section-title">{t("landing.stackTitle")}</h3>
          <p className="section-description">{t("landing.stackNote")}</p>
          <Badge variant="secondary" wrap>
            {t("landing.sample")}
          </Badge>
        </div>
        <div className="problem-stack">
          {previewProblems.map((problem) => (
            <Card key={problem.id} className="stack-card">
              <CardHeader>
                <CardDescription>
                  {problem.id} / Codeforces · {problem.difficulty}
                </CardDescription>
                <CardTitle>{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
