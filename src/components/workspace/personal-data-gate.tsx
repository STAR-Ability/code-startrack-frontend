"use client";
import Link from "next/link";
import type { CopyKey } from "@/lib/i18n/messages";
import { usePathname } from "next/navigation";
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
import { AnalysisView } from "./analysis-view";
import { BatchView } from "./recommendation-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MetricPanel } from "./metric-panel";

// Safe page structure while identity/account reads are unavailable. No private hooks run here.
function PersonalDataPlaceholder({ loading = false }: { loading?: boolean }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const context = useOptionalAccounts();
  const analysis = ["/data", "/profile", "/analysis"].includes(pathname);
  const lists: CopyKey[] =
    pathname === "/data"
      ? ["v.problems"]
      : pathname === "/analysis"
        ? ["v.analysisHistory"]
        : pathname === "/practice"
          ? ["v.recommendationHistory"]
          : pathname === "/accounts"
            ? ["v.accounts"]
            : pathname === "/security/password"
              ? ["v.changePassword"]
              : pathname === "/security/email"
                ? ["v.changeEmail"]
                : pathname === "/security"
                  ? [
                      "data.identity",
                      "security.operations",
                      "security.sessions",
                    ]
                  : [];
  return (
    <div className="flex min-w-0 flex-col gap-4" data-personal-placeholder>
      {pathname === "/dashboard" && !context && (
        <MetricPanel
          title="portfolio.title"
          loading={loading}
          metrics={[
            ["portfolio.accounts", 0],
            ["v.submissions", 0],
            ["v.accepted", 0],
            ["portfolio.solved", 0],
          ]}
        />
      )}
      {pathname === "/dashboard" && (
        <Card size="sm" interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{t("v.nextAction")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>{t("v.unavailable")}</CardContent>
        </Card>
      )}
      {["/dashboard", "/practice"].includes(pathname) && (
        <BatchView batch={null} />
      )}
      {analysis && (
        <AnalysisView
          analysis={null}
          dimensions={["/profile", "/analysis"].includes(pathname)}
          statistics={["/data", "/analysis"].includes(pathname)}
          loading={loading}
          unavailable
          ability={pathname !== "/data"}
          metricTitle={
            pathname === "/profile"
              ? "metrics.ability"
              : pathname === "/analysis"
                ? "metrics.analysis"
                : "profile.overview"
          }
        />
      )}
      {lists.map((title) => (
        <Card key={title} size="sm" interaction="none">
          <CardHeader>
            <CardTitle>
              <h2>{t(title)}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState title={t("v.noRecords")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoginPrompt() {
  const { t } = useLocale();
  return (
    <Empty className="personal-data-empty px-0 sm:px-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LogInIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t("practice.loginPrompt")}</EmptyTitle>
        <EmptyDescription>{t("practice.loginDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/login" className={buttonVariants({ wrap: true })}>
          {t("auth.login")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
        <Link
          href="/demo"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            wrap: true,
          })}
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
      return (
        <>
          <QueryFeedback query={session} />
          {guestContent ?? <PersonalDataPlaceholder loading />}
        </>
      );
    return (
      <>
        {guestContent ?? <LoginPrompt />}
        {!guestContent && <PersonalDataPlaceholder />}
        <ErrorNotice
          dataError
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
          <PersonalDataPlaceholder loading={context.query.isFetching} />
          <Link
            href="/accounts"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("v.accounts")}
          </Link>
        </>
      );
    return (
      <>
        <EmptyState
          title={t("v.noAccount")}
          description={t("v.bindGuide")}
          href="/accounts"
          action={t("v.bind")}
        />
        <PersonalDataPlaceholder />
      </>
    );
  }
  return (
    <div
      key={`${context.user.publicId}:${requireAccount ? (context.selectedAccountId ?? "none") : "user"}`}
      className="flex min-w-0 flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
    >
      {(context.query.error ||
        (!requireAccount && context.query.isFetching)) && (
        <QueryFeedback query={context.query} showLoading={false} />
      )}
      {children}
    </div>
  );
}
