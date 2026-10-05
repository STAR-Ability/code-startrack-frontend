# Three-round codeStartrack UI evolution

## Goal

Evolve the already-designed white-led frontend through three reviewed GitHub-tracked rounds on `dev`. Keep shell decoration visually stable, improve recommendation and evidence clarity, and complete responsive product polish without changing backend contracts or product architecture.

## Context

Main audited AGENTS.md, .agent/PLANS.md, README, current surface documentation, API integration contracts, package/scripts, root/workspace/public shells, global Tailwind v4 tokens, Base UI/Nova primitives, ECharts, mock infrastructure, Storybook and tests. CodeGraph was consulted first. The initial working tree was clean on main (94344a0); dev was safely fast-forwarded from 9055f55 to preserve the existing design. GitHub CLI is available and authenticated. No AGENT.md exists. Next dev regenerated its managed AGENTS block; retain this generated guidance.

The old completed hierarchy plan describes previous work, not new requirements. Browser skill references a missing codex-cli.md; current README and actual harness configuration supply verification. Installed shadcn CLI registry requests failed; official Base UI documentation was inspected. No dependency changes are needed.

## Scope

### In scope

- Shell-level fixed decorative layers with white-led semantic surfaces and local interaction motion.
- Mock development startup root fix for reproduced hardcoded fixture-port collision.
- Recommendation hierarchy, supported metadata and accessible chart evidence.
- Missing/empty/loading/error distinctions, responsive/keyboard/locale consistency.
- Existing Storybook and regression coverage, documentation and three Issues/commits pushed to dev.

### Out of scope

- API/auth/role/cache/schema changes, new UI/chart libraries or framework upgrades.
- Whole-product redesign, new backend fields or fabricated learning metrics.
- Production writes, deployment, PR-per-round and any push/merge to main.

## Acceptance criteria

- [x] Fixed shell backgrounds remain stable while content scrolls; overlays/input work without overflow.
- [x] Mock dev startup collision repaired; synthetic scenarios, normal dev and production export verified.
- [x] Recommendations prioritize next action using only supplied data; chart evidence remains accessible.
- [x] Missing analysis never masquerades as zero ability; genuine zero evidence retains its meaning.
- [x] Responsive, bilingual, keyboard and reduced-motion checks pass on rendered pages.
- [x] Required scripts pass, complete diffs reviewed, scope and limitations recorded.
- Git publication acceptance: each tracking Issue closes only after its reviewed round commit is pushed and verified on dev. Publication receipts belong in Issues #11, #12 and #13.

## Implementation stages

### Stage 1 — Foundation (Issue #11)

Areas: globals.css/shell surface convention, scripts/dev-offline.mjs, launcher coverage/mock docs.
Visual subagent owns fixed decoration and surface documentation; debug subagent owns launcher diagnosis and fix; Main owns integration, browser verification and regression coverage.
Acceptance: viewport background geometry stable, content moves independently, second mock session isolated, normal dev and production build valid.

### Stage 2 — Recommendation and chart clarity (Issue #12)

Areas: recommendation composition, analysis/data/chart presentation, related locale copy/stories/tests.
Start only after Round 1 commit/push/Issue closure. Use independent product audit findings and Main rendered review to set actual scope.
Expected: clearer primary recommendation/context/history; accessible chart values and readable source metadata; unavailable evidence distinct from zeros.

Approved scope after Round 1 review: compact responsive controls and secondary
recommendations; existing localized timestamp utility with retained datetime;
unknown metrics/no radar for null analysis; activity values disclosure; bounded
shared tag chart with complete evidence; shared rating trend conventions. Visual
subagent owns recommendation/CSS/copy, engineering owns analysis/chart views,
independent reviewer owns state/evidence regressions and profile state stories.
Main owns final docs/integration and browser/build/suite verification.

### Stage 3 — Final product polish (Issue #13)

Areas: remaining dashboard/actions/state/accessibility/responsive consistency.
Start with a separate Issue after Round 2 acceptance. Refine targeted deficiencies discovered in browser; no unnecessary architecture changes.
Expected: cohesive final interface with explicit action labels and complete validation.

Approved after Main screenshots and independent review: primary report beside
one collaboration surface, one guest login prompt, wrapping account sources,
contextual aggregate absence composed once, embedded EmptyState variant,
neutral unknown metric typography, readable analysis/history timestamps,
labeled team score/difficulty and consistent labeled history checkbox.
Visual owns dashboard, user analysis/sources, guest practice and bilingual V0.12
copy; engineering owns shared feedback/metrics/CSS, AnalysisView/account history,
team metadata and history checkbox. Reviewer owns behavioral tests/stories.
Main retains integration, docs, rendered/full diff review and verification.

## Testing

- Unit: pnpm test; meaningful launcher and state regressions.
- Integration/E2E: production-export synthetic harness, pnpm test:e2e and focused shell/evidence cases.
- Build/type/lint: pnpm lint, pnpm format:check, pnpm typecheck, pnpm build.
- Storybook: pnpm build-storybook and pnpm test:storybook.
- Manual: Main browser inspection each round; desktop/laptop/tablet/390/320, both locales, 200% text, scroll, keyboard, hover and reduced motion. Screenshots/logs under ignored test-results.
- Never build alongside next dev. Stop preview before E2E; E2E/preview retain fixed harness ports.

