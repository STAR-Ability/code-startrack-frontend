import { createV012Mock } from "../../src/lib/mock/v012-backend.mjs";
import { validateMockRequest } from "../../src/lib/mock/requests.mjs";
import { scenarioConfig } from "../../src/lib/mock/scenarios.mjs";
import { identityFixture } from "../../src/lib/demo/v012-scenarios";
import { fixtureUuid } from "../../src/lib/demo/fixtures";
import { createV02StoryHandler } from "../../.storybook/v02-request-handler";
import {
  isV02Path,
  validateV02Request,
} from "../../src/lib/mock/v02-requests.mjs";

// Storybook-only transport with shared strict request validation. V0.12 reuses
// its HTTP business state machine; V0.2 uses browser presentation fixtures.
// Judge and synchronization transitions remain in the offline HTTP backend.
// Unhandled API calls fail locally, never reach a server.
let restore: (() => void) | undefined;
export function installStoryScenario(name?: string) {
  restore?.();
  restore = undefined;
  if (!name) return;
  const config = scenarioConfig(name);
  const identity = identityFixture(
    config.identity ?? (config.coach ? "coach-owner-member" : "student"),
  );
  const collaboration = createV012Mock();
  collaboration.reset(config);
  const learning = createV02StoryHandler(config);
  const original = window.fetch;
  const intercepted: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
      window.location.origin,
    );
    if (!url.pathname.startsWith("/api/")) return original(input, init);
    if (!url.pathname.startsWith("/api/v1/"))
      throw new Error("Undeclared Storybook API path");
    if (init?.signal?.aborted) throw init.signal.reason;
    const path = url.pathname.slice(7);
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const validated = (
      isV02Path(path) ? validateV02Request : validateMockRequest
    )(method, path, body, url.searchParams);
    let response: Response | undefined;
    const requestId = fixtureUuid(9900);
    const json = (
      payload: unknown,
      status = 200,
      headers: Record<string, string> = {},
    ) => {
      response = new Response(JSON.stringify(payload), {
        status,
        headers: {
          "Content-Type": "application/json",
          "X-codeStartrack-Mock": "true",
          ...headers,
        },
      });
    };
    const data = (
      value: unknown,
      status = 200,
      headers: Record<string, string> = {},
    ) => json({ data: value, requestId }, status, headers);
    const error = (
      code: string,
      status: number,
      headers: Record<string, string> = {},
      details: Record<string, unknown> = {},
    ) =>
      json(
        {
          error: { code, message: "Synthetic Storybook error", details },
          requestId,
        },
        status,
        headers,
      );
    if (!validated.success) {
      error(
        validated.missing ? "RESOURCE_NOT_FOUND" : "INVALID_ARGUMENT",
        validated.missing ? 404 : 400,
      );
      return response!;
    }
    const query = validated.query;
    if (config.delayMs)
      await new Promise((resolve) => setTimeout(resolve, config.delayMs));
    if (init?.signal?.aborted) throw init.signal.reason;
    if (config.networkFailure) throw new TypeError("Synthetic network failure");
    if (config.loggedOut) {
      error("SESSION_EXPIRED", 401);
      return response!;
    }
    if (config.failReads && method === "GET") {
      error("INTERNAL_ERROR", 503);
      return response!;
    }
    if (config.errorResource && path.endsWith(config.errorResource)) {
      error(
        config.errorCode,
        config.errorStatus,
        config.retryAfter ? { "Retry-After": String(config.retryAfter) } : {},
      );
      return response!;
    }
    const paginated = (items: unknown[]) => {
      const page = query.page ?? 1,
        pageSize = query.pageSize ?? 20;
      json({
        data: items.slice((page - 1) * pageSize, page * pageSize),
        meta: {
          page,
          pageSize,
          total: items.length,
          hasNext: page * pageSize < items.length,
        },
        requestId,
      });
    };
    if (isV02Path(path))
      learning({
        path,
        method,
        body: validated.body,
        query,
        headers: new Headers(
          init?.headers ??
            (input instanceof Request ? input.headers : undefined),
        ),
        data,
        error,
        paginated,
      });
    else if (path === "/me") data(identity.user);
    else if (path === "/oj-accounts")
      data(config.noAccounts ? [] : identity.accounts);
    else
      collaboration.handle({
        path,
        method,
        body: validated.body,
        query,
        config,
        user: identity.user,
        bound: config.noAccounts ? [] : identity.accounts,
        data,
        error,
        noContent: (headers: Record<string, string> = {}) => {
          response = new Response(null, {
            status: 204,
            headers: { "X-codeStartrack-Mock": "true", ...headers },
          });
        },
        paginated,
      });
    if (!response) error("RESOURCE_NOT_FOUND", 404);
    return response!;
  };
  window.fetch = intercepted;
  restore = () => {
    if (window.fetch === intercepted) window.fetch = original;
  };
}
