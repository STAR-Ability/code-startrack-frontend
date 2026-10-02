import { expect, test } from "vitest";
import { ApiError, isMissingResource } from "./errors";

test.each(["RESOURCE_NOT_FOUND", "OJ_ACCOUNT_NOT_FOUND", "SYNC_JOB_NOT_FOUND"])(
  "recognizes the documented missing-resource code %s",
  (code) => expect(isMissingResource(new ApiError(code, 404))).toBe(true),
);
test.each([
  new ApiError("HTTP_ERROR", 404),
  new ApiError("RESOURCE_NOT_FOUND", 503),
  new ApiError("FORBIDDEN", 403),
  new ApiError("UNAUTHENTICATED", 401),
  new TypeError("Failed to fetch"),
  null,
])(
  "does not mistake transport or authorization failure for no data: %s",
  (error) => {
    expect(isMissingResource(error)).toBe(false);
  },
);
