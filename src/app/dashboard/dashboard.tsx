"use client";

import { useState } from "react";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { ProfileSection } from "./profile-section";

export function Dashboard({ userId }: { userId: number }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchInterval: false,
            networkMode: "always",
          },
        },
      }),
  );
  const { t } = useLocale();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="flex flex-col items-start gap-5">
        <Link
          href="/"
          prefetch={false}
          className={buttonVariants({ variant: "link", size: "sm" })}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          {t("navigation.home")}
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{t("demo.label")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("demo.learner")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("demo.context")}</p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{t("source.label")} · Codeforces</p>
          <p>{t("accounts.unavailable")}</p>
        </div>
      </div>
      <QueryClientProvider client={client}>
        <ProfileSection userId={userId} />
      </QueryClientProvider>
    </main>
  );
}
