// Runs only in the disposable Linux test container, never in the product image.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:https";
import { request } from "node:http";
import { chromium, expect } from "@playwright/test";

const fixture = process.env.EXPECTED_FIXTURE;
assert.ok(["fixture-a", "fixture-b"].includes(fixture));
const expectedSolved = Number(process.env.EXPECTED_SOLVED);
const frontend = "http://frontend:3000";
const origin = "https://localhost:3443";
const privateValues = /fixture-[ab](?::8080)?|BACKEND_BASE_URL|private http/;
const tls = mkdtempSync(join(tmpdir(), "codestartrack-tls-"));
function command(program, args) {
  execFileSync(program, args, { cwd: tls, stdio: "pipe" });
}
command("openssl", [
  "req",
  "-x509",
  "-newkey",
  "rsa:2048",
  "-nodes",
  "-days",
  "1",
  "-keyout",
  "ca.key",
  "-out",
  "ca.pem",
  "-subj",
  "/CN=codeStartrack isolated test CA",
  "-addext",
  "basicConstraints=critical,CA:TRUE",
]);
command("openssl", [
  "req",
  "-newkey",
  "rsa:2048",
  "-nodes",
  "-keyout",
  "server.key",
  "-out",
  "server.csr",
  "-subj",
  "/CN=localhost",
]);
writeFileSync(
  join(tls, "extensions"),
  "subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\n",
);
command("openssl", [
  "x509",
  "-req",
  "-in",
  "server.csr",
  "-CA",
  "ca.pem",
  "-CAkey",
  "ca.key",
  "-CAcreateserial",
  "-out",
  "server.pem",
  "-days",
  "1",
  "-extfile",
  "extensions",
]);
command("openssl", [
  "req",
  "-x509",
  "-newkey",
  "rsa:2048",
  "-nodes",
  "-days",
  "1",
  "-keyout",
  "untrusted.key",
  "-out",
  "untrusted.pem",
  "-subj",
  "/CN=localhost",
  "-addext",
  "subjectAltName=DNS:localhost",
]);
const database = join(homedir(), ".pki", "nssdb");
mkdirSync(database, { recursive: true });
command("certutil", ["-N", "-d", `sql:${database}`, "--empty-password"]);
command("certutil", [
  "-A",
  "-d",
  `sql:${database}`,
  "-n",
  "codeStartrack test CA",
  "-t",
  "C,,",
  "-i",
  join(tls, "ca.pem"),
]);

function options(name) {
  return {
    key: readFileSync(join(tls, `${name}.key`)),
    cert: readFileSync(join(tls, `${name}.pem`)),
  };
}
const proxy = createServer(options("server"), (incoming, outgoing) => {
  if (incoming.method !== "GET") return outgoing.writeHead(405).end();
  const upstream = request(
    new URL(incoming.url, frontend),
    {
      method: "GET",
      headers: {
        ...incoming.headers,
        host: "localhost:3443",
        "x-forwarded-proto": "https",
      },
    },
    (response) => {
      outgoing.writeHead(response.statusCode, response.headers);
      response.pipe(outgoing);
    },
  );
  upstream.on("error", () => outgoing.writeHead(502).end());
  upstream.end();
});
const untrusted = createServer(options("untrusted"), (_request, response) =>
  response.end("Untrusted test server"),
);
await Promise.all(
  [proxy, untrusted].map(
    (server, i) =>
      new Promise((resolve) => server.listen(3443 + i, "127.0.0.1", resolve)),
  ),
);
async function control(name, settings) {
  const result = await fetch(
    `http://${name}:8080/__control`,
    settings ? { method: "POST", body: JSON.stringify(settings) } : {},
  );
  assert.equal(result.status, 200);
  return (await result.json()).calls;
}
await control("fixture-a", {});
await control("fixture-b", {});
const health = await fetch(`${frontend}/api/health`);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: "ok" });
assert.deepEqual(await control(fixture), []);

