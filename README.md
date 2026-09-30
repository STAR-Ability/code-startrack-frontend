# codeStartrack Frontend

Frontend engineering foundation for **码练星轨 (codeStartrack)**: programming practice + Agent assistance.

The root route is a minimal branded placeholder. Product flows and backend integration are not implemented by this bootstrap.

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

Open <http://localhost:3000>. No environment variables, credentials, or backend service are required for the bootstrap.

The existing Geist fonts use `next/font/google`: the first development compilation and production builds require access to Google Fonts. Next.js serves the downloaded fonts locally to browsers.

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

Playwright starts and stops its own production server on `127.0.0.1:3100`; keep that port available. Rebuild before testing application changes. Smoke tests cover desktop and mobile Chromium, page metadata, the default Chinese document language, responsive width, and browser errors. Failures retain traces in `test-results/` and an HTML report in `playwright-report/`.

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

Create `src/lib/api/` when documented backend integration begins. Add query helpers under `src/lib/query/`, shared chart helpers under `src/lib/charts/`, and hooks, types, layout, or feature components only when real consumers require them. Keep route-specific code alongside its route.

The approved data/form/chart libraries are already installed: TanStack Query, Zod, React Hook Form with Zod resolvers, and Apache ECharts. The static root page does not need a provider. Introduce `QueryClientProvider` at the first client-query boundary; form and chart libraries need no app-wide provider.

Preserve strict TypeScript, Server Components by default, Tailwind CSS, Lucide React, and the existing shadcn Base UI / Nova configuration. The placeholder defaults to `zh-CN`; full `zh-CN` / `en` localization belongs to future product work.

## CI and repository workflow

The CI workflow runs installation, lint, formatting, type checking, unit tests, production build, and Playwright on pull requests to `dev` and `main`. Browser reports are uploaded on failure.

Create task branches from `dev` and target normal pull requests to `dev`; releases target `main`. See [repository management](docs/development/repository-management.md), [coding standards](docs/development/coding-standards.md), and [the approved stack](docs/architecture/tech-stack.md).

The initial remote `dev` branch was created from the unchanged `main` commit for the separate frontend baseline PR. Maintainers still need to configure GitHub branch protection to require the `quality` CI job; baseline preparation does not change protection settings or deploy the app.

## Product and API readiness

[Backend API v0.1](docs/product/apidocs.md) is now available. It documents five external-account, sync, profile, and recommendation endpoints; skill scores and recommendations are explicitly placeholders. The documented APIs do not yet cover the internal Demo V2 judging, hints, training records, or coach loop.

See the [requirement matrix](docs/product/product-requirements.md), [page specifications](docs/product/page-structure.md), [API contract and gaps](docs/product/api-contract.md), and [design direction](docs/product/design-system.md) before planning implementation. These documents distinguish existing contracts from unresolved requirements; they do not authorize frontend mocks or invent missing endpoints.
