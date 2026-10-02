"use client";
import Link from "next/link";
import { useEffect, useState, useId } from "react";
import {
  CircleAlertIcon,
  InboxIcon,
  RefreshCwIcon,
  WifiOffIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { ApiError, isMissingResource } from "@/lib/api/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageMeta } from "@/lib/api/schemas";
import { dataState, useMockMode, type DataQuery } from "@/lib/api/data-state";

export function useCountdown(until: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}
export const SLOW_REQUEST_MS = 8_000;

export function useSlowRequest(pending: boolean) {
  const id = useId();
  const { t } = useLocale();
  const title = t("ui.slowTitle");
  const description = t("ui.slowDescription");
  useEffect(() => {
    if (!pending) return;
    const noticeId = `slow-${id}`;
    const timer = setTimeout(() => {
      toast.add({
        id: noticeId,
        type: "loading",
        title,
        description,
        timeout: 0,
      });
    }, SLOW_REQUEST_MS);
    return () => {
      clearTimeout(timer);
      toast.close(noticeId);
    };
  }, [pending, id, title, description]);
}

function errorMessage(error: unknown) {
  const apiError = error instanceof ApiError ? error : null;
  if (apiError?.code === "PROFILE_NOT_READY") return "v.profileNotReady";
  if (
    ["OJ_ACCOUNT_OWNERSHIP_CONFLICT", "OJ_ACCOUNT_ALREADY_BOUND"].includes(
      apiError?.code ?? "",
    )
  )
    return "v.accountConflict";
  if (apiError?.status === 403) return "v.forbidden";
  if (isMissingResource(apiError)) return "v.notFound";
  if (apiError?.status === 429 || apiError?.code === "REQUEST_IN_PROGRESS")
    return "v.rateLimited";
  if (apiError?.code === "INVALID_CREDENTIALS") return "v.invalidCredentials";
  if (apiError?.code.startsWith("CAPTCHA_")) return "v.captchaInvalid";
  if (apiError?.code.startsWith("EMAIL_CODE_")) return "v.emailCodeInvalid";
  if (apiError?.status === 400) return "v.invalidForm";
  return "ui.connectionHint";
}

export function ErrorNotice({
  error,
  retry,
  pending = false,
  empty = false,
  compact = false,
  dataError = false,
}: {
  error: unknown;
  retry?: () => void;
  pending?: boolean;
  empty?: boolean;
  compact?: boolean;
  dataError?: boolean;
}) {
  const { t } = useLocale();
  const id = useId();
  const apiError = error instanceof ApiError ? error : null;
  const remaining = useCountdown(apiError?.retryAt ?? 0);
  const message = t(dataError ? "ui.connectionHint" : errorMessage(error));
  const title = t("ui.errorTitle");
  const active = !!error && !pending && apiError?.status !== 401;
  const signature = apiError?.code ?? (error ? "UNKNOWN" : "");
  useEffect(() => {
    if (!active) return;
    const noticeId = `error-${id}`;
    toast.add({
      id: noticeId,
      type: "error",
      title,
      description: message,
      timeout: 8_000,
    });
    return () => toast.close(noticeId);
  }, [active, signature, id, title, message]);
  if (!error || pending || apiError?.status === 401) return null;
  const recovery = (
    <>
      {!!remaining && (
        <p role="status">{t("v.retryAfter", { seconds: String(remaining) })}</p>
      )}
      {retry && (
        <Button
          type="button"
          variant="outline"
          disabled={remaining > 0 || apiError?.status === 403}
          onClick={retry}
        >
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          {t("v.retry")}
        </Button>
      )}
      {apiError && (
        <DetailsDisclosure title={t("ui.details")}>
          {dataError && <p>{t(errorMessage(error))}</p>}
          {compact && <p className="mt-2">{message}</p>}
          <p className="mt-2 break-all font-mono">
            {apiError.code}
            {apiError.requestId &&
              ` · ${t("v.requestId")}: ${apiError.requestId}`}
          </p>
        </DetailsDisclosure>
      )}
    </>
  );
  return compact ? (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <p role="alert">{message}</p>
      {recovery}
    </div>
  ) : empty ? (
    <Empty className="feedback-enter border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WifiOffIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t("ui.unavailableTitle")}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <div className="flex w-full flex-col items-center gap-3">{recovery}</div>
    </Empty>
  ) : (
    <Alert className="feedback-enter">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {recovery}
      </AlertDescription>
    </Alert>
  );
}

export function LoadingState({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <div
      role="status"
      aria-label={t("v.loading")}
      className={
        compact
          ? "flex items-center gap-2 py-2 text-sm text-muted-foreground"
          : "feedback-enter flex flex-col gap-5 rounded-xl border bg-card p-6"
      }
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-hidden="true" />
        {t("ui.preparing")}
      </div>
      {!compact && (
        <div className="flex flex-col gap-5" aria-hidden="true">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function QueryFeedback({
  query,
  compact = false,
  showLoading = true,
}: {
  query: {
    isPending: boolean;
    isFetching: boolean;
    error: unknown;
    data: unknown;
    refetch: () => unknown;
  };
  compact?: boolean;
  showLoading?: boolean;
}) {
  const { t } = useLocale();
  const mock = useMockMode();
  const data = isMissingResource(query.error) ? undefined : query.data;
  useSlowRequest(query.isFetching);
  if (!query.isFetching && !query.error) return null;
  return (
    <div
      data-state={dataState({ ...query, data }, mock)}
      className="flex min-w-0 flex-col gap-3"
    >
      {showLoading &&
        query.isFetching &&
        (data === undefined ? (
          <LoadingState compact={compact} />
        ) : (
          <div
            role="status"
            className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
          >
            <Spinner aria-hidden="true" />
            {t("ui.refreshing")}
          </div>
        ))}
      <ErrorNotice
        dataError
        error={query.error}
        retry={() => void query.refetch()}
        pending={query.isFetching}
        empty={data === undefined && !compact}
        compact={compact}
      />
      {Boolean(query.error) && data !== undefined && !compact && (
        <p className="text-xs text-muted-foreground">{t("data.previous")}</p>
      )}
    </div>
  );
}
/** Feedback and children share a stable boundary; data availability never unmounts a card. */
export function DataRegion({
  query,
  children,
  empty,
  name,
}: {
  query: DataQuery;
  children: React.ReactNode;
  empty?: boolean;
  name: string;
}) {
  const mock = useMockMode();
  return (
    <section
      aria-label={name}
      aria-busy={query.isFetching}
      data-state={dataState(query, mock, empty)}
      className="flex min-w-0 flex-col gap-4"
    >
      <QueryFeedback query={query} />
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <Empty className="personal-data-empty feedback-enter border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {href && (
        <Link href={href} className={buttonVariants({ variant: "outline" })}>
          {action}
        </Link>
      )}
    </Empty>
  );
}
export function Pagination({
  meta,
  page,
  setPage,
  pending,
}: {
  meta?: PageMeta;
  page: number;
  setPage: (page: number) => void;
  pending: boolean;
}) {
  const { t } = useLocale();
  return (
    <nav
      className="flex flex-wrap items-center gap-3"
      aria-label={t("v.pagination")}
      aria-busy={pending}
    >
      <Button
        variant="outline"
        disabled={page <= 1 || pending}
        onClick={() => setPage(page - 1)}
      >
        {t("v.previous")}
      </Button>
      <span className="flex items-center gap-2 text-sm" aria-live="polite">
        {pending && <Spinner aria-hidden="true" />}
        {t("v.page", { page: String(page), total: String(meta?.total ?? "—") })}
      </span>
      <Button
        variant="outline"
        disabled={!meta?.hasNext || pending}
        onClick={() => setPage(page + 1)}
      >
        {t("v.next")}
      </Button>
    </nav>
  );
}
