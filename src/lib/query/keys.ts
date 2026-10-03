export const keys = {
  session: ["session"] as const,
  user: (publicId: string) => ["private", publicId] as const,
  accounts: (publicId: string, includeUnbound = false) =>
    ["private", publicId, "accounts", { includeUnbound }] as const,
  account: (publicId: string, accountId: string) =>
    ["private", publicId, "account", accountId] as const,
  userResource: (publicId: string, resource: string, params: object = {}) =>
    ["private", publicId, resource, params] as const,
  teams: (publicId: string, resource: string, params: object = {}) =>
    ["private", publicId, "teams", resource, params] as const,
  team: (
    publicId: string,
    teamId: string,
    resource?: string,
    params: object = {},
  ) =>
    resource
      ? (["private", publicId, "team", teamId, resource, params] as const)
      : (["private", publicId, "team", teamId] as const),
  aiJob: (publicId: string, jobId: string) =>
    ["private", publicId, "ai-job", jobId] as const,
  resource: (
    publicId: string,
    accountId: string,
    resource: string,
    params: object = {},
  ) => ["private", publicId, "account", accountId, resource, params] as const,
};
