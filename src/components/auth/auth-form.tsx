"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useId, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  ErrorNotice,
  QueryFeedback,
  useCountdown,
  useSlowRequest,
} from "@/components/workspace/feedback";
import { clearSession } from "@/components/training/query-provider";

export function Captcha({
  onChange,
  refresh = 0,
  required = false,
}: {
  onChange: (
    value: { challengeId: string; answer: string; expiresAt: number } | null,
  ) => void;
  refresh?: number;
  required?: boolean;
}) {
  const id = useId();
  const { t } = useLocale();
  const [answer, setAnswer] = useState("");
  const query = useQuery({
    queryKey: ["captcha", id, refresh],
    queryFn: async () => ({ ...(await api.captcha()), receivedAt: Date.now() }),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    if (query.isFetching || query.error || !query.data) {
      onChange(null);
      return;
    }
    onChange({
      challengeId: query.data.challengeId,
      answer: "",
      expiresAt: query.data.receivedAt + query.data.expiresInSeconds * 1000,
    });
  }, [query.data, query.isFetching, query.error, onChange]);
  function reset() {
    setAnswer("");
    onChange(null);
    void query.refetch();
  }
  const retryIn = useCountdown(
    query.error instanceof ApiError ? query.error.retryAt : 0,
  );
  const refreshDisabled =
    query.isFetching ||
    retryIn > 0 ||
    (query.error instanceof ApiError && query.error.status === 403);
  return (
    <FieldGroup className="gap-3">
      <Field className="@container/captcha">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FieldLabel htmlFor={id}>{t("v.captcha")}</FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={refreshDisabled}
            aria-busy={query.isFetching}
            onClick={reset}
            aria-label={t("v.refreshCaptcha")}
          >
            {query.isFetching ? (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            ) : (
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {t("ui.refreshCaptchaShort")}
          </Button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-3 @[16rem]/captcha:grid-cols-[minmax(0,1fr)_116px]">
          <Input
            id={id}
            required={required}
            autoComplete="off"
            placeholder={t("ui.captchaPlaceholder")}
            className="h-12"
            disabled={query.isFetching || !query.data || !!query.error}
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              if (query.data)
                onChange({
                  challengeId: query.data.challengeId,
                  answer: event.target.value,
                  expiresAt:
                    query.data.receivedAt + query.data.expiresInSeconds * 1000,
                });
            }}
          />
          <div
            className="captcha-frame relative flex h-12 w-[116px] items-center justify-center overflow-hidden rounded-lg border bg-muted @[16rem]/captcha:w-full"
            aria-busy={query.isFetching}
          >
            {query.isFetching ? (
              <>
                <Skeleton className="absolute inset-0 size-full rounded-none" />
                <Spinner className="relative" aria-label={t("v.loading")} />
              </>
            ) : query.data && !query.error ? (
              <Image
                src={query.data.imageData}
                alt={t("v.captcha")}
                width={116}
                height={44}
                unoptimized
                className="h-11 w-full object-contain"
              />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={refreshDisabled}
                onClick={reset}
              >
                <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
                {t("v.retry")}
              </Button>
            )}
          </div>
        </div>
      </Field>
      <QueryFeedback query={query} compact showLoading={false} />
    </FieldGroup>
  );
}
export type Verification = {
  verificationId: string;
  email: string;
  expiresAt: number;
};
export function EmailVerification({
  email,
  purpose,
  onVerified,
}: {
  email: string;
  purpose:
    "REGISTER" | "PASSWORD_RESET" | "EMAIL_CHANGE_OLD" | "EMAIL_CHANGE_NEW";
  onVerified: (value: Verification) => void;
}) {
  const { t } = useLocale();
  const client = useQueryClient();
  const [captcha, setCaptcha] = useState<{
    challengeId: string;
    answer: string;
    expiresAt: number;
  } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const normalized = email.trim().toLowerCase();
  const cooldownKey = ["email-cooldown", normalized];
  const cooldown = useQuery<number>({
    queryKey: cooldownKey,
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
  });
  const send = useMutation({
    mutationFn: async (operation: {
      email: string;
      captcha: NonNullable<typeof captcha>;
    }) => {
      if (
        !z.email().safeParse(operation.email).success ||
        !operation.captcha.answer
      )
        throw new ApiError("INVALID_ARGUMENT");
      if (operation.captcha.expiresAt <= Date.now())
        throw new ApiError("CAPTCHA_EXPIRED");
      const result = await api.emailCode({
        email: operation.email,
        purpose,
        captchaChallengeId: operation.captcha.challengeId,
        captchaAnswer: operation.captcha.answer,
      });
      return { ...result, receivedAt: Date.now() };
    },
    onSuccess: (result, operation) => {
      onVerified({
        verificationId: result.verificationId,
        email: operation.email,
        expiresAt: result.receivedAt + result.expiresInSeconds * 1000,
      });
      client.setQueryData(
        ["email-cooldown", operation.email],
        result.receivedAt + result.cooldownSeconds * 1000,
      );
    },
    onError: (error, operation) => {
      if (error instanceof ApiError && error.retryAfter)
        client.setQueryData(["email-cooldown", operation.email], error.retryAt);
    },
    onSettled: () => {
      setCaptcha(null);
      setRefresh((value) => value + 1);
    },
  });
  const remaining = useCountdown(cooldown.data ?? 0);
  useSlowRequest(send.isPending);
  return (
    <FieldGroup>
      <Captcha key={refresh} refresh={refresh} onChange={setCaptcha} />
      <Button
        type="button"
        variant="outline"
        wrap
        disabled={
          send.isPending ||
          !!remaining ||
          !captcha?.answer ||
          !z.email().safeParse(normalized).success
        }
        onClick={() => {
          if (captcha) send.mutate({ email: normalized, captcha });
        }}
      >
        {send.isPending ? (
          <Spinner data-icon="inline-start" aria-hidden="true" />
        ) : (
          <MailIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {remaining
          ? t("v.retryAfter", { seconds: String(remaining) })
          : t("v.sendCode")}
      </Button>
      {send.isSuccess && <p role="status">{t("v.codeSent")}</p>}
      <ErrorNotice error={send.error} />
    </FieldGroup>
  );
}
const password = z.string().min(12).max(128);
const code = z.string().regex(/^\d{6}$/);
type AuthFields = {
  account: string;
  username: string;
  email: string;
  password: string;
  emailCode: string;
};
export function AuthForm({ kind }: { kind: "login" | "register" | "reset" }) {
  const { t } = useLocale();
  const client = useQueryClient();
  const router = useRouter();
  const form = useForm<AuthFields>({
    defaultValues: {
      account: "",
      username: "",
      email: "",
      password: "",
      emailCode: "",
    },
  });
  const [captcha, setCaptcha] = useState<{
    challengeId: string;
    answer: string;
    expiresAt: number;
  } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const email = useWatch({ control: form.control, name: "email" });
  const mutation = useMutation({
    mutationFn: async (values: AuthFields) => {
      if (kind === "login") {
        if (!captcha?.answer || !values.account.trim() || !values.password)
          throw new ApiError("INVALID_ARGUMENT");
        if (captcha.expiresAt <= Date.now())
          throw new ApiError("CAPTCHA_EXPIRED");
        return api.login({
          account: values.account.trim(),
          password: values.password,
          captchaChallengeId: captcha.challengeId,
          captchaAnswer: captcha.answer,
        });
      }
      const normalized = values.email.trim().toLowerCase();
      if (
        !z.email().safeParse(normalized).success ||
        !password.safeParse(values.password).success ||
        !code.safeParse(values.emailCode).success
      )
        throw new ApiError("INVALID_ARGUMENT");
      if (
        !verification ||
        verification.email !== normalized ||
        verification.expiresAt <= Date.now()
      )
        throw new ApiError("EMAIL_CODE_EXPIRED");
      if (kind === "reset") {
        await api.resetPassword({
          email: normalized,
          verificationId: verification.verificationId,
          emailCode: values.emailCode,
          newPassword: values.password,
        });
        return null;
      }
      if (
        !z
          .string()
          .regex(/^[A-Za-z0-9_]{3,32}$/)
          .safeParse(values.username).success
      )
        throw new ApiError("INVALID_ARGUMENT");
      return api.register({
        username: values.username,
        email: normalized,
        password: values.password,
        verificationId: verification.verificationId,
        emailCode: values.emailCode,
      });
    },
    onSuccess: (result) => {
      clearSession(client);
      if (result) {
        client.setQueryData(keys.session, result.user);
        void client.invalidateQueries({ queryKey: keys.session });
        router.replace("/dashboard");
      } else setResetDone(true);
    },
    onSettled: () => {
      if (kind === "login") {
        setCaptcha(null);
        setRefresh((value) => value + 1);
      }
    },
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  const title = t(
    kind === "login"
      ? "auth.login"
      : kind === "register"
        ? "v.register"
        : "v.resetPassword",
  );
  useSlowRequest(mutation.isPending);
  return (
    <Card size="lg" className="auth-card w-full">
      <CardHeader className="gap-3">
        <div className="auth-welcome-icon">
          <LockKeyholeIcon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            {t(`ui.${kind}Title`)}
          </h1>
        </CardTitle>
        <CardDescription>{t(`ui.${kind}Description`)}</CardDescription>
      </CardHeader>
      <CardContent>
        {resetDone ? (
          <div
            role="status"
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <CheckCircle2Icon className="size-9 text-link" aria-hidden="true" />
            <p>{t("v.resetDone")}</p>
            <Link href="/login" className={buttonVariants({ size: "xl" })}>
              {t("auth.login")}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            aria-busy={mutation.isPending}
          >
            <FieldGroup className="gap-5">
              {kind === "login" ? (
                <FormInput
                  label={t("v.account")}
                  icon={UserRoundIcon}
                  comfortable
                  placeholder={t("ui.accountPlaceholder")}
                  autoComplete="username"
                  required
                  {...form.register("account")}
                />
              ) : (
                <>
                  {kind === "register" && (
                    <FormInput
                      label={t("v.username")}
                      icon={UserRoundIcon}
                      comfortable
                      placeholder={t("ui.usernamePlaceholder")}
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={32}
                      pattern="[A-Za-z0-9_]+"
                      {...form.register("username")}
                    />
                  )}
                  <FormInput
                    label={t("v.email")}
                    icon={MailIcon}
                    comfortable
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    {...form.register("email")}
                  />
                </>
              )}
              <FormInput
                label={t(kind === "reset" ? "v.newPassword" : "v.password")}
                icon={KeyRoundIcon}
                comfortable
                type="password"
                placeholder={t("ui.passwordPlaceholder")}
                hint={kind !== "login" ? t("ui.passwordHint") : undefined}
                labelAction={
                  kind === "login" ? (
                    <Link
                      href="/reset-password"
                      className="auth-text-link text-xs"
                    >
                      {t("ui.forgotPassword")}
                    </Link>
                  ) : undefined
                }
                autoComplete={
                  kind === "login" ? "current-password" : "new-password"
                }
                required
                minLength={kind === "login" ? undefined : 12}
                maxLength={128}
                {...form.register("password")}
              />
              {kind === "login" ? (
                <Captcha
                  key={refresh}
                  refresh={refresh}
                  onChange={setCaptcha}
                  required
                />
              ) : (
                <>
                  <EmailVerification
                    email={email}
                    purpose={
                      kind === "register" ? "REGISTER" : "PASSWORD_RESET"
                    }
                    onVerified={setVerification}
                  />
                  <FormInput
                    label={t("v.emailCode")}
                    comfortable
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    {...form.register("emailCode")}
                  />
                </>
              )}
              <ErrorNotice
                error={mutation.error}
                pending={mutation.isPending}
              />
              <Button
                size="xl"
                className="auth-submit w-full"
                wrap
                type="submit"
                aria-busy={mutation.isPending}
                disabled={
                  mutation.isPending ||
                  !!remaining ||
                  (kind === "login"
                    ? !captcha
                    : !verification ||
                      verification.email !== email.trim().toLowerCase())
                }
              >
                {mutation.isPending && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {mutation.isPending ? t("ui.submitting") : title}
                {!mutation.isPending && (
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                )}
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {t("ui.authNote")}
              </p>
            </FieldGroup>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3 p-6">
        <p className="text-sm text-muted-foreground">
          {t(kind === "login" ? "ui.noAccount" : "ui.haveAccount")}{" "}
          <Link
            href={kind === "login" ? "/register" : "/login"}
            className="auth-text-link font-medium"
          >
            {t(kind === "login" ? "v.register" : "auth.login")}
          </Link>
        </p>
        <Separator />
        <Link
          href="/demo"
          className={buttonVariants({ variant: "ghost", wrap: true })}
        >
          {t("ui.tryDemo")}
          <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
