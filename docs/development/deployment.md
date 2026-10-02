# V0.11 frontend deployment

The repository remains a Next.js App Router project. Production uses `output: "export"`: all pages are static assets, while nginx owns the same-origin API proxy. The old standalone Node gateway is superseded.

## Build and service boundaries

The multi-stage Dockerfile installs the pinned pnpm dependencies, runs the production build and copies only `out/` plus the nginx template to the runtime image. `.dockerignore` excludes private env files, repository metadata, tests, dependencies and generated build output. Existing dependency mirror settings are retained.

The service listens on port 80. The default upstream is `http://backend:8081`, configurable through the server-only `BACKEND_BASE_URL` environment variable as an origin without a trailing path. Docker Compose maps host port 3000 to container port 80 unless `FRONTEND_PORT` is set.

```bash
docker compose up --build -d
```

`deploy/default.conf.template` forwards `/api/v1/**` preserving the complete path, Origin, Cookie and Set-Cookie. The upstream read timeout is 30 seconds. There is no database/Algorithm/Codeforces proxy. Other `/api/` paths return 404. `/healthz` returns frontend liveness independent of backend readiness. Static route HTML is tried before the `index.html` fallback; fingerprinted assets are cached and HTML is revalidated.

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

Deploy immutable image tags. Roll back by setting `FRONTEND_IMAGE` to the previous compatible image and recreating the frontend. V0.1 and V0.11 use different backend contracts; frontend rollback alone does not make a V0.11 backend compatible with the historical fixed-user API. No frontend migration changes database records.
