# codeStartrack Frontend

**码练星轨 (codeStartrack) V0.13.3** renders evolving backend algorithm versions with strong structural validation and refines profiles, recommendations, dashboards, charts and collaboration workspaces. It preserves confirmed settings after failed refreshes and uses keyboard-safe team confirmations. It retains multi-account data, frozen reports, coach tools, privacy and notifications. It uses Next.js App Router, Tailwind, shadcn Base UI / Nova, Lucide and bilingual Chinese/English UI.

The public landing page and `/demo` use local illustrations and synthetic fixtures. Workspace shells, including `/practice`, are browsable without login. Personal data and actions require a backend Session and the `STUDENT` role; visitors see login prompts within those panels. Empty responses preserve card/list structure; failed reads show safe placeholders, a visible error and retry without blocking navigation:

| Route                                           | Purpose                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/product`                                      | Public product capabilities and the current training loop                          |
| `/product/profile`                              | Illustrative profile and guidance for interpreting account evidence                |
| `/product/recommendations`                      | Public recommendation modes and a clearly labeled synthetic example                |
| `/about`                                        | Product principles, current capabilities and future boundaries                     |
| `/dashboard`                                    | Backend-owned personal aggregate, reports, teams and notifications                 |
| `/data`                                         | Windowed overview, attempted problems, submissions and rating changes              |
| `/profile`                                      | Six-dimensional multi-account user profile and source ratings                      |
| `/analysis`                                     | Current and frozen historical personal reports                                     |
| `/accounts/profile`, `/accounts/analysis`       | Single-account ability and analysis history                                        |
| `/teams`, `/teams/detail`, `/teams/member`      | Team participation, authorized management and independently shared member data     |
| `/privacy`, `/notifications`                    | Independent privacy scopes and notification center                                 |
| `/coach`, `/coach/teams`, `/coach/teams/create` | Additive coach dashboard and team management                                       |
| `/security/coach`                               | Coach invite-code redemption                                                       |
| `/practice`                                     | Three recommendation modes, explicit generation and batch history                  |
| `/accounts`                                     | Multiple CF bindings, synchronization, unbinding and read-only historical bindings |
| `/security`                                     | Identity, account action links and session logout                                  |
| `/security/password`, `/security/email`         | Independent identity-verified change flows and reauthentication                    |
| `/login`, `/register`, `/reset-password`        | Captcha and email-code authentication flows                                        |

## Contract and architecture

The baseline contracts are [V0.11 API](prompts/前端api文档.md) and [V0.11 data model](prompts/前端需要知道的数据库.md). The [V0.12 API](prompts/V0.12-前端api文档.md) and [V0.12 data model](prompts/V0.12-前端需要知道的数据库.md) define the new functionality and override personal aggregate behavior. The current [V0.13.1 integration audit](docs/development/v0.13-integration.md) compares the running OpenAPI contract and responses with frontend validation. The [V0.12 integration guide](docs/development/v0.12-integration.md) remains the functional and cache-boundary baseline.

Every browser API request uses same-origin `/api/v1/**` and `credentials: "include"`. There are no browser tokens, fixed demo-user API calls, database connections, Algorithm calls or Codeforces data API calls. Problem URLs are navigation links supplied by the backend.

`src/lib/api/` contains validated DTOs and the API client. Private query keys contain `publicId`; account reads additionally contain `accountId`, and team reads contain `teamId` with audience where applicable. Every window/mode/page/filter participates in its key. Backend bigint IDs remain decimal strings, including values larger than JavaScript's safe integer range; V0.12 public resource IDs remain UUID strings. Switching accounts cancels old detail reads and remounts account-specific page state; the binding inventory remains user-scoped; unbinding removes that binding's cache; logout clears all private caches. Mutation results are checked against the initiating user before updating state.

The dashboard and personal profile use backend-owned, deduplicated user analysis. Report history uses frozen snapshots. Selected accounts affect account pages; team IDs live in route query parameters, preserving static export. Team/member capabilities come from backend DTOs and all recommendation caches include audience.

## Development

Use Node.js 24 LTS and pnpm 12.8.1:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000). For local integration, set the server-only `BACKEND_BASE_URL` to an HTTP(S) backend origin in an ignored `.env.local`. Preserve existing local settings. The development proxy forwards only `/api/v1/**`; the production default is `http://backend:8081`. The backend must implement V0.11 and V0.12 and validate `Origin` against its configured `PUBLIC_ORIGIN`.

The existing Geist fonts use `next/font/google`, so the first build requires font download access. No API server is needed at build time. Static HTML defaults to Chinese; the saved display locale is restored in the browser.

For development without a backend, use the explicit local Mock:

```bash
pnpm dev:mock
# Or, after building:
pnpm preview:mock
MOCK_SCENARIO=empty pnpm preview:mock
```

The development Mock binds its own available loopback port and prints its `/__control` URL; `MOCK_PORT=3210 pnpm dev:mock` selects an explicit port when needed. Its proxy always overrides `BACKEND_BASE_URL`, including local environment settings. Preview and E2E retain ports 3100/3210; stop manual previews before E2E, and stop Next development before production builds because they share `.next` outputs.

The shared Mock labels synthetic data and serves the V0.11 and V0.12 endpoint families. The [scenario matrix](docs/development/v0.12-mock-scenarios.md) documents 85 deterministic presets and eight identities, shared by HTTP development, Vitest, Storybook and Playwright. Live failures never automatically select synthetic data.

## Component documentation

```bash
pnpm storybook
# http://127.0.0.1:6006
pnpm build-storybook
pnpm test:storybook
```

Storybook documents production primitives, charts, account/user profiles, frozen reports, shared member data and audience-specific team results. Interactive collaboration stories use the same mock request/state boundary for approval, privacy, invitation and confirmation workflows. It shares production tokens, fonts, locale and providers; stories never require a backend.

The [UI surface hierarchy](docs/development/ui-surface-hierarchy.md) describes the existing Card variants, semantic accents and page responsibilities. Recommendation rank and matched ability coverage come from the backend; report evidence remains separate from the current profile.

## Build and serve

```bash
BACKEND_BASE_URL= pnpm build
BACKEND_BASE_URL=http://backend:8081 pnpm start
```

Next.js emits static files to `out/`. The local Node HTTP server serves those files and proxies the same API prefix. Production Docker runs nginx on port 80, proxies `/api/v1/**` without stripping the path or Origin and uses a 30-second upstream read timeout. Deep links resolve exported route HTML before the `index.html` fallback. `/healthz` checks frontend liveness without contacting the backend. Other `/api/` paths return 404.

```bash
docker compose up --build -d
```

See [production deployment](docs/deployment/frontend-production-deployment.md) for deployment and rollback. No live backend writes are performed by the validation suite.

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

E2E uses the production export, a local HTTP proxy on `127.0.0.1:3100` and a synthetic V0.11/V0.12 backend on `127.0.0.1:3210`. It never uses `.env.local` to choose an upstream. Desktop/mobile tests cover locale, keyboard and narrow layouts, authentication, bigint IDs, delayed account switching, unbinding, readonly history, analysis windows, nullable data, recommendation idempotency and task states. They also cover frozen reports, application/invitation transitions, team lifecycle/ownership, privacy withdrawal, coach redemption and audience isolation. Browser network guards reject external requests and old API paths. Container checks require a running Docker daemon.

The [workspace execution plan](.agent/plans/v0.12-workspace-redesign.md) and [delivery report](docs/development/v0.12-workspace-delivery.md) record earlier implementation and validation. The [current integration audit](docs/development/v0.13-integration.md) distinguishes authenticated real-data verification from synthetic mutation coverage. The [independent acceptance plan](.agent/plans/v0.13.3-production-acceptance.md) describes the release work. The [canonical release tracker](https://github.com/STAR-Ability/code-startrack-frontend/issues/29) records publication, exact-image and authenticated post-deployment evidence as the respective gates complete; consult that Issue for current status.

## Production deployment

Image publication and production deployment require a separate release operation.
See the [production deployment guide](docs/deployment/frontend-production-deployment.md)
for the previously recorded image receipt, server topology and rollback procedure.
That image receipt does not verify the new frontend integration described here.
