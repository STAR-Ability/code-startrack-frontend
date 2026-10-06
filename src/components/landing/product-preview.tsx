"use client";
import {
  ArrowUpRightIcon,
  CheckCheckIcon,
  ActivityIcon,
  CodeXmlIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { previewProfile, previewProblems } from "@/lib/demo/preview";

export function ProductPreview() {
  const { t } = useLocale();
  const problem = previewProblems[2];
  return (
    <div id="product-preview" className="product-preview scroll-mt-36">
      <div className="preview-grid" aria-hidden="true" />
      <svg
        className="preview-orbit"
        viewBox="0 0 600 520"
        fill="none"
        aria-hidden="true"
      >
        <ellipse
          cx="300"
          cy="260"
          rx="278"
          ry="194"
          transform="rotate(-26 300 260)"
        />
        <ellipse
          cx="300"
          cy="260"
          rx="230"
          ry="140"
          transform="rotate(-26 300 260)"
        />
        <path className="orbit-path" d="M30 370 C110 100 300 470 560 165" />
        <circle cx="94" cy="252" r="5" />
        <circle cx="502" cy="157" r="5" />
      </svg>
      <div className="preview-cards">
        <Card className="preview-profile" interaction="none">
          <CardHeader>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ActivityIcon className="size-4" aria-hidden="true" />
              </span>
              <Badge variant="outline" wrap>
                {t("profile.identity")}
              </Badge>
            </div>
            <CardTitle>{t("landing.previewProfile")}</CardTitle>
            <CardDescription>Codeforces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-3">
              <strong className="text-4xl font-semibold tabular-nums tracking-tighter">
                {previewProfile.solved}
              </strong>
              <span className="text-xs text-muted-foreground">
                {t("profile.totalSolved")}
              </span>
            </div>
            <div className="sample-bars mt-6" aria-hidden="true">
              {[28, 43, 35, 65, 49, 72, 60, 86, 72, 100, 83, 114].map(
                (height, i) => (
                  <span key={i} style={{ height }} />
                ),
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {t("profile.averageDifficulty")} ·{" "}
              {previewProfile.averageDifficulty}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("profile.last7Days")} · {previewProfile.recentActivity}
            </span>
            <CheckCheckIcon className="size-4 text-link" aria-hidden="true" />
          </CardFooter>
        </Card>
        <Card className="preview-problem" interaction="none">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CodeXmlIcon className="size-4" aria-hidden="true" />
              {t("landing.next")}
            </div>
            <CardTitle>{problem.title}</CardTitle>
            <CardDescription>Codeforces · {problem.difficulty}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("landing.previewReason")}
            </p>
          </CardContent>
          <CardFooter>
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" wrap />}>
                <span className="min-w-0">{t("landing.previewAction")}</span>
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>{t("landing.sample")}</PopoverTitle>
                  <PopoverDescription>
                    {t("landing.stackNote")}
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </CardFooter>
        </Card>
      </div>
      <p className="relative mt-7 text-center text-xs text-muted-foreground">
        {t("landing.sample")}
      </p>
    </div>
  );
}
