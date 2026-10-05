"use client";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRightIcon, CodeXmlIcon } from "lucide-react";
import { useJobLock } from "./use-job-lock";
import { AccountDetails } from "./account-details";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentBinding, isCurrentUser } from "@/lib/query/session";
import type { OjAccountDto } from "@/lib/api/schemas";
import { useAccounts } from "./account-provider";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { accountTone, jobTone } from "@/lib/ui/status";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormInput } from "@/components/ui/form-input";
import {
  EmptyState,
  ErrorNotice,
  QueryFeedback,
  useCountdown,
} from "./feedback";

export function AccountsPage() {
  const { user, accounts, query, selectAccount } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const [history, setHistory] = useState(false);
  const historyQuery = useQuery({
    queryKey: keys.accounts(user.publicId, true),
    queryFn: ({ signal }) => api.accounts(true, signal),
    enabled: history,
  });
  const form = useForm<{ username: string }>({
    defaultValues: { username: "" },
  });
  const bind = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: ({ username }: { username: string }) => api.bind(username),
    onSuccess: async (result) => {
      if (!isCurrentUser(client, user.publicId)) return;
      client.setQueryData<OjAccountDto[]>(
        keys.accounts(user.publicId),
        (previous) => [
          result.account,
          ...(previous ?? []).filter(
            (a) => a.accountId !== result.account.accountId,
          ),
        ],
      );
      client.setQueryData(
        keys.resource(user.publicId, result.account.accountId, "job", {
          jobId: result.initialSync.jobId,
        }),
        result.initialSync,
      );
      await client.invalidateQueries({
        queryKey: keys.accounts(user.publicId),
      });
      selectAccount(result.account.accountId);
      form.reset();
      void client.invalidateQueries({
        queryKey: keys.accounts(user.publicId, true),
      });
    },
  });
  const remaining = useCountdown(
    bind.error instanceof ApiError ? bind.error.retryAt : 0,
  );
  const list = history ? (historyQuery.data ?? []) : accounts;
  const listQuery = history ? historyQuery : query;
  return (
    <>
      <Card size="sm" interaction="none" variant="supporting" tone="info">
        <CardHeader>
          <CardTitle>
            <h2>{t("v.bind")}</h2>
          </CardTitle>
          <CardDescription>{t("v.bindingNote")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => bind.mutate(values))}>
            <FieldGroup className="sm:flex-row sm:items-end">
              <FormInput
                label={t("v.handle")}
                required
                {...form.register("username", {
                  required: true,
                  validate: (value) => !!value.trim(),
                })}
              />
              <Button
                wrap
                disabled={bind.isPending || !!remaining}
                type="submit"
              >
                {bind.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("v.bind")}
              </Button>
              <ErrorNotice error={bind.error} />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Field orientation="horizontal">
        <FieldLabel className="min-h-11 cursor-pointer gap-3 py-2">
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
            checked={history}
            onChange={(event) => setHistory(event.target.checked)}
          />
          {t("v.historyAccounts")}
        </FieldLabel>
      </Field>
      {history && <QueryFeedback query={historyQuery} />}
      {!list.length &&
        listQuery.data !== undefined &&
        !listQuery.isFetching &&
        !listQuery.error && <EmptyState title={t("v.noAccount")} />}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        {list.map((account) => (
          <AccountCard key={account.accountId} account={account} />
        ))}
      </div>
    </>
  );
}
function AccountCard({ account }: { account: OjAccountDto }) {
  const { user, selectAccount, selectedAccountId } = useAccounts();
  const { t, locale } = useLocale();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const locked = useJobLock(user.publicId, account.accountId);
  const sync = useMutation({
    meta: {
      publicId: user.publicId,
      accountId: account.accountId,
      operation: "job",
    },
    mutationFn: () => api.sync(account.accountId),
    onSuccess: () => {
      if (!isCurrentBinding(client, user.publicId, account.accountId)) return;
      void client.invalidateQueries({
        queryKey: keys.account(user.publicId, account.accountId),
      });
      void client.invalidateQueries({ queryKey: keys.accounts(user.publicId) });
    },
  });
  const unbind = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: () => api.unbind(account.accountId),
    onSuccess: async () => {
      if (!isCurrentUser(client, user.publicId)) return;
      await client.cancelQueries({
        queryKey: keys.account(user.publicId, account.accountId),
      });
      client.removeQueries({
        queryKey: keys.account(user.publicId, account.accountId),
      });
      client.setQueryData<OjAccountDto[]>(
        keys.accounts(user.publicId),
        (previous) =>
          previous?.filter((a) => a.accountId !== account.accountId),
      );
      if (selectedAccountId === account.accountId) selectAccount(null);
      setConfirm(false);
      void client.invalidateQueries({ queryKey: keys.accounts(user.publicId) });
      void client.invalidateQueries({
        queryKey: keys.accounts(user.publicId, true),
      });
    },
  });
  const remaining = useCountdown(
    sync.error instanceof ApiError ? sync.error.retryAt : 0,
  );
  return (
    <Card
      className="workspace-account-card"
      tone={selectedAccountId === account.accountId ? "info" : undefined}
      interaction="none"
      data-selected={selectedAccountId === account.accountId}
    >
      <CardHeader>
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant={accountTone[account.bindStatus]} wrap>
            {account.bindStatus}
          </Badge>
          {selectedAccountId === account.accountId && (
            <Badge variant="info" wrap>
              {t("accounts.currentSelection")}
            </Badge>
          )}
        </div>
        <CardTitle>
          <h2 className="wrap-anywhere">{account.username}</h2>
        </CardTitle>
        <CardDescription>
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <CodeXmlIcon className="size-3.5 shrink-0" aria-hidden="true" />
            Codeforces · {t("v.accountId")}: {account.accountId}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="account-summary">
          <div>
            <dt>{t("v.rating")}</dt>
            <dd>{account.rating ?? t("v.unrated")}</dd>
          </div>
          <div>
            <dt>{t("v.lastSync")}</dt>
            <dd>
              {account.lastSyncedAt
                ? new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: user.timezone,
                  }).format(new Date(account.lastSyncedAt))
                : t("v.never")}
            </dd>
          </div>
        </dl>
        {account.lastSyncStatus && (
          <Badge variant={jobTone[account.lastSyncStatus]} wrap>
            {t(`v.job.${account.lastSyncStatus}`)}
          </Badge>
        )}
        <ErrorNotice error={sync.error ?? unbind.error} />
        <AccountDetails accountId={account.accountId} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Link
          href="/data"
          className={buttonVariants({ variant: "outline", wrap: true })}
          onClick={() => selectAccount(account.accountId)}
        >
          {t("v.viewAccount")}
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
        {account.bindStatus !== "UNBOUND" && (
          <>
            <Button
              wrap
              disabled={
                locked ||
                sync.isPending ||
                unbind.isPending ||
                !!remaining ||
                account.lastSyncStatus === "QUEUED" ||
                account.lastSyncStatus === "RUNNING"
              }
              onClick={() => {
                selectAccount(account.accountId);
                sync.mutate();
              }}
            >
              {sync.isPending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("v.sync")}
            </Button>
            <Button
              wrap
              variant="ghost"
              disabled={unbind.isPending}
              onClick={() => setConfirm(true)}
            >
              {t("v.unbind")}
            </Button>
          </>
        )}
      </CardFooter>
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!unbind.isPending) setConfirm(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("v.unbindConfirm")}</DialogTitle>
            <DialogDescription>
              {account.username} · {t("v.unbindNote")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              wrap
              variant="outline"
              disabled={unbind.isPending}
              onClick={() => setConfirm(false)}
            >
              {t("v.cancel")}
            </Button>
            <Button
              wrap
              variant="destructive"
              disabled={unbind.isPending}
              onClick={() => unbind.mutate()}
            >
              {unbind.isPending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("v.confirm")}
            </Button>
          </div>
          <ErrorNotice error={unbind.error} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
