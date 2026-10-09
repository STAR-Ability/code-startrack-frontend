# Frontend audit, redesign and release evidence

## Current outcome

The candidate frontend is version 0.14.0. All 37 existing routes retain the V0.2
and established CF/collaboration contracts, static App Router export, existing
libraries and bilingual data ownership. All required local gates pass. Production release remains blocked until real
authentication, backend capability and the actual deployment target are verified. No merge, image publication or
production deployment has occurred in this task.

## Delivered changes

- Fixed session ownership after awaited collaboration refresh, independent
  judge/analysis revision reconciliation, denied AI-job processing locks and
  bounded learning-profile reconciliation after the header Refresh action.
- Private source reveal now remounts and aborts reads when the identity or
  submission changes. Blank source validation focuses its associated editor;
  source/code blocks resist automatic translation and retain exact bytes.
- Static routing serves exported HTML before payload directories, canonicalizes
  page trailing slashes and returns actual 404 pages for unknown paths. Canonical
  Node redirects remain on the frontend origin for crafted raw slash paths.
- Redesigned fixed geometric backgrounds, shared surfaces, navigation, controls,
  metric typography, route compositions and prominent recommendation actions.
  Decorative shapes remain clipped and noninteractive.
- Redesigned ECharts palettes, gradients, grids, exact-value tooltips, score radar
  labels, distribution density and native keyboard legends. Lazy engine failures
  expose localized retry; reduced motion and complete accompanying data remain.
  Actual wrapping legend rows reserve their space from the first loading frame,
  remain mounted through error/retry, and enable their buttons once ready.
- Corrected bilingual source/privacy claims and removed obsolete public version
  copy. No dependency or API architecture migration was required.

## Audit and research artifacts

- [Feature and route audit](frontend-feature-audit-2026-10.md)
- [Route design audit](frontend-route-design-audit-2026-10.md)
- [Visual references and iterative review](visual-design-review-2026-10.md)
- [Chart research and data boundaries](chart-design-research-2026-10.md)
- [Independent security/keyboard review](frontend-independent-review-2026-10.md)
- [Actual backend verification](real-backend-verification-2026-10.md)
- [Actual release/infrastructure inspection](frontend-release-inspection-2026-10.md)
- [Execution plan](../../.agent/plans/frontend-audit-redesign-release-2026-10.md)

## Verification ledger

