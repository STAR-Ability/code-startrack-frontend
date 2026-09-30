import "server-only";

import { z } from "zod";

import { backendOrigin, DEMO_USER_ID } from "./config.server";
import { ApiReadError, type ReadOperation } from "./errors";
import { profileSchema, recommendationsSchema } from "./schemas";

const TIMEOUT_MS = 8_000;
const wireError = z.object({ error: z.string(), message: z.string() });

// Private and closed over two operations: no URL, method, headers or body input.
async function read<T extends { userId: number }>(
  operation: ReadOperation,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const origin = backendOrigin(operation);
  const path =
    operation === "profile"
      ? `/api/users/${DEMO_USER_ID}/profile`
      : `/api/users/${DEMO_USER_ID}/recommendations?limit=1`;
  const controller = new AbortController();
  let timedOut = false;
  let upstreamStatus: number | undefined;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    controller.signal.throwIfAborted();
    const response = await fetch(`${origin}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });
    upstreamStatus = response.status;

    if (!response.ok) {
      // Keep the documented wire shape separate from the frontend error shape.
      // Only an explicitly documented identifier crosses the browser boundary.
      const parsed = wireError.safeParse(
        await response.json().catch(() => undefined),
      );
      controller.signal.throwIfAborted();
      throw new ApiReadError({
        operation,
        category: "http",
        status: response.status >= 400 ? response.status : 502,
        upstreamStatus,
        ...(parsed.success && parsed.data.error === "account_not_found"
          ? { backendError: parsed.data.error }
          : {}),
      });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      controller.signal.throwIfAborted();
      if (!(error instanceof SyntaxError)) throw error;
      throw new ApiReadError({
        operation,
        category: "invalid_json",
        status: 502,
        upstreamStatus,
      });
    }
    controller.signal.throwIfAborted();
    const parsed = schema.safeParse(payload);
    if (!parsed.success || parsed.data.userId !== DEMO_USER_ID) {
      throw new ApiReadError({
        operation,
        category: "invalid_payload",
        status: 502,
        upstreamStatus,
      });
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiReadError) throw error;
    throw new ApiReadError({
      operation,
      category: timedOut
        ? "timeout"
        : signal?.aborted
          ? "aborted"
          : "transport",
      status: timedOut ? 504 : 502,
      ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function getTrainingProfile(signal?: AbortSignal) {
  return read("profile", profileSchema, signal);
}

export function getTrainingRecommendations(signal?: AbortSignal) {
  return read("recommendation", recommendationsSchema, signal);
}
