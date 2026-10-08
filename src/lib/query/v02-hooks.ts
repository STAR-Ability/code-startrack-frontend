"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useWorkspaceSession } from "@/components/workspace/account-provider";
import { useCountdown } from "@/components/workspace/feedback";
import { v02 } from "@/lib/api/v02";
import { ApiError } from "@/lib/api/errors";
import type {
  SubmissionView,
  SubmissionAnalysisView,
  LearningProfileJob,
  LearningProfile,
} from "@/lib/api/v02-schemas";
import type { AnalysisWindow } from "@/lib/api/schemas";
import { isCurrentUser } from "./session";
import { keys } from "./keys";
import {
  v02Keys,
  deniedV02,
  judgePollDelay,
  analysisPollDelay,
  profilePollDelay,
  V02LatestProfilePolling,
  acceptSubmission,
  V02OperationKeys,
  V02AnalysisTasks,
} from "./v02";

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
function useVisibility() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}
/** Frozen rank/reason fields stay intact; completion and staleness flags are live projections. */
export async function invalidateV02LearningSources(
  client: QueryClient,
  publicId: string,
) {
  if (!isCurrentUser(client, publicId)) return;
  client.setQueryData(v02Keys.resource(publicId, "learning-reconciliation"), {
    sourceChangedAt: Date.now(),
  });
  await Promise.all(
    [
      "training-records",
      "training-record",
      "learning-profile",
      "learning-history",
      "recommendations",
      "recommendation-history",
      "recommendation-batch",
    ].map((resource) =>
      client.invalidateQueries({
        queryKey: [...v02Keys.all(publicId), resource],
      }),
    ),
  );
}
export function useV02Query<T>(
  resource: string,
  params: object,
  read: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: v02Keys.resource(user?.publicId ?? "none", resource, params),
    queryFn: async ({ signal }) => {
      if (!user || !isCurrentUser(client, user.publicId))
        throw new ApiError("UNAUTHORIZED", 401);
      const result = await read(signal);
      signal.throwIfAborted();
      if (!isCurrentUser(client, user.publicId))
        throw new ApiError("STALE_SESSION");
      return result;
    },
    enabled: !!user && enabled,
  });
  return { ...query, data: deniedV02(query.error) ? undefined : query.data };
}
export function useV02Mutation<V, R>(
  operation: string,
  run: (variables: V, key: string) => Promise<R>,
  onSuccess?: (result: R, variables: V) => void,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const store = useRef(new V02OperationKeys());
  const identity = useRef(user?.publicId);
  useEffect(() => {
    if (identity.current !== user?.publicId) {
      store.current.clear();
      identity.current = user?.publicId;
    }
  }, [user?.publicId]);
  const mutation = useMutation({
    mutationKey: [
      ...v02Keys.all(user?.publicId ?? "none"),
      "mutation",
      operation,
    ],
    meta: { publicId: user?.publicId, v02: true },
    retry: false,
    onMutate: () => ({ publicId: user?.publicId }),
    mutationFn: async (variables: V) => {
      if (!user || !isCurrentUser(client, user.publicId))
        throw new ApiError("UNAUTHORIZED", 401);
      return run(
        variables,
        store.current.key(user.publicId, operation, variables),
      );
    },
    onSuccess: async (result, variables, context) => {
      if (!context?.publicId) return;
      store.current.finish(context.publicId, operation, variables);
      if (!isCurrentUser(client, context.publicId)) return;
      // A retry response changes task identity; cancel older reads before refreshing projections.
      await client.cancelQueries({ queryKey: v02Keys.all(context.publicId) });
      if (!isCurrentUser(client, context.publicId)) return;
      onSuccess?.(result, variables);
      await client.invalidateQueries({
        queryKey: v02Keys.all(context.publicId),
      });
    },
    onError: async (error, variables, context) => {
      if (!context?.publicId) return;
      store.current.finish(context.publicId, operation, variables, error);
      if (
        !isCurrentUser(client, context.publicId) ||
        !(error instanceof ApiError)
      )
        return;
      if (error.code === "ROLE_REQUIRED")
        await client.invalidateQueries({ queryKey: keys.session });
      if (error.status === 409 || error.status === 404)
        await client.invalidateQueries({
          queryKey: v02Keys.all(context.publicId),
        });
    },
  });
  const owned = mutation.context?.publicId === user?.publicId;
  const error = owned ? mutation.error : null;
  const remaining = useCountdown(error instanceof ApiError ? error.retryAt : 0);
  return {
    ...mutation,
    data: owned ? mutation.data : undefined,
    error,
    remaining,
    blocked:
      mutation.isPending ||
      remaining > 0 ||
      (error instanceof ApiError && error.status === 403),
  };
}

