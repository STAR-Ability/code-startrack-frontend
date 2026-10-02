# V0.11 Mock API and data-state audit

Reviewed on 2026-10-02 against the complete DTOs, endpoint tables and semantics in
[prompts/前端api文档.md](../../prompts/前端api文档.md) and
[prompts/前端需要知道的数据库.md](../../prompts/前端需要知道的数据库.md).

## Repository review and authority

Reviewed App Router routes/layouts; workspace, auth, landing and shared UI consumers;
API endpoints/response schemas/transport; session, ownership, cache keys and mutations;
locale dictionaries; charts; Demo fixtures; offline scripts; Playwright fixtures/specs;
static server/nginx/Docker/CI configuration; and relevant engineering/product rules.
The active frontend is V0.11 with 12 product routes (including the landing page).
`apidocs.md`, the V0.1 page/requirements documents and the broader Demo V2 plan describe
older/different stages. Their user-level aggregation, fixed-user gateway, Judge and
Agent requirements are superseded by this task's explicit account-scoped V0.11
sources. No endpoints from those historical documents were added.

Findings addressed:

- Analysis, overview and dashboard cards depended on successful data before mounting.
- Failed first list loads lacked the same empty/list structures as empty successes.
- Documented 404s were silently displayed as successful emptiness with no retry.
- Compact errors hid the recovery explanation in details/toasts.
- The existing test backend ignored several filters and requested pagination sizes;
  invented arbitrary snapshot/job/batch detail responses; discarded unbound accounts;
  reused one rebinding ID; and did not preserve generated histories or limits.
- Original summary/progress/submission fixtures described different datasets. Some
  recommendations included already-solved problems and mixed snapshot references.
- Two of 31 endpoint wrappers existed without actual UI consumers.
- The failed-refresh E2E asserted that a button was enabled before waiting for the
  initial content; it now waits for the actual content it intends to retain.

## Explicit Mock startup

Node 24 and the repository's pinned pnpm/dependencies are required. No dependency,
DB, algorithm service, external account, key or live backend is needed.

```sh
pnpm dev:mock                  # Next development on 3000, Mock API on 3210
pnpm build
pnpm preview:mock              # Static preview on 3100, Mock API on 3210
MOCK_SCENARIO=empty pnpm preview:mock
MOCK_SCENARIO=error pnpm dev:mock
pnpm test:e2e                  # Starts/stops its own preview, do not run another
```

If this restricted environment reports Turbopack worker port-binding EPERM,
`pnpm build --webpack` uses the installed Next.js supported alternative and
produces the same static export. The default build script remains unchanged.

Existing `dev:offline` and `preview:offline` remain compatible aliases. Mock startup
explicitly overrides `.env.local` backend selection with the loopback service. It
refuses public backend binding; preview awaits backend binding before accepting
frontend requests and fails on occupied ports. Stop the manual server with Ctrl+C
before E2E. State is memory-only and resets when the server restarts.

The default Mock starts as a synthetic signed-in student with DemoAlpha and DemoBeta
plus read-only unbound history. All returned fields are complete V0.11 DTOs, including
nullable fields. IDs remain decimal strings (including beyond JS safe-number range),
UUIDs remain UUIDs, timestamps are UTC, arrays remain arrays and memory is bytes.
Analysis totals and attempted-problem progress match the same submission fixtures.
Four windows share calendar-day boundaries. Histories are addressable by their
actual IDs; generation excludes solved candidates and preserves stored batches.

Responses identify provenance with `X-codeStartrack-Mock: true`, outside the DTO;
the shared API client displays the localized **Mock mode · example data** notice.
Normal live startup never silently falls back to Mock after a failed API call.
Landing illustrations and `/demo` remain explicitly local example views.

