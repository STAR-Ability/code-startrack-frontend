"use client";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceSession } from "./account-provider";
import { keys } from "@/lib/query/keys";
import { ApiError } from "@/lib/api/errors";
export function useUserQuery<T>(
  resource: string,
  params: object,
  read: (publicId: string, signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const { data: user } = useWorkspaceSession();
  const query = useQuery({
    queryKey:
      resource === "teams" && "endpoint" in params
        ? keys.teams(user?.publicId ?? "none", String(params.endpoint), params)
        : keys.userResource(user?.publicId ?? "none", resource, params),
    queryFn: ({ signal }) => read(user!.publicId, signal),
    enabled: !!user && enabled,
  });
  const denied =
    query.error instanceof ApiError &&
    [401, 403, 404].includes(query.error.status);
  return { ...query, data: denied ? undefined : query.data };
}