This ledger is the documentation snapshot after the local gates completed and
source/tests were pushed through `c5c339d`. Documentation is delivered in a
subsequent commit. Fresh CI results for the final dev head are recorded in
[PR #42](https://github.com/STAR-Ability/code-startrack-frontend/pull/42); initial
CI runs are not acceptance of this candidate.

| Gate                               | Current evidence                                                                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint                               | PASS in final `pnpm check` against the final chart/member source                                                                                                                         |
| Formatting                         | PASS in final `pnpm check`; final evidence documentation is checked separately                                                                                                           |
| TypeScript                         | PASS in final `pnpm check` and production build                                                                                                                                          |
| Full unit suite                    | PASS: 507 tests across 57 files in final `pnpm check`; 33 scoped chart tests also pass                                                                                                   |
| Production export                  | PASS: final stable-layout production export (37 product routes; 40 generated static pages)                                                                                               |
| Storybook build                    | PASS against final source                                                                                                                                                                |
| Storybook browser suite            | PASS: all 486 tests against rebuilt stable-layout source; desktop/mobile keyboard story also passes (2 tests); earlier failure evidence retained                                         |
| Full E2E                           | PASS: all 334 tests against the final stable-layout export, exit code 0, no skipped tests; original failures and canceled replay retained                                                |
| Rendered route matrix              | PASS: 222 route observations, 24 member-view checks and 54 final affected-route recaptures with 174 SVGs, in two locales and desktop/tablet/mobile                                       |
| Responsive chart review            | PASS: 72 shared visual checks, 13 chart cases and four final locale/theme/reduced-motion/native-keyboard interaction cases                                                               |
| Keyboard/source review             | PASS in both locales including 320px at 200% text; no external requests, business writes or console errors                                                                               |
| Text contrast                      | PASS for sampled light semantic foreground tokens against white, own soft surface and canvas; minimum 4.73:1. This is not a full WCAG audit                                              |
| Loading layout                     | PASS: 8 real delayed-engine browser cases, 24 persistent frames / 56 legend buttons, 0px measured displacement and successful mode switches before readiness                             |
| Docker                             | PASS: exact local image `sha256:70f4840c2264fbd945b575d793938fcf2ee73407e8aa780f79d8c2647870e228`; all 223 inputs equal source commit `765b55e` (qualified fixture transport documented) |
| Real transport                     | PASS: health, live/saved OpenAPI parity, 48 protected anonymous reads and 26 adapter/proxy checks; CAPTCHA server/schema success excludes browser Origin                                 |
| Real authenticated roles/workflows | BLOCKED: no designated existing credentials or session supplied                                                                                                                          |
| Real browser authentication origin | BLOCKED: local preview Origin is rejected by the deployed backend; do not infer browser CAPTCHA success from a Node request without Origin                                               |
| V0.2 real API success              | UNVERIFIED: additive endpoint families absent from advertised live OpenAPI; anonymous 401s do not prove route support                                                                    |
| Git/PR/CI                          | Source/test commits df06272, 6777343, 765b55e and c5c339d pushed to dev; PR #42 is draft while real release gates remain unmet; fresh final-head CI pending at this snapshot             |
| Main merge/image publication       | NOT RUN; release gates remain unmet                                                                                                                                                      |
| server2 deployment                 | BLOCKED: no existing frontend deployment or backend route; requested topology clarification pending                                                                                      |

## E2E correction evidence

The first complete run passed 330 tests and failed four strict locator checks.
Native chart legends introduced another submission-count button, and radar score
labels introduced another exact zero-score text node. The tests now locate the
data-mode button within its existing named group and the zero score within the
semantic definition carrying its localized sample count. Existing error recovery,
filter, pagination, sample, recommendation, order and responsive assertions remain;
the zero score is checked at all three widths. All 18 affected-file checks pass.
The next replay exposed a separate cold-engine response-wait timeout before UTC
assertions. A trace confirmed that three ready-only legends moved the following
mode controls by about 96 CSS pixels during the click; exact missed activation
dispatch cannot be proved from the trace. That earlier-export replay was stopped
after 268 passes, one timeout, one interrupted test and 64 tests not run.

The actual legend now remains mounted from the initial frame with disabled
controls until ready, preserving its real wrapping geometry through error and
retry. A deferred-loader regression proves node continuity, disabled behavior,
latest retry data and ready selection. The timestamp test also scopes its action
to the existing localized data group and checks selected state without adding a
readiness wait, changing any UTC assertion or increasing its timeout. A further
evidence-clarity assertion now counts the six readable semantic definitions,
excluding identical score labels in the radar SVG; the expected count and all
remaining evidence and transport assertions are unchanged.

Final production rebuild, the complete 507-test unit suite and the new exact
Docker image pass. Holding the real ECharts chunk in eight browser cases confirms
zero displacement across all 24 frames and successful Submissions switches before
the engine is released. The complete E2E replay passes all 334 tests with exit
code 0; no test is skipped or disabled. The final log is
`test-results/final-ready-e2e-gate.log`.

The first stable-layout Storybook replay exposed a keyboard play function that
attempted Enter while its legend button was disabled. The function now waits for
that button to be enabled before the original Enter/Space and pressed-state
assertions. The rebuilt story passes both viewport projects and the complete
486-test suite passes with exit code 0. The interrupted replay and disabled-button trace remain under
`test-results/final-layout-storybook-gate.log` and
`test-results/storybook-initial-disabled-legend/`. The final successful build,
keyboard and full-suite logs are `test-results/final-ready-storybook-build.log`,
`test-results/final-ready-storybook-keyboard.log` and
`test-results/final-ready-storybook-gate.log`.

The original log and four failure trace directories are retained under ignored
`test-results/final-e2e-gate.log` and `test-results/e2e-initial-failures/`. The
focused replay log is `test-results/e2e-selector-replay.log`; the final complete
replay log for the deliberately stopped earlier export is
`test-results/final-e2e-confirmed.log`, with timeout/interruption traces in
`test-results/e2e-layout-race/`. No test was skipped or disabled. The locator
corrections preserve the original assertions; the separate stable-layout fix
changes one production input, `chart.tsx`.

## Release boundaries

The existing healthy production frontend is on server1 (`startrack-prod`), while
`server2` has no frontend container, image, Compose project, port 3000 listener or
frontend ingress. The historical rollback instructions cannot be silently applied
to server2. Deployment requires an explicit target and, for a new server2 setup,
its domain and approved backend route.

Main branch protection requires a PR and fresh `quality` and `storybook` checks.
No bypass is permitted. Version 0.13.3 is already published, so 0.14.0 is reserved
for this candidate and cannot be described as a published release. Preserve the
current production image and restricted Compose files as the actual rollback
baseline after the target is resolved.

No backend code, database or judge service was changed or independently tested.
All business-write coverage uses isolated synthetic fixtures. Screenshots, traces
and detailed runtime logs remain under ignored `test-results/`.
