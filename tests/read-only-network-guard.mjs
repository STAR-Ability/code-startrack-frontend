// Test-process preload only. A failed guard terminates the harness, so an
// unexpected request cannot be swallowed as an ordinary product error state.
const origin = process.env.BACKEND_BASE_URL;
if (origin && !/^http:\/\/127\.0\.0\.1:321[0-2]$/.test(origin)) {
  throw new Error("Offline tests require an isolated loopback upstream");
}
const allowed = new Set(
  origin
    ? [
        `${origin}/api/users/1/profile`,
        `${origin}/api/users/1/recommendations?limit=1`,
      ]
    : [],
);
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  const body = init?.body ?? (input instanceof Request ? input.body : null);
  if (!allowed.has(url) || method !== "GET" || body != null) {
    console.error("Offline server network policy violation");
    process.exit(1);
  }
  return originalFetch(input, init);
};
