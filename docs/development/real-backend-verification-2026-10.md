# Real backend verification — October 2026

The original verification on 2026-10-09 used the frontend API adapters and
the `startrack-prod` backend reached through the explicitly authorized loopback
SSH tunnel:

```bash
ssh -N -L 8081:127.0.0.1:8081 startrack-prod
```

The local 8081 listener was checked before starting the tunnel; no listener
existed. The original adapter/browser evidence below belongs to that host and
artifact. A later read-only inventory distinguishes it from the newer server2
backend; it does not transfer authenticated acceptance between hosts.
Requests use real backends, with no mock transport header.
Backend code, databases, account settings and business records were not modified.
No judge service was contacted or independently tested.

## Fresh host-specific contract inspection

Health and OpenAPI were inspected separately on 2026-10-09. Acquisition times
below are UTC; image/revision results from subsequent read-only inspections were
recorded at `2026-10-09T03:43:32.049Z`.

| Host and request route                                                                                              | Acquisition UTC window        | Health / OpenAPI | Advertised paths / primary operations / schemas | Image tag     |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------- | ----------------------------------------------- | ------------- |
| `startrack-prod`: `root@server1.qlluck.com:22`; local SSH tunnel to its `127.0.0.1:8081`                            | `03:41:55.938`–`03:41:56.479` | 200 / 200        | 85 / 97 / 140                                   | `sha-e47cbc1` |
| `server2`: `ubuntu@server2.qlluck.com:1022`; SSH-executed `curl` to that host's `127.0.0.1:8081`, inventory context | `03:41:55.939`–`03:41:57.275` | 200 / 200        | 112 / 126 / 199                                 | `sha-318b841` |

Both health bodies are `{ "status": "ok", "service": "backend" }`. The inspected
`startrack-app` image labels identify full OCI revisions
`e47cbc1c3bbb64dbf47cafc6fdf04f7c86ddb458` on `startrack-prod` and
`318b84170860b6e4ca6931712554474a531acfcb` on server2. Both images use
`ghcr.io/star-ability/code-startrack-backend`. Image inspection selected only the
image reference and revision label; environment variables and secrets were not
read. Server2's unprivileged Docker inspection was denied; one read-only
`sudo -n docker inspect` succeeded.

The `startrack-prod` OpenAPI still exactly matches
`docs/development/default_OpenAPI.json` after recursively excluding exporter-only
`refType`. Server2 adds 27 paths, 29 primary operations and 59 schemas, while all
97 baseline operation definitions and all 140 baseline schema definitions remain
unchanged after the same normalization. Both specs still label `info.version`
as `v0.11`; that metadata does not establish equal API coverage.

All 27 additive frontend/admin method/path pairs across 25 paths in sections
4–6.1 of `prompts/v0.2前端api文档.md` are advertised by server2. They remain absent
from the inspected `startrack-prod` specification. The two other added operations
are internal algorithm/judge event POST definitions; they were only observed in
OpenAPI and were never requested.

### Static V0.2 contract comparison

Read-only comparison of all 27 server2 operations against the designated V0.2
document and current frontend adapters/runtime schemas found matching method/path
pairs, request/response field inventories and envelope shapes. All 18 GETs
advertise the documented 200 response. Complete advertised-schema compatibility
is **BLOCKED** by the following discrepancies:

- `components.schemas.ProblemRef.properties.platform.enum` advertises
  `STARTRACK`/`CODEFORCES`, while the designated contract and
  `src/lib/api/v02-schemas.ts:59–69` require `startrack`/`codeforces`. This affects
  problem/submission/training/recommendation and relevant administrator payloads.
  Serialized uppercase values would fail frontend validation; authenticated
  payload evidence is required to distinguish actual serialization from OpenAPI
  annotation drift. No frontend normalization was added to conceal this conflict.
