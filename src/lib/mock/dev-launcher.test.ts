// @vitest-environment node
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startMockDevelopment } from "../../../scripts/dev-offline.mjs";

vi.mock("node:child_process", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:child_process")>();
  return {
    ...original,
    spawn: vi.fn(() => new original.ChildProcess()),
  };
});

const launches: Awaited<ReturnType<typeof startMockDevelopment>>[] = [];
beforeEach(() => {
  vi.mocked(spawn).mockClear();
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(async () => {
  for (const launch of launches.splice(0)) {
    launch.child.emit("exit", 0, null);
    await launch.done;
  }
  vi.restoreAllMocks();
});

async function launch(env: Partial<NodeJS.ProcessEnv> = {}) {
  const result = await startMockDevelopment({
    env: { ...env, NODE_ENV: env.NODE_ENV ?? "development" },
    args: ["--port", "3001"],
  });
  launches.push(result);
  return result;
}

describe("mock development launcher", () => {
  it("isolates fixtures and overrides a live upstream with its own loopback origin", async () => {
    const first = await launch({
      MOCK_SCENARIO: "no-accounts",
      BACKEND_BASE_URL: "https://live.example.invalid",
    });
    const second = await launch({ MOCK_SCENARIO: "success" });
    expect(first.origin).not.toBe(second.origin);
    expect(first.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    const options = vi.mocked(spawn).mock.calls[0][2];
    expect(options?.env?.BACKEND_BASE_URL).toBe(first.origin);
    expect(vi.mocked(spawn).mock.calls[0][1]).toEqual([
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3001",
    ]);
    for (const fixture of [first, second]) {
      const response = await fetch(`${fixture.origin}/api/v1/me`);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-codeStartrack-Mock")).toBe("true");
    }
    const firstAccounts = await (
      await fetch(`${first.origin}/api/v1/oj-accounts`)
    ).json();
    const secondAccounts = await (
      await fetch(`${second.origin}/api/v1/oj-accounts`)
    ).json();
    expect(firstAccounts.data).toEqual([]);
    expect(secondAccounts.data.length).toBeGreaterThan(0);
  });

  it.each(["-1", "65536", "3.2", "abc", "", " 3210", "1e3"])(
    "rejects invalid MOCK_PORT %j before starting Next",
    async (MOCK_PORT) => {
      await expect(launch({ MOCK_PORT })).rejects.toThrow(
        "MOCK_PORT must be an integer from 0 to 65535",
      );
      expect(spawn).not.toHaveBeenCalled();
    },
  );

  it("reports an occupied explicit port and does not reuse that server", async () => {
    const existing = createServer();
    await new Promise<void>((resolve) =>
      existing.listen(0, "127.0.0.1", resolve),
    );
    try {
      const port = (existing.address() as AddressInfo).port;
      await expect(launch({ MOCK_PORT: String(port) })).rejects.toThrow(
        `Mock fixture port ${port} is already in use`,
      );
      expect(spawn).not.toHaveBeenCalled();
      expect(existing.listening).toBe(true);
    } finally {
      await new Promise<void>((resolve) => existing.close(() => resolve()));
    }
  });

  it("closes the fixture and removes forwarding handlers after frontend exit", async () => {
    const listenerCount = process.listenerCount("SIGINT");
    const fixture = await launch();
    expect(process.listenerCount("SIGINT")).toBe(listenerCount + 1);
    fixture.child.emit("exit", 2, null);
    expect(await fixture.done).toBe(2);
    expect(fixture.backend.listening).toBe(false);
    expect(process.listenerCount("SIGINT")).toBe(listenerCount);
  });

  it("forwards shutdown signals and closes the fixture after interruption", async () => {
    const fixture = await launch();
    const kill = vi.spyOn(fixture.child, "kill").mockReturnValue(true);
    process.emit("SIGTERM");
    expect(kill).toHaveBeenCalledWith("SIGTERM");
    fixture.child.emit("exit", null, "SIGTERM");
    expect(await fixture.done).toBe(0);
    expect(fixture.backend.listening).toBe(false);
  });

  it("closes the fixture if the frontend process fails to spawn", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fixture = await launch();
    fixture.child.emit("error", new Error("Synthetic spawn failure"));
    expect(await fixture.done).toBe(1);
    expect(fixture.backend.listening).toBe(false);
  });
});
