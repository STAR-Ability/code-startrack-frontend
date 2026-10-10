# Frontend feature audit — October 2026

This audit covers the frontend at starting revision
`41ccd2ba279a25e7c748cdbf66996c6e8dd21ddb` on `dev`. It is evidence for the current
audit/redesign/release task, not a replacement API contract or a release approval.
No backend implementation, database, judge service, or production business record
was changed as part of the feature audit.

## Sources and architecture

The audit used `AGENTS.md`, the installed Next.js 16.3.6 Server/Client Component
and static-export guides, `docs/architecture/tech-stack.md`, the V0.12/V0.13/V0.2
integration guides, the current V0.2 API/data/architecture references, the saved
OpenAPI document, current source/tests, and Git history. CodeGraph was used before
source relationship searches. In particular, commits `f803a53`, `2619c15`,
`61ba79e`, `7160672`, and `171c83e` establish the additive contracts and implemented
workflows; their existence was not treated as proof that the code was correct.

The App Router has 37 existing page routes. The project retains static export,
React/TypeScript, pnpm, Tailwind, existing shadcn/Base UI components, TanStack Query,
Zod, React Hook Form, ECharts, Vitest, and Playwright. Runtime resource identifiers
remain query parameters on fixed exported pages. All production transport stays
behind the established same-origin `/api/v1/**` API client and session cookie.
No dependency or architecture migration was needed for the audited fixes.

Private query keys are partitioned by publicId; account, team, analysis-window,
recommendation-audience, problem-version, and language boundaries remain explicit.
Logout cancels reads, clears private query/mutation caches and temporary editor
drafts, and retains the observed session query so mounted gates receive `null`.
New operation keys use cryptographic UUID v4 generation and uncertain retries
retain the original key/payload. The judge result, static analysis, and profile
rebuild lifecycles remain independent frontend projections.

## Route and feature coverage

The following matrix records the route families inspected, their functional
boundaries, and existing regression coverage. Test names are coverage pointers;
their existence does not by itself claim a current full-suite PASS.

