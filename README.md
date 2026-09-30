# codeStartrack Frontend

Frontend engineering foundation for **码练星轨 (codeStartrack)**: programming practice + Agent assistance.

The root route remains a minimal branded placeholder. V01-01 adds a server-only GET gateway for the existing Demo profile and recommendation; product UI is not implemented yet.

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

Open <http://localhost:3000>. The placeholder, build and tests need no live backend. The two gateway reads require server-side runtime configuration as described below.

The existing Geist fonts use `next/font/google`: the first development compilation and production builds require access to Google Fonts. Next.js serves the downloaded fonts locally to browsers.

## Read-only backend setup

Create `.env.local` from `.env.example` only if no local file exists, then set `BACKEND_BASE_URL` to the intended absolute HTTP(S) backend origin. Preserve unrelated local settings. No credentials, path, query or fragment are accepted; one trailing slash is allowed. Keep the value server-only and restart the server after changing its environment. Do not use a `NEXT_PUBLIC_*` backend variable, a source-code fallback or `next.config` environment mapping. `.env.local` remains ignored; the committed example contains only `BACKEND_BASE_URL=`.

The Next.js server selects `DEMO_USER_ID = 1` from `src/lib/api/config.server.ts`:

| Browser request on the Next.js origin | Only allowed upstream request              |
| ------------------------------------- | ------------------------------------------ |
| `GET /api/training/profile`           | `GET /api/users/1/profile`                 |
| `GET /api/training/recommendation`    | `GET /api/users/1/recommendations?limit=1` |

The browser never contacts the backend directly. Both routes use request-time, uncached server reads, an 8-second timeout covering headers/body, no automatic retries and no redirects. They do not accept user/destination/query/body overrides or forward browser credentials. POST/PUT/PATCH/DELETE/HEAD are rejected locally; OPTIONS is local only. Never send these methods to the live backend, and never activate binding, synchronization or catalogue operations (E3/E4/E5).

Missing configuration fails locally with a safe 500 error and no upstream request. See [the frontend gateway contract](docs/product/api-contract.md#implemented-frontend-get-boundary-v01-01) for data validation and error categories. These technical routes do not add a dashboard or other product UI.

Build independently of a backend value, even if this machine has a local live configuration:

```bash
BACKEND_BASE_URL= pnpm build
```

Use `pnpm start` for the production server and set `BACKEND_BASE_URL` in that server process's runtime environment. The same build can target another backend after restart without rebuilding browser JavaScript. Docker standalone output, Compose, container health and `node server.js` belong to V01-08; they are not implemented yet. Compose's future `.env` must explicitly inject the variable into the container rather than relying on Next.js's local `.env.local` behavior.

## Commands

| Command             | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`          | Start the Next.js development server                                        |
| `pnpm build`        | Create the production build                                                 |
| `pnpm start`        | Serve an existing production build                                          |
| `pnpm lint`         | Run ESLint with no warnings allowed                                         |
| `pnpm format`       | Format source, tests, configuration, workflows, README, and execution plans |
| `pnpm format:check` | Check the same formatting scope without writing                             |
| `pnpm typecheck`    | Generate Next.js route types, then run strict TypeScript checking           |
| `pnpm test`         | Run Vitest once                                                             |
| `pnpm test:watch`   | Run Vitest in watch mode                                                    |
| `pnpm test:e2e`     | Run Playwright against the production build                                 |

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

Playwright starts and stops two production instances of the same build on `127.0.0.1:3100/3101`, with isolated synthetic upstreams on `127.0.0.1:3210/3211`; keep those four ports available. Explicit runtime environment values prevent the harness from using any local live backend configuration. Rebuild before testing application changes. Smoke tests cover desktop and mobile Chromium, page metadata, the default Chinese document language, responsive width, and browser errors. Desktop gateway tests exercise actual Next.js dispatch, both runtime destinations, same-origin browser reads, zero-forwarding negative requests, redirects/errors/timeouts and host isolation. A throwaway app checks that Next.js compilation rejects a Client Component importing the private backend client; it does not alter the production build. Failures retain traces in `test-results/` and an HTML report in `playwright-report/`.

If your shell uses an HTTP proxy, exclude loopback addresses from proxying so Playwright can detect its local server. Preserve any existing exclusions:

```bash
NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost" \
no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost" pnpm test:e2e
```

Unit tests live beside source files as `*.test.ts(x)` and run in jsdom with Testing Library matchers and automatic cleanup. Browser tests live in `tests/e2e/` and are excluded from Vitest discovery. Use E2E tests for asynchronous Server Components.

## Source structure

```text
src/
  app/                 App Router layout, root placeholder, global styles
  components/ui/       Existing shadcn Base UI / Nova primitives
  lib/utils.ts         Existing shared class-name helper (shadcn alias)
tests/
  setup.ts             Vitest DOM matchers and cleanup
  e2e/                 Playwright browser tests
```

`src/lib/api/` now contains the private GET client/runtime configuration/gateway handlers and separate browser-safe schemas/error types. Only the two explicit route handlers may invoke this private client. Add query helpers under `src/lib/query/`, shared chart helpers under `src/lib/charts/`, and hooks, types, layout, or feature components only when real consumers require them. Keep route-specific code alongside its route.

The approved data/form/chart libraries are already installed: TanStack Query, Zod, React Hook Form with Zod resolvers, and Apache ECharts. The static root page does not need a provider. Introduce `QueryClientProvider` at the first client-query boundary; form and chart libraries need no app-wide provider.

Preserve strict TypeScript, Server Components by default, Tailwind CSS, Lucide React, and the existing shadcn Base UI / Nova configuration. The placeholder defaults to `zh-CN`; full `zh-CN` / `en` localization belongs to future product work.

## CI and repository workflow

The CI workflow runs installation, lint, formatting, type checking, unit tests, production build, and Playwright on pull requests to `dev` and `main`. Browser reports are uploaded on failure.

Create task branches from `dev` and target normal pull requests to `dev`; releases target `main`. See [repository management](docs/development/repository-management.md), [coding standards](docs/development/coding-standards.md), and [the approved stack](docs/architecture/tech-stack.md).

The initial remote `dev` branch was created from the unchanged `main` commit for the separate frontend baseline PR. Maintainers still need to configure GitHub branch protection to require the `quality` CI job; baseline preparation does not change protection settings or deploy the app.

## Product and API readiness

[Backend API v0.1](docs/product/apidocs.md) is now available. It documents five external-account, sync, profile, and recommendation endpoints; skill scores and recommendations are explicitly placeholders. The documented APIs do not yet cover the internal Demo V2 judging, hints, training records, or coach loop.

See the [requirement matrix](docs/product/product-requirements.md), [page specifications](docs/product/page-structure.md), [API contract and gaps](docs/product/api-contract.md), and [design direction](docs/product/design-system.md) before planning implementation. These documents distinguish existing contracts from unresolved requirements; they do not authorize frontend mocks or invent missing endpoints.
