# Independent frontend review — October 2026

Reviewed the current worktree on 2026-10-09, independently of the implementation
owners, with particular attention to private source isolation, form focus,
collaboration completion ownership and independent judge/analysis projections.
The final complete diff was also reviewed for chart state, exported-page
routing, unintended scope changes, private data, debug artifacts and hidden
test exclusions.

The review used the current
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
and the repository's browser-review workflow. The applicable rules were semantic
controls and labels, associated errors and first-error focus, visible keyboard
focus, reduced motion, translated narrow layouts, explicit external navigation,
code/identifier translation protection, and loading/error states.

## Source findings

- `src/components/workspace/v02/submission-source.tsx:17` — PASS. The content
  component is keyed by authenticated public ID and submission ID. Changing
  either discards already revealed source and its hash before the replacement
  viewer is rendered. Reads require the current identity; hiding/unmounting
  aborts requests; late results check the controller and current session before
  displaying data. Source is component-local and not persistently cached.
- `src/components/workspace/v02/problem-editor.tsx:139` — PASS. Blank-source
  submission moves keyboard focus to the actual textarea. Its label, invalid
  state and associated error remain intact; an invalid source never reaches the
  write API. The surrounding problem detail component remounts on identity and
  route changes, and temporary drafts retain complete user/problem/version/
  language ownership.
- `src/components/workspace/v02/code-editor.tsx:36` — PASS. The forwarded input
  ref reaches the native textarea; the source field has a meaningful name,
  disables spelling/capitalization/autocorrection, permits paste and protects
  code from browser translation.
- `src/components/workspace/v012-shared.tsx:114` — PASS. Completion ownership is
  checked both before and after awaited dependent refreshes. The new independent
  regression additionally changes identity while the original write is still
  in flight and proves that its completion cannot navigate/reset the next user's
  form or invalidate that user's private queries.
- `src/components/workspace/use-ai-job.ts:15` — PASS. HTTP 401/403/404 release a
  withdrawn task's processing state and stop polling; a transient outage keeps
  the task pending, preventing accidental duplicate generation.
- `src/lib/query/v02.ts:193` — PASS. Same-task judge and analysis revisions are
  reconciled separately. A newer verdict survives an older analysis projection
  and vice versa; changed task IDs are not compared using another task's
  revision. The analysis tracker separately rejects retired identities. UTC
  update-time selection preserves fractional precision.
- `src/components/workspace/v02/safe-markdown.tsx:53` — PASS. Statement media
  remains explicit link navigation with visible keyboard focus; code regions
  are focusable and excluded from browser translation. Source and Markdown are
  rendered as text/safe structured content rather than executable HTML.

No additional blocking defect was reproduced in these reviewed changes. A
suspected early identity-switch callback problem was disproved by executable
evidence: the private mutation key detaches the old observer and existing
ownership guards suppress stale completion. Its useful regression was retained
in `collaboration-session.test.tsx`, with the implementation owner's coordination.

## Final diff and resolved routing finding

After the routing and legend follow-ups below, source review found no additional
unresolved high-impact chart or UI defect. Stable semantic chart IDs preserve
native legend selection and palette slots across
locale, theme, reorder and removal changes; production trend callers provide
those IDs. The compact recommendation preview retains supplied order and links
to the complete frozen batch. Added-line scans of tracked changes and new files
found no hidden test skips or exclusive tests, new lint/TypeScript suppressions,
debug artifacts or secret assignments. The `console.log` text in the static
server test is an asserted synthetic asset fixture.

The routing review found and reproduced one limited local-server defect. A raw
`GET /x/..//problems/detail/?problemId=42 HTTP/1.1` request was normalized to a
pathname beginning with two slashes, then emitted as HTTP 308 with
`Location: //problems/detail?problemId=42`. This is a protocol-relative external
redirect. Normal browser URL normalization reduces its reachability; production
nginx retains its default slash merging, so the same configuration-level edge
does not apply there. That nginx conclusion came from source and official
documentation review, not an independent runtime nginx reproduction.

**RESOLVED:** `scripts/start.mjs:152` collapses leading slashes before removing
the trailing slash and constructing the canonical Location. The new regression
in `src/lib/mock/frontend-server.test.ts` sends the exact raw target through
Node's `httpRequest` path option, since `fetch` would normalize it first. It
asserts HTTP 308, `/problems/detail?problemId=42`, the original frontend origin,
and no upstream forwarding.

**PASS — lead-run regression evidence:** the complete
`src/lib/mock/frontend-server.test.ts` suite passed all 25 tests after the fix;
the lead agent also completed scoped ESLint and Prettier checks. The raw-request
regression reproduced the prior failure before the corrected implementation.

**PASS — independent source and handler verification:** the corrected handler
was invoked against the current static export with the original raw target, a
four-slash variant and a normal route containing `filter=a%2Fb`. Every redirect
retained a single leading slash and the complete query, and resolved to the
frontend origin. This follow-up review changed only this report; it did not
rebuild the app, modify fixtures or rerun the lead agent's test suite.

## E2E replay diagnosis and legend follow-up

The prior full replay, using the earlier compiled export, was deliberately
canceled after 268 passes, one English UTC test timeout, one interrupted test
and 64 tests not run. The lead agent archived its logs and traces. Those counts
are partial evidence, not a complete E2E acceptance result.

The failing `product-polish.spec.ts` trace located the timeout at the response
wait registered on line 206 for `/api/v1/oj-accounts/:id/submissions`; no UTC
formatting assertion had run. The click uniquely resolved to the intended
Personal data toggle and completed without a strict-selector error. Its final
state was focused but `aria-pressed="false"`, with Attempted problems still
selected. No submissions request existed in the network trace; the session,
account, problem, overview and sync-status reads returned HTTP 200. No runtime
or hydration error explained the missed activation.

