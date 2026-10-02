export const keys = {
  session: ["session"] as const,
  user: (publicId: string) => ["private", publicId] as const,
  accounts: (publicId: string, includeUnbound = false) =>
    ["private", publicId, "accounts", { includeUnbound }] as const,
  account: (publicId: string, accountId: string) =>
    ["private", publicId, "account", accountId] as const,
  resource: (
    publicId: string,
    accountId: string,
    resource: string,
    params: object = {},
  ) => ["private", publicId, "account", accountId, resource, params] as const,
};
