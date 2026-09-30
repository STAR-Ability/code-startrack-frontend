export type ReadOperation = "profile" | "recommendation";

export type ApiErrorCategory =
  | "configuration"
  | "invalid_request"
  | "method_not_allowed"
  | "transport"
  | "aborted"
  | "timeout"
  | "http"
  | "invalid_json"
  | "invalid_payload";

export type ApiErrorResponse = {
  error: {
    operation: ReadOperation;
    category: ApiErrorCategory;
    status: number;
    upstreamStatus?: number;
    backendError?: "account_not_found";
  };
};

// Deliberately retain no raw message, URL, payload or exception cause.
export class ApiReadError extends Error {
  constructor(readonly detail: ApiErrorResponse["error"]) {
    super(detail.category);
    this.name = "ApiReadError";
  }
}
