"use client";
import { useMutationState } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { useCountdown } from "./feedback";

// Multiple controls can start the same account job; share their pending/cooldown state.
export function useJobLock(publicId: string, accountId: string) {
  const states = useMutationState({
    filters: {
      predicate: (mutation) =>
        mutation.meta?.publicId === publicId &&
        mutation.meta?.accountId === accountId &&
        mutation.meta?.operation === "job",
    },
    select: (mutation) => ({
      status: mutation.state.status,
      error: mutation.state.error,
    }),
  });
  const until = Math.max(
    0,
    ...states.map((state) =>
      state.error instanceof ApiError ? state.error.retryAt : 0,
    ),
  );
  const remaining = useCountdown(until);
  return (
    states.some(
      (state) =>
        state.status === "pending" ||
        (state.error instanceof ApiError && state.error.status === 403),
    ) || remaining > 0
  );
}
