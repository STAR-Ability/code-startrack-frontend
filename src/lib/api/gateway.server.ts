import "server-only";

import {
  getTrainingProfile,
  getTrainingRecommendations,
} from "./client.server";
import {
  ApiReadError,
  type ApiErrorResponse,
  type ReadOperation,
} from "./errors";

const responseHeaders = { "Cache-Control": "no-store" };

export async function readGateway(request: Request, operation: ReadOperation) {
  try {
    if (request.method !== "GET") {
      throw new ApiReadError({
        operation,
        category: "method_not_allowed",
        status: 405,
      });
    }
    if (
      new URL(request.url).search ||
      request.body !== null ||
      (request.headers.has("content-length") &&
        request.headers.get("content-length") !== "0") ||
      request.headers.has("transfer-encoding") ||
      ["x-http-method-override", "x-method-override", "x-http-method"].some(
        (name) => request.headers.has(name),
      )
    ) {
      throw new ApiReadError({
        operation,
        category: "invalid_request",
        status: 400,
      });
    }
    const payload =
      operation === "profile"
        ? await getTrainingProfile(request.signal)
        : await getTrainingRecommendations(request.signal);
    return Response.json(payload, { headers: responseHeaders });
  } catch (error) {
    const detail: ApiErrorResponse["error"] =
      error instanceof ApiReadError
        ? error.detail
        : { operation, category: "transport", status: 502 };
    return Response.json({ error: detail } satisfies ApiErrorResponse, {
      status: detail.status,
      headers: responseHeaders,
    });
  }
}

// Explicit HEAD is essential: Next.js otherwise dispatches HEAD through GET.
export function rejectHead() {
  return new Response(null, {
    status: 405,
    headers: { ...responseHeaders, Allow: "GET, OPTIONS" },
  });
}

export function localOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...responseHeaders, Allow: "GET, OPTIONS" },
  });
}
