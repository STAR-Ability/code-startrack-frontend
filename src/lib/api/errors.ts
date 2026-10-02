export class ApiError extends Error {
  readonly retryAt: number;
  constructor(
    readonly code: string,
    readonly status = 0,
    readonly requestId: string | null = null,
    readonly details: Record<string, unknown> = {},
    readonly retryAfter = 0,
  ) {
    super(code);
    this.name = "ApiError";
    this.retryAt = retryAfter > 0 ? Date.now() + retryAfter * 1000 : 0;
  }
}

/** A contract-level missing record, not a proxy or an undocumented route failure. */
export function isMissingResource(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    [
      "RESOURCE_NOT_FOUND",
      "OJ_ACCOUNT_NOT_FOUND",
      "SYNC_JOB_NOT_FOUND",
    ].includes(error.code)
  );
}
