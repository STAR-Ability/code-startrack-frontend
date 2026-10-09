# Premium frontend and server2 release

## Goal

Deliver a visibly richer, coherent codeStartrack frontend, including a professional coding workspace, verified real server2 integration, protected dev-to-main release, and healthy frontend Docker deployment on server2.

## Context

The task attachment is the current scope. The initial worktree is clean on dev at `3dac8c2`. Existing surface variants, semantic chart palettes, locale dictionaries, query adapters, synthetic Playwright harness and static-export Docker runtime must remain compatible. The initial problem editor is a textarea in two independent cards. Existing audit receipts are historical evidence only. Current server2 backend is reachable on loopback 8081; the old server is prohibited. Real identities and the server2 frontend ingress need authoritative evidence.

## Scope

### In Scope

- Visible stationary geometric compositions across public, authentication, learning, analytics and collaboration routes.
- Shared components, major route hierarchy, prominent KPIs, honest feedback states and coordinated ECharts refinements.
- Adjustable statement/editor workspace with a mature local editor, usable controls, sample console and supported submission lifecycle.
- Desktop, laptop, tablet, 390px/320px, bilingual, keyboard and reduced-motion browser review with iterative fixes.
- Scoped verified milestone commits pushed to dev; full automated gates; protected PR merge and exact-main Docker deployment on server2.

### Out of Scope

- Backend source, databases, services, judge development or deployment.
- Access to the previous server, security bypasses, fabricated API capabilities or unrelated cleanup.

## Acceptance Criteria

- [x] Fixed, clearly visible background geometry differs by page category and preserves readable content.
- [x] All major route families and reusable controls have coherent improved composition and feedback.
- [x] Important numerical information precedes secondary charts and details.
- [x] Coding workspace has adjustable accessible panes, mature syntax editor, language/settings controls and structured samples/results.
- [x] Unsupported running/custom tests remain clearly unavailable; supported submissions preserve real API and draft behavior.
- [x] ECharts are readable, coordinated, responsive, accessible and accurately represent values.
- [ ] Multi-resolution, bilingual, keyboard and reduced-motion visual evidence is inspected and high-impact defects revised.
- [ ] Real server2 authentication, permissions, profiles, recommendations, problems and submissions pass with designated identities.
- [ ] Lint, formatting, types, units, Storybook, E2E, build and exact-image gates pass.
- [ ] Each meaningful milestone is reviewed, committed and verified on remote dev.
- [ ] PR is merged through required checks; exact-main production image deployed only on server2 with rollback retained.
- [ ] Production browser/pages/editor/charts/API connectivity and service health are verified.

## Implementation Stages

### Stage 1 - Background and visual system

Areas: global tokens, fixed geometric layer, shared surface styling and background regression coverage.
Result: obvious visual depth with category-specific geometry and near-opaque reading surfaces.
Validation: lint/types, background browser checks, desktop/mobile screenshots; commit and push dev.

### Stage 2 - Components and major route hierarchy

Areas: shared page headers, metrics, dashboards, learning overview/profile/recommendations and shared UI controls.
Result: numerals and next actions lead the page; fewer repeated containers and clearer secondary evidence.
Validation: relevant unit/browser flows and responsive screenshots; separate commit and push dev.

### Stage 3 - Coding workspace

Areas: problem bank, detail, statement, editor and result console; minimal editor dependencies and regression tests.
Result: accessible adjustable professional split panes and mature code editing with honest API feedback.
Validation: editor units, real CodeMirror browser interactions, draft/submission synthetic regressions and multi-width review; separate commit and push dev.

Completion-audit follow-up: the current console shows samples and request status but navigates away before showing final judging results. Add a Samples/Submission results switch inside the existing resizable console, using the existing validated submission resource and polling hook. Display only documented aggregate verdict, timing, memory, score, test totals, compile log and structured error fields. Preserve an explicit full-detail link for analysis and private-source controls. Show the immutable submitted compiler/version and distinguish later editor changes or a newer failed attempt. Clear all accepted-attempt metadata on owner changes or denied operations/reads; never fall back to prior or seeded private results after denial. No Run or per-test actual output is invented. The current task's explicit bottom-results requirement takes priority over the older prompt's automatic detail-navigation convention; document the intentional UX change and update behavioral tests without weakening source or idempotency coverage.

### Stage 4 - Charts

Areas: ECharts presentation/theme and accessible tooltip/label behavior.
Result: exact readable multicolor chart data, polished radar/line/bar composition and adaptive labels.
Validation: chart units and browser legend/tooltip/resizing evidence; separate commit and push dev.

