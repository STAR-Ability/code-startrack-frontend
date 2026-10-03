"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import { invalidateAiResult } from "@/lib/query/v012-invalidation";
import { ApiError } from "@/lib/api/errors";
import type { AiJobDto } from "@/lib/api/v012-schemas";
import { useWorkspaceSession } from "./account-provider";
const subscribe = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
export function isAiJobPending(
  jobId: string | null,
  job: AiJobDto | undefined,
  error: unknown,
) {
  if (!jobId || (error instanceof ApiError && error.status === 404))
    return false;
  return !job || ["QUEUED", "RUNNING"].includes(job.status);
}
export function aiPollDelay(
  job: AiJobDto | undefined,
  failures: number,
  error: unknown = null,
) {
  if (job && ["SUCCESS", "FAILED"].includes(job.status)) return false;
  if (error instanceof ApiError && [401, 403, 404].includes(error.status))
    return false;
  return Math.min(30_000, 3_000 * 2 ** Math.min(failures, 5));
}
export function useAiJob(jobId: string | null, teamId?: string) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const visible = useSyncExternalStore(
    subscribe,
    () => document.visibilityState !== "hidden",
    () => true,
  );
  const completed = useRef<string | null>(null);
  const failures = useRef(0);
  const query = useQuery({
    queryKey: keys.aiJob(user?.publicId ?? "none", jobId ?? "none"),
    queryFn: async ({ signal }) => {
      try {
        const job = await v012.aiJob(jobId!, signal);
        failures.current = 0;
        return job;
      } catch (error) {
        if (!signal.aborted) failures.current++;
        throw error;
      }
    },
    enabled: !!user && !!jobId && visible,
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      visible
        ? aiPollDelay(query.state.data, failures.current, query.state.error)
        : false,
  });
  const denied =
    query.error instanceof ApiError &&
    [401, 403, 404].includes(query.error.status);
  const job = denied ? undefined : query.data;
  useEffect(() => {
    if (
      !user ||
      job?.status !== "SUCCESS" ||
      completed.current === `${user.publicId}:${job.jobId}` ||
      !isCurrentUser(client, user.publicId)
    )
      return;
    completed.current = `${user.publicId}:${job.jobId}`;
    void invalidateAiResult(client, user.publicId, job.type, teamId);
  }, [job, user, client, teamId]);
  return { ...query, data: job };
}
