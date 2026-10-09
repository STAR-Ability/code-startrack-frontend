import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/components/training/query-provider";
import { demoUser } from "@/lib/demo/fixtures";
import { v012Job } from "@/lib/demo/v012-fixtures";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { useAiJob, isAiJobPending } from "./use-ai-job";

vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: demoUser }),
}));
vi.mock("@/lib/api/v012", () => ({ v012: { aiJob: vi.fn() } }));
let visibility = "visible";
beforeEach(() => {
  vi.useFakeTimers();
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibility,
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});
function setup() {
  const client = createQueryClient();
  client.setQueryData(keys.session, demoUser);
  client.setQueryData(
    keys.aiJob(demoUser.publicId, v012Job().jobId),
    v012Job(),
  );
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const hook = renderHook(() => useAiJob(v012Job().jobId), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client, invalidate };
}
async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}
describe("AI job lifecycle", () => {
  it.each([403, 404])(
    "withdraws a denied job and releases the processing state after HTTP %s",
    async (status) => {
      const denied = new ApiError("UNAUTHORIZED", status);
      vi.mocked(v012.aiJob).mockRejectedValue(denied);
      const { result } = setup();
      await advance(1);
      expect(result.current.data).toBeUndefined();
      expect(
        isAiJobPending(
          v012Job().jobId,
          result.current.data,
          result.current.error,
        ),
      ).toBe(false);
      await advance(30_000);
      expect(v012.aiJob).toHaveBeenCalledTimes(1);
    },
  );
  it("releases the processing state when the session expires", () => {
    const expired = new ApiError("SESSION_EXPIRED", 401);
    expect(isAiJobPending(v012Job().jobId, v012Job("RUNNING"), expired)).toBe(
      false,
    );
  });
  it("retains processing after a transient read failure instead of permitting duplicate jobs", () => {
    const outage = new ApiError("UPSTREAM_UNAVAILABLE", 503);
    expect(isAiJobPending(v012Job().jobId, undefined, outage)).toBe(true);
    expect(isAiJobPending(v012Job().jobId, v012Job("RUNNING"), outage)).toBe(
      true,
    );
  });
  it("withdraws a missing job, stops polling and permits a deliberate new request", async () => {
    const missing = new ApiError("RESOURCE_NOT_FOUND", 404);
    vi.mocked(v012.aiJob).mockRejectedValue(missing);
    const { result } = setup();
    await advance(1);
    expect(result.current.data).toBeUndefined();
    expect(isAiJobPending(v012Job().jobId, v012Job(), missing)).toBe(false);
    await advance(30_000);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
  });
  it("polls every three seconds, refreshes only its result family and stops on success", async () => {
    vi.mocked(v012.aiJob)
      .mockResolvedValueOnce(v012Job("RUNNING"))
      .mockResolvedValue(v012Job("SUCCESS"));
    const { invalidate } = setup();
    await advance(1);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
    await advance(2998);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
    await advance(10);
    expect(v012.aiJob).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["private", demoUser.publicId, "user-analysis"],
    });
    await advance(30_000);
    expect(v012.aiJob).toHaveBeenCalledTimes(2);
  });
  it("pauses in a hidden page and checks immediately when visible again", async () => {
    vi.mocked(v012.aiJob).mockResolvedValue(v012Job("RUNNING"));
    setup();
    await advance(1);
    await act(async () => {
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await advance(10_000);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
    await act(async () => {
      visibility = "visible";
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await advance(1);
    expect(v012.aiJob).toHaveBeenCalledTimes(2);
  });
  it("backs off failed reads while retaining the running job, then recovers", async () => {
    vi.mocked(v012.aiJob)
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR"))
      .mockResolvedValue(v012Job("SUCCESS"));
    const { client } = setup();
    await advance(1);
    expect(
      client.getQueryData(keys.aiJob(demoUser.publicId, v012Job().jobId)),
    ).toEqual(v012Job());
    await advance(5000);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
    await advance(1100);
    expect(v012.aiJob).toHaveBeenCalledTimes(2);
  });
  it("stops on a failed job without invalidating an existing report", async () => {
    vi.mocked(v012.aiJob).mockResolvedValue(
      v012Job("FAILED", "PERSONAL_REPORT"),
    );
    const { invalidate } = setup();
    await advance(1);
    await advance(30_000);
    expect(v012.aiJob).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
