import type { QueryClient } from "@tanstack/react-query";
import type { OjAccountDto, UserDto } from "@/lib/api/schemas";
import { keys } from "./keys";

// A mutation may finish after logout or after another user signs in.
export function isCurrentUser(client: QueryClient, publicId: string) {
  return (
    client.getQueryData<UserDto | null>(keys.session)?.publicId === publicId
  );
}

export function isCurrentBinding(
  client: QueryClient,
  publicId: string,
  accountId: string,
) {
  return (
    isCurrentUser(client, publicId) &&
    !!client
      .getQueryData<OjAccountDto[]>(keys.accounts(publicId))
      ?.some(
        (account) =>
          account.accountId === accountId && account.bindStatus !== "UNBOUND",
      )
  );
}
