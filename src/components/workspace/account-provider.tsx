"use client";
import { createContext, useContext, useState } from "react";
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { keys } from "@/lib/query/keys";
import type { OjAccountDto, UserDto } from "@/lib/api/schemas";
import { isMissingResource } from "@/lib/api/errors";

type AccountContextValue = {
  user: UserDto;
  query: UseQueryResult<OjAccountDto[]>;
  accounts: OjAccountDto[];
  selectedAccountId: string | null;
  account: OjAccountDto | null;
  selectAccount: (id: string | null) => void;
};
const AccountContext = createContext<AccountContextValue | null>(null);
export function useAccountTimezone() {
  return useContext(AccountContext)?.user.timezone ?? "Asia/Shanghai";
}
export function useAccounts() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider is required");
  return value;
}
const SessionContext = createContext<UseQueryResult<UserDto | null> | null>(
  null,
);
export function useWorkspaceSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("WorkspaceSessionProvider is required");
  return value;
}
export function useOptionalAccounts() {
  return useContext(AccountContext);
}
export function WorkspaceSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const query = useQuery<UserDto | null>({
    queryKey: keys.session,
    queryFn: ({ signal }) => api.me(signal),
  });
  const user = query.data;
  const student =
    user?.roles.includes("STUDENT") && user.accountStatus === "ACTIVE"
      ? user
      : null;
  return (
    <SessionContext value={query}>
      <AccountProvider user={student}>{children}</AccountProvider>
    </SessionContext>
  );
}
type AccountSelection = {
  publicId: string | null;
  selected: string | null;
  historyAccount: OjAccountDto | null;
};
function initialSelection(publicId: string | null): AccountSelection {
  let selected = null;
  if (publicId) {
    try {
      selected = localStorage.getItem(`codestartrack.account.${publicId}`);
    } catch {
      // Preference persistence is optional.
    }
  }
  return { publicId, selected, historyAccount: null };
}
function AccountProvider({
  user,
  children,
}: {
  user: UserDto | null;
  children: React.ReactNode;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: user ? keys.accounts(user.publicId) : ["accounts-disabled"],
    queryFn: ({ signal }) =>
      user ? api.accounts(false, signal) : Promise.resolve([]),
    enabled: !!user,
  });
  const publicId = user?.publicId ?? null;
  const [selection, setSelection] = useState(() => initialSelection(publicId));
  // Keep the public subtree mounted as session loading resolves, while resetting
  // account preferences synchronously before committing a different identity.
  if (selection.publicId !== publicId) {
    setSelection(initialSelection(publicId));
  }
  if (!user) return <AccountContext value={null}>{children}</AccountContext>;
  // An unbound account is selectable only after loading the user's own historical list.
  const { selected, historyAccount } = selection;
  const missing = isMissingResource(query.error);
  const accounts = missing ? [] : (query.data ?? []);
  const account =
    accounts.find((a) => a.accountId === selected) ??
    (!missing && historyAccount?.accountId === selected
      ? historyAccount
      : null) ??
    accounts[0] ??
    null;
  function selectAccount(id: string | null) {
    if (!user) return;
    const owned = id
      ? (client
          .getQueryData<OjAccountDto[]>(keys.accounts(user.publicId))
          ?.find((a) => a.accountId === id) ??
        client
          .getQueryData<OjAccountDto[]>(keys.accounts(user.publicId, true))
          ?.find((a) => a.accountId === id))
      : null;
    if (id && !owned) return;
    if (account)
      void client.cancelQueries({
        queryKey: keys.account(user.publicId, account.accountId),
      });
    setSelection({
      publicId: user.publicId,
      selected: id,
      historyAccount: owned?.bindStatus === "UNBOUND" ? owned : null,
    });
    try {
      if (id && owned?.bindStatus !== "UNBOUND")
        localStorage.setItem(`codestartrack.account.${user.publicId}`, id);
      else localStorage.removeItem(`codestartrack.account.${user.publicId}`);
    } catch {
      /* Preference persistence is optional. */
    }
  }
  return (
    <AccountContext
      value={{
        user,
        query,
        accounts,
        selectedAccountId: account?.accountId ?? null,
        account,
        selectAccount,
      }}
    >
      {children}
    </AccountContext>
  );
}