- All nine writes mark `Idempotency-Key` optional, although the designated
  contract requires a UUID. Seven writes advertise only 200 and omit their
  documented first-create response: 202 for submission creation, analysis retry,
  profile rebuild and problem import; 201 for training creation, recommendation
  generation and metadata-version creation. Frontend writes validate/send the
  key and the client accepts successful 2xx envelopes, so these annotation
  differences alone do not establish a runtime frontend failure.
- Required-property, nullability, format, literal and bounds metadata are
  incomplete. Examples include required submission inputs, nullable latest
  profile/recommendation results, external `problemVersionId`, training
  timestamps/errors and platform `url` (advertised as string, required as null by
  the designated contract). The broad field types and nested analysis shapes
  otherwise align; the specification alone cannot establish complete runtime
  schema acceptance.

The fresh requests were only anonymous `GET /health` and `GET /v3/api-docs` on
each host. No protected workflow, CAPTCHA, authentication, mutation or downstream
service was retested. Server2 is inventory context, not an approved frontend
deployment, ingress or backend route. Designated credentials/session, an approved
frontend route with matching browser Origin and authenticated V0.2 acceptance
remain release dependencies.

Raw HTTP responses, request timestamps, image-label receipts, normalized contract
comparisons and the operation review are retained under ignored
`test-results/real-backend-host-reaudit-20261009T034019Z/`. The original 48-read,
26-adapter and browser `ORIGIN_REJECTED` evidence below remains scoped to
`startrack-prod` revision `e47cbc1` and its original frontend artifact.
The fresh task-owned tunnel was stopped after collection; listener absence was
verified at `2026-10-09T03:48:50.241Z` and recorded in its cleanup receipt.

## Initial startrack-prod contract snapshot

| Check                              | Result | Evidence                                                                                                                                                                                                       |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                     | PASS   | `GET /health`: HTTP 200, status `ok`                                                                                                                                                                           |
| Live API documentation             | PASS   | `GET /v3/api-docs`: HTTP 200, JSON                                                                                                                                                                             |
| Saved/live operation compatibility | PASS   | All 85 paths, 97 GET/POST/PUT/PATCH/DELETE operations and 140 component schemas exactly match `default_OpenAPI.json` after ignoring exporter-only `refType` metadata                                           |
| Backend revision                   | PASS   | Running backend image is `ghcr.io/star-ability/code-startrack-backend:sha-e47cbc1`; its OCI revision label is `e47cbc1c3bbb64dbf47cafc6fdf04f7c86ddb458`                                                       |
| CAPTCHA server/schema request      | PASS   | Node request without browser Origin to `POST /api/v1/auth/captcha`: HTTP 200; actual frontend schema accepts UUID challenge, PNG data URL and 180-second expiry; response has `no-store` and no session cookie |

The OpenAPI `info.version` remains `v0.11`; actual paths and component schemas
define the supported public contract. Backend image inspection was read-only.

## Original startrack-prod anonymous access and frontend transport

Every one of the original `startrack-prod` contract's 48 protected GET operations
returned HTTP 401
`SESSION_EXPIRED`. Every response passed the frontend error-envelope shape:
`error.code`, `error.message`, object `error.details`, and UUID `requestId`.
Placeholder decimal IDs and UUIDs were used for parameterized routes; no real
customer or account identifiers were collected.

This exhaustive anonymous sweep covers identity/roles, OJ accounts and sync jobs,
account dashboards/profiles/recommendations/history/problems/submissions/ratings,
user overview/profiles/reports/history, privacy, joined/search teams, team detail,
members and shared member domains, analysis/recommendations, applications,
invitations, notifications/unread counts, coach dashboard, AI jobs and the
administrator coach-invite-code list. It verifies authentication enforcement;
it does not prove access for any authenticated role.

