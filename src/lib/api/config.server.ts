import "server-only";

import { ApiReadError, type ReadOperation } from "./errors";

export const DEMO_USER_ID = 1;

export function backendOrigin(operation: ReadOperation): string {
  // Read per operation: neither module loading nor a build requires a backend.
  const value = process.env.BACKEND_BASE_URL;
  try {
    if (!value || value !== value.trim() || !/^https?:\/\//.test(value)) {
      throw new Error();
    }
    const url = new URL(value);
    // Compare the raw origin form too: URL parsing otherwise hides dot paths,
    // empty query/fragment delimiters, backslashes and embedded credentials.
    if (
      !/^https?:\/\/[^/?#\\\s@]+\/?$/.test(value) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new ApiReadError({
      operation,
      category: "configuration",
      status: 500,
    });
  }
}
