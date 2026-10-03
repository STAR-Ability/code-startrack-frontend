"use client";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  FingerprintIcon,
  LayersIcon,
  RouteIcon,
  OrbitIcon,
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

export const productLinks = [
  ["/product", "features"],
  ["/product/profile", "profile"],
  ["/product/recommendations", "recommendations"],
  ["/about", "about"],
] as const;
const icons = [LayersIcon, FingerprintIcon, RouteIcon, OrbitIcon];
export function ProductIndex() {
  const { t } = useLocale();
  return (
    <div className="product-index mt-12">
      {productLinks.map(([href, key], index) => {
        const Icon = icons[index];
        return (
          <Card
            key={key}
            size="lg"
            interaction="lift"
            className={`product-index-${key}`}
          >
            <CardHeader>
              <div className="mb-5 flex items-center justify-between">
                <Icon
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
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
            <CardContent className="mt-auto">
              <div className={`index-art index-art-${key}`} aria-hidden="true">
                {key === "features" ? (
                  <>
                    <span>01</span>
                    <span>02</span>
                    <span>03</span>
                  </>
                ) : key === "profile" ? (
                  <FingerprintIcon className="size-12 text-insight" />
                ) : key === "recommendations" ? (
                  <>
                    <span className="font-mono text-3xl text-info">N + 1</span>
                    <RouteIcon className="size-8" />
                  </>
                ) : (
                  <OrbitIcon className="size-16" />
                )}
              </div>
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
