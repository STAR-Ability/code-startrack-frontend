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
import { buttonVariants } from "@/components/ui/button";

import { productLinks } from "@/lib/ui/product-navigation";
const icons = [LayersIcon, FingerprintIcon, RouteIcon, OrbitIcon];
export function ProductIndex() {
  const { t } = useLocale();
  return (
    <div className="public-capabilities mt-10">
      {productLinks.map(([href, key], index) => {
        const Icon = icons[index];
        return (
          <article key={key} className="public-capability-item">
            <span className="public-marker" aria-hidden="true">
              0{index + 1}
            </span>
            <div className="public-body">
              <h3 className="flex min-w-0 items-start gap-3 section-heading">
                <Icon
                  className="mt-1 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 wrap-anywhere">
                  {t(`showcase.${key}.label`)}
                </span>
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`showcase.${key}.description`)}
              </p>
              <Link
                href={href}
                prefetch={false}
                className={buttonVariants({
                  variant: "link",
                  wrap: true,
                  className: "self-start",
                })}
              >
                {t("showcase.explore")} · {t(`showcase.${key}.label`)}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