| Routes                                                                             | Audited responsibilities and constraints                                                                                                                                                                               | Regression evidence                                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/`, `/product`, `/product/profile`, `/product/recommendations`, `/about`, `/demo` | Public entry/navigation, explicit synthetic demonstration data and bilingual capability copy; no private API requirements disguised as public behavior                                                                 | `entry`, `public-practice`, `product-pages`, `product-polish`, locale E2E; page/showcase unit tests                             |
| `/login`, `/register`, `/reset-password`                                           | CAPTCHA identity/expiry and one-use refresh; email/purpose-bound verification, cooldowns; 12–128-character passwords preserved unchanged; success clears previous private state                                        | `auth-feedback`, `auth-feedback`/interaction browser checks; API client and session tests                                       |
| `/security`, `/security/password`, `/security/email`, `/security/coach`            | Security changes force reauthentication; old/new email verification remains separate; coach role redemption refreshes `/me`; roles do not grant team ownership                                                         | `v012-management`, `collaboration-feedback`; session/role adapter tests                                                         |
| `/dashboard`                                                                       | Combined platform/external learning entry, CF aggregate context, current recommendations, and collaboration context; no CF binding required for platform learning                                                      | `v02-workflow`, `v02-contract`, `frontend-hierarchy`, `workspace-navigation`                                                    |
| `/accounts`, `/accounts/profile`, `/accounts/analysis`, `/data`                    | Current and historical CF bindings, account selection, sync/rebuild recovery, account-scoped history/data/rating lists; account preference does not change user aggregates                                             | `accounts-page`, `sync-panel`, portfolio/API unit tests; `profile`, `data-resilience`, `v012`                                   |
| `/profile`, `/analysis`                                                            | CF-only user aggregate windows/history and frozen personal report snapshots; supplied source/rating provenance and unknown algorithm versions remain visible                                                           | algorithm compatibility, analysis-view, AI lifecycle unit tests; `profile-radar`, `algorithm-compatibility`, `evidence-clarity` |
| `/practice`                                                                        | Existing CF account recommendation generation/latest/history; supplied ranks/reasons and completion; UUID operation keys and uncertain retries                                                                         | recommendations-page unit tests; `recommendation`, `recommendation-loading`, `interactions`                                     |
| `/problems`, `/problems/detail`                                                    | Authenticated published bank, filters/pagination, immutable/current statements, safe Markdown, samples/provenance, capability-driven languages, private version/language drafts and explicit version-conflict recovery | problem-state/editor/detail/statement/Markdown tests; `v02-contract`, `v02-workflow`                                            |
| `/submissions`, `/submissions/detail`                                              | Personal platform filters and independent judge/analysis states, infrastructure versus solution verdicts, private source reveal, static-tool metrics/findings/reproducibility and deliberate retries                   | submission-list/judge/source/static-analysis tests; query polling tests; `v02-workflow`                                         |
| `/training`, `/training/detail`                                                    | Backend-owned current plans/attempts/completion and frozen first recommendation attribution; inclusive `from` and exclusive `to` boundaries; external navigation never marks AC                                        | learning-model/workspace tests; `v02-contract`, `v02-workflow`                                                                  |
| `/learning-profile`                                                                | Four combined learning windows, immutable snapshots/history, ability separate from code quality, source-separated difficulty scales, explicit rebuild and bounded automatic latest GET reconciliation                  | learning-workspaces/model/query-hook tests; `v02-contract`, `v02-workflow`                                                      |
| `/learning-recommendations`                                                        | Source/mode/latest/frozen batch/history scopes, explicit generation and bounded limits; navigation during in-flight generation does not overwrite selection                                                            | learning-workspaces tests; V0.2 adapters/operation-key tests; `v02-workflow`                                                    |
| `/teams`, `/teams/detail`, `/teams/member`                                         | URL-driven team tasks, fresh `canManage`, independent member-data permissions, invitations/applications/membership/settings, MEMBER/COACH recommendation audiences                                                     | team-member/settings/focus/invalidation tests; `team-workspace`, `team-analytics`, `v012-management`, `collaboration-feedback`  |
| `/coach`, `/coach/teams`, `/coach/teams/create`                                    | Additive COACH gate and managed-team directories, pending queues and creation; system ADMIN/COACH never silently overrides per-team management authorization                                                           | coach-page tests; `v012`, `team-workspace`, `v012-responsive`                                                                   |
| `/privacy`, `/notifications`                                                       | Four independent privacy scopes; confirmed writes survive failed refreshes without overwriting newer revisions/denials; structured notification references and read/unread counts                                      | settings-save-feedback/invalidation/API tests; `v012-management`, `collaboration-feedback`                                      |

No unfinished production endpoint or fake completion interaction was introduced.
The V0.2 administrator import/publication/withdrawal/metadata API signatures remain
available and validated. A complete administrator console is not an existing
route requirement: the V0.2 delivery plan explicitly permits API signatures and
marks that console optional. The six ability dimensions remain training familiarity;
static code quality is separate. Synthesis remains the documented NOT_REQUESTED
placeholder without an invented execution endpoint or generated explanation.

## Concrete defects corrected

| Defect                                                                                                                                                   | Resulting behavior                                                                                                                                                                            | Direct regression                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Collaboration success checked the current identity before awaiting query refresh, then ran navigation/form-reset callbacks after logout or another login | Rechecks the operation's session ownership after refresh and before invoking completion side effects                                                                                          | `collaboration-session.test.tsx` covers logout/new identity during refresh and same-session completion               |
| `acceptSubmission` rejected an entire submission DTO when either independent task revision was older                                                     | Keeps only the stale task's judge/analysis fields while accepting the other task's valid progress; comparison remains scoped to task identity, and UTC update precision is retained           | `v02.test.ts` covers crossed judge/analysis revisions, completed verdict preservation and new analysis task identity |
| Legacy AI polling stopped on 401/403/404 while its processing helper only stopped on 404                                                                 | Permanent session/access denials release the processing state; transient read failures retain the lock and prevent duplicate job creation                                                     | `use-ai-job.test.tsx` covers denied jobs, session expiration, transient outages and recovery                         |
| Header Refresh used `QueryClient.refetchQueries`, bypassing the latest-profile hook's bounded-attempt reset                                              | A private read-restart signal begins a new bounded GET attempt without claiming a source update; null evidence still requires an actual source event before automatic reconciliation          | `v02-hooks.test.tsx` covers header-style query-client refresh, bounded restart, no rebuild POST and null evidence    |
| Static export folders could shadow their HTML page, trailing-slash requests could return 403, and unknown pages fell back to homepage HTTP 200           | Prefers exported HTML, canonicalizes known trailing-slash pages while preserving queries, and returns true 404 responses for unknown pages/assets                                             | Local static-server fixture regression and added exact-image container assertions                                    |
| Generic landing/auth/product copy described CF as the sole current source and claimed that only public training data was used                            | Bilingual copy describes platform and CF practice separately and distinguishes public CF records from private platform submissions; synthetic CF previews retain their specific source labels | Existing localization/public-page checks plus coordinated browser review                                             |

## Verification recorded by the feature audit

| Check                                                          | Result                           | Scope                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused API/query/session/form regression command              | PASS — 119 tests across 10 files | `client`, `v012`, `v02`, `v02-schemas`, `v02` query/hooks, V0.12 invalidation, collaboration/session, AI lifecycle, settings-save feedback; run before the two added header-refresh tests                                             |
| Updated V0.2 query/polling hooks                               | PASS — 31 tests across 2 files   | Includes the two new header-refresh regressions and crossed task revisions                                                                                                                                                            |
| Local static routing/server unit regression                    | PASS — 24 tests                  | HTML-before-directory selection, query-preserving redirects, unknown-page/asset 404 and unchanged proxy/cache/body behavior                                                                                                           |
| Localization and public-page checks                            | PASS — 9 tests across 4 files    | Existing locale/V0.2 message parity, About page and landing-route selection                                                                                                                                                           |
| Scoped ESLint and Prettier                                     | PASS                             | Initial collaboration, independent revision and AI-lock changed files                                                                                                                                                                 |
| Full lint/format/types/unit/build/Storybook/E2E/browser matrix | NOT RUN by this audit subtask    | Coordinated task-level gates must record current final-tree results separately                                                                                                                                                        |
| Exact-image container verification                             | NOT RUN by this audit subtask    | The default socket was unavailable; root verified Docker 29.5.2 through existing colima-startrack-v02 context and owned the then-pending task-scoped container gate; final candidate acceptance is recorded in the release inspection |
| Authenticated real-backend role/workflow reads                 | BLOCKED in current evidence      | No designated credentials/session were supplied to the read-only integration audit                                                                                                                                                    |

The separate [real backend verification report](real-backend-verification-2026-10.md)
records host-specific read-only transport/contract evidence. The designated
startrack-prod OpenAPI matches the saved legacy contract (85 paths and 97 primary
operations), without the additive V0.2 endpoints. A later server2 inventory
advertises all 27 designated V0.2 method/path pairs, with unresolved enum and
annotation discrepancies recorded in that report. Advertised paths and anonymous
security responses do not establish authenticated runtime/schema acceptance.
Synthetic tests prove frontend behavior only. Availability and authenticated API
support must be verified before claiming a complete release.

The backend image-only CAPTCHA still has no nonvisual contract alternative.
This documented backend dependency is not resolved by weakening the challenge or
inventing an endpoint. Existing audience/report-period/team-clearing contract
discrepancies retain their documented legacy boundaries until newer authoritative
backend evidence resolves them.

## Static routing follow-up

The routing subtask updated `deploy/default.conf.template`, `scripts/start.mjs`,
`src/lib/mock/frontend-server.test.ts`, and `tests/container/browser-check.mjs`.
Nginx and the local preview prioritize the exported `.html` file over directories
containing Next navigation payloads. A known page with a trailing slash receives
HTTP 308 with query parameters preserved. Unknown paths are not redirected to a
fictitious page and return HTTP 404, with exported `404.html` when available.
API/static prefix locations retain precedence; no stale API path becomes HTML.

The routing regressions passed 24 unit tests, focused ESLint/Prettier and
`git diff --check`. Container assertions now include root/nested routes, rendered
canonical dashboard navigation, query preservation, unknown pages, missing assets
and obsolete API paths. Those assertions were added; runtime nginx/browser execution
is NOT RUN by this audit subtask. The default Docker socket was unavailable, but root
subsequently verified the existing `colima-startrack-v02` Docker context (29.5.2).
The coordinated container gate will use that context without changing unrelated
services. README describes the corrected behavior instead of a homepage fallback.
