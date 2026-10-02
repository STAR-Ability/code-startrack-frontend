import { z } from "zod";
import { ApiError } from "./errors";
import { envelope, errorSchema, pageEnvelope } from "./schemas";
import { recordDataSource } from "./data-state";

export type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  idempotencyKey?: string;
};

// Only a path inside our public API is accepted; the browser never knows upstream addresses.
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\#]/.test(path) ||
    path.split(/[/?]/).includes("..")
  )
    throw new ApiError("INVALID_API_PATH");
  const controller = new AbortController();
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`/api/v1${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      signal,
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
    // Keep known Mock provenance through intercepted/proxy failures lacking headers.
    if (response.headers.get("X-codeStartrack-Mock") === "true")
      recordDataSource(true);
    const payload: unknown =
      response.status === 204
        ? undefined
        : await response.json().catch(() => undefined);
    signal.throwIfAborted();
    if (!response.ok) {
      const parsed = errorSchema.safeParse(payload);
      const retryAfter = Number(response.headers.get("Retry-After"));
      throw new ApiError(
        parsed.success ? parsed.data.error.code : "HTTP_ERROR",
        response.status,
        parsed.success ? parsed.data.requestId : null,
        parsed.success ? parsed.data.error.details : {},
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 0,
      );
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      throw new ApiError("INVALID_RESPONSE", response.status);
    return parsed.data;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted ? "TIMEOUT" : "NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

// Recursively verify all nested account IDs before accepting an account-scoped response.
export function assertAccount(value: unknown, accountId: string): void {
  if (!value || typeof value !== "object") return;
  if ("accountId" in value && value.accountId !== accountId)
    throw new ApiError("ACCOUNT_MISMATCH");
  for (const child of Object.values(value)) assertAccount(child, accountId);
}
function assertFields(value: unknown, expected: Record<string, string>) {
  if (value === null) return;
  for (const [key, field] of Object.entries(expected)) {
    if (
      !value ||
      typeof value !== "object" ||
      !(key in value) ||
      Reflect.get(value, key) !== field
    )
      throw new ApiError("INVALID_RESPONSE");
  }
}
export async function readData<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestOptions,
  accountId?: string,
  expected: Record<string, string> = {},
) {
  const result = await request(path, envelope(schema), options);
  if (accountId) assertAccount(result.data, accountId);
  assertFields(result.data, expected);
  return result.data;
}
export async function readPage<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  accountId?: string,
  expected: Record<string, string> = {},
) {
  const result = await request(path, pageEnvelope(schema), { signal });
  if (accountId) assertAccount(result.data, accountId);
  for (const item of result.data) assertFields(item, expected);
  return result;
}
export function queryString(
  values: Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
}
