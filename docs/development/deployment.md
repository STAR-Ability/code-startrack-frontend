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

## V0.11.0 deployment result — 2026-10-03

Deployment completed at approximately 01:07 Asia/Shanghai. The production image was built from main commit `21e763477a6380b080f3b1355791f6c8fb5e5ebc`, preserved by annotated Git tag `v0.11.0`.

| Item                     | Verified result                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Image                    | `ghcr.io/star-ability/code-startrack-frontend:v0.11.0`                                             |
| Commit tag               | `ghcr.io/star-ability/code-startrack-frontend:sha-21e763477a6380b080f3b1355791f6c8fb5e5ebc`        |
| Deployed digest          | `sha256:036c3fb29a4eec9df67cafb65acac471a1c463fb935f08841045b7fb731517f0`                          |
| Container                | `code-startrack-frontend-frontend-1`, ID `70de727ee37e`, healthy, zero restarts                    |
| Binding                  | `127.0.0.1:3000` → nginx `80`                                                                      |
| Deployment files         | `/opt/projects/code-startrack-frontend-deploy/releases/v0.11.0/`                                   |
| Original frontend backup | `/opt/projects/code-startrack-frontend-deploy/backups/pre-v0.11.0.Ax5Cvq/`                         |
| Main CI                  | [Successful run](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37036733540) |
| Image publication        | [Successful run](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37036751363) |

The `.env` in the release directory pins the complete GHCR digest. Inspect the deployment with:

```bash
ssh startrack-prod
cd /opt/projects/code-startrack-frontend-deploy/releases/v0.11.0
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml ps
```

Validation passed:

- Lint, formatting, strict typecheck, 73 unit tests and production static build.
- 110 desktop/mobile E2E passes; one intentional mobile skip of a desktop-sidebar test. The publication job independently repeated these checks.
- Full local Docker acceptance, including browser interaction, Session Cookie/Origin forwarding, Secure/HttpOnly/SameSite flags, HTTPS forwarding and frontend liveness with the fixture stopped.
- Live OpenAPI review of 31 operations and 377 nested DTO fields; 17 private GET routes returned the expected 401 envelope through SSH.
- A production canary using the exact GHCR digest passed ten pages and the backend Session check before replacing the old frontend.
- Final production browser verification passed 20 desktop/mobile page visits and three same-origin private GET checks with no page errors or horizontal overflow. Captcha POSTs were intercepted before transport; no production auth/business mutation was made.
- Existing TLS ingress returned page 200 and `/api/v1/me` 401 through SSH, with hostname and certificate validation using Cloudflare's [official Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/). No system trust-store change or insecure TLS option was used.
- nginx configuration validation passed, no nginx error-level messages were observed, and the backend container ID/image/start time, unrelated container IDs and Docker Volume inventory match the pre-deployment snapshot.

Resolved failures: the initial Docker Hub nginx pull timed out; the Docker fixture had stale source/dependency mounts and attempted to violate its loopback guard; a recommendation test clicked stale history before its refresh completed; and a GHCR nginx layer stalled at zero bytes on the server. These were corrected and revalidated. The last transfer was recovered by fetching the identical official nginx digest from ECR, then pulling the frontend from GHCR by its published digest. No registry/system configuration was changed.

Remaining acceptance limits:

- The public edge still returns SafeLine HTTP 468 to curl and the automated browser and displays a human-confirmation prompt. This predates the frontend deployment. Public edge access after human confirmation remains unverified; WAF, 1Panel and OpenResty configuration are unchanged.
- Real login, email delivery, account binding, synchronization and recommendation mutations were not run against production. Their frontend flows pass isolated fixtures; this does not prove production email/provider behavior.
- The algorithm service is absent. Analysis/recommendation endpoints and existing empty/error/partial-sync behavior remain in place, without fabricated successful results.
- Backend `COOKIE_SECURE=false` remains unchanged. The frontend enforces secure Session cookies, but direct backend access does not receive that frontend protection.
- Actions reported existing action-runtime deprecation and upcoming runner-image migration notices; all jobs passed. Updating these tool versions is separate maintenance.

The previous frontend image and original Compose/env/inspect files remain available for rollback. The authorized old container was removed only after the canary passed. Its historical V0.1 contract is incompatible with the current V0.11 backend, so restoration of that image is not evidence of functional rollback compatibility. No database, backend container, Volume or unrelated service was modified.
