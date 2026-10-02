# Compact multi-account workspace and account security

## Goal

Show one coherent account portfolio, compact page-specific metrics before reusable charts, focused security workflows and an accessible collapsible sidebar on desktop/mobile.

## Context

The user explicitly authorizes direct `dev` commits/pushes and no new task branches/PRs for this work. The clean baseline is `a2ed2d7`, containing the previous Mock/resilience work and the user's README commit. V0.11 APIs and database guidance remain account-scoped. This task authorizes a frontend portfolio summary, superseding the previous UI restriction on combined presentation; it does not introduce a user-level analysis DTO or backend algorithm.

## Scope

### In Scope

- Dashboard: compact totals for owned active/invalid bindings, account list and management entry; retain account-specific next action/recommendation.
- Sum explicitly additive snapshot counts and label cross-account problem occurrences; do not merge Rating, ability scores, tags or active-day counts into a fabricated unified profile. Exclude unbound history and disclose missing/failed/stale snapshots.
- Page-specific compact metric panels; primary numbers precede trend/distribution/radar visualizations using the existing Apache ECharts component.
- Rename security UI to account and security; separate password/email pages with exact existing verification requirements and reauthentication semantics.
- Icon-only collapsible sidebar, accessible labels/tooltips, optional preference persistence, reduced-motion handling and a quieter textured workspace background.
- Preserve five data states, identity isolation, both locales and existing UI foundations.

### Out of Scope

- New production APIs, deduplicated user-level problem/profile algorithms, real backend mutations, new chart/UI dependencies or authentication requirements unsupported by the contract.

## Acceptance Criteria

- [x] Dashboard totals include multiple bindings and survive individual errors; account switching cannot change portfolio scope.
- [x] Metrics are compact and page-specific; no duplicate full training overview blocks within a page.
- [x] Independent password/email routes work and revoke sessions after success; no editable security forms remain on the overview.
- [x] Sidebar collapses to accessible icons with smooth motion and preference restoration.
- [x] Desktop, 390/320px, both locales, text zoom and important interactions pass browser review.
- [x] Lint, formatting, typecheck, unit tests, production build and E2E pass; scoped commit is pushed to `origin/dev`.

## Implementation Stages

### Stage 1 - Portfolio and metric hierarchy

Files: API/query helpers, workspace pages, metric/chart components and locale dictionaries.
Result: labeled portfolio aggregation, per-account provenance and compact page-specific metric/chart order.
Validation: aggregation/ownership/partial-data tests and UI resilience regressions.

### Stage 2 - Navigation and security

Files: workspace shell/sidebar/background, security overview and separate static routes.
Result: collapsible navigation and focused, verified password/email operations.
Validation: security request/session tests, keyboard and responsive tests.

### Stage 3 - Browser and delivery

Files: E2E, active contract, audit and this plan.
Result: local Mock browser evidence, all checks, scoped direct-dev delivery.

## Testing

- Unit: additive counts and duplicate-problem semantics, excludes unbound/mismatched windows, zero/null defaults.
- E2E: portfolio stability on account switches and partial failures; sidebar collapse/persistence/keyboard; security overview links and independent forms.
- Browser: actual isolated Mock; all routes/zh-CN/en/desktop/mobile/200% text; console, overflow and visual review.
- Build/type/lint: repository scripts, without live mutations or changing default toolchain.

## Risks

- No documented user-level deduplicated statistics endpoint exists. Summed solved/attempted counts are account occurrences, explicitly labeled; scores/Rating remain independent.
- Multiple snapshots can have different cutoffs. Show coverage/stale state rather than implying an atomic global snapshot.
- Portfolio reads must survive selected-account cancellation and be cleared with identity/binding lifecycle changes.
- Mock authentication remains a local simulator, not real email/security delivery.

## Rollback / Reversibility

Revert the scoped commit; original API DTOs/endpoints and no new dependencies make rollback local to presentation and query orchestration.

## Progress

- [x] Baseline, installed component/Next documentation and contract review.
- [x] Stage 1
- [x] Stage 2
- [x] Stage 3

## Decisions / Deviations

- Use the existing ECharts renderer rather than introduce shadcn's Recharts dependency. Its existing Base UI cards, disclosures and fields remain the visual system.
- shadcn CLI documentation lookup failed at the registry; official Base UI component documentation was fetched as fallback.

## Browser findings addressed

- Dashboard recommendation metadata and its card escaped their intended grid column because the reused component returns a fragment. Wrap both in one column and keep the short next-action card aligned at the top. Regression asserts separate desktop columns.
- Collapsed brand text wrapped inside a zero-width container and expanded the header. Keep that text on one line with clipped overflow; regression bounds the collapsed brand height/position.
- Successful query feedback left empty flex children and extra gaps. Return no feedback container for idle success, while DataRegion retains its stable state boundary. Reduce nested page gaps and remove repeated score copy beneath the primary ability metrics.
- Base UI 1.8 visual tooltips are identified by the installed component slot; their trigger links retain localized accessible names.
- Mobile navigation now observes its viewport and current-link size so narrow-screen/200% text changes keep the active destination visible; accessibility regressions verify its bounds.

## Verification results

- pnpm lint, pnpm format:check and pnpm typecheck: passed.
- pnpm test: 73 tests across 10 files passed, including four portfolio/queue regressions.
- pnpm build: default Turbopack build passed and exported all 14 product routes, including both independent security routes. No alternative build mode or new dependency was needed.
- pnpm test:e2e: 108 passed, one desktop-sidebar test intentionally skipped on mobile.
- After the final zero-evidence state and mobile-resize corrections, pnpm test:e2e tests/e2e/workspace-redesign.spec.ts tests/e2e/accessibility.spec.ts: 15 passed, the same mobile skip. This includes two additional desktop/mobile zero-evidence cases.
- Actual local Mock browser review: 70 route/locale/viewport/zoom checks; 14 routes, zh-CN/en, 1440/390px, selected 320px/200% text and collapsed sidebar. No runtime/hydration errors, actual failed API/network requests or external requests. Cancelled route-prefetch requests are recorded separately. Playwright MCP additionally confirmed desktop column placement, collapsed brand bounds and the active mobile security destination after text zoom.
- Local ignored evidence: test-results/mock-browser-review/ (screenshots and review.json), test-results/mcp/ (interactive snapshots/screenshots/console/network).
- No backend contract or mutation behavior changed; all writes were validated only against the isolated Mock fixture. No user-level deduplication/profile endpoint was invented.
