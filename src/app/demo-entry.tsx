"use client";

import Link from "next/link";
import { ArrowRightIcon, EyeIcon, InfoIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoEntry() {
  const { t } = useLocale();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-9 px-5 py-12 sm:px-8 sm:py-20"
    >
      <div className="flex flex-col items-start gap-5">
        <Badge variant="secondary">
          <EyeIcon data-icon="inline-start" aria-hidden="true" />
          {t("demo.label")}
        </Badge>
        <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          {t("entry.title")}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          {t("entry.description")}
        </p>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/dashboard"
          prefetch={false}
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
        >
          {t("entry.openDemo")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
        <p className="text-sm text-muted-foreground">{t("demo.context")}</p>
      </div>
      <div className="flex flex-col gap-4">
        <Alert role="note">
          <InfoIcon aria-hidden="true" />
          <AlertDescription>{t("entry.readOnly")}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{t("source.label")} · Codeforces</p>
          <p>{t("accounts.unavailable")}</p>
        </div>
      </div>
    </main>
  );
}
