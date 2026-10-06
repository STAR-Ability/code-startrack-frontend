# Five-iteration frontend redesign and production release

## Goal

Implement the approved evidence-led training observatory across every existing
codeStartrack route, complete exactly five reviewed redesign commits on `dev`,
release through a protected `dev -> main` PR, publish the exact GHCR image, deploy
the frontend only, and verify authenticated real-backend production acceptance.

## Context

Starting branch/commit: `dev`, `c3aba367672d6719f802a8c2f0023f5e40897daf`.
The design audit, library evaluation, blueprint and execution prompt under
`docs/design/` and `prompts/frontend-visual-overhaul.md` govern presentation.
Root AGENTS.md and `.agent/PLANS.md` govern implementation. No nested AGENTS.md
was found. Installed Next 16.3.6 static-export/client-boundary/lazy-loading guides
were inspected. Existing Base UI/Nova, Tailwind v4, Geist/CJK, ECharts,
TanStack Query and bilingual dictionaries remain the architecture.

Initial unrelated change: `.gitignore` (preserve byte-for-byte and exclude from
task commits). The four untracked design-handoff documents are inputs to this
task and will be committed with the plan to keep the review reproducible.

The handoff's audit-only no-publication/no-production clauses are superseded by
the current user's explicit release/deployment/test-account authorization.
All local mutations remain isolated to synthetic fixtures; production account
testing uses read-only or reversible session operations. Credentials never
enter source, plans, screenshots, PR text or receipts.

## Scope

### In Scope

- Shared tokens, type/density/width/surface/motion roles and Storybook specimens.
- Public, authentication and workspace chrome and reusable feedback/controls.
- Dashboard, practice, user/account profile/reports, data/submissions/charts.
- Public capability narrative/demo, accounts/security/privacy/notifications.
- Teams, all four independently shared member domains and coach workflows.
- Five iteration reviews, tests, rendered QA, scoped commits and `origin/dev` pushes.
- Protected PR/CI, main-only GHCR publication, frontend-only deployment/rollback,
  bilingual responsive authenticated production acceptance and release report.

### Out of Scope

- New routes, APIs, backend behavior/schema, fabricated analytics, auth bypasses.
- Framework/library replacement, global preset reset, new motion/chart runtime.
- Unrelated Git changes, production data edits, unrelated service restarts.
- A frontend-only claim to solve the nonvisual CAPTCHA backend dependency.

## Acceptance Criteria

- [ ] All audit frontend-controlled priorities F01–F22 are resolved or evaluated
      against current evidence; all route families use the approved system.
- [ ] Passive surfaces stay still; type/density/width/motion roles are reusable.
- [ ] Desktop submissions expose at least three comparable primary rows and all
      original metadata; mobile detail remains keyboard/touch accessible.
- [ ] At 390×844 populated practice, the first recommendation/action gains useful
      viewport presence; generation modes, count, account and order survive.
- [ ] Dashboard first desktop viewport contains next action and concise evidence.
- [ ] Member pages name the viewed learner and authorized domain/team context.
- [ ] Public zoom navigation leaves useful reading space; both locales work at
      1440, 1280, 768, 390 and 320px, including 200% text and reduced motion.
- [ ] Exact chart scores/vertices, frozen snapshots, null/zero, ranks, windows,
      identity/query ownership, privacy withdrawal and mutation semantics survive.
- [ ] Field errors are associated/actionable; local loading/error/success remains
      stable; chart import failure offers local recovery and textual evidence.
- [ ] Five main redesign commits are reviewed, validated and pushed to `dev`.
- [ ] Fresh final lint/format/type/unit/build/Storybook/E2E gates pass.
- [ ] Required GitHub `quality` and `storybook` checks pass, then a normal PR
      merge reaches main without bypassing ruleset 24550440.
- [ ] New version/SHA/digest and publication workflow are positively identified.
- [ ] Prior image is recorded, frontend-only deployment is healthy, rollback
      retained, and real-backend production responsive/auth acceptance is proven.
- [ ] Final Git state and external limitations are reported accurately.