### Stage 5 - Iterative responsive and accessibility polish

Areas: defects found across rendered routes and independent review.
Result: no obvious high-impact visual, keyboard, locale, loading or responsive defects.
Validation: full route matrix, relevant E2E, inspected screenshots and independent audit; commit and push dev.

Completion-audit follow-up: earlier current-task route coverage includes all routes in English at desktop/mobile plus a larger bilingual matrix for twelve routes. Some coach captures were access-denied rather than authorized coach content. After the new source freeze, use isolated synthetic fixtures with the documented roles to inspect the remaining authorized route families, both locales and desktop/laptop/tablet/mobile. Keep denied and authorized evidence distinct; inspect actual page images rather than counting linked-route HEAD probes as rendered pages.

### Stage 6 - Real integration

Areas: ignored local backend configuration, task-owned server2 tunnel, designated real-session acceptance and contract comparison.
Result: evidence from actual backend adapters and browser workflows; resolve frontend contract defects without backend changes.
Validation: preserve same-origin Origin/session boundary; authenticated reads and explicitly authorized test-identity workflows; commit verified frontend/report changes and push dev.

### Stage 7 - Protected release

Areas: full gates, PR, CI/review, exact-main Docker image, inspected server2 frontend-only deployment and rollback.
Result: deployed and verified production release, or explicit externally blocked gates without bypass.
Validation: full local/CI suite, protected merge, exact-image acceptance, production health/API/browser checks; record immutable receipts.

## Testing

- Unit: meaningful editor, chart and discovered-defect regression tests plus full Vitest suite.
- Integration: current server2 OpenAPI and actual validated API payloads through same-origin frontend proxy.
- E2E: production export and isolated synthetic fixture, plus designated real-session browser acceptance.
- Storybook: static build and full interaction/accessibility suite.
- Build/type/lint: repository scripts without weakening checks.
- Container: existing exact-image acceptance on scoped Docker context.

## Risks

- Designated test-account login passes; catalog/language HTTP 500 responses and empty learning data prevent complete real-flow acceptance.
- Server2 advertised enums may disagree with the approved contract; runtime payloads must resolve that conflict.
- No initial frontend container is evidenced on server2; inspect ingress and confirm destination before provisioning.
- Shared fixture and build outputs require serialized resets and stopping preview/dev before relevant full tests.
- New editor dependency must be locally bundled, compatible and avoid external asset requests.

## Rollback / Reversibility

Keep scoped milestone commits; preserve unrelated work and private settings. Use required protected PR process. Pin the production image by digest and retain the prior frontend image/configuration. Replace only frontend services; never remove volumes, unrelated containers, backend or judge resources.

## Progress

- [x] Stage 1
- [x] Stage 2
- [x] Stage 3
- [x] Stage 4
- [ ] Stage 5
- [ ] Stage 6
- [ ] Stage 7

## Decisions / Deviations

- Baseline production build passes before visual work. Synthetic preview runs on loopback 3100 and cannot select the private local backend configuration.
- Specialized agents have disjoint global, page, editor, chart and infrastructure ownership. Root owns commits, integration, release decisions and shared locale keys.
- CodeMirror 6 is chosen as the permitted mature Monaco equivalent: local syntax/search/undo/line-number support without Monaco worker/runtime infrastructure. Minimum compatible dependencies are evaluated in the editor milestone.
- Real acceptance can use frontend origin `http://127.0.0.1:8081` with a separate server2 tunnel on 18081, an origin currently advertised by server2. Origin is preserved; no backend configuration is changed.

- Stage 1 static checks and production build pass; all 10 background E2E cases pass across desktop/mobile, five widths, stationary scroll geometry, seven distinct compositions and keyboard/dialog interaction. First rendered desktop review confirms stronger fixed geometry and readable KPI surfaces. Mobile inspection and independent visual iteration continue before final acceptance.

- Rendered iteration moved public mobile artwork toward the gutter and raised the four-column KPI threshold to 44rem so desktop half-width panels retain two readable columns. These CSS values were previewed directly; exact exported-artifact acceptance is repeated in the final rebuild.

- Stage 2 workspace hierarchy is implemented: learning KPIs precede action/recommendation modules, CF summary precedes its next step, compact recommendations lose nested frames, and shared page headers/metrics improve all workspace routes. Targeted 34-unit checks pass; the second coordinated build, full lint/format and 515 unit tests across 59 files pass. Twenty-four bilingual four-width route observations pass after KPI column refinement. Public composition and follow-on settings/result/filter improvements remain separate reviewed milestones.