| Scenario        | Behavior                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `success`       | Two CF accounts, one unrated, Gym/INFERRED, nullable title/URL, team PENDING submission, four windows, three recommendation modes and historical binding |
| `visitor`       | Expired session and login guidance                                                                                                                       |
| `no-accounts`   | Signed-in user, no bindings, real Mock binding flow                                                                                                      |
| `empty`         | Zero analysis evidence, empty records and successful zero-candidate recommendations                                                                      |
| `not-generated` | `data=null` analysis/recommendations with empty histories                                                                                                |
| `stale`         | Existing snapshots/batches marked stale                                                                                                                  |
| `partial`       | Sync -> PARTIAL/ANALYSIS; successful CF data remains available                                                                                           |
| `running`       | Active job continues polling                                                                                                                             |
| `invalid`       | INVALID account allows sync/unbind, rejects rebuild/generate                                                                                             |
| `completed`     | Historical batch retains original rank with solvedSinceGeneration=true and original analysis                                                             |
| `error`         | All reads fail with a valid ApiError and retry                                                                                                           |
| `slow`          | Delayed requests with persistent structure and loading feedback                                                                                          |

Implementation: `src/lib/mock/{backend,requests,scenarios}.mjs`, shared typed fixtures
in `src/lib/demo/fixtures.ts`. `tests/mock-backend.mjs` is a compatibility export.
The local-only `/__control` endpoint is outside the API prefix and is not proxied
by the frontend. Tests use it to reset state, fail a specific path/resource, slow
requests, force a one-off generation timeout/429, keep jobs running or exercise
101-account pagination. Unknown scenario names fail startup.

The Mock validates methods, allowed request/query fields, enums, IDs, integer
ranges and time boundaries; malformed JSON becomes a documented error envelope.
Filtering happens before pagination; total/hasNext and beyond-last-page behavior
follow the contract. Binding/unbinding, invalid/read-only states, same-active-job
reuse, 60-second manual-job cooldown, terminal statuses and per-account generation
idempotency are simulated. POST/DELETE only affect this temporary local dataset.

Authentication is a **single synthetic learner simulator**: captcha/email/password
ownership, delivery, one-use verification codes, multi-user credentials, Origin
security and seven-day expiry enforcement require the real backend. For form
exploration use a non-empty captcha answer, a six-digit email code (e.g. 123456)
and a 12–128 character synthetic password. Never enter real credentials. No emails
are sent. These limitations do not change frontend DTOs or production behavior.

## Endpoint usage

There were 29 actual UI consumers before this change, with all 31 wrappers already
present. After this change all 31 documented endpoints have a reasonable consumer.
No documented endpoint remains unused. A read wrapper alone was not counted as UI
usage. Requests remain centralized in `src/lib/api/endpoints.ts`.

| Method and path (all prefixed `/api/v1`)               | UI consumer / purpose                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| POST /auth/captcha                                     | Login/register/reset/email-change captcha                         |
| POST /auth/email-codes                                 | Registration/reset and old/new email verification                 |
| POST /auth/register                                    | Registration form                                                 |
| POST /auth/login                                       | Login form                                                        |
| POST /auth/logout                                      | Security: current session                                         |
| POST /auth/logout-all                                  | Security: all sessions                                            |
| POST /auth/password/reset                              | Reset-password form                                               |
| GET /me                                                | Session provider and signed-in identity                           |
| GET /me/roles                                          | **Added:** identity/role card in security                         |
| POST /me/password/change                               | Security password form                                            |
| POST /me/email/change                                  | Security verified email-change form                               |
| GET /oj-accounts                                       | Owned account selector; unbound-history toggle; all pages fetched |
| POST /oj-accounts                                      | Bind form                                                         |
| GET /oj-accounts/{accountId}                           | **Added:** expandable account details                             |
| DELETE /oj-accounts/{accountId}                        | Confirmed unbinding                                               |
| POST /oj-accounts/{accountId}/sync                     | Account cards, dashboard next action and sync panel               |
| GET /sync-jobs/{jobId}                                 | Sync panel with active/terminal polling and backoff               |
| GET /oj-accounts/{accountId}/sync-status               | Sync panel, restoring an in-flight job                            |
| POST /oj-accounts/{accountId}/analysis/rebuild         | Dashboard next action and sync panel                              |
| GET /oj-accounts/{accountId}/dashboard                 | Dashboard summary, recommendation and next action                 |
| GET /oj-accounts/{accountId}/training/overview         | Personal data overview and stats, four windows                    |
| GET /oj-accounts/{accountId}/problems                  | Attempted problems, status/tag/difficulty filters                 |
| GET /oj-accounts/{accountId}/submissions               | Submission tab and problem drawer; verdict/problem/time filters   |
| GET /oj-accounts/{accountId}/rating-changes            | Rating tab and chronological chart for the current page           |
| GET /oj-accounts/{accountId}/analysis/latest           | Profile/analysis pages and window selector                        |
| GET /oj-accounts/{accountId}/analysis/history          | Snapshot list and score trend for the current page                |
| GET /oj-accounts/{accountId}/analysis/{snapshotId}     | Analysis history and recommendation source dialog                 |
| GET /oj-accounts/{accountId}/recommendations/latest    | Practice; changing mode only reads                                |
| GET /oj-accounts/{accountId}/recommendations/history   | Practice history, one/all modes and pagination                    |
| GET /oj-accounts/{accountId}/recommendations/{batchId} | Immutable batch inspection                                        |
| POST /oj-accounts/{accountId}/recommendations/generate | Explicit generation, bounded count, same-key retry                |

