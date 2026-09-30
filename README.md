# codeStartrack Frontend

**码练星轨 (codeStartrack)** V0.1: one unified training profile and one source-aware recommendation for a shared Demo learner.

`/` explains the read-only Demo and opens `/dashboard`. The dashboard shows supported metrics and one recommendation, with the backend’s early-placeholder limitation visible. Account binding/synchronization, account discovery and multiple-account support remain deferred or API-blocked.

## Requirements

- Node.js 24 LTS (`.nvmrc` and `package.json` engines).
- pnpm 12.8.1 (pinned in `package.json`).

## Local development

```bash
nvm use
npm install --global pnpm@12.8.1
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. The entry, build and tests need no live backend. The two gateway reads require server-side runtime configuration as described below.

The existing Geist fonts use `next/font/google`: the first development compilation and production builds require access to Google Fonts. Next.js serves the downloaded fonts locally to browsers.

## Read-only backend setup

Create `.env.local` from `.env.example` only if no local file exists, then set `BACKEND_BASE_URL` to the intended absolute HTTP(S) backend origin. Preserve unrelated local settings. No credentials, path, query or fragment are accepted; one trailing slash is allowed. Keep the value server-only and restart the server after changing its environment. Do not use a `NEXT_PUBLIC_*` backend variable, a source-code fallback or `next.config` environment mapping. `.env.local` remains ignored; the committed example leaves the backend empty and supplies neutral Compose defaults.

The Next.js server selects `DEMO_USER_ID = 1` from `src/lib/api/config.server.ts`:

| Browser request on the Next.js origin | Only allowed upstream request              |
| ------------------------------------- | ------------------------------------------ |
| `GET /api/training/profile`           | `GET /api/users/1/profile`                 |
| `GET /api/training/recommendation`    | `GET /api/users/1/recommendations?limit=1` |

The browser never contacts the backend directly. Both routes use request-time, uncached server reads, an 8-second timeout covering headers/body, no automatic retries and no redirects. They do not accept user/destination/query/body overrides or forward browser credentials. POST/PUT/PATCH/DELETE/HEAD are rejected locally; OPTIONS is local only. Never send these methods to the live backend, and never activate binding, synchronization or catalogue operations (E3/E4/E5).

Missing configuration fails locally with a safe 500 error and no upstream request. See [the frontend gateway contract](docs/product/api-contract.md#implemented-frontend-get-boundary-v01-01) for data validation and error categories. The dashboard calls these same-origin routes only; the entry never fetches training data.

Build independently of a backend value, even if this machine has a local live configuration:

```bash
BACKEND_BASE_URL= pnpm build
```

Use `pnpm start` to copy static assets beside the local standalone server and start it with Node; set `BACKEND_BASE_URL` in that server process's runtime environment. The same build can target another backend after restart without rebuilding browser JavaScript. For Docker, use the production standalone server and explicit Compose runtime configuration described in [deployment instructions](docs/development/deployment.md).

## Production with Docker Compose

Docker Engine and Compose v2+ are required. Create an ignored `.env` from `.env.example` if no `.env` exists, set its server-only `BACKEND_BASE_URL`, then run:

```bash
docker compose up -d
```

This builds the image on first use and starts the non-root standalone Node server at <http://localhost:3000>. `.env.local` is not Compose input. A later backend change takes effect with `docker compose up -d` without rebuilding browser JavaScript. `/api/health` reports frontend liveness only. See [deployment and rollback](docs/development/deployment.md) for host ports, TLS entry points, immutable images, and isolated container verification. Live deployment acceptance remains gated by operator readiness in V01-09.

## Commands

| Command               | Purpose                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`            | Start the Next.js development server                                                  |
| `pnpm build`          | Create the production build                                                           |
| `pnpm start`          | Serve an existing production build                                                    |
| `pnpm lint`           | Run ESLint with no warnings allowed                                                   |
| `pnpm format`         | Format source, tests, configuration, workflows, README, and execution plans           |
| `pnpm format:check`   | Check the same formatting scope without writing                                       |
| `pnpm typecheck`      | Generate Next.js route types, then run strict TypeScript checking                     |
| `pnpm test`           | Run Vitest once                                                                       |
| `pnpm test:watch`     | Run Vitest in watch mode                                                              |
| `pnpm test:e2e`       | Run Playwright against the production build                                           |
| `pnpm test:container` | Build and verify production containers against isolated fixtures and trusted test TLS |

Formatting intentionally leaves imported product/development prose and installed agent skills untouched. Generated output and lockfiles are excluded.