## Implementation Stages

### Iteration 1 — Design foundation

Areas: globals.css, Card/Button and related foundation roles, token stories,
Storybook viewport presets and design-system documentation.
Result: coherent typography, passive surface semantics, shared control densities,
short purposeful motion, complete CJK fallback and identifying field borders.
Validation: static/type/unit/build, Storybook build/tests, desktop/mobile bilingual
light/dark specimens, composite contrast and independent design/accessibility review.

### Iteration 2 — Shell and shared components

Areas: public/workspace/auth navigation/context, page measures, reusable controls,
overlays, local loading/empty/error feedback.
Result: compact continuous shell and usable mobile/zoom navigation, purpose-based
heading/width roles and clear feedback ownership.
Validation: core gates, navigation/accessibility/locale/account E2E, keyboard,
rapid overlay interruption, responsive screenshots and independent reviews.

### Iteration 3 — Core training and analytics

Areas: routed UserDashboardPage, practice/recommendation views, user/account
profiles/reports, data/submissions, chart composition and lazy failure recovery.
Result: action-first desktop/mobile composition, exact readable evidence,
comparable records and distinct frozen/current context.
Validation: core gates, radar/recommendation/loading/data/history/algorithm E2E,
real SVG geometry, all metadata and before/after composition proof.

### Iteration 4 — Remaining public/auth/settings/collaboration experience

Areas: landing/showcase/about/demo, auth field recovery, accounts/sync/security,
privacy/notifications, team/coach/member task layouts and bilingual responsive UX.
Result: truthful connected public narrative, focused forms/scannable rows,
viewed-member provenance, compact authorized collaboration and complete states.
Validation: core gates, auth/security/settings/public/team/collaboration E2E,
Storybook, both locales/widths, keyboard/text zoom and independent reviews.

### Iteration 5 — Polish and production hardening

Areas: all route families, measured performance, meaningful visual regression,
release version and actual design/development documentation.
Result: converged design after multiple independent design/mobile/accessibility/
motion/performance/maintainability critics; no high-impact issue remains.
Validation: full fresh gates, complete responsive/state review, comparable cold
and warm route measurements (three samples), final diff/security/Git audit.

### Release and production acceptance

Normal merge-commit convention: protected `dev -> main` PR after `quality` and
`storybook`. Release workflow manually dispatched on main; canonical GHCR image
`ghcr.io/star-ability/code-startrack-frontend`, new immutable version/SHA tags.
Inspect live topology again before mutation; record exact old/new digests.
Deploy the existing Compose `frontend` service only. Verify health/logs/proxy,
then production public/login/session/navigation/profile/practice/recommendations/
reports/data/settings/visible roles/logout/re-login in both locales and mobile,
tablet, desktop/wide widths. Document unavailable data/domain gates honestly.

## Testing

- Unit/component: `pnpm test`; investigate historical actual-ECharts full-suite
  resource timeout before changing concurrency; preserve regression behavior.
- Integration/E2E: `pnpm test:e2e`, targeted specs between iterations, full final
  suite; fixture gateway owns 3100/3210 and blocks browser egress.