- Stage 4 preserves ECharts semantic palettes, radar/gradient infrastructure and exact data, adds safe native text-node tooltip panels and responsive horizontal labels, and resets ECharts when tooltip renderers change. Forty focused tests pass, including actual ECharts injection/lifecycle/media regressions. Sixteen rendered light/dark bilingual viewport combinations cover 64 charts with no runtime, overflow or settled tooltip containment failures; keyboard legend toggles actual plotted series. This independent milestone is committed before the editor milestone while its discovered layout/focus defects are being fixed.

- Stage 2 public composition is complete and independently reviewed: the home flow replaces repeated cards with one ordered journey, product/features use asymmetric composition, and profile/recommendation/about/demo pages use shared surfaces with distinct information hierarchy. Three focused units and scoped source checks pass. Fifty-four responsive/locale observations and fifteen final third-export captures pass, including centered profile artwork, three correctly offset capability nodes and a full-width mobile source ribbon; no overflow, runtime, failed-request or API-call findings. Shared feedback, settings/result/filter improvements remain in the Stage 5 milestone.

- Third production export passes. The focused editor/workflow/accessibility run has 40 passes and two desktop text-zoom failures caused by the full account badge exceeding the /data header at 320px. The first full Storybook run has 482 passes and four failures: an old textarea story against the lazy client wrapper, and editor contrast, each duplicated across desktop/mobile. These failures are retained and are being corrected; no full-suite success is claimed until the rebuilt reruns pass. Independent review also requires fallback canvas geometry and no-editor separator focus fixes.

- Stage 5 shared feedback and controls are ready: team/task depth, empty/skeleton feedback, invalid forms, dialog/table feedback, settings navigation, verdict-first submission results and collapsible training dates are implemented. Existing Badge/Button wrapping fixes the measured /data account/action failures. The fifth compiled export passes six bilingual 320px/200% checks with 54 one-line numerical values, including zero and formatted ratings; empty icons, delayed loading, hover/focus surfaces and keyboard dialog dismissal pass. No browser errors, failed HTTP requests, external traffic or fixture mutations were observed. Full source lint/format/types/build and 518 units pass. Source and independent review pass for these shared changes.

- The editor remains under final correction: fifth-export focused checks have 19 passes and one synthetic contenteditable fill failure. Genuine keyboard diagnosis separately reveals a real rapid compiler-switch document latch and a zero-height editor canvas at 320px/200% text. Both are being fixed with behavioral coverage before marking Stage 3 or overall Stage 5 complete. Exact rich/plain/failure source, ordinary resized actions, no-editor focus and normal responsive geometry already pass independently.

- Stage 3 passes on the sixth export: all 24 focused desktop/mobile browser cases and 13 editor units pass, including genuine keyboard edits, compiler-private draft isolation, preferences, visible/clickable code at 320px/200% and the final caret in a 90-line plain document. A compiler change mounts its own document to cancel the prior typing latch; undo history resets while outer preferences remain. Wrapped chrome grows inside the scrollable form and retains a 120px minimum canvas. Real deferred-chunk failure, maximum console, COACH/disabled focus and exact private source pass in actual browsers. The syntax palette's lowest measured contrast is 6.94:1. Desktop/mobile/fallback screenshots are inspected. Full lint/format/types, 518 units and production/Storybook builds pass; all original failures and corrected-test evidence remain preserved. Overall independent final audit and full suites continue under Stages 5 and 7.

- The sixth-source full Storybook suite passes all 486 cases. Both exact-`995a4e2` push and PR CI runs pass 518 units, 352 E2E and 486 Storybook cases. Local full E2E nevertheless ends with 351 passes and one mobile delayed-radar failure: an eight-second persistent loading toast covers the locale header. A normal immediate rerun passes because the notice never appears; adding an explicit visible-notice wait deterministically reproduces the original defect on the old export. The response remains held until after an ordinary locale click, and no assertion or overall timeout is weakened. The seventh-build fix uses the official bottom-anchored toast composition with matching stack, bridge and entry/exit transforms, retaining pointer, close, action, hover and swipe behavior. Full rebuilt verification and final browser inspection are pending; original trace/logs and prototype evidence are preserved.

- Seventh and eighth bottom-toast exports pass complete Storybook suites, and the eighth export passes `pnpm check` and both delayed-radar cases. Exact-eighth browser review still finds the loading notice covers the locale button at 320px/200% text. The ninth correction bounds notice height, wraps long actions, uses the official single-visible-notice limit without discarding the queue, and removes circular content-height sizing. Fixture diagnostics that mixed changing source with eighth CSS are explicitly provisional; final acceptance requires a frozen source/build pair.

