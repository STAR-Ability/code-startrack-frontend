"use client";
import Link from "next/link";
import {
  DatabaseIcon,
  FingerprintIcon,
  RouteIcon,
  ArrowUpRightIcon,
  LayersIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProductShell } from "./product-shell";

export function CapabilitiesPage() {
  const { t } = useLocale();
  const steps = [
    ["data", "input", DatabaseIcon, "/about"],
    ["profile", "context", FingerprintIcon, "/product/profile"],
    ["next", "output", RouteIcon, "/product/recommendations"],
  ] as const;
  return (
    <ProductShell>
      <section className="landing-section brand-hero grid gap-10 pt-10 lg:grid-cols-[1.3fr_1fr] lg:pt-14">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="info">{t("showcase.features.label")}</Badge>
          <h1 className="hero-title">{t("showcase.features.title")}</h1>
          <p className="section-description">
            {t("showcase.features.description")}
          </p>
        </div>
        <div className="capability-map self-center" aria-hidden="true">
          {steps.map(([key, label, Icon], index) => (
            <div key={key} className="capability-node">
              <span className="font-mono text-xs text-muted-foreground">
                0{index + 1}
              </span>
              <Icon className="size-5 text-info" />
              <span>{t(`showcase.features.${label}`)}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="section-wash border-y">
        <section className="landing-section grid gap-5 lg:grid-cols-3">
          {steps.map(([key, , Icon, href], index) => (
            <Card key={key} size="lg" interaction="lift">
              <CardHeader>
                <div className="mb-8 flex items-center justify-between">
                  <Icon
                    className="size-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <CardTitle>
                  <h2>{t(`showcase.features.${key}`)}</h2>
                </CardTitle>
                <CardDescription>
                  {t(`showcase.features.${key}Note`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-6">
                <Link
                  href={href}
                  className={buttonVariants({ variant: "link" })}
                >
                  {t("showcase.explore")}
                  <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
      <section className="landing-section grid gap-8 md:grid-cols-[1fr_2fr]">
        <LayersIcon
          className="size-12 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-5">
          <h2 className="section-title">{t("showcase.features.boundary")}</h2>
          <p className="section-description">
            {t("showcase.features.boundaryNote")}
          </p>
          <p className="text-sm text-warning">{t("showcase.service")}</p>
        </div>
      </section>
    </ProductShell>
  );
}
