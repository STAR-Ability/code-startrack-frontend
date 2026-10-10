"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { CopyKey } from "@/lib/i18n/messages";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import {
  invalidateCollaboration,
  type CollaborationOperation,
} from "@/lib/query/v012-invalidation";
import { useWorkspaceSession } from "./account-provider";
import { QueryFeedback, useCountdown } from "./feedback";
import { useAiJob } from "./use-ai-job";
export function Panel({
  title,
  description,
  children,
  variant = "default",
  size = "sm",
  tone,
  className,
}: {
  title: CopyKey;
  description?: string;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Card>["variant"];
  size?: React.ComponentProps<typeof Card>["size"];
  tone?: React.ComponentProps<typeof Card>["tone"];
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Card
      size={size}
      variant={variant}
      tone={tone}
      interaction="none"
      className={`min-w-0 wrap-anywhere ${className ?? ""}`}
    >
      <CardHeader className="panel-heading">
        <CardTitle>
          <h2>{t(title)}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        {children}
      </CardContent>
    </Card>
  );
}
export function Status({ value }: { value: string }) {
  const { t } = useLocale();
  return (
    <Badge wrap variant={value === "PENDING" ? "warning" : "secondary"}>
      {t(`v12.status.${value}` as CopyKey)}
    </Badge>
  );
}
export function useTeamQuery<T>(
  teamId: string,
  resource: string,
  params: object,
  read: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const { data: user } = useWorkspaceSession();
  const router = useRouter();
  const query = useQuery({
    queryKey: keys.team(user?.publicId ?? "none", teamId, resource, params),
    queryFn: ({ signal }) => read(signal),
    enabled: !!user && !!teamId && enabled,
  });
  const denied =
    query.error instanceof ApiError &&
    [401, 403, 404].includes(query.error.status);
  useEffect(() => {
    if (
      query.error instanceof ApiError &&
      query.error.code === "TEAM_FORBIDDEN"
    )
      router.replace("/teams");
  }, [query.error, router]);
  return { ...query, data: denied ? undefined : query.data };
}
export function useCollaborationMutation<V, R>(
  operation: CollaborationOperation,
  run: (variables: V) => Promise<R>,
  teamId?: string,
  onSuccess?: (result: R) => void,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ["private", user?.publicId, operation, teamId],
    meta: { publicId: user?.publicId, v012: true },
    mutationFn: async (variables: V) => {
      if (!user || !isCurrentUser(client, user.publicId))
        throw new ApiError("UNAUTHORIZED", 401);
      return run(variables);
    },
    onSuccess: async (result) => {
      if (!user || !isCurrentUser(client, user.publicId)) return;
      await invalidateCollaboration(client, user.publicId, operation, teamId);
      if (!isCurrentUser(client, user.publicId)) return;
      onSuccess?.(result);
    },
    onError: async (error) => {
      if (
        !user ||
        !isCurrentUser(client, user.publicId) ||
        !(error instanceof ApiError)
      )
        return;
      if (error.code === "ROLE_REQUIRED")
        await client.invalidateQueries({ queryKey: keys.session });
      if (error.code === "TEAM_FORBIDDEN") router.replace("/teams");
      if (error.status === 403 && teamId)
        await client.invalidateQueries({
          queryKey: keys.team(user.publicId, teamId, "detail"),
        });
      if (error.status === 409 || error.status === 404)
        await invalidateCollaboration(client, user.publicId, operation, teamId);
    },
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  return {
    ...mutation,
    remaining,
    blocked:
      mutation.isPending ||
      remaining > 0 ||
      (mutation.error instanceof ApiError && mutation.error.status === 403),
  };
}
export function AiJobNotice({
  jobId,
  teamId,
}: {
  jobId: string | null;
  teamId?: string;
}) {
  const query = useAiJob(jobId, teamId);
  const { t } = useLocale();
  if (!jobId) return null;
  return (
    <div className="flex flex-col gap-3">
      <QueryFeedback query={query} compact />
      {query.data && (
        <Alert>
          <AlertDescription>
            <p role="status">
              {t(
                query.data.status === "FAILED"
                  ? "v12.jobFailed"
                  : query.data.status === "SUCCESS"
                    ? "v12.jobSuccess"
                    : "v12.processing",
              )}{" "}
              · <Status value={query.data.status} />
            </p>
            {query.data.errors.map((error, index) => (
              <p key={index} className="break-words">
                {error.code} · {error.message}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
export function CoachGate({ children }: { children: React.ReactNode }) {
  const { data: user } = useWorkspaceSession();
  const { t } = useLocale();
  return user?.roles.includes("COACH") ? (
    children
  ) : (
    <Alert>
      <AlertDescription>
        {t("v12.ROLE_REQUIRED")}{" "}
        <Link href="/dashboard" className="underline">
          {t("v.dashboard")}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
