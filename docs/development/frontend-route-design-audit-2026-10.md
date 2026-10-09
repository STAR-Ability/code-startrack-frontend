# Frontend route design audit — October 2026

This audit covers all 37 exported `src/app/**/page.tsx` routes. The implementation
uses existing shadcn Base UI/Nova components, semantic color tokens, Lucide icons,
Geist typography and ECharts. It preserves backend values, source scales,
recommendation ordering, snapshot identity, locale ownership and role boundaries.

The execution plan is
[frontend-audit-redesign-release-2026-10.md](../../.agent/plans/frontend-audit-redesign-release-2026-10.md).
Shared surfaces are documented in
[ui-surface-hierarchy.md](ui-surface-hierarchy.md), and shared visual findings in
[visual-design-review-2026-10.md](visual-design-review-2026-10.md).

## Findings and changes

The initial rendered dashboard repeated every recommendation and the source-count
panel before its existing CF context. It now leads with a platform-training entry,
four primary learning metrics and the first supplied recommendation. A deep link
opens the complete frozen batch. This display bound does not sort recommendations
or change their rank, completion state, reasons, scores or attribution.

The learning profile displayed the overall score beneath its radar. The score now
leads the ability section, next to a labeled weakest-dimension badge. Source counts
follow the main evidence. Code-quality and comparable CF statistics form separate
panels in a responsive row. Difficulty charts use a responsive grid while keeping
CF_RATING, PLATFORM_RATING and UNRATED scales independent. All supplied values remain
available outside charts.

Recommendation generation used a tall, single-column control area and repeated its
explanation. Source and mode controls now form two columns when space allows; the
quantity and generation action share a compact row. The first-ranked result has a
restrained info surface, while the other supplied results use quieter rows. Plan
actions have content-sized buttons rather than full-width dark strips. Full batches
retain every supplied recommendation and all provenance disclosures.

The problem bank now separates filters from reading results and gives each result
a wrapping title, metadata and explicit navigation action. Training rows distinguish
attempts, accepted submissions and last submission time. Training detail uses a
single problem-context heading followed by factual counters; reference and
attribution panels share a responsive row. Learning history remains secondary.

The demo now belongs to the fixed public background and introduces its synthetic
scope beside a clear training entry. Its primary metrics precede charts. The shared
member ability view now uses the same prominent supplied score and weakest-dimension
badge, with its radar beside the complete dimension list. Existing
public, account, team, privacy, notification and security routes benefit from the
shared background, chapter headers, layered surfaces, stronger semantic KPI styling
and coherent control states; their established route-specific hierarchy is retained.

## Route matrix

`Shared` means the route is revised through shared shell, typography, Card, metric,
chart and control changes. `Local` means its composition also changes directly in
this audit. The inventory is derived from current route files rather than historical
plans. Detail views are inspected with current synthetic resource IDs, not only
missing-parameter states.

