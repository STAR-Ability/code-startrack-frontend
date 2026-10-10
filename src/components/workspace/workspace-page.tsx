"use client";
import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BookOpenIcon,
  ChartNoAxesCombinedIcon,
  DatabaseIcon,
  FingerprintIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  RouteIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { RefreshButton } from "./refresh-button";
import { useOptionalAccounts, useWorkspaceSession } from "./account-provider";
import { PersonalDataGate } from "./personal-data-gate";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/layout/locale-provider";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { SyncPanel } from "./sync-panel";
import type { CopyKey } from "@/lib/i18n/messages";

const pageIcons = {
  dashboard: LayoutDashboardIcon,
  problems: BookOpenIcon,
  training: ListChecksIcon,
  "learning-profile": FingerprintIcon,
  profile: FingerprintIcon,
  "learning-recommendations": RouteIcon,
  practice: RouteIcon,
  analysis: ChartNoAxesCombinedIcon,
  accounts: UsersIcon,
  teams: UsersIcon,
  coach: GraduationCapIcon,
  notifications: BellIcon,
  data: DatabaseIcon,
  security: ShieldCheckIcon,
  privacy: ShieldCheckIcon,
  submissions: ListChecksIcon,
};

export function AccountSwitcher({ inline = false }: { inline?: boolean }) {
  const context = useOptionalAccounts();
  const session = useWorkspaceSession();
  const { t } = useLocale();
  const pathname = usePathname();
  const id = useId();
  if (!context)
    return (
      <div className="workspace-context-bar flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {session.isFetching ? (
            <Spinner aria-hidden="true" />
          ) : (
            <Badge variant="secondary">{t("practice.visitor")}</Badge>
          )}
          <span>
            {t(
              session.isFetching
                ? "practice.checkingSession"
                : "practice.browseFreely",
            )}
          </span>
        </div>
        <Link href="/login" className={buttonVariants({ size: "sm" })}>
          {t("auth.login")}
        </Link>
      </div>
    );
  const { accounts, account, selectedAccountId, selectAccount, user, query } =
    context;
  const userOnly =
    !inline &&
    ![
      "/accounts",
      "/data",
      "/practice",
      "/accounts/analysis",
      "/accounts/profile",
    ].includes(pathname);
  return (
    <div
      className={
        inline
          ? "flex flex-wrap items-end gap-3"
          : "workspace-context-bar flex flex-wrap items-end justify-between gap-3 border-b bg-background/80 px-5 py-3 sm:px-6"
      }
    >
      {!userOnly && (
        <Field className="max-w-sm">
          <FieldLabel htmlFor={id}>{t("v.selectAccount")}</FieldLabel>
          <NativeSelect
            id={id}
            disabled={!accounts.length && account?.bindStatus !== "UNBOUND"}
            value={selectedAccountId ?? ""}
            onChange={(event) => selectAccount(event.target.value || null)}
          >
            {!selectedAccountId && (
              <NativeSelectOption value="">
                {t(
                  query.isFetching
                    ? "v.loading"
                    : query.error
                      ? "v.unavailable"
                      : "v.noAccount",
                )}
              </NativeSelectOption>
            )}
            {accounts.map((item) => (
              <NativeSelectOption key={item.accountId} value={item.accountId}>
                {item.username} · {item.accountId}
              </NativeSelectOption>
            ))}
            {account?.bindStatus === "UNBOUND" && (
              <NativeSelectOption value={account.accountId}>
                {account.username} · {t("v.readOnly")}
              </NativeSelectOption>
            )}
          </NativeSelect>
        </Field>
      )}
      {!inline && (
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 text-sm">
          <span className="min-w-0 wrap-anywhere">
            {user.displayName ?? user.username}
          </span>
          <Link href="/accounts" className="underline underline-offset-4">
            {t("v.accounts")}
          </Link>
        </div>
      )}
    </div>
  );
}
export function WorkspacePage({
  title,
  children,
  requireAccount = true,
  requireStudent = true,
  showSync = false,
  publicContent = false,
}: {
  title: CopyKey;
  children: React.ReactNode;
  requireAccount?: boolean;
  requireStudent?: boolean;
  showSync?: boolean;
  publicContent?: boolean;
}) {
  const context = useOptionalAccounts();
  const account = context?.account;
  const pathname = usePathname();
  const { t } = useLocale();
  const section = pathname.split("/")[1] as keyof typeof pageIcons;
  const PageIcon = pageIcons[section] ?? LayoutDashboardIcon;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="workspace-main mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8"
    >
      <header className="workspace-page-header flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="workspace-page-icon flex size-12 shrink-0 items-center justify-center rounded-2xl border border-info/15 bg-surface-reading text-info shadow-surface sm:size-14">
            <PageIcon className="size-5 sm:size-6" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="workspace-eyebrow text-xs tracking-widest text-muted-foreground">
              codeStartrack · {t("dashboard.workspace")}
            </p>
            <h1 className="workspace-title wrap-anywhere text-3xl font-semibold tracking-tight">
              {t(title)}
            </h1>
            {account && requireAccount && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant="outline" wrap>
                  {account.username}
                </Badge>
                {account.bindStatus !== "ACTIVE" && (
                  <Badge variant="secondary" wrap>
                    {t(
                      account.bindStatus === "UNBOUND"
                        ? "v.readOnly"
                        : "v.invalidAccount",
                    )}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {context && (
            <RefreshButton
              key={`${context.user.publicId}:${context.selectedAccountId}:${pathname}`}
              publicId={context.user.publicId}
              accountId={context.selectedAccountId}
            />
          )}
        </div>
      </header>
      {publicContent ? (
        children
      ) : (
        <PersonalDataGate
          requireAccount={requireAccount}
          requireStudent={requireStudent}
        >
          {children}
          {showSync && account && <SyncPanel account={account} />}
        </PersonalDataGate>
      )}
    </main>
  );
}
