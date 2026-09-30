# V0.1 production deployment

The image runs the Next.js standalone Node server as the non-root `node` user. Browser API requests stay on the frontend origin; only the server reads runtime `BACKEND_BASE_URL`. No build argument, image default, browser configuration or startup task selects a backend. The image contains no local environment files, source mounts or full development dependency tree.

## First run from a checkout

Requirements: Docker Engine, Docker Compose v2+ and network access for the initial Node image, frozen pnpm dependency installation and existing Google Fonts build downloads. The Dockerfile uses Node 24 and pnpm 12.8.1. Builds do not require or contact a backend. BuildKit is supported but not required.

1. Use `dev` and preserve any existing local files. If `.env` does not exist, copy `.env.example` to `.env`. Set `BACKEND_BASE_URL` to the operator-provided absolute HTTP(S) backend origin, without credentials, path, query or fragment. Keep this file ignored and local. Shell variables override Compose `.env` values.
2. Set `FRONTEND_PORT` if port 3000 is occupied. The default bind address is `127.0.0.1`; set `FRONTEND_BIND_ADDRESS` to the intended host interface when needed. The container always listens on `0.0.0.0:3000`.
3. Run:

```bash
docker compose up -d
```

On first use, Compose checks the configured image, then builds from source when it is absent. The default `codestartrack-frontend:local` is a local build tag, not a published image. An initial registry lookup warning can precede the local build. `pull_policy: missing` reuses an existing non-`latest` image; it never forces a rebuild of an image already pulled. A later source update using the local build tag requires an explicit `docker compose build frontend` before `docker compose up -d`.

Compose explicitly injects `BACKEND_BASE_URL` and rejects an empty value before starting. Next.js local-development `.env.local` is **not** Compose input. `.env.example` is shared documentation for the two workflows; the Compose-only variables do not configure browser code. `.dockerignore` permits only build inputs and excludes all real env files, Git, dependencies, tests and generated output from the context.

Check startup without printing environment values:

```bash
docker compose config --quiet
docker compose ps
docker compose logs --tail=50 frontend
```

Open the configured frontend URL. `/` performs no training read; `/profile` reads E1, and `/practice` reads E1 then E2 through the fixed gateway routes for Demo learner 1. Navigation within the workspace reuses loaded data. The legacy `/dashboard` redirects to `/practice`. No account binding, synchronization or catalogue preparation occurs.

## Health and runtime changes

The bounded Node-based healthcheck performs only `GET http://127.0.0.1:3000/api/health`, returning `{ "status": "ok" }`. It needs neither curl nor a backend connection and exposes no configuration. It indicates process liveness, not backend availability, learner data or catalogue readiness. `restart: unless-stopped` restarts exited processes; Docker does not automatically restart a running container solely because its health status becomes unhealthy.

Changing the ignored `.env` or shell `BACKEND_BASE_URL`, then running `docker compose up -d`, recreates the service with the same image and new runtime destination. `docker compose restart` alone does not apply changed environment configuration. No JavaScript rebuild is required. Missing/invalid configuration or inaccessible backend data stays a visible, safe error; never repair it with E3/E4/E5.

For HTTPS, put this service behind the operator's existing trusted TLS reverse proxy and forward the same frontend origin, including `/api/training/*`. DNS, certificate provisioning and reverse-proxy deployment are operator prerequisites outside V01-08. Browsers then use HTTPS only; a configured HTTP upstream is a separate server-to-server hop and remains unencrypted. Backend CORS changes or browser security exceptions are unnecessary.

## Published images and rollback

Image publishing and registry credentials are not implemented or provisioned by this repository. When an operator supplies a published immutable GHCR tag/digest and access, set `FRONTEND_IMAGE` to that exact reference in the ignored Compose configuration. Record the previous reference and runtime settings before changing a release.

```bash
docker compose pull frontend
# Continue only after pull succeeds:
docker compose up -d
```

The pulled image is reused; there is no `pull_policy: build`, development command or source mount. Avoid mutable `latest` references. If registry credentials are required, the operator handles authentication outside the repository. Do not continue after a failed pull and silently fall back to a local source build for an intended published release.

To roll back, restore the previous immutable `FRONTEND_IMAGE` reference and its compatible runtime settings, pull that image if it is absent locally, and run `docker compose up -d`. Confirm health and perform only the permitted GET smoke checks. No database migration or backend write belongs to frontend deployment/rollback. Keep old images available until release acceptance; do not prune shared Docker resources automatically.

## Isolated container acceptance

Run the normal quality checks and offline E2E suite first, then:

```bash
pnpm test:container
```

This separate command requires Docker/Compose and free host port 3300. It builds the production image once and runs it against two synthetic fixtures on an internal Docker network with no Internet route. Test services and read-only fixture mounts live only in `tests/container/compose.yml`; the root production Compose file contains only the frontend. Each run has its own Compose project and tears it down afterward. The local test images/build cache remain available for subsequent runs; no registry publishing or shared Docker cleanup occurs.

The verifier checks required configuration, the actual filtered Docker context, non-root startup, standalone/public/static files, restart/health settings, exact GET-only upstream calls, local method rejection, safe errors and health while both fixtures are stopped. It compares image IDs and delivered asset hashes after changing runtime destinations. Both product pages run through a test HTTPS reverse proxy in a disposable Linux browser container. A temporary CA is trusted only in that container's NSS store; a negative control verifies that an untrusted certificate is still rejected. There is no `ignoreHTTPSErrors: true`, certificate bypass, disabled web security, host trust-store change or CORS allowance. Browser requests are guarded to the HTTPS frontend origin. Canceled Next.js Flight navigation streams are recorded separately only when client navigation completes without a full-page fallback; API/static failures and runtime errors still fail acceptance. Runtime evidence is written to ignored `test-results/container-evidence.json`.

The browser test tool image uses the same pinned Playwright version as the repository plus NSS certificate tooling; neither enters the production image. Dependency/image installation needs network access before the isolated runtime starts. The standard 3100–3102 offline E2E servers remain separate and do not require Docker.

## Live acceptance remains V01-09

Local synthetic acceptance does not establish a deployed live release. V01-09 still requires an agreed frontend target/origin, operator access, runtime network reachability, an immutable release reference where published images are used, and an owner confirming existing Demo learner/catalogue readiness. Record the image ID, origin, date and actual E1/E2 status through the gateway when those prerequisites exist. Do not copy live response bodies into tests or documentation. Do not infer catalogue completeness from one successful recommendation, run E3/E4/E5, or create a deployment target by assumption.