| Route                       | Current composition and audit decision                                                                                                                            | Change |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `/`                         | Product introduction, preview, training loop and entry actions; fixed brand canvas and restrained feature surfaces.                                               | Shared |
| `/product`                  | Platform/CF capabilities and the current training loop; preserve distinct capability groups.                                                                      | Shared |
| `/product/profile`          | Clearly labeled illustrative profile; primary values precede its ability evidence.                                                                                | Shared |
| `/product/recommendations`  | Synthetic recommendation explanation and mode comparison; maintain example labeling.                                                                              | Shared |
| `/about`                    | Product principles and present/future boundaries; preserve editorial spacing.                                                                                     | Shared |
| `/demo`                     | Synthetic intro and training entry, primary metrics, charts, then recommendation.                                                                                 | Local  |
| `/login`                    | Identity form, captcha and recovery links within the shared auth composition.                                                                                     | Shared |
| `/register`                 | Registration, verification and inline errors within the shared auth composition.                                                                                  | Shared |
| `/reset-password`           | Email verification and new password; wrapping labels and recovery actions.                                                                                        | Shared |
| `/dashboard`                | Combined learning metrics and one recommendation preview, then distinct CF/report/collaboration context.                                                          | Local  |
| `/problems`                 | Filter surface, readable result list, explicit problem actions and pagination.                                                                                    | Local  |
| `/problems/detail`          | Immutable statement and capability-driven editor in a responsive split.                                                                                           | Shared |
| `/submissions`              | Labeled judging/date filters, status results and pagination.                                                                                                      | Shared |
| `/submissions/detail`       | Independent judge and analysis states, private-source disclosure and evidence.                                                                                    | Shared |
| `/training`                 | Source/status/date filter group, factual attempt/acceptance rows and navigation.                                                                                  | Local  |
| `/training/detail`          | Problem context, current counters, then reference and attribution.                                                                                                | Local  |
| `/learning-profile`         | Window/rebuild controls, learning status, ability score/evidence, separate code quality, scale-specific charts and history.                                       | Local  |
| `/learning-recommendations` | Compact generation controls, rank-aware full batch and secondary history.                                                                                         | Local  |
| `/profile`                  | Aggregated CF ability summary, dimension evidence and source context.                                                                                             | Shared |
| `/data`                     | Windowed selected-account data, table filters, distributions and rating evidence.                                                                                 | Shared |
| `/analysis`                 | Current report conclusions and frozen historical report evidence.                                                                                                 | Shared |
| `/practice`                 | Training controls, first recommendation, supporting recommendations, source evidence and history.                                                                 | Shared |
| `/accounts`                 | Bind form, current binding inventory, sync state and read-only historical bindings.                                                                               | Shared |
| `/accounts/profile`         | Selected-account metrics, ability evidence and synchronization controls.                                                                                          | Shared |
| `/accounts/analysis`        | Selected-account window/history controls and immutable analysis evidence.                                                                                         | Shared |
| `/teams`                    | Participation/discovery/application/invitation sections and team actions.                                                                                         | Shared |
| `/teams/detail`             | Team identity, task navigation and authorized overview/analytics/management sections.                                                                             | Shared |
| `/teams/member`             | Capability-controlled member views; primary score and weakest dimension precede the radar and complete dimension evidence. Privacy boundaries remain independent. | Local  |
| `/coach`                    | Coach task direction, actionable counts, managed teams and updates.                                                                                               | Shared |
| `/coach/teams`              | Coach team inventory with management actions; preserve authorization.                                                                                             | Shared |
| `/coach/teams/create`       | Labeled team creation form with explicit submit, pending and error feedback.                                                                                      | Shared |
| `/privacy`                  | Independent sharing scopes, associated labels and confirmed persisted settings.                                                                                   | Shared |
| `/notifications`            | Unread/all filtering, readable notification actions and paging.                                                                                                   | Shared |
| `/security`                 | Identity summary, change flows and logout action.                                                                                                                 | Shared |
| `/security/password`        | Identity verification and password change with visible errors and recovery.                                                                                       | Shared |
| `/security/email`           | Independent email verification and reauthentication flow.                                                                                                         | Shared |
| `/security/coach`           | Invite redemption form and additive role feedback.                                                                                                                | Shared |

## Verification evidence

The initial independent Playwright review used the explicit synthetic development
harness at `http://127.0.0.1:3000`. Final settled evidence uses the production-export
harness at `http://127.0.0.1:3100`, with requests restricted to its origin. Screenshots,
route-state JSON and reproducible inspection scripts live under ignored
`test-results/route-design-audit/`. The coach preset includes both STUDENT and COACH
so authorized forms and coaching pages can be inspected without backend writes.
The default STUDENT preset is restored after the review.

- PASS: scoped ESLint for the changed composition files, including the shared member ability view.
- PASS: TypeScript compilation with `pnpm exec tsc --noEmit`.
- PASS: four shared-member null-snapshot tests in both locales.
- PASS: all 18 learning-workspace regression tests, including preservation of supplied ordering and complete-batch identity in the compact preview.
- PASS: all 37 routes rendered at 1440, 1024, 768, 390 and 320 pixels (185 initial development observations) without document or inspected control/surface overflow.
- PASS: settled full-page production-export screenshots for all 37 routes in both locales at 1440, 768 and 390 pixels (222 observations); all 150 chart SVGs loaded, with no pending data, console/hydration errors or document/control overflow.
- PASS: 24 additional valid member-view observations across four views, two locales and three widths. Basic training, ability and report-list views rendered; detailed submissions correctly showed privacy denial in the supplied fixture.
- PASS: 54 observations of the final rebuilt production export across nine chart states, both locales and 1440, 768 and 390 pixels. All 174 chart SVGs rendered, with no pending data, console/page errors, document/control overflow, external requests or API writes.
- PASS: eight production cases on source `765b55e` at 1440, 768, 390 and 320 pixels in both locales, with the actual lazy ECharts package chunk held until after a real Personal data mode interaction. All 24 chart frames and 56 native legend buttons remained mounted with exactly 0px measured geometry change.
- PASS: two independent ready-engine dashboard disclosure checks at 1440 pixels in both locales. Enter opened the native date/value list and closed it again; native dates were unmounted while the fully rendered SVG axis remained visible.

