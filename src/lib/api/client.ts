import { z } from "zod";
import { ApiReadError, type ReadOperation } from "./errors";
import { profileSchema } from "./schemas";

const gatewayError = z.object({
  error: z.object({
    operation: z.enum(["profile", "recommendation"]),
    category: z.enum([
      "configuration",
      "invalid_request",
      "method_not_allowed",
      "transport",
      "aborted",
      "timeout",
      "http",
      "invalid_json",
      "invalid_payload",
    ]),
    status: z.number().int(),
  }),
});

async function read<T>(
  operation: ReadOperation,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    const response = await fetch(`/api/training/${operation}`, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal,
    });
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const parsed = gatewayError.safeParse(payload);
      throw new ApiReadError(
        parsed.success && parsed.data.error.operation === operation
          ? parsed.data.error
          : { operation, category: "http", status: response.status },
      );
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      throw new ApiReadError({
        operation,
        category: "invalid_payload",
        status: 502,
      });
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiReadError) throw error;
    throw new ApiReadError({
      operation,
      category: signal?.aborted ? "aborted" : "transport",
      status: 502,
    });
  }
}

export function readProfile(signal?: AbortSignal) {
  return read("profile", profileSchema, signal);
}
