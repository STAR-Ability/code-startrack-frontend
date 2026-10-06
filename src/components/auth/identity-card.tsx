"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { keys } from "@/lib/query/keys";
import { isMissingResource } from "@/lib/api/errors";
import { useAccounts } from "@/components/workspace/account-provider";
import { DataRegion } from "@/components/workspace/feedback";
import { useLocale } from "@/components/layout/locale-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IdentityCard() {
  const { user } = useAccounts();
  const { t } = useLocale();
  const query = useQuery({
    queryKey: [...keys.user(user.publicId), "roles"],
    queryFn: ({ signal }) => api.roles(signal),
  });
  const roles = isMissingResource(query.error) ? [] : (query.data?.roles ?? []);
  return (
    <Card
      size="sm"
      interaction="none"
      className="identity-panel @container/identity"
    >
      <CardHeader>
        <CardTitle titleRole="section">
          <h2>{t("data.identity")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataRegion
          query={query}
          name={t("data.identity")}
          empty={!roles.length}
        >
          <dl className="identity-details grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-4 @[30rem]/identity:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {t("v.username")}
              </dt>
              <dd className="mt-1 wrap-anywhere">
                {user.displayName ?? user.username}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {t("data.roles")}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {roles.length
                  ? roles.map((role) => (
                      <Badge key={role.code} variant="outline" wrap>
                        {role.name} · {role.code}
                      </Badge>
                    ))
                  : t("v.unavailable")}
              </dd>
            </div>
            <div className="min-w-0 @[30rem]/identity:col-span-full">
              <dt className="text-xs text-muted-foreground">{t("v.email")}</dt>
              <dd className="mt-1 wrap-anywhere">{user.email}</dd>
            </div>
          </dl>
        </DataRegion>
      </CardContent>
    </Card>
  );
}