Added account details show maximum Rating, rank, organization, country, binding
and provider timestamps, fetched only when expanded. Security's identity card
shows existing username/email plus the role endpoint's display names/codes. It
is isolated from password/email forms so its failure does not hide those forms.

No extra dashboard/product module was needed. Optional provider avatar/photos,
contribution/friend counts, first/last names, city and maxRank; problem points;
submission raw verdict/testset/passed-test metadata; and algorithm/mapping/version
internals are intentionally not all shown. Existing score charts show the primary
six scores; per-dimension evidence counts are not a second analytics panel. These
are available DTO fields, not missing API integrations. No documented agent,
in-browser Judge, problem statement or cross-user analytics endpoint exists.

## Shared data states and recovery

`dataState`, `DataRegion`, `QueryFeedback`, `ErrorNotice` and safe presentation
placeholders share this policy. State and provenance never add fields to DTOs.

| State   | Rendering                                                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading | Keep card/list headings and controls, show skeleton/loading; retain cached data during refresh                                                              |
| success | Render validated live DTOs                                                                                                                                  |
| empty   | Successful null, [] or zero evidence; keep statistics/list structure and show the corresponding explanation                                                 |
| error   | Keep structure; retain usable cached data; otherwise counts=0, nullable values=unavailable, lists empty; visible localized connection explanation and retry |
| mock    | Valid synthetic data with a visible provenance notice; empty/error/loading keep their more specific state                                                   |

Loading takes precedence while a retry runs; an error takes precedence over empty
and Mock. Account-mismatched responses never enter the cache. Missing/inaccessible
records clear previously displayed private values, retain safe structure and show
recoverable failure. A 401 clears private caches and shows login guidance; no user
or binding is fabricated to mount private hooks. Session/account failures render
safe page placeholders without requesting an unknown account.

The primary load error is “当前无法加载数据，请检查网络或稍后重试”. Error code,
requestId and code-specific explanation remain in details. Retry handles documented
Retry-After and 403 restrictions. Lists keep their filters, pagination and empty
states even on first failure. `null` Rating/difficulty stays unavailable/unrated,
and absent average/max difficulty stays null in presentation; it is never treated
as a real zero sample or inserted into the successful Query cache.

## Verification

Lint, format and type checking passed. All 69 unit tests (including 18 HTTP Mock
contract tests) and all 99 desktop/mobile E2E tests passed. The static export
passed with `pnpm build --webpack`; the default Turbopack worker failed to bind
a port under this environment's restrictions, including an escalated retry.

Actual Mock preview checks covered 12 routes, both locales, desktop/390px and
selected 320px/200% text layouts: 56 checks, no runtime/hydration errors, actual
network/API failures or external requests. Cancelled route-prefetch fetches during
navigation are recorded separately. Browser MCP was blocked by tool approval
policy; the review used installed Playwright/Chrome instead. Screenshots and
JSON evidence are local ignored artifacts under `test-results/mock-browser-review/`.

See the synchronized execution plan at `.agent/plans/mock-api-resilience.md` for
check details and browser evidence. Unit contract tests cover complete DTOs,
statistical relationships, pagination/filter semantics, rejected input, ownership,
immutable snapshot/batch identity, rebinding, idempotency and partial jobs. E2E
regressions cover persistent structures, zero/null defaults, isolated failures,
recovery, account/role details, slow/empty states and historical completion.
