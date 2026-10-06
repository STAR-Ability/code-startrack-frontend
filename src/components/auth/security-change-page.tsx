"use client";
import Link from "next/link";
import { ShieldCheckIcon, ArrowLeftIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  ErrorNotice,
  useCountdown,
  useSlowRequest,
} from "@/components/workspace/feedback";
import { EmailVerification, type Verification } from "./auth-form";
import { FormInput } from "@/components/ui/form-input";

export function SecurityChangePage({ kind }: { kind: "password" | "email" }) {
  const { user } = useAccounts();
  const { t } = useLocale();
  const client = useQueryClient();
  const router = useRouter();
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
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
      ...[changePassword.error, changeEmail.error].map((error) =>
        error instanceof ApiError ? error.retryAt : 0,
      ),
    ),
  );
  useSlowRequest(changePassword.isPending || changeEmail.isPending);
  const pending =
    changePassword.isPending || changeEmail.isPending || !!remaining;
  return (
    <div className="security-flow flex w-full max-w-2xl flex-col gap-4 self-center">
      <Link
        href="/security"
        prefetch={false}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          wrap: true,
          className: "self-start",
        })}
      >
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        {t("security.back")}
      </Link>
      <section
        className="security-task-context flex min-w-0 flex-col gap-3"
        aria-label={t("security.identity")}
      >
        <div className="security-task-identity grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-1">
          <ShieldCheckIcon
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            <p className="font-medium">{t("security.identity")}</p>
            <p className="wrap-anywhere text-muted-foreground">
              {t("security.identityNote", { email: user.email })}
            </p>
          </div>
          <Badge
            variant="outline"
            className="col-start-2 w-fit max-w-full"
            wrap
          >
            {t(
              user.emailVerified ? "security.verified" : "security.unverified",
            )}
          </Badge>
        </div>
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("security.riskTitle")}</AlertTitle>
          <AlertDescription>{t("security.riskNote")}</AlertDescription>
        </Alert>
      </section>
      {kind === "password" ? (
        <Card size="sm" interaction="none">
          <CardHeader>
            <CardTitle titleRole="section">
              <h2>{t("v.changePassword")}</h2>
            </CardTitle>
            <CardDescription>{t("security.passwordAdvice")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              aria-busy={changePassword.isPending}
              onSubmit={passwordForm.handleSubmit((values) =>
                changePassword.mutate({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                }),
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
                <FormInput
                  label={t("security.confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  required
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register("confirmPassword", {
                    validate: (value) =>
                      value === passwordForm.getValues("newPassword") ||
                      t("security.passwordMismatch"),
                  })}
                />
                <Button wrap type="submit" disabled={pending}>
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
      ) : (
        <Card size="sm" interaction="none">
          <CardHeader>
            <CardTitle titleRole="section">
              <h2>{t("v.changeEmail")}</h2>
            </CardTitle>
            <CardDescription>{t("security.emailAdvice")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              aria-busy={changeEmail.isPending}
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
                <dl className="security-email-context min-w-0 text-sm">
                  <div className="flex min-w-0 flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">
                      {t("v.oldEmail")}
                    </dt>
                    <dd className="wrap-anywhere">{user.email}</dd>
                  </div>
                </dl>
                <EmailVerification
                  email={user.email}
                  purpose="EMAIL_CHANGE_OLD"
                  onVerified={setOldVerification}
                />
                <FormInput
                  label={t("v.oldCode")}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                  {...emailForm.register("oldEmailCode")}
                />
                <FormInput
                  label={t("v.newEmail")}
                  error={emailForm.formState.errors.newEmail?.message}
                  type="email"
                  autoComplete="email"
                  required
                  {...emailForm.register("newEmail", {
                    validate: (value) =>
                      value.trim().toLowerCase() !==
                        user.email.trim().toLowerCase() ||
                      t("security.differentEmail"),
                  })}
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
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                  {...emailForm.register("newEmailCode")}
                />
                <Button
                  wrap
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
      )}
    </div>
  );
}
