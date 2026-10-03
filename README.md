# codeStartrack Frontend

**码练星轨 (codeStartrack) V0.12** unifies the visual system and adds public product pages and Storybook component documentation while retaining the V0.11 backend contract. It uses Next.js App Router, Tailwind, shadcn Base UI / Nova, Lucide and bilingual Chinese/English UI.

The public landing page and `/demo` use local illustrations and synthetic fixtures. Workspace shells, including `/practice`, are browsable without login. Personal data and actions require a backend Session and the `STUDENT` role; visitors see login prompts within those panels. Empty responses preserve card/list structure; failed reads show safe placeholders, a visible error and retry without blocking navigation:

| Route                                    | Purpose                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `/product`                               | Public product capabilities and the current training loop                          |
| `/product/profile`                       | Illustrative profile and guidance for interpreting account evidence                |
| `/product/recommendations`               | Public recommendation modes and a clearly labeled synthetic example                |
| `/about`                                 | Product principles, current capabilities and future boundaries                     |
| `/dashboard`                             | All-bound-CF-account totals/list and account-specific next action                  |
| `/data`                                  | Windowed overview, attempted problems, submissions and rating changes              |
| `/profile`                               | Six-dimensional account profile on a fixed 0–100 scale                             |
| `/analysis`                              | Four analysis windows and immutable snapshot history                               |
| `/practice`                              | Three recommendation modes, explicit generation and batch history                  |
| `/accounts`                              | Multiple CF bindings, synchronization, unbinding and read-only historical bindings |
| `/security`                              | Identity, account action links and session logout                                  |
| `/security/password`, `/security/email`  | Independent identity-verified change flows and reauthentication                    |
| `/login`, `/register`, `/reset-password` | Captcha and email-code authentication flows                                        |

## Contract and architecture

The V0.11 sources are [frontend API](prompts/前端api文档.md) and [frontend data model](prompts/前端需要知道的数据库.md). Older V0.1 product documents remain historical; the active integration summary is [API contract](docs/product/api-contract.md).

Every browser API request uses same-origin `/api/v1/**` and `credentials: "include"`. There are no browser tokens, fixed demo-user API calls, database connections, Algorithm calls or Codeforces data API calls. Problem URLs are navigation links supplied by the backend.

`src/lib/api/` contains validated DTOs and the API client. Query keys include `publicId`, `accountId`, resource and every window/mode/page/filter parameter. IDs remain decimal strings, including values larger than JavaScript's safe integer range. Switching accounts cancels old detail reads and remounts account-specific page state; portfolio reads remain scoped to all owned bindings; unbinding removes that binding's cache; logout clears all private caches. Mutation results are checked against the initiating user before updating state.

The dashboard sums only additive counts for one analysis window. Solved problems are labeled as account occurrences because cross-account overlap is not deduplicated. Rating, ability and recommendations stay account-specific. Compact detail metrics precede reusable ECharts visuals; desktop navigation collapses to labeled icons and restores its optional preference.

For Codex CLI setup, MCP/Skills, portable GitHub CLI and offline browser review,
see [the project environment guide](docs/development/codex-cli.md).

## Development

Use Node.js 24 LTS and pnpm 12.8.1:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000). For local integration, set the server-only `BACKEND_BASE_URL` to an HTTP(S) backend origin in an ignored `.env.local`. Preserve existing local settings. The development proxy forwards only `/api/v1/**`; the production default is `http://backend:8081`. The backend must implement V0.11 and validate `Origin` against its configured `PUBLIC_ORIGIN`.

The existing Geist fonts use `next/font/google`, so the first build requires font download access. No API server is needed at build time. Static HTML defaults to Chinese; the saved display locale is restored in the browser.

For development without a backend, use the explicit local Mock:

```bash
pnpm dev:mock
# Or, after building:
pnpm preview:mock
MOCK_SCENARIO=empty pnpm preview:mock
```

The shared Mock API labels synthetic data and serves all V0.11 endpoint families.
See the [Mock runbook and endpoint audit](docs/development/mock-api-audit.md) for
failure/empty scenarios, fixture semantics, authentication limitations and all 31
endpoint consumers. Live failures never automatically select synthetic data.

## Component documentation

```bash
pnpm storybook
# http://127.0.0.1:6006
pnpm build-storybook
pnpm test:storybook
```

Storybook contains 73 states across 12 component groups, including real primitives,
charts, account profiles and recommendations. It shares production tokens, fonts,
providers and locale behavior. CI tests the standalone build and preserves a
deployable `storybook-static-<commit>` artifact for 14 days. See the
[Storybook guide](docs/development/storybook.md) for coverage and contribution rules.

## Build and serve

```bash
BACKEND_BASE_URL= pnpm build
BACKEND_BASE_URL=http://backend:8081 pnpm start
```

Next.js emits static files to `out/`. The local Node HTTP server serves those files and proxies the same API prefix. Production Docker runs nginx on port 80, proxies `/api/v1/**` without stripping the path or Origin and uses a 30-second upstream read timeout. Deep links resolve exported route HTML before the `index.html` fallback. `/healthz` checks frontend liveness without contacting the backend. Other `/api/` paths return 404.

```bash
docker compose up --build -d
```

See [deployment](docs/development/deployment.md) for deployment and rollback. No live backend writes are performed by the validation suite.

## Checks

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build-storybook
pnpm test:storybook
pnpm test:container
```

E2E uses the production export, a local HTTP proxy on `127.0.0.1:3100` and a synthetic V0.11 backend on `127.0.0.1:3210`. It never uses `.env.local` to choose an upstream. Desktop/mobile tests cover locale, keyboard and narrow layouts, authentication, bigint IDs, delayed account switching, unbinding, readonly history, analysis windows, nullable data, recommendation idempotency and task states. They also cover partial portfolio failures, sidebar persistence and independent password/email verification. Browser network guards reject external requests and old API paths. Container checks require a running Docker daemon.

The [execution plan](.agent/plans/v0.11-frontend.md) records migration decisions, validation and remaining integration risks. Real backend compatibility, mail delivery, provider sync and Algorithm operation must still be verified against the deployed V0.11 services.

## Production deployment

The verified V0.12.0 image is published to GHCR; this release does not replace the
production frontend automatically. See the [production deployment guide](docs/deployment/frontend-production-deployment.md)
for the inspected server topology, immutable image receipt, frontend-only upgrade
commands and V0.11.0 rollback.
