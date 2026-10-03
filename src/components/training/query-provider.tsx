"use client";
import { useState } from "react";
import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";

export function clearSession(client: QueryClient) {
  void client.cancelQueries();
  // Preserve the observed session query so mounted workspace gates receive null.
  // Clearing and recreating it detaches observers and can leave an old user visible.
  client.setQueryData(keys.session, null);
  client.removeQueries({
    predicate: (query) => query.queryKey[0] !== keys.session[0],
  });
  client.getMutationCache().clear();
}
export function createQueryClient() {
  function handleSessionError(error: Error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      error.code !== "INVALID_CREDENTIALS"
    )
      clearSession(client);
  }
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleSessionError(error);
        if (error instanceof ApiError && error.code === "ROLE_REQUIRED")
          void client.invalidateQueries({ queryKey: keys.session });
        if (
          error instanceof ApiError &&
          [403, 404].includes(error.status) &&
          query.queryKey[2] === "team" &&
          ["member-data", "member-report"].includes(String(query.queryKey[4]))
        ) {
          const prefix = query.queryKey.slice(0, 4);
          for (const resource of ["detail", "members", "member-access"]) {
            if (query.queryKey[4] !== resource)
              void client.invalidateQueries({
                queryKey: [...prefix, resource],
              });
          }
        }
        if (
          error instanceof ApiError &&
          error.status === 404 &&
          query.queryKey[2] === "account"
        ) {
          void client.invalidateQueries({
            predicate: (item) =>
              item.queryKey[0] === "private" &&
              item.queryKey[1] === query.queryKey[1] &&
              item.queryKey[2] === "accounts",
          });
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const publicId = mutation.meta?.publicId;
        if (typeof publicId === "string" && !isCurrentUser(client, publicId))
          return;
        handleSessionError(error);
        if (error instanceof ApiError && error.code === "ROLE_REQUIRED")
          void client.invalidateQueries({ queryKey: keys.session });
        if (
          error instanceof ApiError &&
          (error.status === 404 ||
            [
              "OJ_ACCOUNT_UNBOUND",
              "OJ_ACCOUNT_INVALID",
              "DATA_CHANGED",
              "SYNC_REQUIRED",
              "PROFILE_NOT_READY",
            ].includes(error.code))
        ) {
          void client.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === "private" &&
              (query.queryKey[2] === "accounts" ||
                ["sync-status", "dashboard"].includes(
                  String(query.queryKey[4]),
                )),
          });
        }
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
  return client;
}
export function TrainingQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
