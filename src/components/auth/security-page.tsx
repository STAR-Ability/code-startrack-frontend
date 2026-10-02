"use client";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  ErrorNotice,
  useCountdown,
  useSlowRequest,
} from "@/components/workspace/feedback";
import { EmailVerification, FormInput, type Verification } from "./auth-form";

export function SecurityPage() {
  const { user } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const router = useRouter();
  const passwordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const emailForm = useForm({
    defaultValues: {
      password: "",
      newEmail: "",
      oldEmailCode: "",
      newEmailCode: "",
    },
  });
  const [oldVerification, setOldVerification] = useState<Verification | null>(
    null,
  );
  const [newVerification, setNewVerification] = useState<Verification | null>(
    null,
  );
  const newEmail = useWatch({ control: emailForm.control, name: "newEmail" });
  function reauth() {
    if (!isCurrentUser(client, user.publicId)) return;
    clearSession(client);
    router.replace("/login");
  }
  const logout = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: (all: boolean) => (all ? api.logoutAll() : api.logout()),
    onSuccess: reauth,
  });
  const changePassword = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: api.changePassword,
    onSuccess: reauth,
  });
  const changeEmail = useMutation({
    meta: { publicId: user.publicId },
    mutationFn: async (values: {
      password: string;
      newEmail: string;
      oldEmailCode: string;
      newEmailCode: string;
    }) => {
      const normalized = values.newEmail.trim().toLowerCase();
      if (
        !oldVerification ||
        !newVerification ||
        oldVerification.email !== user.email.trim().toLowerCase() ||
        newVerification.email !== normalized ||
        oldVerification.expiresAt <= Date.now() ||
        newVerification.expiresAt <= Date.now()
      )
        throw new ApiError("EMAIL_CODE_EXPIRED");
      return api.changeEmail({
        ...values,
        oldEmail: user.email,
        newEmail: normalized,
        oldVerificationId: oldVerification.verificationId,
        newVerificationId: newVerification.verificationId,
      });
    },
    onSuccess: reauth,
  });
  const remaining = useCountdown(
    Math.max(
      ...[logout.error, changePassword.error, changeEmail.error].map((error) =>
        error instanceof ApiError ? error.retryAt : 0,
      ),
    ),
  );
  useSlowRequest(
    logout.isPending || changePassword.isPending || changeEmail.isPending,
  );
  const pending =
    logout.isPending ||
    changePassword.isPending ||
    changeEmail.isPending ||
    !!remaining;
  return (
    <>
      <p className="text-sm text-muted-foreground">{t("v.reauthNote")}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => logout.mutate(false)}
        >
          {logout.isPending && (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          )}
          {t("v.logout")}
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => logout.mutate(true)}
        >
          {logout.isPending && (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          )}
          {t("v.logoutAll")}
        </Button>
      </div>
      <ErrorNotice error={logout.error} />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("v.changePassword")}</h2>
          </CardTitle>
          <CardDescription>{t("v.passwordHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((values) =>
              changePassword.mutate(values),
            )}
          >
            <FieldGroup>
              <FormInput
                label={t("v.currentPassword")}
                type="password"
                autoComplete="current-password"
                required
                {...passwordForm.register("currentPassword")}
              />
              <FormInput
                label={t("v.newPassword")}
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                {...passwordForm.register("newPassword")}
              />
              <Button type="submit" disabled={pending}>
                {changePassword.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("v.changePassword")}
              </Button>
              <ErrorNotice error={changePassword.error} />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("v.changeEmail")}</h2>
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={emailForm.handleSubmit((values) =>
              changeEmail.mutate(values),
            )}
          >
            <FieldGroup>
              <FormInput
                label={t("v.password")}
                type="password"
                autoComplete="current-password"
                required
                {...emailForm.register("password")}
              />
              <p>
                {t("v.oldEmail")}: {user.email}
              </p>
              <EmailVerification
                email={user.email}
                purpose="EMAIL_CHANGE_OLD"
                onVerified={setOldVerification}
              />
              <FormInput
                label={t("v.oldCode")}
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                {...emailForm.register("oldEmailCode")}
              />
              <FormInput
                label={t("v.newEmail")}
                type="email"
                autoComplete="email"
                required
                {...emailForm.register("newEmail")}
              />
              <EmailVerification
                email={newEmail}
                purpose="EMAIL_CHANGE_NEW"
                onVerified={setNewVerification}
              />
              <FormInput
                label={t("v.newCode")}
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                {...emailForm.register("newEmailCode")}
              />
              <Button
                type="submit"
                disabled={
                  pending ||
                  !oldVerification ||
                  !newVerification ||
                  newVerification.email !== newEmail.trim().toLowerCase()
                }
              >
                {changeEmail.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {t("v.changeEmail")}
              </Button>
              <ErrorNotice error={changeEmail.error} />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