An additional executable acceptance check imported the actual `api`, `v012` and
`v02` adapters with the repository's `pnpm exec tsx`, and ran them through
`createFrontendServer` with a real upstream of `http://127.0.0.1:8081` on an
ephemeral local frontend port. All 25 protected adapter calls raised a real
`ApiError` with HTTP 401, code `SESSION_EXPIRED` and a validated request ID. The
CAPTCHA adapter parsed the real successful response through the same proxy.
All 26 transport calls preserved `credentials: include`, `cache: no-store`,
`redirect: error`, the same-origin `/api/v1/` boundary and response `no-store`;
none contained `X-codeStartrack-Mock`.

The adapter selection covers identity/roles, account listing/detail/dashboard,
account analysis/problems/submissions/recommendations, user analysis/history,
reports, privacy, teams/detail/members, team and personal applications/invitations,
plus the additive platform problem/submission/training/profile/recommendation
clients. This is API/proxy verification; rendered-page acceptance is tracked
separately in the frontend release audit.

## Original production-export browser acceptance

Against `startrack-prod` revision `e47cbc1`, after the audit production export and
before the chart loading-layout follow-up, the then-current `scripts/start.mjs`
served `out/`
through a task-owned ephemeral listener at `http://127.0.0.1:55151`, with a real
upstream of `http://127.0.0.1:8081`. The former tunnel was revalidated as absent
(no listening socket and its prior tool process handle missing) before the
explicitly authorized SSH tunnel was reestablished. An isolated headless Chromium
context permitted only that local frontend origin and GET/HEAD requests, plus
the public `POST /api/v1/auth/captcha`. No credentials were entered, login
submission attempted, accounts changed or judge service contacted.

| Browser check                                | Result  | Actual evidence                                                                                                                                                                        |
| -------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exported login layout and controls           | PASS    | English and Simplified Chinese controls, password/account fields and localized errors render at 1440px and 390px without page overflow                                                 |
| Anonymous protected-page gate                | PASS    | `/teams` requests real `/api/v1/me`, receives HTTP 401 `SESSION_EXPIRED`, and renders the localized sign-in gate and login links                                                       |
| Mock provenance and cache boundary           | PASS    | Browser `/auth/captcha` and `/me` responses have no `X-codeStartrack-Mock`; both preserve `no-store`; no mock notice renders                                                           |
| CAPTCHA image rendering at this local origin | BLOCKED | Actual browser request is HTTP 403 `ORIGIN_REJECTED`; no PNG is delivered to the browser, and CAPTCHA input/refresh are disabled                                                       |
| CAPTCHA failure boundary                     | PASS    | Valid backend 403 envelope becomes a visible localized error; no success image or usable challenge is fabricated                                                                       |
| Runtime/network observations                 | PASS    | No unexpected console/hydration errors, page exceptions, transport failures or external requests; expected resource-console entries are exactly CAPTCHA 403 and session 401 per locale |

The request preserves browser Origin `http://127.0.0.1:55151`. The API contract
requires write Origin to match the backend's configured `PUBLIC_ORIGIN`, and
deployment documentation explicitly says to preserve Origin rather than remove
it to bypass validation. The earlier successful Node CAPTCHA requests had no
browser Origin and establish only server/schema compatibility; they cannot prove
successful CAPTCHA rendering from an arbitrary local browser origin. No Origin
header was removed or rewritten, and no backend security setting was changed.
Successful rendered CAPTCHA acceptance remains **BLOCKED** until the verified
production artifact is served from the matching configured public origin.

The error currently uses the shared localized connection guidance; the backend's
exact `ORIGIN_REJECTED` code is available in its details disclosure. This local
integration condition is distinct from invalid credentials, a failed challenge,
or missing authenticated-role acceptance.

Screenshots were inspected and sanitized status evidence is stored under ignored
`test-results/real-anonymous-acceptance/`. The task-owned static listener was
shut down after acceptance. Completed unit/API suites were not rerun for this
rendered acceptance extension. The subsequent chart-only loading-layout change
does not alter the login or session-gate components, but this browser run does
not establish real chart, authenticated-flow or V0.2 acceptance for that later
artifact.