- The ninth candidate keeps Close outside the scrollable message/action region, prioritizes mobile navigation before the complete Mock notice, and makes application/Storybook provider limits consistent. Immutable prototypes pass ordinary locale clicks at 320px/667px and 900px height with 200% text in both locales, long-action Tab/Enter, touch scrolling and queue promotion. Base UI synchronously tries to focus a promoted toast before React removes `inert`; a guarded frame-after-dismissal retry preserves its handlers and original focus anchor for Escape and keyboard Close. Real browser regression coverage and compiled acceptance are required before completing Stage 5.

- Real frontend CAPTCHA/login passes with the user-designated test identity, with ADMIN primary role and ADMIN/STUDENT membership. At 10:58 UTC server2 health is HTTP 200 and Docker healthy. Authenticated catalog and judge-language reads repeatedly return HTTP 500; personal read endpoints return valid empty/null data. No business data or backend/judge service was changed. Complete integration, populated contract acceptance and production frontend ingress remain open gates.

- The ninth full Storybook suite passes all 494 cases, including eight new queue/long-notice regressions. The frozen tenth export passes `pnpm check` (518 units /59 files), final Storybook build and the eight affected cases, ten actual capability-layout cells and four actual delayed-profile/header cells with matching served CSS. Notification correction `8af72bc` is pushed and remotely verified. The complete tenth E2E run is historical: desktop uncertain-submit retry is intercepted by the visible error notice; its test follow-up happened during that run and is explicitly recorded. The exact `8af72bc` PR and push CI runs each end with 351 E2E passes and one failed retry case, while each Storybook suite passes all 494 cases. Final frozen-source CI remains required.

- Real tenth-export identity/role reads pass with ADMIN/STUDENT; catalog and judge-language reads remain HTTP 500, while learning/training/submission/account reads return valid empty/null data. Twenty bilingual desktop/mobile observations preserve truthful errors and empty states, with no runtime errors or business writes; canceled local route probes are retained. Nineteen screenshots are settled, while one desktop training screenshot has an entrance-transition caveat. Current-session UI logout returns 204, then `/me` returns 401 and the session cookie is absent. Browser, real frontend and SSH tunnel are closed. A newly observed shared public footer CTA wraps English letters at 320px/200%; its local layout correction and eleventh compiled verification are pending before Stage 5 completes.

- The tenth full E2E run ends with 349 passes and three failures (16.5 minutes): two error-notice interceptions require ordinary dismissal before Retry, while mobile rapid compiler switching reveals actual lost source after a roughly 3 ms switch. Five immediate diagnostic repetitions pass, but the original trace and deterministic parent-cache regression prove the race; it is not dismissed as flaky. Stage 3 is reopened until synchronous guarded draft saving and preserved version-refresh behavior pass the rebuilt regression. The shared public header also remains too tall and sticky at 320px/200% text; mobile layout/flow is being corrected alongside the footer before the single eleventh source freeze.

- Stage 3 is complete again on the eleventh compiled export: synchronous user/problem/version/compiler cache writes preserve exact source before React language changes, while guarded passive migration retains version-refresh semantics and live session ownership. Four new regression cases pass; `pnpm check` passes lint, formatting, types, 522 units across 60 files and the production build. The corrected focused browser run passes all 22 cases in 59.5 seconds, including all 12 genuine-editor cases, four bilingual footer cases, four 404/503 session recoveries and two uncertain-submission retries. Editor milestone `475142fac97710360ad0eddc8cd1f0c46fd394e1` and recovery coverage `b4574f8c1d32ec58b3571ba2efb6d32b8dcf138d` are separately pushed and remotely verified.

- Initial eleventh focused verification retains 16 passes and six test-selector failures: Base UI intentionally hides the collapsed, unfocused Close from role queries while keeping the labeled control visible. Only the two regression locators change to translated exact-label queries; ordinary clicks, hidden-notice checks, recovery, source and idempotency assertions remain. Both runs have immutable inputs, and original traces are preserved. Corrected test-input digest `a270177a253743bc64657b4ecdd8fab637782d9378c41f7a65cecd21770cec49` retains compiled production digest `509d0e28f95c811e3ecaee3df589e21f2358794e35c32a3f86c46bef7b5fa745` and export digest `1612ee956a5a3950fd77fb2c1a11533a600fe04131aa8887c516da882383a58f`. Eleventh Storybook build and six affected queue/long-notification cases pass. Complete final-head 356-case E2E and 494-case Storybook verification remain required at this snapshot; terminal required checks are authoritative on PR #42.

