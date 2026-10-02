"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccounts } from "./account-provider";
import { isMissingResource } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";

export function useAccountQuery<T>(
  resource: string,
  params: object,
  read: (id: string, signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const { user, selectedAccountId } = useAccounts();
  const query = useQuery({
    queryKey: keys.resource(
      user.publicId,
      selectedAccountId ?? "none",
      resource,
      params,
    ),
    queryFn: ({ signal }) => {
      if (!selectedAccountId) throw new Error("An account must be selected");
      return read(selectedAccountId, signal);
    },
    enabled: !!selectedAccountId && enabled,
  });
  // Never retain a record the server now reports as missing/inaccessible.
  return {
    ...query,
    data: isMissingResource(query.error) ? undefined : query.data,
  };
}