## Risks

Shared fixed decoration needs correct stacking and mobile resizing; no transformed ancestors or scroll listeners. Shared chart/UI changes may affect team/public examples; preserve DTO ownership, frozen evidence, backend rank and completed state. Mock dev startup works on clean ports here: do not claim the user's original unknown failure was reproduced. Real authenticated backend behavior is outside synthetic verification.

## Rollback / reversibility

Each round is a scoped coherent commit with no data/schema migration. Revert through ordinary Git commits; never reset or discard user work.

## Progress

- [x] Initial audit and clean dev checkout.
- [x] Round 1 implementation, verification and Main acceptance; commit/push and Issue closure recorded in Issue #11.
- [x] Round 2 implementation, verification and Main acceptance; commit/push and Issue closure recorded in Issue #12.
- [x] Round 3 implementation, verification and Main acceptance. Final publication and closure receipt is recorded in Issue #13 after remote verification.

## Decisions / deviations

- Preserve semantic tokens and existing Card role variants rather than adding another system.
- Shell decoration uses fixed bounded paint; functional sections and diagrams remain with content.
- Original clean-port dev:mock works; reproduced second-session EADDRINUSE on fixed3210 warrants a dev-only isolated fixture port and explicit diagnostics.

## Round 1 acceptance

PASS: lint, format, typecheck, unit suite (166 tests), production build, Storybook
build and 306 Storybook browser checks. Full E2E: 180 passed, one intentional
mobile skip, two failures in the new dialog heading assertion. The selector was
corrected to the actual accessible title; all eight shell checks then passed in
both projects, including both previously failing cases. All 182 applicable cases
have passing results. No existing regression failed.

Main independently inspected fixed decoration and normal scrolling on landing,
practice, dashboard and auth; practice at 1024/768/390/320px had no overflow or
console warnings/errors. The independent reviewer found no blocking issue.
Mock launch with occupied 3210, synthetic populated/empty/error/slow responses,
explicit-port diagnostics, shutdown and normal dev were exercised. Initial test
fixture NODE_ENV typing was corrected without weakening strictness; final checks
passed. Real authenticated backend and deployment are NOT RUN.

## Round 2 acceptance

PASS: lint, format, typecheck, 174 unit tests, production export and Storybook
build. Full Storybook suite: 312 passed. Full E2E: 186 passed, one intentional
mobile skip, two failures in a new overly broad absent-chart assertion. The
assertion incorrectly counted a valid independent history trend; it now targets
unavailable snapshot charts and preserves that history. Final affected E2E
rerun: 26 passed; all 188 applicable cases have passing results. Main found an
ineffective supporting-footer CSS-layer override; composition utilities fixed
it, final builds passed and 40 recommendation Storybook checks passed.

Main inspected desktop and mobile recommendations, dashboard chart values,
missing aggregate profile, rating charts and loading/long-content stories.
320/390/768/1024/1440 widths and 200% text sizing showed no overflow. Source review
confirmed API/rank/completion/cache/audience boundaries remain unchanged.
Round 3 targets the observed repetitive empty containers, dashboard actions and
times, guest login duplication and long account names. Real backend/deployment
remain NOT RUN. GitHub CI for Round 1 also completed successfully.

## Round 3 acceptance

PASS: lint, format check, typecheck, 175 unit tests, production export,
Storybook build and 324 Storybook browser checks. Full E2E: 196 passed, one
intentional mobile skip, four failures from two selectors in both projects.
The new recovery test incorrectly rooted its relative card filter at main;
the existing no-account test still expected a combined team-name/count link.
Both selectors now follow the semantic composition, retaining local overflow
checks and adding exact destination and labeled member-count assertions.
All four corrected cases passed; all 200 applicable E2E cases have passing
results. Product source did not change after the complete browser suites.

Main independently inspected production dashboard, practice and team
recommendations, desktop through 320px, visible keyboard focus, chart roles,
and contextual/mixed-evidence Storybook examples. No page errors or external
requests occurred in the production dashboard/practice review. Dev mock was
restarted and verified against its dynamically assigned synthetic fixture.
Delayed recommendations now show loading without premature empty copy and
retain known cached results during refresh.

Main's 320px/200% text review found local clipping hidden by Card overflow;
shared Empty sizing/wrapping, a content-aware metric grid and guest prompt
spacing repaired it. Local card/header/action regression assertions passed.
The fixed shell remains stable during scrolling; content and local controls
remain interactive. Independent source review found no API/auth/query-scope,
snapshot provenance or team audience regression. The existing white-led
identity, shadcn foundation and ECharts stack are preserved.

An unrelated .gitignore edit present after interrupted execution is preserved
and excluded from the round commit. Its pre-existing trailing whitespace is
excluded from the task diff check. Real authenticated backend, Safari-specific
behavior, production performance profiling and deployment are NOT RUN.
GitHub CI for both earlier round commits completed successfully.
