"use client";
import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function AccountSwitcher() {
  const context = useOptionalAccounts();
  const session = useWorkspaceSession();
  const { t } = useLocale();
  const id = useId();
  if (!context)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-4 sm:px-8">
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
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-background px-5 py-4 sm:px-8">
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
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>{user.displayName ?? user.username}</span>
        <Link href="/accounts" className="underline underline-offset-4">
          {t("v.accounts")}
        </Link>
      </div>
    </div>
  );
}
export function WorkspacePage({
  title,
  children,
  requireAccount = true,
  showSync = false,
  publicContent = false,
}: {
  title: CopyKey;
  children: React.ReactNode;
  requireAccount?: boolean;
  showSync?: boolean;
  publicContent?: boolean;
}) {
  const context = useOptionalAccounts();
  const account = context?.account;
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12"
    >
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-widest text-muted-foreground">
          codeStartrack · V0.11
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{t(title)}</h1>
          {context && (
            <RefreshButton
              key={`${context.user.publicId}:${context.selectedAccountId}:${pathname}`}
              publicId={context.user.publicId}
              accountId={context.selectedAccountId}
            />
          )}
        </div>
        {account && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{account.username}</Badge>
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
      </header>
      {publicContent ? (
        children
      ) : (
        <PersonalDataGate requireAccount={requireAccount}>
          {children}
          {showSync && account && <SyncPanel account={account} />}
        </PersonalDataGate>
      )}
    </main>
  );
}
