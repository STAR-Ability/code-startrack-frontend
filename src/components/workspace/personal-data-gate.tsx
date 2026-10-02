"use client";
import Link from "next/link";
import { ArrowRightIcon, LogInIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useOptionalAccounts, useWorkspaceSession } from "./account-provider";
import { EmptyState, ErrorNotice, QueryFeedback } from "./feedback";

export function LoginPrompt() {
  const { t } = useLocale();
  return (
    <Empty className="personal-data-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LogInIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t("practice.loginPrompt")}</EmptyTitle>
        <EmptyDescription>{t("practice.loginDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/login" className={buttonVariants()}>
          {t("auth.login")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
        <Link
          href="/demo"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("ui.exploreDemo")}
        </Link>
      </EmptyContent>
    </Empty>
  );
}

/** Mount private hooks only after session and (when needed) account resolution. */
export function PersonalDataGate({
  children,
  requireAccount = true,
  guestContent,
}: {
  children: React.ReactNode;
  requireAccount?: boolean;
  guestContent?: React.ReactNode;
}) {
  const session = useWorkspaceSession();
  const context = useOptionalAccounts();
  const { t } = useLocale();
  if (!session.data) {
    if (session.isFetching && session.data === undefined)
      return <QueryFeedback query={session} />;
    return (
      <>
        {guestContent ?? <LoginPrompt />}
        <ErrorNotice
          error={session.error}
          retry={() => void session.refetch()}
          pending={session.isFetching}
          compact
        />
      </>
    );
  }
  if (!context)
    return (
      <EmptyState
        title={t("v.studentRequired")}
        href="/demo"
        action={t("entry.openDemo")}
      />
    );
  if (requireAccount && !context.account) {
    if (context.query.isFetching || context.query.error)
      return (
        <>
          <QueryFeedback query={context.query} />
          <Link
            href="/accounts"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("v.accounts")}
          </Link>
        </>
      );
    return (
      <EmptyState
        title={t("v.noAccount")}
        description={t("v.bindGuide")}
        href="/accounts"
        action={t("v.bind")}
      />
    );
  }
  return (
    <div
      key={`${context.user.publicId}:${requireAccount ? (context.selectedAccountId ?? "none") : "user"}`}
      className="flex min-w-0 flex-col gap-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
    >
      {(context.query.error ||
        (!requireAccount && context.query.isFetching)) && (
        <QueryFeedback query={context.query} showLoading={false} />
      )}
      {children}
    </div>
  );
}