function useV02Polling<T>(
  resource: string,
  params: object,
  read: (signal: AbortSignal) => Promise<T>,
  delay: (
    data: T | undefined,
    failures: number,
    error: unknown,
  ) => number | false,
  enabled: boolean,
  reconcile?: (previous: T | undefined, incoming: T) => T,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const visible = useVisibility();
  const failures = useRef(0);
  const queryKey = v02Keys.resource(user?.publicId ?? "none", resource, params);
  const query = useQuery<T>({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!user || !isCurrentUser(client, user.publicId))
        throw new ApiError("UNAUTHORIZED", 401);
      try {
        const incoming = await read(signal);
        signal.throwIfAborted();
        if (!isCurrentUser(client, user.publicId))
          throw new ApiError("STALE_SESSION");
        failures.current = 0;
        return reconcile
          ? reconcile(client.getQueryData<T>(queryKey), incoming)
          : incoming;
      } catch (error) {
        if (!signal.aborted) failures.current++;
        throw error;
      }
    },
    enabled: !!user && enabled && visible,
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      visible
        ? delay(query.state.data, failures.current, query.state.error)
        : false,
    refetchIntervalInBackground: false,
  });
  return { ...query, data: deniedV02(query.error) ? undefined : query.data };
}
/** Automatic rebuilds expose no public job ID; bounded GETs reconcile only the latest projection. */
export function useV02LatestProfile(
  window: AnalysisWindow = "ALL",
  enabled = true,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const polling = useRef(new Map<string, V02LatestProfilePolling>());
  const scope = `${user?.publicId}:${window}`;
  function strategy() {
    const existing = polling.current.get(scope);
    if (existing) return existing;
    const created = new V02LatestProfilePolling();
    polling.current.clear();
    polling.current.set(scope, created);
    return created;
  }
  const query = useV02Polling<LearningProfile | null>(
    "learning-profile",
    { window },
    (signal) => v02.learningProfile(user!.publicId, window, signal),
    (profile, failures, error) => {
      const sourceUpdate = user
        ? client.getQueryData<{ sourceChangedAt: number }>(
            v02Keys.resource(user.publicId, "learning-reconciliation"),
          )
        : undefined;
      return strategy().delay(
        profile,
        failures,
        error,
        sourceUpdate?.sourceChangedAt,
      );
    },
    enabled,
  );
  const profile = query.data;
  useEffect(() => {
    if (
      !user ||
      !profile ||
      profile.stale ||
      !isCurrentUser(client, user.publicId)
    )
      return;
    const marker = `${user.publicId}:${profile.snapshotId}`;
    if (observed.current === marker) return;
    observed.current = marker;
    for (const resource of [
      "learning-history",
      "recommendations",
      "recommendation-history",
      "recommendation-batch",
    ])
      void client.invalidateQueries({
        queryKey: [...v02Keys.all(user.publicId), resource],
      });
  }, [profile, user, client]);
  function refetch(...options: Parameters<typeof query.refetch>) {
    strategy().reset();
    return query.refetch(...options);
  }
  return { ...query, refetch };
}
export function useV02Submission(submissionId: string | null) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const query = useV02Polling<SubmissionView>(
    "submission",
    { submissionId },
    (signal) => v02.submission(submissionId!, signal),
    judgePollDelay,
    !!submissionId,
    acceptSubmission,
  );
  const submission = query.data;
  useEffect(() => {
    if (
      !user ||
      !submission ||
      !isCurrentUser(client, user.publicId) ||
      !["COMPLETED", "FAILED", "CANCELLED"].includes(submission.judgeStatus)
    )
      return;
    const marker = `${user.publicId}:${submission.submissionId}:${submission.judgeTaskId}:${submission.judgeRevision}:${submission.judgeStatus}`;
    if (observed.current === marker) return;
    observed.current = marker;
    void invalidateV02LearningSources(client, user.publicId);
  }, [submission, user, client]);
  return query;
}
export function useV02Analysis(
  submissionId: string | null,
  submission?: SubmissionView,
) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const tasks = useRef(new Map<string, V02AnalysisTasks>());
  const scope = `${user?.publicId}:${submissionId}`;
  const analysisId = submission?.analysisId ?? null;
  function tracker() {
    const existing = tasks.current.get(scope);
    if (existing) return existing;
    const created = new V02AnalysisTasks();
    tasks.current.clear();
    tasks.current.set(scope, created);
    return created;
  }
  const query = useV02Polling<SubmissionAnalysisView>(
    "submission-analysis",
    { submissionId, analysisId },
    (signal) => {
      tracker().project(analysisId);
      return v02.submissionAnalysis(submissionId!, signal);
    },
    (data, failures, error) =>
      analysisPollDelay(data, failures, error, submission),
    !!submissionId,
    (previous, incoming) => tracker().accept(incoming, previous),
  );
  const analysis = query.data;
  useEffect(() => {
    if (
      !user ||
      !analysis ||
      !["SUCCEEDED", "PARTIAL"].includes(analysis.status) ||
      !isCurrentUser(client, user.publicId)
    )
      return;
    const marker = `${user.publicId}:${analysis.analysisId}:${analysis.revision}`;
    if (observed.current === marker) return;
    observed.current = marker;
    void invalidateV02LearningSources(client, user.publicId);
  }, [analysis, user, client]);
  function accept(view: SubmissionAnalysisView) {
    if (!user || !submissionId || !isCurrentUser(client, user.publicId)) return;
    void client.cancelQueries({
      queryKey: [...v02Keys.all(user.publicId), "submission-analysis"],
    });
    const current = tracker().accept(view);
    for (const taskId of new Set([analysisId, current.analysisId]))
      client.setQueryData(
        v02Keys.resource(user.publicId, "submission-analysis", {
          submissionId,
          analysisId: taskId,
        }),
        current,
      );
  }
  return { ...query, accept };
}
export function useV02ProfileJob(jobId: string | null) {
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const query = useV02Polling<LearningProfileJob>(
    "profile-job",
    { jobId },
    (signal) => v02.profileJob(jobId!, signal),
    profilePollDelay,
    !!jobId,
  );
  const job = query.data;
  useEffect(() => {
    if (
      !user ||
      !job ||
      job.status !== "SUCCEEDED" ||
      !isCurrentUser(client, user.publicId)
    )
      return;
    const marker = `${user.publicId}:${job.jobId}`;
    if (observed.current === marker) return;
    observed.current = marker;
    void invalidateV02LearningSources(client, user.publicId);
  }, [job, user, client]);
  return query;
}