The action snapshot at trace time `112557.031` showed all three charts busy.
By `112983.663`, they were ready and their native legends had been inserted;
the subsequent screencast visibly moved the data controls by approximately 96
CSS pixels. This supports an action/layout readiness race rather than a lost
fixture response or UTC-formatting failure. The trace does not record enough
DOM event detail to prove the exact reason the click failed to activate the tab.

**PASS — independent source review:** `chart.tsx:199` now renders the actual
keyed legend group and buttons from their first frame, including loading,
failure and retry. The native buttons stay disabled until the engine is ready.
The same labels, swatches and wrapping layout reserve the content's real space;
disabled styling changes opacity and pointer behavior without changing its
dimensions. No fixed placeholder height or additional animation was added.

The deferred regression in `chart.test.tsx:275` checks legend and button node
continuity through loading, failure and retry, prevents disabled toggles,
confirms retry initializes the latest supplied data, and verifies a ready
button still toggles its series. Its DOM assertions establish continuity and
interaction semantics; they do not independently measure browser geometry.

`product-polish.spec.ts:211` now scopes the Submissions toggle to the existing
localized Personal data group (`v.data`) and asserts `aria-pressed="true"`
after clicking. Always-present legend controls can share the series name, so
the semantic group identifies the intended mode control. The response waiter
remains registered before the click. Every submission/report-period UTC
assertion, nonempty-response and request-method check, and the existing timeout
budget remain intact; no chart-readiness wait was added to this test.

**PASS — implementation-owner regression evidence:** the chart owner reported
33 scoped tests, including the deferred regression, plus scoped ESLint and
Prettier checks. **NOT RUN by this reviewer:** follow-up tests, browser runs or
builds. The rebuilt export and complete final E2E gates remain the lead agent's
verification responsibility; this source review does not claim they passed.

## Remaining locator audit

A CodeGraph-first source review and scoped E2E/Storybook searches found one
additional concrete evidence collision. `evidence-clarity.spec.ts:28` counted
six page-wide exact `0 / 100` text nodes. A populated zero snapshot renders six
dimension definitions and, once initialized, six identical radar score labels
inside SVG. The assertion could observe only the definitions before the engine
finished, rather than consistently identify the intended readable evidence.

The six-value assertion now scopes to the existing `[data-analysis-ability]`
card's semantic `definition` roles and retains its expected count of six. The
absent-profile checks for no chart, no numeric zeros and no zero scores remain
broad; the positive metric check, GET-only evidence and timeout budget are
unchanged. No readiness wait or application change was added.

The other remaining submission-mode locators already target their Personal
data group. The independent Storybook review found no additional collision:
the lone Solved legend action lives in a single-chart story and already waits
for its button to be enabled. Existing locale/radar score checks use dimension
definitions rather than page-wide numeric text. Runtime verification for this
test-only follow-up remains with the lead agent; no test, browser, build or
fixture operation was performed by the locator reviewers.

**PASS:** targeted ESLint for `evidence-clarity.spec.ts`, targeted Prettier for
that test and this report, and the scoped whitespace/diff check.

## Executed regression checks

**PASS:** 65 tests across these eight suites:

```bash
pnpm exec vitest run src/components/workspace/v02/submission-source.test.tsx src/components/workspace/v02/problem-editor.test.tsx src/components/workspace/v02/problem-detail-page.test.tsx src/components/workspace/collaboration-session.test.tsx src/components/workspace/use-ai-job.test.tsx src/lib/query/v02.test.ts src/lib/query/v02-hooks.test.tsx src/components/training/query-provider.test.ts
```

Coverage includes revealed-source removal, abort and stale response handling,
expired-session cache clearing, first-error focus, unmodified source submission,
uncertain-write replay, explicit version recovery, private draft boundaries,
deferred collaboration writes and awaited refreshes, authorization denial,
transient-error polling, independent task reconciliation and retired analyses.

**PASS:** targeted ESLint on `collaboration-session.test.tsx`, and targeted
Prettier checks for that regression file and this report.

## Isolated browser acceptance

An independent headless Chromium instance used the existing synthetic dev
harness at `http://127.0.0.1:3000`. The reviewer confirmed mock provenance before
opening protected routes, did not reset the shared fixture, and enforced an
origin/method guard that aborted external traffic and every non-GET/HEAD request.
No shared browser MCP state was used.

**PASS** in English and Simplified Chinese:

- native Enter submission on the focused submit button focuses the invalid
  source textarea and exposes correctly resolved descriptions and visible focus;
- editor layout has no page overflow at 390px or 320px with 200% text sizing;
- native keyboard source reveal/hide updates `aria-expanded`, removes source
  on hide, and allows visible keyboard focus on the private code region;
- source code has `translate="no"`;
- zero external requests, business-write requests, browser page errors or
  console/hydration errors.

Rendered screenshots were inspected for readable labels, focus emphasis,
component/background separation and narrow-layout behavior. Review evidence is
stored under ignored `test-results/independent-review/`, including the executable
read-only browser check and screenshots. The broad all-route desktop/tablet/
mobile visual sweep remains the separate QA owner's verification scope.

## Limits

This review is a scoped source, regression and browser acceptance check, not a
full WCAG conformance audit. Full-repository lint/type/build, Storybook and E2E
release gates are coordinated separately by the lead agent. Live authenticated
and role acceptance remains subject to the designated-session/backend blockers
in `real-backend-verification-2026-10.md`. No real backend mutation, judge service
test, commit, push or deployment was performed by this reviewer.