let browser;
try {
  browser = await chromium.launch();
  // Negative control proves certificate validation is enabled, not bypassed.
  const negative = await browser.newPage({ ignoreHTTPSErrors: false });
  await assert.rejects(
    negative.goto("https://localhost:3444"),
    /ERR_CERT_AUTHORITY_INVALID/,
  );
  await negative.close();
  const context = await browser.newContext({
    ignoreHTTPSErrors: false,
    serviceWorkers: "block",
  });
  const violations = [];
  const errors = [];
  const cancelledNavigations = [];
  const requests = [];
  await context.route("**/*", (route) => {
    const incoming = route.request();
    if (
      new URL(incoming.url()).origin !== origin ||
      incoming.method() !== "GET"
    ) {
      violations.push(incoming.url());
      return route.abort();
    }
    requests.push(incoming.url());
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    // Next can cancel an unused Flight stream during a successful navigation.
    // Record that case separately; below we require client navigation (no full
    // reload), the complete result and exactly E1/E2. Other failures still fail.
    if (
      request.failure()?.errorText === "net::ERR_ABORTED" &&
      request.resourceType() === "fetch" &&
      url.origin === origin &&
      url.pathname === "/dashboard" &&
      url.searchParams.has("_rsc")
    ) {
      cancelledNavigations.push(url.pathname);
    } else {
      errors.push(
        `${request.failure()?.errorText}: ${request.resourceType()} ${url}`,
      );
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const document = await page.goto(origin);
  assert.equal(document.status(), 200);
  assert.match(
    (await document.securityDetails()).issuer,
    /codeStartrack isolated test CA/,
  );
  assert.equal(await page.evaluate(() => window.isSecureContext), true);
  assert.doesNotMatch(await document.text(), privateValues);
  await page.getByRole("button", { name: "English", exact: true }).click();
  assert.deepEqual(await control(fixture), []);
  const profile = page.waitForResponse(`${origin}/api/training/profile`);
  const recommendation = page.waitForResponse(
    `${origin}/api/training/recommendation`,
  );
  await page.evaluate(() => {
    window.containerNavigationMarker = true;
  });
  await page.getByRole("link", { name: "View read-only demo" }).click();
  await expect(
    page.getByRole("link", { name: "Open on Codeforces" }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${origin}/dashboard`);
  assert.equal(
    await page.evaluate(() => window.containerNavigationMarker),
    true,
  );
  await expect(page.locator("dd").first()).toHaveText(String(expectedSolved));
  for (const result of await Promise.all([profile, recommendation])) {
    assert.equal(result.status(), 200);
    assert.doesNotMatch(await result.text(), privateValues);
    assert.doesNotMatch(JSON.stringify(result.headers()), privateValues);
  }
  assert.doesNotMatch(await page.content(), privateValues);
  assert.deepEqual(await control(fixture), [
    { method: "GET", path: "/api/users/1/profile", body: "" },
    { method: "GET", path: "/api/users/1/recommendations?limit=1", body: "" },
  ]);
  assert.deepEqual(
    await control(fixture === "fixture-a" ? "fixture-b" : "fixture-a"),
    [],
  );
  const assets = {};
  for (const path of [
    ...new Set(requests.map((url) => new URL(url).pathname)),
  ].filter((path) => path.startsWith("/_next/static/"))) {
    const asset = await fetch(`${frontend}${path}`);
    assert.equal(asset.status, 200);
    const bytes = Buffer.from(await asset.arrayBuffer());
    assert.doesNotMatch(bytes.toString(), privateValues);
    assets[path] = createHash("sha256").update(bytes).digest("hex");
  }
  assert.ok(Object.keys(assets).some((path) => path.endsWith(".js")));
  assert.ok(Object.keys(assets).some((path) => path.endsWith(".css")));
  assert.ok(Object.keys(assets).some((path) => /\.woff2?$/.test(path)));
  assert.equal((await fetch(`${frontend}/file.svg`)).status, 200);
  const before = await control(fixture);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
    const local = await fetch(`${frontend}/api/training/profile`, { method });
    assert.equal(local.status, method === "OPTIONS" ? 204 : 405);
  }
  assert.deepEqual(await control(fixture), before);
  await control(fixture, { failed: true });
  const error = await fetch(`${frontend}/api/training/profile`);
  assert.equal(error.status, 503);
  assert.doesNotMatch(await error.text(), privateValues);
  const afterFailure = await control(fixture);
  assert.equal((await fetch(`${frontend}/api/health`)).status, 200);
  assert.deepEqual(await control(fixture), afterFailure);
  assert.deepEqual(violations, []);
  assert.deepEqual(errors, []);
  console.log(
    `CONTAINER_EVIDENCE ${JSON.stringify({ expectedSolved, assets, trustedHttps: true, upstreamCalls: before, cancelledNavigations })}`,
  );
} finally {
  await browser?.close();
  proxy.closeAllConnections();
  untrusted.closeAllConnections();
  proxy.close();
  untrusted.close();
}
