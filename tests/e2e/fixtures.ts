import { expect, test as base } from "@playwright/test";
export const test = base.extend({
  context: async ({ context }, provideContext) => {
    const violations: string[] = [];
    const browserErrors: string[] = [];
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (
        url.origin !== "http://127.0.0.1:3100" ||
        (!["GET", "HEAD"].includes(request.method()) &&
          !url.pathname.startsWith("/api/v1/"))
      ) {
        violations.push(`${request.method()} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      if (
        url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/api/v1/")
      ) {
        violations.push(url.pathname);
        return route.abort();
      }
      return route.continue();
    });
    context.on("page", (page) => {
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          !message.text().startsWith("Failed to load resource:")
        )
          browserErrors.push(message.text());
      });
    });
    await provideContext(context);
    expect(violations, "Unexpected browser egress").toEqual([]);
    expect(browserErrors, "Runtime/hydration errors").toEqual([]);
  },
});
export { expect };
export async function configureUpstream(
  config: Record<string, unknown> = {},
  preserveCalls = false,
) {
  await fetch("http://127.0.0.1:3210/__control", {
    method: "POST",
    body: JSON.stringify({ ...config, preserveCalls }),
  });
}
export async function upstreamCalls() {
  return (
    (await (await fetch("http://127.0.0.1:3210/__control")).json()) as {
      calls: {
        method: string;
        path: string;
        body?: Record<string, unknown>;
        headers: Record<string, string>;
      }[];
    }
  ).calls;
}
