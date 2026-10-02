# Mock API and resilient workspace

## Goal

Run every existing V0.11 route and its interactions against explicit synthetic APIs, and preserve useful page/card structure when reads fail.

## Context

The authoritative DTOs and semantics are `prompts/前端api文档.md` and `prompts/前端需要知道的数据库.md`. Historical V0.1 APIs and the broader Demo V2 plan are superseded by the active V0.11 contract. The static frontend already has Zod/TanStack Query, local Demo fixtures and an incomplete HTTP test backend. README has pre-existing user edits and must be preserved. Work uses a V0.11 task branch under the normal repository workflow.

Tracking: [Issue #8](https://github.com/STAR-Ability/code-startrack-frontend/issues/8), branch `fix/mock-api-resilient-workspace`.

## Scope

### In Scope

- Audit every current route, API call, transport/schema, data state and offline test infrastructure.
- Share typed, consistent fixtures and an isolated Mock service between development, preview and E2E.
- Support documented filtering, pagination, histories, binding lifecycle, jobs and idempotency; provide named failure/empty scenarios.
- Keep cards, statistics and list controls mounted; show truthful zero/null UI defaults, visible errors and retries.
- Add focused account details and role information for the two unused read endpoints.
- Document all endpoint usage and intentionally omitted DTO fields; run all requested checks and browser review.

### Out of Scope

- Backend/DB/algorithm work, live mutations, automatic synthetic fallback after real errors, new product modules or UI dependencies.
- Production-grade identity/email verification in the synthetic local service.

## Acceptance Criteria

- [x] Fixtures use complete V0.11 DTOs, string IDs and correct statistical/relationship semantics.
- [x] Explicit Mock startup never selects a configured live backend and clearly labels synthetic data.
- [x] Loading/success/empty/error/mock states share reusable logic; failures preserve structure and offer retry.
- [x] Every documented endpoint has an audited usage decision.
- [x] Main routes work in Mock mode on desktop/mobile and both locales without runtime errors.
- [x] Lint, format, typecheck, unit tests, static build and full E2E pass.

## Implementation Stages

### Stage 1 - Audit and Mock foundation

Files: API schemas/client, Demo fixtures, Mock service, offline scripts and contract tests.
Result: validated fixtures, strict requests, deterministic scenarios and isolated HTTP Mock.
Validation: contract/filter/history/lifecycle tests.

### Stage 2 - Stable data regions

Files: shared feedback/state, workspace pages, account/security details and locale strings.
Result: persistent cards and lists, safe null/count defaults, visible recovery and Mock provenance.
Validation: regression tests for first failure, cached failure, retry and independent resources.

### Stage 3 - Review and delivery

Files: E2E and engineering audit/runbook.
Result: actual offline browser review, complete checks and concise usage report.

## Testing

- Unit/integration: DTO completeness, statistical invariants, strict Mock routing/filtering/pagination, ownership, immutable histories, idempotency and reusable state precedence.
- E2E: all existing flows plus persistent structures under outages, selective failures and retry.
- Build/type/lint: all five project checks; build before offline preview/E2E.

## Risks

- Mock is a local single-learner simulator, not an authentication security implementation.
- A missing or expired session must never be replaced with a fabricated identity. Gates render safe placeholders and authentication guidance.
- Resource-not-found responses must clear inaccessible cached data while retaining recoverable errors.

## Rollback / Reversibility

Revert the scoped task commit. Normal live startup remains independent of Mock startup; no dependencies or private configuration change.

## Progress

- [x] Initial repository/API/database and data-flow audit.
- [x] Stage 1
- [x] Stage 2
- [x] Stage 3

## Decisions / Deviations

- The active contract currently treats some documented 404s as quiet emptiness. This task explicitly requires visible error/retry, so revise that rule and its regressions while retaining cached-record removal and session isolation.
- Default `pnpm build` (Turbopack) failed with a CSS worker port-binding EPERM, including an escalated retry. The installed Next.js CLI documents `--webpack`; `pnpm build --webpack` successfully builds every static route without changing the default project script.
- Browser MCP was unavailable because its approval policy rejects calls. Review uses the installed Playwright/Chrome API against the same isolated preview, blocking external destinations and recording errors/screenshots under ignored `test-results/mock-browser-review/`.
- Browser review exposed a 320px/200% data-page overflow. Wrap tab/status controls and long tab labels; add data/analysis/security routes to both-locale accessibility regressions.

## Final validation

- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`: passed.
- `pnpm test`: all 69 tests in 9 files passed, including 18 HTTP Mock contract tests.
- `pnpm build --webpack`: passed, with every product route statically exported; default Turbopack limitation is recorded above.
- `pnpm test:e2e`: all 99 tests passed in 3.2 minutes across desktop/mobile Chromium, with no external browser requests or runtime/hydration errors.
- Actual `pnpm preview:offline` Mock startup and Playwright browser review: 56 checks (12 routes in zh-CN/en at 1440/390px, plus dashboard/data/analysis/security at 320px/200% in both locales). No overflow, runtime/hydration errors, actual failed network/API requests or external destinations. Navigation-cancelled fetches for route prefetch are logged separately.
- Screenshots and machine-readable review are ignored local artifacts in `test-results/mock-browser-review/`; E2E HTML report is in `playwright-report/`.
- Reviewed the full task diff and new files. No dependencies, env files, private data, live mutations or generated/debug artifacts enter the task commit. The pre-existing README localhost-link edit remains uncommitted.
