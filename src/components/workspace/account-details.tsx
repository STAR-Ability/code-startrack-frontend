"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { keys } from "@/lib/query/keys";
import { isMissingResource } from "@/lib/api/errors";
import { useAccounts } from "./account-provider";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { DataRegion } from "./feedback";

export function AccountDetails({ accountId }: { accountId: string }) {
  const { user } = useAccounts();
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
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
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {t("data.accountDetails")}
      </Button>
      {open && (
        <DataRegion query={query} name={t("data.accountDetails")}>
          <dl className="grid grid-cols-2 gap-3">
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
                <dt className="text-xs text-muted-foreground">{t(label)}</dt>
                <dd className="wrap-anywhere">{value}</dd>
              </div>
            ))}
          </dl>
        </DataRegion>
      )}
    </div>
  );
}