## Verification

Install the Chromium browser once (Linux also needs system dependencies):

```bash
pnpm exec playwright install chromium
# Linux / CI:
pnpm exec playwright install --with-deps chromium
```

Run the full validation sequence:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright starts and stops three production instances of the same build on `127.0.0.1:3100–3102`, with isolated synthetic upstreams on `127.0.0.1:3210–3212`; keep those six ports available. The third app deliberately has no backend configuration. Explicit runtime environment values prevent the harness from using any local live backend configuration. Rebuild before testing application changes. Desktop/mobile coverage includes both locales, keyboard entry/navigation, delayed/zero/empty/error/timeout states, scoped retry, retained previous data, missing configuration, responsive width and text zoom. Browser requests are guarded to same-origin GETs; service workers are blocked. A test-only server preload terminates the harness on unexpected destinations/methods, while the upstream records actual requests. External navigation is fulfilled synthetically only on an explicit test click. Desktop gateway tests exercise actual Next.js dispatch, both runtime destinations, same-origin browser reads, zero-forwarding negative requests, redirects/errors/timeouts and host isolation. A throwaway app checks that Next.js compilation rejects a Client Component importing the private backend client; it does not alter the production build. Failures retain traces in `test-results/` and an HTML report in `playwright-report/`.

If your shell uses an HTTP proxy, exclude loopback addresses from proxying so Playwright can detect its local server. Preserve any existing exclusions:

```bash
NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost" \
no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost" pnpm test:e2e
```

Unit tests live beside source files as `*.test.ts(x)` and run in jsdom with Testing Library matchers and automatic cleanup. Browser tests live in `tests/e2e/` and are excluded from Vitest discovery. Use E2E tests for asynchronous Server Components.

## Source structure

```text
src/
  app/                 Read-only entry, dashboard, API routes, global styles
  components/layout/   Locale context and compact language/header control
  lib/i18n/            Bilingual messages, locale and formatting helpers
  components/ui/       Existing shadcn Base UI / Nova primitives
  lib/utils.ts         Existing shared class-name helper (shadcn alias)
tests/
  setup.ts             Vitest DOM matchers and cleanup
  e2e/                 Playwright browser tests
```

`src/lib/api/` now contains the private GET client/runtime configuration/gateway handlers and separate browser-safe schemas/error types. Only the two explicit route handlers may invoke this private client. Add query helpers under `src/lib/query/`, shared chart helpers under `src/lib/charts/`, and hooks, types, layout, or feature components only when real consumers require them. Keep route-specific code alongside its route.

The approved data/form/chart libraries are already installed: TanStack Query, Zod, React Hook Form with Zod resolvers, and Apache ECharts. The Query provider is scoped to `/dashboard`, with user-scoped cache keys and automatic retry/polling/focus/reconnect refetch disabled. Form and chart libraries remain unused.

Preserve strict TypeScript, Server Components by default, Tailwind CSS, Lucide React, and the existing shadcn Base UI / Nova configuration. Chinese (`zh-CN`) is the default, with English on the same routes. A host-only `codestartrack_locale` cookie stores only the presentation preference; switching does not refetch training data.

## CI and repository workflow

The CI workflow runs installation, lint, formatting, type checking, unit tests, production build, and Playwright on pushes to `dev` and pull requests to `dev` and `main`. Browser reports are uploaded on failure.

For the current V0.1 workflow, implement directly on `dev`, validate/review each completed stage, commit it separately and push immediately to `origin/dev`. Keep `main` untouched; no feature branch or PR is required for this exception. See [repository management](docs/development/repository-management.md), [coding standards](docs/development/coding-standards.md), and [the approved stack](docs/architecture/tech-stack.md).

The initial remote `dev` branch was created from the unchanged `main` commit for the separate frontend baseline PR. Maintainers still need to configure GitHub branch protection to require the `quality` CI job; baseline preparation does not change protection settings or deploy the app.

## Product and API readiness

[Backend API v0.1](docs/product/apidocs.md) is now available. It documents five external-account, sync, profile, and recommendation endpoints; skill scores and recommendations are explicitly placeholders. The documented APIs do not yet cover the internal Demo V2 judging, hints, training records, or coach loop.

See the [requirement matrix](docs/product/product-requirements.md), [page specifications](docs/product/page-structure.md), [API contract and gaps](docs/product/api-contract.md), and [design direction](docs/product/design-system.md) before planning implementation. These documents distinguish existing contracts from unresolved requirements; they do not authorize frontend mocks or invent missing endpoints.