## Authentication and role acceptance boundary

| Workflow                                                                                | Status  | Remaining evidence                                                                                    |
| --------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| Anonymous protection of existing read endpoints                                         | PASS    | Original startrack-prod verification: all 48 advertised protected GET operations                      |
| Node CAPTCHA/schema request without browser Origin                                      | PASS    | Real public endpoint and actual API adapter; browser-origin success remains blocked                   |
| Valid login/session/logout                                                              | BLOCKED | No designated credentials or active test session are supplied by the current task or documented setup |
| Authenticated STUDENT reads and owned account isolation                                 | BLOCKED | Designated test identity and real session                                                             |
| COACH dashboard and managed-team permission checks                                      | BLOCKED | Designated COACH identity and team ownership/membership fixtures                                      |
| Ordinary-member/shared-member privacy boundaries                                        | BLOCKED | Designated member identities with known sharing scopes                                                |
| ADMIN permission checks                                                                 | BLOCKED | Explicitly designated administrator session                                                           |
| Account binding/sync, recommendation generation, privacy/team/account-management writes | NOT RUN | Synthetic frontend flows cover transitions; no production business-record mutation was performed      |

Earlier integration documentation describes an authorized administrator acceptance
from a previous task. That historical result does not supply reusable credentials
or establish current release acceptance. No undocumented login information was
guessed; no account was created, edited or reset to obtain a session. A designated
session or credentials are required to establish the authenticated release gates.

## Additive V0.2 backend dependency

The additive contract in `prompts/v0.2前端api文档.md` defines these frontend-facing
backend families. They are absent from the original and fresh `startrack-prod`
OpenAPI, while server2 now advertises all 27 designated method/path pairs:

- `/platform-problems/**` and `/judge-languages`;
- `/submissions/**`;
- `/me/training-records/**`;
- `/me/learning-profile/**` and `/learning-profile-jobs/**`;
- `/me/recommendations/**`;
- the additive `/admin/problem-imports/**` and `/admin/platform-problems/**` proxies.

The original six anonymous `startrack-prod` sample GETs covering platform
problems/detail, platform submissions,
training records, latest combined learning profile and latest combined
recommendations returned HTTP 401 `SESSION_EXPIRED`. Authentication runs before
routing, so those responses cannot prove that the additive operations exist or
that an authenticated request would succeed. This omission conclusion applies
to `startrack-prod`, not to the newly inspected server2 contract. Server2's
advertised availability and shared enum/annotation discrepancies are recorded
above. Real V0.2 integration remains **BLOCKED** pending an approved matching
frontend/backend route and authoritative authenticated payload evidence. No
frontend endpoint or success payload was invented to conceal this dependency.

All related frontend judge-result/analysis presentation remains within the
documented backend API boundary. Actual judging, tool execution and downstream
service behavior are outside this verification's scope.

## Release implication

The scoped API regression command passed all 62 tests across four suites:

```bash
pnpm exec vitest run src/lib/api/client.test.ts src/lib/api/v012.test.ts src/lib/api/v02.test.ts src/lib/api/algorithm-compatibility.test.ts
```

These tests validate synthetic error/response handling, adapter identities,
request contracts and version compatibility; they do not assert authenticated
production success. The verification report also passed targeted Prettier
formatting after formatting corrections.

The original anonymous API compatibility, CAPTCHA server/schema requests and
frontend error/proxy boundary passed against `startrack-prod`. Its actual
local-browser CAPTCHA rendering was blocked by the real `ORIGIN_REJECTED`
boundary; that historical observation is not a server2 browser verdict. Fresh
health/OpenAPI checks pass on both hosts, and server2 advertises all additive
V0.2 operations with the unresolved schema discrepancies described above.
Authenticated role workflows, matching-origin browser authentication and V0.2
success/readback remain unverified. Offline tests and advertised operations cannot
substitute for those live release gates; this report does not authorize or claim
a completed release.