- Stage 5 rendered acceptance passes all 12 combined eleventh-export public cells with exact root font size and three stable header frames, both locales, mobile/tablet/desktop and 200% text. Header flow, native menu keyboard navigation, complete capability labels and footer words, focus and ordinary CTA navigation pass with matching disk/served HTML and CSS. Both desktop 200% headers measure 247px. Browser contexts close; no runtime, console, HTTP or non-cancellation request failures or fixture business writes occur. All 84 canceled local route HEAD probes remain recorded. The first provisional raw measurements were overwritten, so only the conclusive rerun supports final geometry acceptance; this evidence limit is recorded without reconstructing artifacts. Representative mobile and desktop screenshots are visually inspected. Stages 6 and 7 remain blocked by real catalog/language HTTP 500, unresolved populated contract evidence and unconfigured production ingress; no merge, production image or deployment is performed.

- The exact `f411559bf0b9f386437ea2bc0b24ee352e59c2fb` PR and push CI runs pass all 522 units/60 files, 356 E2E and 494 Storybook cases without failed/flaky/skipped or retry markers. A requirement-by-requirement completion audit still finds safe frontend work: final aggregate judging results are absent from the requested bottom editor panel, and authorized coach plus broader bilingual route evidence needs completion. Stages 3 and 5 reopen for those concrete requirements; passing CI does not redefine the requested outcome. The first automatic continuation rechecks server2 health and ingress read-only: health is 200, the same backend revision is healthy, and no frontend container or configured frontend domain/proxy exists. Real business POST workflows remain unverified within the established read-only test-account boundary, separately from catalog/language HTTP 500 and empty personal GET results.

- Inline bottom results source and unit freeze is ready: semantic Base UI Samples/Submission results tabs retain polling while hidden/collapsed, current validated submissions stay in the editor with an explicit detail link, and denied reads/writes or owner changes suppress private result context. Existing compiler regressions are unchanged. Focused verification passes 25 units across three files, scoped lint/format/TypeScript and independent source/security review. Existing full-workflow E2E now checks inline AC before ordinary detail navigation while preserving detail AC, analysis, opt-in source, exact payload and idempotency checks. New state/keyboard/zoom browser coverage and a fresh build/full suite remain pending; this source does not inherit the f411559 CI acceptance.

- The twelfth production export passes full `pnpm check` (537 units /61 files) and the 494-case Storybook suite. Its first focused browser run has 42 passes and six new test activation-assumption failures; installed Base UI tabs use manual Enter/Space activation. The corrected 12 result cases pass while keeping source, idempotency, polling, denial and geometry assertions. Independent actual screenshot and default-scroll DOM review nevertheless confirms clipped English Samples/Submission results labels at 320px/200%: the header right edge is 279px, while text reaches 291.91px and 302.63px. Earlier metric/page-overflow checks did not cover those clipped labels. Add actual text-line/clipping-ancestor regression and reuse existing Button wrapping in both tabs, then rebuild; full authorized route acceptance remains pending. An initial geometry assertion falsely rejected intentional vertical form scrolling; its failure artifacts are retained and horizontal checks stay strict.

- Stage 3 passes on the thirteenth export with inline aggregate submission results and wrapped console tabs. The corrected full check passes 537 units across 61 files, lint, format, types and production build; all 368 E2E cases (18.1 minutes) and 494 Storybook cases (11.2 minutes) pass without failure, flaky, skipped or test-retry markers. The final follow-up inventory has 365 source, 225 production and 295 export files, with no added, removed or changed inputs at suite completion. Independent security review, all 14 actual Results captures and image reviews, four bilingual tab-geometry cases and a fresh bilingual editor-focus probe pass. Ordinary source focus exposes the 120px canvas before and after Results; earlier cropped screenshots reflect form scrolling. The initial archive-suffix typecheck failure and vertical-visibility test assumptions remain recorded without changing compiler strictness or weakening horizontal bounds.

- Stage 5 remains open during the frozen 332-cell authorized route review. Actual image review finds an English unread-notification badge clipped at 320px/200% on the coach dashboard; the shared NotificationRow omits the existing Badge wrapping variant. Keep this candidate's evidence and correct the concrete shared-row defect in a separate milestone after the current capture completes. The thirteenth automated suites and editor acceptance do not establish complete visual or release acceptance. Stages 6 and 7 still require successful real catalog/language and populated workflow evidence, a resolved production ingress, and protected exact-head release checks.
