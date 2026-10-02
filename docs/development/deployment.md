# V0.11 frontend deployment

The repository remains a Next.js App Router project. Production uses `output: "export"`: all pages are static assets, while nginx owns the same-origin API proxy. The old standalone Node gateway is superseded.

## Build and service boundaries

The multi-stage Dockerfile installs the pinned pnpm dependencies, runs the production build and copies only `out/` plus the nginx template to the runtime image. `.dockerignore` excludes private env files, repository metadata, tests, dependencies and generated build output. Existing dependency mirror settings are retained.

The service listens on port 80. The default upstream is `http://backend:8081`, configurable through the server-only `BACKEND_BASE_URL` environment variable as an origin without a trailing path. Docker Compose maps host port 3000 to container port 80 unless `FRONTEND_PORT` is set.

```bash
docker compose up --build -d
```

`deploy/default.conf.template` forwards `/api/v1/**` preserving the complete path, Origin and Cookie. It retains a trusted outer proxy's HTTPS forwarding header and adds Secure, HttpOnly and SameSite=Lax to the `cst_session` response cookie. Only isolated local HTTP testing may set `FRONTEND_COOKIE_SECURE=false`; this never removes an upstream Secure flag. The upstream read timeout is 30 seconds. There is no database/Algorithm/Codeforces proxy. Other `/api/` paths return 404. `/healthz` returns frontend liveness independent of backend readiness. Static route HTML is tried before the `index.html` fallback; fingerprinted assets are cached and HTML is revalidated.

The backend must configure `PUBLIC_ORIGIN` to the browser-facing origin and set the documented HttpOnly Session cookie. Deploy production behind HTTPS and require `Secure` cookies. A local HTTP backend may explicitly use its documented development cookie setting. Do not rewrite or remove Origin to bypass backend checks.

## Local production preview

```bash
BACKEND_BASE_URL= pnpm build
BACKEND_BASE_URL=http://127.0.0.1:8081 pnpm start
```

The small Node server in `scripts/start.mjs` serves the same static output and proxies only `/api/v1/**`. It is also exercised by offline E2E tests. No API call happens during static generation. The backend URL is runtime-only in production and never emitted into browser bundles.

Static HTML defaults to zh-CN; the browser restores the saved locale after hydration. Authentication and private account reads are client-side Session operations. Unknown dynamic IDs are requested through the API, not encoded as build-time page routes.

## Validation and rollback

Run the standard lint, format, typecheck, unit, build and E2E scripts. `pnpm test:container` requires a running Docker daemon and uses a synthetic backend on an internal container network. It verifies exported routes, API proxy headers/cookies, forbidden legacy paths and frontend health without live services.

The fixture reads the installed pure-JavaScript Zod package and fixture/API modules through read-only bind mounts. A Docker-only relay exposes the shared Mock service within the internal test network while keeping its loopback-only binding guard intact. No backend port is published. Cleanup never deletes volumes; failed runs print container logs before removing their own containers.

Deploy immutable image tags. Roll back by setting `FRONTEND_IMAGE` to the previous compatible image and recreating the frontend. V0.1 and V0.11 use different backend contracts; frontend rollback alone does not make a V0.11 backend compatible with the historical fixed-user API. No frontend migration changes database records.

## Production target verified on 2026-10-03

- Connect only using `ssh startrack-prod`. `startrack-app` uses host networking and listens on 8081. Do not recreate or reconfigure it.
- The existing HTTPS ingress for `acm.qlluck.com` forwards to `127.0.0.1:3000`. Keep this binding and all existing ingress/WAF configuration.
- Use the standalone `deploy/compose.production.yml`: host port 3000 maps to nginx port 80, and `host.docker.internal:host-gateway` reaches the existing backend. A literal `backend` service name is not resolvable in this topology.
- Backend `PUBLIC_ORIGIN` already includes `https://acm.qlluck.com`. Its current `COOKIE_SECURE=false` is compensated by frontend cookie hardening. The backend configuration remains unchanged; direct backend access is outside this mitigation.
- `/doc.html` and `/v3/api-docs` were read through a loopback SSH tunnel. All 31 frontend operations match the live V0.11 path/method inventory; 14 DTO schemas (377 nested field checks) have matching names and non-null wire types. Generated OpenAPI omits most requiredness, nullability and enum details; the explicit V0.11 DTO document remains necessary for those constraints.
- Live validation uses GET only. `/health` returns 200 and unauthenticated `/api/v1/me` returns the expected 401 `SESSION_EXPIRED` envelope. Authentication, email, security changes, binding, synchronization and generation are tested only with the isolated fixture, not production records.
- Algorithm service is absent. Keep the documented endpoints and existing null/error/partial-sync states; do not block other integration or claim real analysis results.

Read-only local tunnel:

```bash
ssh -o ExitOnForwardFailure=yes -N \
  -L 127.0.0.1:18081:127.0.0.1:8081 startrack-prod
curl --noproxy '*' http://127.0.0.1:18081/health
```

Local Docker should target that tunnel through the container runtime's host gateway. Never publish a new server port for testing. Always inspect the runtime's actual connectivity; host gateway behavior differs between Docker Desktop, Colima and Linux.

## Publishing and replacing the frontend

After local checks, review the complete diff, commit/push `dev`, and merge it into `main`. The explicit production task authorizes that merge. CI checks both branches. Run the `Publish production image` workflow on `main`; it repeats quality/E2E checks and builds from that commit using a temporary Actions `GITHUB_TOKEN` with `packages: write`. No developer PAT is stored or copied to the server.

The workflow publishes `ghcr.io/star-ability/code-startrack-frontend:v<package-version>` and `sha-<full-main-commit>`, adds OCI source/revision labels, and refuses to overwrite an existing version. Increment the package version for subsequent releases. Deploy the returned digest, not an unpinned `latest` tag.

Before replacement, save the old frontend inspect output and frontend Compose/env files in a restricted backup directory. Keep the old image. Install the production Compose file in a separate frontend-only deployment directory and validate its rendered configuration. Pull the new GHCR digest before removing the specifically authorized old container `code-startrack-frontend-frontend-1`. Recreate only the frontend; never invoke project-wide cleanup against backend services and never delete volumes.

Verify container health, startup/access/error logs, exported pages and assets, same-origin unauthenticated API responses, and the existing HTTPS ingress. Use a GET-only browser guard for live pages: login pages automatically request a captcha with POST, so block that request during read-only acceptance. Authenticated business flows remain fixture-verified until a separately authorized production test is available.

The public ingress returned HTTP 468 to automated HTTP probes before deployment. Preserve the WAF and report any continuing public-access restriction separately from the frontend container and local ingress checks.
