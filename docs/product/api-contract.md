# Active contract: codeStartrack V0.11

The current implementation follows [V0.11 frontend API](../../prompts/前端api文档.md) and [V0.11 frontend data model](../../prompts/前端需要知道的数据库.md), as explicitly requested on 2026-10-02. They supersede the V0.1 integration below.

- Browser calls only `/api/v1/**`, with Session credentials through a same-origin reverse proxy.
- Public workspace shells (including `/practice`) remain visible during anonymous sessions, missing accounts and backend failures. The 2026-10-02 visitor-browsing request supersedes earlier frontend redirect-on-401 behavior: 401 still clears private state, but personal panels show login prompts. No anonymous private API access is added. Explicit logout/password change still navigate to login.
- Successful null/empty responses show empty states. Failed reads, including documented resource-not-found responses, retain card/list structure, show an explicit localized error and offer retry. Missing/inaccessible records stop rendering previously cached values; safe zero/null UI placeholders are not cached as successful data. A 401 still clears private state and shows login guidance.
- `GET /me` establishes the authenticated user; paginated `GET /oj-accounts` establishes owned bindings.
- Each account data request explicitly names an opaque decimal-string `accountId`. Profiles are independent per binding, never aggregated across a system user.
- Dashboard, training overview, problems, submissions, ratings, analysis snapshots/history, recommendation batches/history and asynchronous sync jobs use the exact V0.11 envelopes and DTOs.
- Reads do not compute recommendations. Generation uses one UUID idempotency key per operation and retains it for uncertain retries.
- Runtime response validation rejects account mismatches and malformed required fields. Query keys include user, binding and all request parameters.
- `UNBOUND` is read-only; `INVALID` permits manual sync/unbind. No implicit current-account endpoint exists.
- Public Demo is synthetic and local. Explicit `dev:mock` / `preview:mock` use the same isolated V0.11 Mock API as E2E; transport provenance visibly labels synthetic data. Live failures never automatically select Mock data. The former fixed-user gateway has been removed.
- All 31 documented endpoints have UI consumers. The endpoint matrix, Mock scenarios/limitations and shared loading/success/empty/error/mock policy are in [the Mock/API audit](../development/mock-api-audit.md).

Implementation and tests are in `src/lib/api/`, `src/components/workspace/`, `src/components/auth/` and `tests/e2e/`. The backend has not been modified or verified live. All contract tests use isolated fixtures.

---

## Historical V0.1 contract (superseded)

# codeStartrack V0.1 Frontend API Contract

## Current read-only execution decisions

The user's later gateway/read-only instructions govern current implementation. Browser API requests go only to the Next.js application: `GET /api/training/profile` and `GET /api/training/recommendation` forward server-side to `GET /api/users/1/profile` and `GET /api/users/1/recommendations?limit=1`. Use one `DEMO_USER_ID = 1` and server-only runtime `BACKEND_BASE_URL`; never expose the backend through `NEXT_PUBLIC_*`. No POST, PUT, PATCH, DELETE, HEAD or OPTIONS may reach the live backend. E3/E4/E5 and the binding/synchronization flows described below remain deferred specifications, not current executable work.

