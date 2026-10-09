"use client";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  FingerprintIcon,
  LayersIcon,
  RouteIcon,
  OrbitIcon,
  DatabaseIcon,
  CodeXmlIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { productLinks } from "@/lib/ui/product-navigation";
import { previewProfile } from "@/lib/demo/preview";
import { cn } from "@/lib/utils";

const icons = [LayersIcon, FingerprintIcon, RouteIcon, OrbitIcon];
export function ProductIndex() {
  const { t, locale } = useLocale();
  return (
    <div className="mt-10 grid min-w-0 gap-4 md:grid-cols-3">
      {productLinks.map(([href, key], index) => {
        const Icon = icons[index];
        return (
          <Card
            key={key}
            size="lg"
            interaction="lift"
            variant={
              key === "profile"
                ? "analysis"
                : key === "recommendations"
                  ? "recommendation"
                  : "default"
            }
            className={cn(
              key === "features" && "md:col-span-2",
              key === "profile" && "md:row-span-2",
            )}
          >
            <CardHeader>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl bg-info-soft text-info",
                    key === "profile" && "bg-insight-soft text-insight",
                    key === "about" && "bg-support-soft text-support",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <CardTitle>
                <h3>{t(`showcase.${key}.label`)}</h3>
              </CardTitle>
              <CardDescription>
                {t(`showcase.${key}.description`)}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={cn(
                key === "profile"
                  ? "flex flex-1 flex-col justify-center"
                  : "mt-auto",
              )}
            >
              {key === "features" ? (
                <div className="grid items-center gap-2 rounded-2xl border border-info/10 bg-info-soft/45 p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:p-5">
                  {(
                    [
                      ["data", DatabaseIcon],
                      ["profile", FingerprintIcon],
                      ["practice", CodeXmlIcon],
                    ] as const
                  ).map(([step, StepIcon], stepIndex) => (
                    <div key={step} className="contents">
                      {stepIndex > 0 && (
                        <ArrowRightIcon
                          className="hidden size-4 text-info/60 sm:block"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-surface-border bg-card px-3 py-4 shadow-surface sm:flex-col sm:text-center">
                        <StepIcon
                          className="size-5 shrink-0 text-info"
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium">
                          {t(`flow.${step}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : key === "profile" ? (
                <div className="relative flex min-h-64 flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-insight-soft/45 py-10">
                  <div
                    className="pointer-events-none absolute size-56 rounded-full border border-insight/15"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute size-40 rounded-full border border-insight/20"
                    aria-hidden="true"
                  />
                  <FingerprintIcon
                    className="relative size-12 text-insight"
                    aria-hidden="true"
                  />
                  <div className="relative flex flex-col items-center gap-1 rounded-xl bg-card/90 px-6 py-3">
                    <strong className="text-4xl font-semibold tabular-nums tracking-tight">
                      {new Intl.NumberFormat(locale).format(
                        previewProfile.solved,
                      )}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {t("profile.totalSolved")}
                    </span>
                  </div>
                  <span className="relative px-5 text-center text-xs text-muted-foreground">
                    {t("landing.sample")}
                  </span>
                </div>
              ) : key === "recommendations" ? (
                <div
                  className="flex items-center justify-between gap-5 rounded-2xl bg-info-soft/60 p-5"
                  aria-hidden="true"
                >
                  <span className="font-mono text-3xl tracking-tight text-info">
                    N + 1
                  </span>
                  <div className="flex items-center gap-2 text-info/60">
                    <span className="size-2 rounded-full border border-current" />
                    <span className="h-px w-8 bg-current" />
                    <RouteIcon className="size-7" />
                  </div>
                </div>
              ) : (
                <div
                  className="relative flex min-h-20 items-center justify-center overflow-hidden rounded-2xl bg-support-soft/60"
                  aria-hidden="true"
                >
                  <span className="absolute size-36 rounded-full border border-support/15" />
                  <span className="absolute size-24 rounded-full border border-support/20" />
                  <OrbitIcon className="size-9 text-support" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link
                href={href}
                className={buttonVariants({ variant: "link", wrap: true })}
              >
                {t("showcase.explore")} · {t(`showcase.${key}.label`)}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
