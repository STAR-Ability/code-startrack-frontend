"use client";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, KeyRoundIcon, MailIcon } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { isCurrentUser } from "@/lib/query/session";
import { ApiError } from "@/lib/api/errors";
import { useAccounts } from "@/components/workspace/account-provider";
import { useLocale } from "@/components/layout/locale-provider";
import { clearSession } from "@/components/training/query-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ErrorNotice,
  useCountdown,
  useSlowRequest,
} from "@/components/workspace/feedback";
import { IdentityCard } from "./identity-card";

export function SecurityPage() {
  const { user } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const router = useRouter();
  const logout = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: (all: boolean) => (all ? api.logoutAll() : api.logout()),
    onSuccess: () => {
      if (!isCurrentUser(client, user.publicId)) return;
      clearSession(client);
      router.replace("/login");
    },
  });
  const remaining = useCountdown(
    logout.error instanceof ApiError ? logout.error.retryAt : 0,
  );
  useSlowRequest(logout.isPending);
  return (
    <>
      <IdentityCard />
      <Link href="/privacy" className="underline">
        {t("v12.privacy")}
      </Link>
      <Link href="/security/coach" className="underline">
        {t("v12.redeem")}
      </Link>
      <Card size="sm" interaction="none">
        <CardHeader>
          <CardTitle>
            <h2>{t("security.operations")}</h2>
          </CardTitle>
          <CardDescription>{t("v.reauthNote")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {(
              [
                [
                  "/security/password",
                  "v.changePassword",
                  "security.passwordDescription",
                  KeyRoundIcon,
                ],
                [
                  "/security/email",
                  "v.changeEmail",
                  "security.emailDescription",
                  MailIcon,
                ],
              ] as const
            ).map(([href, title, description, Icon]) => (
              <li key={href} className="security-action-row">
                <div className="flex min-w-0 items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-medium">{t(title)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t(description)}
                    </p>
                  </div>
                </div>
                <Link
                  href={href}
                  prefetch={false}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    wrap: true,
                  })}
                >
                  {t(title)}
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card size="sm" interaction="none">
        <CardHeader>
          <CardTitle>
            <h2>{t("security.sessions")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {[false, true].map((all) => (
              <Button
                key={String(all)}
                wrap
                variant="outline"
                disabled={logout.isPending || !!remaining}
                onClick={() => logout.mutate(all)}
              >
                {logout.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t(all ? "v.logoutAll" : "v.logout")}
              </Button>
            ))}
          </div>
          <ErrorNotice error={logout.error} />
        </CardContent>
      </Card>
    </>
  );
}