P-01–P-05 are [resolved for this read-only slice](product-requirements.md#approved-v01-product-decisions): `/` links to the existing Demo `/dashboard`; retry only a failed GET; visibly disclose early placeholder recommendations; zh-CN default/en on the same routes, external problems in a new tab; white/neutral-first colors with blue only as an accent. The dashboard is a planned destination, not an already implemented scaffold route. No product UI is added by V01-01.

## Authority and product boundary

Milestone: **V0.1 — Unified Training Profile & Recommendation (Codeforces First)**, as directed by [the current rewrite instruction](../../prompts/v01-doc-rewrite.md). [apidocs.md](apidocs.md), API v0.1, remains the source for exact existing HTTP behavior. This contract was reviewed on 2026-09-30; it is documentation-derived, not a live-service verification.

The explicit V0.1 direction supersedes the earlier Demo V2 implementation scope in these product documents. The unchanged repository instructions and product plan still describe a larger training loop. Deferred capabilities appear only under **Future / Post-V0.1** below and are not prerequisites for this milestone. See [requirements](product-requirements.md), [page model](page-structure.md), and [design direction](design-system.md).

## Approved Demo configuration

The [same-platform account update](../../prompts/v01-doc-update-multiple-same-platform-accounts.md) explicitly approves `DEMO_USER_ID = 1` and the environment-configured backend base URL server-only runtime `BACKEND_BASE_URL`. Its referenced `docs/development/v01-demo-assumptions.md` is currently absent; this document uses only the values stated in the prompt, without inventing additional assumptions.

Internal identity is **resolved for V0.1** using user 1, temporarily for the Demo. E3 sends `user_id = 1`; E1/E2 use `userId = 1`. E4 still requires the real `account_id` returned by binding. No authentication/user-provisioning work is added. Demo setup must make user 1 and the backend available; the assumption does not create a user through an undocumented API or bypass existing errors.

The unchanged backend supports the first-run flow with one Codeforces account, subject to existing-binding/ownership conflicts. Multiple Codeforces accounts under that same user are an approved product requirement but **BLOCKED_BY_API**. If required for the actual V0.1 implementation, G-09 must be resolved first; the one-account demo must not be described as demonstrating that capability.

## Unified product model, current connector implementation

```text
One codeStartrack user
  → zero or more external accounts, including multiple on the same platform
  → synchronize each account independently through its connector
  → combined learner dataset retaining source provenance
  → one user-level training profile
  → one user-level recommendation experience
  → a recommended problem retains its source platform and external URL
```

The current working connector is **Codeforces only**. E3 includes `platform` but restricts a user to at most one account per platform; this explicitly conflicts with the approved multiple-same-platform-account requirement (G-09). E1 documents aggregation over all accounts linked to a user, and E1/E2 accept a user ID rather than an account ID or selected platform. E1/E2 remain conceptually compatible with one learner and many accounts; E3 is the binding constraint. This does not prove that additional connectors or complete cross-account normalization semantics are implemented.

Keep frontend/domain concepts distinct: user, external account, platform/connector, training data, profile, recommendation. Preserve wire field names while keeping source-specific fetching and metadata at the connector boundary. Never turn Codeforces into a global product mode or split the learner into platform-specific profiles. Profile/recommendation reads describe the codeStartrack user even when their sole current data source is Codeforces.

## Transport, identity, and shared constraints

| Topic                  | Documented behavior / unresolved boundary                                                                                                                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host                   | Source says `HOST: /`. V0.1 configures the actual backend base URL via server-only runtime `BACKEND_BASE_URL`; no concrete origin or secret is hardcoded.                                                                                                                                                                                    |
| Documentation location | `/v3/api-docs` is the API description location, not a sixth application endpoint with a documented product response.                                                                                                                                                                                                                         |
| Internal identity      | E3 requires `user_id`; E1/E2 require `userId`. `DEMO_USER_ID = 1` resolves this for the temporary V0.1 Demo (G-01). This is an approved Demo assumption, not a new API or production authentication design.                                                                                                                                  |
| Account identity       | E3 returns `account_id` for E4's `{accountId}`. It is not interchangeable with the user ID.                                                                                                                                                                                                                                                  |
| Platform support       | E3 supports only `platform = "codeforces"` in v0.1. No other connector support follows from a generic string field.                                                                                                                                                                                                                          |
| Authentication/routing | Use the approved server-only runtime `BACKEND_BASE_URL` configuration. The API source still does not specify auth/session requirements; do not infer or implement a new scheme for this Demo. Actual media types and server-to-backend deployment connectivity remain integration details (G-07); browser-direct backend CORS is not needed. |
| Media types            | E1/E2/E4/E5 list request type `application/x-www-form-urlencoded`; E3 lists `application/x-www-form-urlencoded,application/json`. All list response type `*/*`; examples are JSON. Do not replace this with an assumed global media-type guarantee.                                                                                          |
| Wire naming            | Keep `userId`, `generatedAt`, `user_id`, `account_id`, `last_7_days` and all other names exactly as documented.                                                                                                                                                                                                                              |
| IDs                    | IDs are `integer(int64)`. Safe numeric range/serialization for JavaScript is unspecified; do not silently round large IDs (G-03).                                                                                                                                                                                                            |
| Response completeness  | Response tables do not declare requiredness for every field. Recommendation `difficulty` is explicitly nullable; tags may be empty and the example title is empty. Other nullable/empty aggregate behavior needs G-03.                                                                                                                       |
| Times                  | Preserve `string(date-time)`. Profile `updatedAt`, account `synced_at`, binding `created_at`, and recommendation `generatedAt` describe different events; do not substitute one for another.                                                                                                                                                 |

### Shared `ApiError`

| Field     | Type     | Meaning                                                                |
| --------- | -------- | ---------------------------------------------------------------------- |
| `error`   | `string` | Stable machine-readable identifier for branching; not UI display copy. |
| `message` | `string` | Human-readable explanation.                                            |

The source repeats the same example for unrelated statuses:

```json
{
  "error": "account_not_found",
  "message": "账号 99 不存在"
}
```

This preserves the source shape but does not establish the correct code for every error case. Do not invent a `code`/`details` envelope or new identifiers. **TODO: Backend API required** — G-03: accurate per-case errors and field requiredness. UI categories such as account conflict or profile unavailable are frontend concepts, not assumed wire values. A 404 alone cannot distinguish every cause listed below.

## Implemented frontend GET boundary (V01-01)

The two frontend-owned routes are `GET /api/training/profile` and `GET /api/training/recommendation`. They forward only the fixed E1/E2 operations in the current read-only decision above. They are technical Next.js routes, not additions to the backend E1–E5 inventory. `DEMO_USER_ID = 1` is centralized in server configuration; private runtime `BACKEND_BASE_URL` is validated when a read is requested, never required at import/build time. The backend origin must be absolute HTTP(S), without credentials/path/query/fragment; a trailing slash is normalized. No browser-controlled proxy destination, learner ID or limit exists.

Success returns the validated consumed fields under their existing wire names, without a new envelope. Unknown extra fields are accepted and stripped; `skills`, `score` and undisplayed fields are not forwarded. Required profile counts/difficulty are nonnegative int32 values; average difficulty is a finite nonnegative number. IDs must be numeric safe integers, and the returned learner must match the configured Demo identity. Zero counts remain zero. Datetimes retain their original text, accepting usable ISO date-time values with arbitrary fractional precision, offsets or no explicit offset; no timezone is inferred or rewritten. This tolerance is frontend parsing policy, not a new backend timestamp guarantee (G-03).

Recommendation source/internal IDs, platform and reason are required. Empty lists/titles, null difficulty and empty tags remain valid. Missing title/difficulty/tags/URL stays absent. An invalid supplied URL becomes `null` so the later UI disables its action; only an absolute supplied HTTP(S) URL without credentials is usable, and no URL is constructed from IDs. Absent metadata tolerance is a defensive frontend policy rather than proof that backend omission is guaranteed. No default metrics, successful mock data, confidence score or ability analysis is manufactured.

Frontend failure shape:

```ts
type ApiErrorResponse = {
  error: {
    operation: "profile" | "recommendation";
    category:
      | "configuration"
      | "invalid_request"
      | "method_not_allowed"
      | "transport"
      | "aborted"
      | "timeout"
      | "http"
      | "invalid_json"
      | "invalid_payload";
    status: number;
    upstreamStatus?: number;
    backendError?: "account_not_found";
  };
};
```

These are frontend-owned categories, not backend wire codes. The private client recognizes the documented `{ error, message }` shape and discards raw human-readable messages. Only the documented `account_not_found` identifier may be serialized; unknown identifiers, raw bodies/messages, stack traces, URLs, environment values and upstream headers are never forwarded or logged. A 404 still does not prove any particular account/recovery state.

| Condition                                                 | Gateway status                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Unexpected query/body/method-override input               | 400, zero upstream calls                                                       |
| Unsupported methods, including explicit HEAD              | 405, zero upstream calls; framework method failures and HEAD have no JSON body |
| Local OPTIONS                                             | 204 with `Allow: GET, OPTIONS`, zero upstream calls                            |
| Missing or invalid server configuration                   | 500, zero upstream calls                                                       |
| Network failure or caller cancellation                    | 502 (`transport` or `aborted`)                                                 |
| Invalid success JSON or consumed-field validation failure | 502 (`invalid_json` or `invalid_payload`)                                      |
| 8-second timeout, including stalled response bodies       | 504                                                                            |
| Upstream HTTP 4xx/5xx                                     | Preserve status, even with empty/non-JSON bodies                               |
| Upstream redirect/other non-success status                | 502; retain `upstreamStatus`, never follow redirects                           |

Upstream reads omit credentials and carry only `Accept: application/json` as an application-selected header, with no body or inbound header passthrough. Reads and gateway success/error responses use `no-store`. There is no automatic retry, polling, build/import request, generic proxy, write client or repair operation. The browser API path is same-origin Next.js, so backend browser CORS and HTTPS-browser-to-HTTP-backend mixed content are not dependencies. Container/server egress and live response contracts still require V01-08/09 verification; server-to-server HTTP remains HTTP.

## Frontend error presentation (V01-02)

This is the accepted presentation mapping (under the user’s 2026-09-30 delegation) for the already implemented V01-01 frontend error model, not a change to backend wire errors or the gateway. Use the operation and category, with strings from the [bilingual inventory](design-system.md#v01-02-bilingual-copy-inventory). Never expose raw backend text, exception details, hosts, environment names or machine identifiers as UI copy.

| Normalized category / state                                             | Profile copy                                      | Recommendation copy                               | Recovery                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeout`                                                               | `profile.timeout`                                 | `recommendation.timeout`                          | User-triggered Retry of only the failed GET.                                                                                                                            |
| `configuration`, `transport`, `http`, `invalid_json`, `invalid_payload` | `profile.error`                                   | `recommendation.error`                            | Same operation-specific Retry; configuration/data repair stays outside this UI. No binding/sync recovery.                                                               |
| `invalid_request`, `method_not_allowed`, unexpected frontend failure    | `profile.error`                                   | `recommendation.error`                            | Fail visibly; a Retry must still use the approved fixed GET. These represent implementation/configuration faults, not user input forms or permission to change methods. |
| `aborted` after navigation/unmount or superseded work                   | No new error announcement for the abandoned view. | No new error announcement for the abandoned view. | No automatic retry. If the still-active operation actually fails with this category, use its generic error and scoped Retry.                                            |
| Successful E2 with `recommendations: []`                                | Keep the successful profile.                      | `recommendation.empty`                            | No error Retry or invented candidate; a future explicit page visit can read again.                                                                                      |
| Successful E1 with zero metrics                                         | Render the validated zero values.                 | Normal initial recommendation read may follow.    | No account absence or need to sync is inferred.                                                                                                                         |

Any upstream 404, including the allowed `account_not_found` identifier, still maps to the failed operation's generic copy. It cannot select “no account connected,” “user missing,” or “no candidates” as a proven cause. Unknown categories use generic operation copy, not serialized debug data. If old successful data remains visible, pair the error with `data.previous` and the original timestamp.

Initial reads may sequence E1 then the first E2. Once E2 has been attempted, retrying E1 never repeats E2, and retrying E2 never repeats E1. Successful empty data is not an error. Locale changes do not add a backend parameter/header, change learner identity or trigger backend reads; raw reason/title/tag text remains as supplied. No API, schema, gateway status, retry transport policy or E3/E4/E5 activation changes in V01-02.

## Existing endpoint inventory

E1–E5 are the only documented application endpoints. Preserve methods and paths without adding a version prefix.

| ID  | Exact method and path                     | Success                      | Documented errors  | V0.1 use                                                                   |
| --- | ----------------------------------------- | ---------------------------- | ------------------ | -------------------------------------------------------------------------- |
| E1  | `GET /api/users/{userId}/profile`         | 200 `ProfileResponse`        | 404                | Unified user profile; real summary metrics and placeholder `skills`.       |
| E2  | `GET /api/users/{userId}/recommendations` | 200 `RecommendationResponse` | 404                | One primary source-aware recommendation; current results are placeholders. |
| E3  | `POST /api/accounts`                      | 201 `BindAccountResponse`    | 400, 404, 409, 502 | Connect the public Codeforces account to an existing internal user.        |
| E4  | `POST /api/accounts/{accountId}/sync`     | 200 `SyncResponse`           | 404, 502           | Import and store public external training data for that account.           |
| E5  | `POST /api/problems/sync/{platform}`      | 200; schema absent           | 400, 502           | Operator-managed shared source catalogue for recommendation candidates.    |

## E1 — Unified user training profile

`GET /api/users/{userId}/profile`

Request content type: `application/x-www-form-urlencoded`. Response content type: `*/*`. No request body is documented.

| Parameter | Location | Required | Type             |
| --------- | -------- | -------- | ---------------- |
| `userId`  | path     | yes      | `integer(int64)` |

Metrics are computed in real time rather than read from stale snapshots. The source explicitly describes aggregation across all of a user's connected accounts: solved problems are deduplicated, and average difficulty is weighted by the number of solved problems with a difficulty score. The source estimates roughly 9%–23% of problems lack difficulty scores and are excluded from that average; this is context, not a frontend constant.

| Response field                | Type                | Meaning                                                        |
| ----------------------------- | ------------------- | -------------------------------------------------------------- |
| `userId`                      | `integer(int64)`    | Internal codeStartrack user ID.                                |
| `totalSolved`                 | `integer(int32)`    | Solved problems, deduplicated across accounts.                 |
| `averageDifficulty`           | `number`            | Average over solved problems with difficulty scores only.      |
| `maxDifficulty`               | `integer(int32)`    | Highest solved-problem difficulty.                             |
| `skills`                      | `array<SkillScore>` | **Placeholder data; the ability algorithm is not integrated.** |
| `skills[].name`               | `string`            | Knowledge-area name.                                           |
| `skills[].score`              | `number`            | Score from 0.0 to 1.0; still a placeholder.                    |
| `recentActivity`              | `RecentActivity`    | Aggregate submission activity.                                 |
| `recentActivity.last_7_days`  | `integer(int32)`    | Submission count in the last 7 days.                           |
| `recentActivity.last_30_days` | `integer(int32)`    | Submission count in the last 30 days.                          |
| `updatedAt`                   | `string(date-time)` | Profile generation time.                                       |

Statuses: **200** success; **404** user missing, or no profile because data has not been synchronized (`ApiError`). Behavior for no submissions, no solved problems, or no rated solved problems is not fully specified.

Frontend use: one profile on `/dashboard`, using the six supported summary metrics/timestamps. Do not call it a source-specific learner profile or plot `skills` as measured ability. No profile preference-write API is implied. Account listing is also absent from this response.

V0.1's currently contributing source is Codeforces. E1 is already conceptually suitable for multiple accounts belonging to user 1, including repeated platforms once E3 permits those bindings. The source's deduplication/weighted-average description does not fully define overlapping submissions/problems across accounts, normalization/provenance rules, or future cross-platform difficulty equivalence; those remain G-08. Do not assert that raw ratings from different platforms are already comparable. Cache/refetch timing is a frontend planning matter; “real time” does not specify a polling protocol.

## E2 — User recommendation list

`GET /api/users/{userId}/recommendations`

Request content type: `application/x-www-form-urlencoded`. Response content type: `*/*`. No request body is documented.

| Parameter | Location | Required | Type             | Constraints                                         |
| --------- | -------- | -------- | ---------------- | --------------------------------------------------- |
| `userId`  | path     | yes      | `integer(int64)` | Internal learner identity.                          |
| `limit`   | query    | no       | `integer(int32)` | Maximum 50. Default and minimum are not documented. |

An existing batch is reused if it is not older than the latest profile; otherwise a batch is regenerated. The described candidate pool is the platform catalogue's problems the user has not done, dependent on E5 catalogue synchronization. **The recommendation algorithm is not integrated; current results are hardcoded placeholders.** User-scoped parameters do not make these results validated personalized reasoning.

| Response field                        | Type                        | Meaning                                                                                             |
| ------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `userId`                              | `integer(int64)`            | Internal learner identity.                                                                          |
| `recommendations`                     | `array<RecommendedProblem>` | Hardcoded/placeholder recommendation results.                                                       |
| `recommendations[].problemId`         | `integer(int64)`            | Internal catalogue problem ID.                                                                      |
| `recommendations[].platform`          | `string`                    | Problem's source platform.                                                                          |
| `recommendations[].externalProblemId` | `string`                    | Identifier on that source platform.                                                                 |
| `recommendations[].title`             | `string`                    | Title; the documented example is empty.                                                             |
| `recommendations[].difficulty`        | `integer(int32)`, nullable  | Difficulty score; newly published problems may be unrated.                                          |
| `recommendations[].tags`              | `array<string>`             | Algorithm tags; may be empty.                                                                       |
| `recommendations[].url`               | `string`                    | External link to solve the problem on its source platform.                                          |
| `recommendations[].score`             | `number`                    | Recommendation score, 0.0–1.0; not established as trustworthy personalization.                      |
| `recommendations[].reason`            | `string`                    | Display reason. Structured `reason_codes` are stored in the database, not exposed by this response. |
| `generatedAt`                         | `string(date-time)`         | Recommendation batch generation time.                                                               |

Statuses: **200** success; **404** user missing, no bound account, or no recommendation can currently be generated (`ApiError`). Empty-list vs 404 semantics are unspecified.

Frontend use: request `limit=1` for one primary card on `/dashboard`, preserve returned source metadata and reason, and link to the supplied `url`. Do not add a selected-platform parameter or claim a top-ranked result when ordering/ranking semantics are unspecified (G-04). Missing title/difficulty/tags need honest presentation rather than invented data. Display an explicit placeholder limitation so a reason suggesting a weak knowledge area is not presented as verified analysis; do not derive further claims from `skills` or `score`.

Calling E2 may reuse a batch; the frontend cannot claim it forced new generation or that newly synced data has definitely changed the algorithm. Reason localization, freshness relationships, result ordering, and no-candidate behavior need G-04/05. The current contract is compatible with a source-aware card; future connectors do not require a separate recommendation page.

## E3 — Connect an external account

`POST /api/accounts`

Request content types: `application/x-www-form-urlencoded,application/json`. Response content type: `*/*`.

| Parameter / field    | Location   | Required | Type                 | Constraints                                                                         |
| -------------------- | ---------- | -------- | -------------------- | ----------------------------------------------------------------------------------- |
| `bindAccountRequest` | body       | yes      | `BindAccountRequest` | Request object; the source example places its fields directly in the body.          |
| `user_id`            | body field | yes      | `integer(int64)`     | Existing internal codeStartrack user.                                               |
| `platform`           | body field | yes      | `string`             | v0.1 supports only `codeforces`.                                                    |
| `username`           | body field | yes      | `string`             | Public platform username; additional length/pattern constraints are not documented. |

Source example (illustrative only; its user ID must not become a production default):

```json
{
  "user_id": 1,
  "platform": "codeforces",
  "username": "tourist"
}
```

The backend immediately validates that the external username exists. It accepts no password or cookies and reads public data. An external platform account can belong to only one student; one student can bind only one account per platform. This current restriction must remain in the documented contract: it blocks a second Codeforces binding for user 1 even when that second external account is distinct. It is not the intended product cardinality; see G-09 below. Additional platforms are not supported merely because the field is generic. Existence validation is not a documented account-ownership proof.

| Response field | Type                | Meaning                                            |
| -------------- | ------------------- | -------------------------------------------------- |
| `account_id`   | `integer(int64)`    | External-account record ID, required by E4.        |
| `platform`     | `string`            | Source platform identifier.                        |
| `username`     | `string`            | Username retaining the platform's original casing. |
| `created_at`   | `string(date-time)` | Binding time.                                      |

| Status | Meaning                                                                                |
| ------ | -------------------------------------------------------------------------------------- |
| 201    | Binding succeeded.                                                                     |
| 400    | Missing parameter or unsupported platform (`ApiError`).                                |
| 404    | Internal user missing or external account not found (`ApiError`).                      |
| 409    | Account already bound, or user already bound an account on that platform (`ApiError`). |
| 502    | External platform unavailable (`ApiError`).                                            |

Frontend use: the connection form on `/`, using the approved Demo `user_id = 1`. Never request platform secrets, fabricate additional users to bypass the binding limit, or treat the external handle as internal identity. No account-list/get/unbind/replace/remove or internal-user-creation endpoint is documented. A 409 remains an error and does not return a documented recovery account ID. Returning connected-account state/recovery needs G-02; Demo identity itself is resolved.

## E4 — Synchronize an external account's training data

`POST /api/accounts/{accountId}/sync`

Request content type: `application/x-www-form-urlencoded`. Response content type: `*/*`. No request body is documented.

| Parameter   | Location | Required | Type             |
| ----------- | -------- | -------- | ---------------- |
| `accountId` | path     | yes      | `integer(int64)` |

Imports all external submissions for that account, writes them to the database, and automatically deduplicates them. The request blocks until synchronization finishes; the source says a full historical import usually takes seconds to tens of seconds. With no new external submissions, repeating the synchronization is idempotent: `new_submissions` is 0 and `total_submissions` is unchanged.

| Response field      | Type                | Meaning                                                                                                |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `status`            | `string`            | Fixed `success`; failures use an error response.                                                       |
| `new_submissions`   | `integer(int32)`    | Number newly imported this time; 0 is valid success.                                                   |
| `total_submissions` | `integer(int32)`    | Total stored submissions for this account, not just this import or a guaranteed all-source user total. |
| `synced_at`         | `string(date-time)` | Sync completion time.                                                                                  |

Statuses: **200** synchronization complete; **404** account missing; **502** external platform unavailable. Errors use `ApiError`.

Frontend use: after binding, use the returned `account_id`, show that account's pending state, then load E1/E2 for Demo user 1. For the approved target, each real connected account is synchronized independently through E4; there is no documented bulk-sync endpoint. One account's failure must not be represented as successful synchronization of all accounts, and browser-summed E4 totals must not replace backend user-level metrics. No sync-job endpoint or polling protocol is documented. Prevent duplicate active syncs; a browser timeout is not proof that the server cancelled. Re-sync and read-after-sync freshness guarantees need G-05. The product expects imported records to feed the unified learner model; the internal normalization/provenance schema is not exposed here.

## E5 — Operator source-catalogue synchronization

`POST /api/problems/sync/{platform}`

Request content type: `application/x-www-form-urlencoded`. Response content type: `*/*`. No request body is documented.

| Parameter  | Location | Required | Type     |
| ---------- | -------- | -------- | -------- |
| `platform` | path     | yes      | `string` |

Imports the source platform's complete catalogue. Existing problems are left unchanged except for filling previously missing difficulty scores. The catalogue is shared across users, is decoupled from account synchronization, and does not require high-frequency execution. E2's candidate pool depends on this setup. V0.1 uses Codeforces as its only connector; E5's own parameter table does not provide a supported-platform enum or authorize other integrations.

Statuses: **200** complete, returning the number of newly added problems; **400** unsupported platform; **502** external platform unavailable. Errors use `ApiError`.

**TODO: Backend API required** — G-06: the source supplies no 200 response schema/example/property name. Do not invent a scalar type or a `count`/`added_count` object field. Confirm operational permissions, supported-platform contract, readiness, timeout behavior and setup ownership.

Frontend use: operator preparation only. Do not place a catalogue-sync CTA in ordinary onboarding/dashboard, automatically import the full catalogue on user visits, or treat catalogue setup as an account-specific operation. The backend source says that without this step the pool contains only problems from users' submissions and recommendations degrade to already-done problems; this conflicts with E2's not-done candidate description and needs clarification (G-04/06).

## Multiple Same-Platform Accounts — Contract Gap

### Current E3 behavior

`POST /api/accounts` currently permits **at most one external account per `(user_id, platform)`**. It may return **409** because the user already has an account on that platform, or because the external account is already bound. E3's request/response shapes and all current statuses remain unchanged in this documentation. With Codeforces as the only supported connector, this means at most one Codeforces account for Demo user 1.

### Desired product behavior

One codeStartrack user may connect zero or more external accounts, including multiple accounts sharing a platform. Each account has a backend-issued `account_id` and is synchronized independently. All successfully synchronized data retains source provenance and contributes to one normalized/deduplicated user-level dataset, one profile and one recommendation experience. E1 and E2 already fit that high-level model; their user scope is not a blocker.

**Status: BLOCKED_BY_API (G-09).** The one-account first-run V0.1 demo can use the existing contract. The additional same-platform binding cannot be enabled or claimed successful until backend behavior and its documented contract change.

### Required backend change

**TODO: Backend API required** — Change the binding uniqueness/validation rule so more than one account record can share `(user_id, platform)`, while preventing the same external platform account from being attached incorrectly or duplicated. The current restriction is conceptually comparable to `UNIQUE(user_id, platform)`; this is an explanation of behavior, not a claim about verified database DDL. Do not prescribe a replacement database constraint without the backend schema/design.

The backend may be able to retain `POST /api/accounts` and change validation/uniqueness behavior, but that is a backend design decision, not an existing contract fact. Document any changed duplicate/ownership conflict behavior and updated 409 cases. Do not invent an endpoint or remove the current 409 to imply support in advance.

### Account management and aggregation gaps

**TODO: Backend API required** — G-02: the API lacks documented user-account listing, recovery of `account_id` after reload, inspection of per-account sync status/last sync, unbinding, replacement and removal. These are distinct from the resolved Demo user identity. Multiple accounts make discovery and status recovery more important; do not infer these capabilities from E3's single binding response or E4's completed-sync response. Removal/replacement are future capabilities unless separately included in an implementation task.

**TODO: Backend API required** — G-08: verify normalization and deduplication of overlapping submissions/solved problems across same-platform accounts and, later, different platforms. Preserve account/platform provenance; define weighted-difficulty/activity behavior without double counting. E1's documented user-level aggregation is compatible, but the browser must not implement a substitute aggregation over separate internal users or guessed account records.

No frontend workaround is authorized: no extra internal users for one learner, browser merging of separate users' profiles, constructed account IDs, hardcoded account rows, direct database inserts, swallowed 409 responses, or browser-local handles represented as backend-bound accounts.

## Deferred account-connection orchestration

| Frontend operation       | Documented call / prerequisite                                                                                                            | Meaning                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `IDLE`                   | Use `DEMO_USER_ID = 1` and server-only runtime `BACKEND_BASE_URL`. E5 catalogue preparation remains an independent operator prerequisite. | Public handle entry; no platform-mode state or new identity-provisioning step.                                                 |
| `CONNECTING_ACCOUNT`     | E3 with `user_id = 1`, `platform = "codeforces"`, public `username`.                                                                      | Bind the first account and retain its actual `account_id`; additional same-platform binding remains G-09 / **BLOCKED_BY_API**. |
| `SYNCING_DATA`           | E4 with that account ID.                                                                                                                  | Import/store public data; await response, including valid zero-new-record success.                                             |
| `BUILDING_PROFILE`       | E1 with the original user ID.                                                                                                             | Read computed user-level metrics; no extra build endpoint/job.                                                                 |
| `LOADING_RECOMMENDATION` | E2 with the same user ID and `limit=1`.                                                                                                   | Read a possibly reused recommendation batch; currently placeholder behavior.                                                   |
| `READY`                  | Successful profile and usable recommendation loaded.                                                                                      | Display honest summary, source-aware reason and external CTA.                                                                  |

These labels are frontend state, not new HTTP APIs or persisted backend enums. Show operation-specific failures; do not restart binding automatically when sync/profile/recommendation fails. A profile can remain usable while the recommendation region shows an empty/error state. The current docs do not establish reload-safe account lookup, request cancellation, or a forced recomputation method.

## V0.1 backend and API gaps

Every row marked **TODO: Backend API required** needs backend clarification/contract evidence. These are capability gaps, not proposed routes, methods, fields, or schemas.

| ID   | Gap and impact                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | **RESOLVED_FOR_V01_DEMO** — `DEMO_USER_ID = 1` is the approved temporary internal identity. No authentication/user-provisioning work is required for this Demo; a production identity system is a separate future concern. This does not resolve external-account discovery (G-02).                                                                                                           |
| G-02 | **TODO: Backend API required** — List connected accounts by user; recover their `account_id` values after reload; inspect per-account sync status and last-sync time; resolve binding conflicts. Unbind/replace/remove are also undocumented, future capabilities. E3/E4 only provide the current operation context, not account collection discovery.                                        |
| G-03 | **TODO: Backend API required** — Correct error identifiers per case; distinguish ambiguous 404 causes; response requiredness/nullability; no-submission/no-rated-problem aggregates; date/time-window semantics; safe `int64` range/serialization.                                                                                                                                            |
| G-04 | **TODO: Backend API required** — Recommendation ordering and primary-item semantics, default/minimum `limit`, empty-list vs 404 behavior, current placeholder bounds, batch/profile freshness relationship and reason localization. Reconcile not-done candidates with the stated already-done fallback without catalogue setup. Mature personalization is not a V0.1 acceptance requirement. |
| G-05 | **TODO: Backend API required** — Sync timeout/retry/cancellation behavior, completion consistency for subsequent profile reads, and how profile freshness affects recommendation batches. Successful import does not document a new personalized recommendation.                                                                                                                              |
| G-06 | **TODO: Backend API required** — E5 success payload, explicit platform support, operational authorization/setup ownership and catalogue readiness. Operator setup must enable recommendations without adding a user-level catalogue workflow.                                                                                                                                                 |
| G-07 | **CONFIGURATION DECIDED** — Backend base URL is server-only runtime `BACKEND_BASE_URL`; keep it environment-configured and secret-free. Actual response media types and server-to-backend connectivity need integration confirmation; the browser uses only the same-origin Next.js gateway. Do not reopen authentication/user provisioning for the fixed-user Demo.                          |
| G-08 | **TODO: Backend API required** — Verify normalized account/platform provenance and deduplication of overlapping submissions/problems across multiple same-platform accounts, including weighted metrics/activity. Future connectors additionally need cross-source difficulty comparability. Keep aggregation in one backend user-level model.                                                |
| G-09 | **BLOCKED_BY_API — TODO: Backend API required** — E3 currently permits one account per user per platform and returns 409 for an existing platform binding. Change/approve/document uniqueness and validation to enable multiple same-platform accounts while preserving external-account ownership integrity. E1/E2 user scope is already compatible.                                         |

## Conflicts and limits against the unified model

- **Milestone conflict with earlier sources:** the unchanged project plan and repository instructions describe Demo V2. The explicit V0.1 prompt controls this rewrite; the two-page external-source flow is now current. This is a recorded scope change, not a silent interpretation of the older plan.
- **Explicit binding-model conflict:** the approved product permits repeated platforms among one user's accounts; E3 permits only one account per user per platform and can return 409. G-09 is **BLOCKED_BY_API**. E1/E2 remain compatible user-level reads; E4 remains independently account-scoped. Do not claim multiple Codeforces bindings work today.
- **Demo assumptions clarified:** the earlier documents treated internal identity and base-URL selection as unresolved. The current prompt resolves them with `DEMO_USER_ID = 1` and server-only runtime `BACKEND_BASE_URL`; it does not change E3 or establish account discovery.
- **Analysis limitation:** `skills` is explicitly placeholder data. Computed summary metrics are real documented outputs, but a trusted skill model is not implemented. Cross-source normalization/comparability is unspecified rather than confirmed absent.
- **Recommendation limitation:** E2 is user-scoped and source-aware, but hardcoded. The intended unified-state reasoning is a product direction, not established algorithmic behavior. Source `reason` text must carry the appropriate limitation in presentation.
- **Candidate-pool ambiguity:** E2's not-done description and E5's already-done fallback without catalogue setup are not a reliable exclusion guarantee. No undocumented selection policy is introduced to resolve them.
- **Error/example ambiguity:** repeated `account_not_found` examples under unrelated statuses do not define all recovery branches. Preserve the examples' limitations rather than inventing identifiers.

## Future / Post-V0.1

Multiple same-platform accounts are an approved product requirement awaiting G-09/G-02/G-08 backend work; they are not currently usable in the first-run demo. Additional connectors may later supply LeetCode, AtCoder, NowCoder, or other source accounts to that same user. Each account retains its platform; records retain provenance; normalized data contributes to one unified training profile; recommendation outputs retain source and URL. Adding a connector must not change the high-level connection → synchronization → profile → recommendation flow. No future endpoints or schemas are defined here.

Internal problem details/seeded problem bank, code editing, Run Sample, submissions/Judge and AC/WA/TLE/CE/RE interactions, internal history, progressive/LLM Agent assistance, teams, coaches, and role switching belong to later scope. Their missing contracts are not V0.1 blockers.

## Contract change discipline

Update this document and the [requirement matrix](product-requirements.md#requirement--api-matrix) when source behavior changes, then update affected page states before any integration work. Preserve exact HTTP and wire semantics. Keep confirmed contracts distinct from future architecture, and implementation choices distinct from backend guarantees. This documentation-only rewrite introduces no clients, schemas, mock behavior, or API calls.
