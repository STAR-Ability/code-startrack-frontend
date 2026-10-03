"use client";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { accountTone } from "@/lib/ui/status";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { FormInput } from "@/components/ui/form-input";
import {
  EmptyState,
  ErrorNotice,
  QueryFeedback,
  useCountdown,
} from "./feedback";

export function AccountsPage() {
  const { user, accounts, selectAccount } = useAccounts();
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
  return (
    <>
      <Card size="sm" interaction="none">
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={history}
          onChange={(event) => setHistory(event.target.checked)}
        />
        {t("v.historyAccounts")}
      </label>
      {history && <QueryFeedback query={historyQuery} />}
      {!list.length && <EmptyState title={t("v.noAccount")} />}
      <div className="grid gap-4 lg:grid-cols-2">
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
  const router = useRouter();
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
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="break-all">{account.username}</h2>
        </CardTitle>
        <CardDescription>
          {t("v.accountId")}: {account.accountId}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant={accountTone[account.bindStatus]}>
          {account.bindStatus}
        </Badge>
        <p>
          {t("v.rating")}: {account.rating ?? t("v.unrated")}
        </p>
        <p>
          {t("v.lastSync")}:{" "}
          {account.lastSyncedAt
            ? new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(account.lastSyncedAt))
            : t("v.never")}
        </p>
        {account.lastSyncStatus && (
          <p>{t(`v.job.${account.lastSyncStatus}`)}</p>
        )}
        <ErrorNotice error={sync.error ?? unbind.error} />
        <AccountDetails accountId={account.accountId} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            selectAccount(account.accountId);
            router.push("/data");
          }}
        >
          {t("v.viewAccount")}
        </Button>
        {account.bindStatus !== "UNBOUND" && (
          <>
            <Button
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={unbind.isPending}
              onClick={() => setConfirm(false)}
            >
              {t("v.cancel")}
            </Button>
            <Button
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