The final targeted states include the public profile example, expanded personal
profile evidence, account-data statistics and Ratings, selected-account analysis,
authorized team analysis, member training and ability, and the learning profile.
The selected-account fixture supplies two history records, so its score trend was
inspected in a populated state. Desktop and mobile chart contact sheets and full
member pages were reviewed after the rebuild; radar labels wrap on narrow English
screens, native legends remain readable, and the complete factual dimension lists
remain available. The 222-row matrix and 24 member observations cover the preceding
production snapshot; the 54 targeted observations cover the ready chart composition
before the final loading-geometry correction. That correction preserves the ready
composition and is covered by the eight additional delayed-engine cases below.

The delayed-engine check identified the exported ECharts chunk by its actual
`_echarts_instance_` module marker and held its request in isolated browser contexts.
Each of the three `/data` charts initially had no SVG, an active loading state, and
its complete disabled native legend. While the chunk remained held, the real
Submissions mode button in the Personal data group was clicked; all eight supplied
submission-list API responses returned 200 and the selected mode remained active
after engine readiness. Legend groups, labels, initial selected states and DOM
nodes persisted, while legend buttons changed from disabled to enabled.

Measurements used document coordinates (`rect.top + scrollY`) and the same viewport,
locale and supplied data before and after engine readiness. Full chart frames,
chart surfaces, native legend groups, every legend button, the Personal data group,
its controls and the downstream Submissions heading had exactly 0px displacement.
The loading-to-ready screenshots were also inspected at 320 pixels in both locales.
No browser errors, warnings, failed API requests, external requests or API writes
occurred. The network log preserves 16 aborted frontend-route requests and no other
failure codes. All browser contexts were closed without resetting the shared fixture.

The reproducible focused script is
`test-results/route-design-audit/loading-geometry.mjs`; its eight state/network JSON
files, combined `loading-geometry.json`, and 24 full-page pending, pending-selected
and ready screenshots remain in the same ignored artifact directory.

The release follow-up date check used an owned offline preview of the unchanged
application export. Its actual visible axis date was `2026-09-03`, a documented
zero-filled calendar day. That date had two exact card-wide matches when the
disclosure opened: one SVG axis label and one native `dl time[datetime]`. The first
raw activity date, `2026-10-01`, was not an axis tick at this local layout; its native
row retained the supplied five submissions, two solved problems and one pending
submission. On Enter close, both native dates were unmounted, while the SVG axis
date remained visible. This independently demonstrates why a closed-list assertion
must target native evidence rather than all card text. No application or fixture
changes were made, and the owned browser and preview were closed.

The reproducible check is
`test-results/route-design-audit/ready-date-disclosure.mjs`, with two status/network
JSON files, combined `ready-date-disclosure.json`, and six initial, expanded and
collapsed screenshots. Earlier inspection runs assumed the first raw date would
be a visible axis tick; their assumption failures are preserved separately in
`ready-date-disclosure-*-axis-assumption.json`. The final checks select an actually
drawn date and separately verify the first raw date, with no browser errors,
warnings, failed API requests, external requests or API writes.

The request-failure log preserves 151 `net::ERR_ABORTED` cancellations on frontend
route requests during navigation/prefetch. There were no failed API requests or
other failure codes. These cancellations did not produce console errors or prevent
the inspected pages, data or charts from settling. The final capture script is
`test-results/route-design-audit/final-chart-routes.mjs`, with state JSON and
`final-*` screenshots in the same ignored directory. The chart review separately
verified keyboard legend toggling and hidden-series identity across locale changes
in light, dark and reduced-motion states.

The first cold-development sweep reported an input hydration warning on
`/reset-password` and a pre-mount React state warning on `/security/coach`.
A later 320px `/data` observation also reported a development warning during live
reload. An immediate fresh `/reset-password` read was clean. The feature audit
received these findings. They were not reproduced in the settled 222-row
production-export sweep, including
`/reset-password`, `/security/coach` and `/data` in both locales and all three
widths. Final E2E remains a separate release gate.

This visual audit does not establish real-backend functionality or production
release. Those gates remain tracked by the separate backend and release reports.
