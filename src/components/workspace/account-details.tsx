"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { keys } from "@/lib/query/keys";
import { isMissingResource } from "@/lib/api/errors";
import { useAccounts } from "./account-provider";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { DataRegion } from "./feedback";

export function AccountDetails({ accountId }: { accountId: string }) {
  const { user, selectAccount } = useAccounts();
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const query = useQuery({
    queryKey: keys.resource(user.publicId, accountId, "account-details"),
    queryFn: ({ signal }) => api.account(accountId, signal),
    enabled: open,
  });
  const account = isMissingResource(query.error) ? undefined : query.data;
  const date = (value: string | null | undefined) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: user.timezone,
        }).format(new Date(value))
      : t("v.unavailable");
  return (
    <div className="account-details @container/account-details flex min-w-0 flex-col gap-3">
      <Button
        wrap
        variant="ghost"
        aria-expanded={open}
        aria-controls={open ? detailsId : undefined}
        className="self-start"
        onClick={() => setOpen((value) => !value)}
      >
        {t("data.accountDetails")}
        <ChevronDownIcon
          data-icon="inline-end"
          aria-hidden="true"
          className={open ? "rotate-180" : undefined}
        />
      </Button>
      {open && (
        <div id={detailsId}>
          <DataRegion query={query} name={t("data.accountDetails")}>
            <Link
              href="/accounts/analysis"
              className="flex w-fit min-w-0 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
              onClick={() => selectAccount(accountId)}
            >
              {t("v.analysis")}
              <ArrowRightIcon className="size-4 shrink-0" aria-hidden="true" />
            </Link>
            <dl className="account-details-list">
              {(
                [
                  ["v.maxRating", account?.maxRating ?? t("v.unrated")],
                  ["v.rank", account?.rank ?? t("v.unavailable")],
                  [
                    "data.organization",
                    account?.organization ?? t("v.unavailable"),
                  ],
                  ["data.country", account?.country ?? t("v.unavailable")],
                  ["v.boundAt", date(account?.boundAt)],
                  ["data.registeredAt", date(account?.registeredAt)],
                  ["data.lastOnlineAt", date(account?.lastOnlineAt)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                  <dd className="wrap-anywhere">{value}</dd>
                </div>
              ))}
            </dl>
          </DataRegion>
        </div>
      )}
    </div>
  );
}