- Storybook: `pnpm build-storybook`, `pnpm test:storybook` (own server 6007).
- Static/build: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`;
  explicit Prettier for design/prompt Markdown; container check at release.
- Manual rendered evidence: ignored `test-results/redesign/`, browser console/
  network/overflow/zoom/focus/motion and local text/control contrast inspection.

## Risks

- Shared style changes can expose dense/long-state overflow; inspect whole pages.
- Query and privacy invariants have higher priority than visual simplification.
- Backend CAPTCHA has no nonvisual alternative; keep explicit known limitation.
- Unit default concurrency has a reproduced historical chart timeout; diagnosis
  is required and isolated passes alone do not establish a green full suite.
- Build/dev/preview/E2E share artifacts or ports; coordinate process ownership.
- Version tags are immutable; bump version on dev before release publication.

## Rollback / Reversibility

Each iteration is a scoped commit, with no backend contract/data migration.
Preserve the old production image and Compose environment/reference backup;
recreate only frontend with the recorded previous digest if availability fails.
Permanent fixes follow dev -> protected PR -> main -> GHCR -> deploy.

## Progress

- [x] Read handoff/instructions and inspect Git/tool/architecture/release policy.
- [x] Baseline rendered/performance evidence and current baseline receipts.
- [x] Iteration 1 reviewed, validated, committed and pushed (`05587b4`).
- [ ] Iteration 2 reviewed, validated, committed and pushed.
- [ ] Iteration 3 reviewed, validated, committed and pushed.
- [ ] Iteration 4 reviewed, validated, committed and pushed.
- [ ] Iteration 5 reviewed, validated, committed and pushed.
- [ ] Final dev validation and protected release PR/merge.
- [ ] GHCR exact image publication and frontend-only production deployment.
- [ ] Real-backend authenticated/bilingual/responsive acceptance and final audit.

## Decisions / Deviations

- No new dependency or supplementary source is necessary for the approved work.
- Baseline lint/format/build and 80 representative responsive/locale captures
  passed. Comparable three-pair route performance receipts live under
  `test-results/redesign/baseline/performance/`.
- Default unit runs reproduced the historical first actual-ECharts import
  timeout (262/263). Scoped beforeAll preloading keeps that one-time setup out of
  behavior timers; assertions, default workers and default timeouts remain.
  Subsequent full default runs passed 263/263, including integrated foundations.
- Iteration 1 independent visual/source reviews closed input focus and narrow
  enlarged-text password/CAPTCHA regressions. Both themes' invalid focus rings
  exceed 6.4:1 contrast; six auth cases retain 104px password and 126px CAPTCHA
  entry width. Secondary auth-footer wrapping remains an iteration 4 refinement.
- Iteration 1 Storybook passed 366 tests. The full E2E run passed 258 with one
  expected skip and two copies of a real enlarged-text header-height regression.
  The shared Brand mark now remains physical 40px, retaining its normal visual
  dimensions; independent settled browser measurements show 233px headers in
  both locales versus the 266.7px limit. All 60 affected E2E cases passed on the
  corrected export, including both original failures. Final lint/format/typecheck,
  production/Storybook builds and the affected landing unit check passed.
- Production/release access is available; policy requires PR and both CI checks.
- Iteration 2 source and independent reviews are complete: compact public chrome,
  sidebar identity/account separation, persistent navigation groups, local active
  link reveal, focused page measures, reversible Base UI overlays and scoped
  feedback ownership. Enlarged text exposed real shell/form/hidden-label issues;
  physical 240px/68px sidebar geometry, panel-based Privacy reflow and bounded
  wrapping Brand content resolve them. Final 320px/200% public headers measure
  302px English / 280px Chinese; four Privacy values retain 220px useful width at
  768px/200%, and collapsed links remain 40px square without empty scroll overflow.
- Iteration 2 final lint/format/type checks and production/Storybook builds pass;
  default full unit run passes 270 tests. Storybook's initial 405 passes and 15
  failures exposed new specimen/test assumptions about modal-hidden triggers,
  disabled Select focus, visual-only Tooltip, locale live regions and viewport
  globals. All affected cases pass in the final 92-case scoped run. Independent
  rendered review passes 16 motion and eight feedback cases; 100 initial and 50
  final ordinary-text route/width/locale captures have no overflow/runtime faults.
- Iteration 2 scoped E2E initially passed 171 with one expected skip and eight
  copies of four test assumptions: fractional scroll targets, a public label and
  moved binding-status context. Test-only fixes retain the reading/focus/selected
  binding/read-only contracts; both complete affected specs pass all 16 rerun
  cases in desktop/mobile projects. Combined current scope verifies 179 distinct
  cases with one expected skip. Receipts live under
  `test-results/redesign/iteration-2/`.
- Finite normal-text review leaves two minor presentation items for iteration 4:
  narrow English public step markers and tablet Security email wrapping. Practice
  result composition and all remaining public capability-copy corrections remain
  the planned iteration 3/4 work.
