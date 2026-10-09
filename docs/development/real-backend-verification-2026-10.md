# Real backend verification — October 2026

Verification performed on 2026-10-09 using the current frontend API adapters and
the backend reached through the explicitly authorized loopback SSH tunnel:

```bash
ssh -N -L 8081:127.0.0.1:8081 startrack-prod
```

The local 8081 listener was checked before starting the tunnel; no listener
existed. Requests below use the real backend, with no mock transport header.
Backend code, databases, account settings and business records were not modified.
No judge service was contacted or independently tested.

## Current deployed contract

| Check                              | Result | Evidence                                                                                                                                                                                                       |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                     | PASS   | `GET /health`: HTTP 200, status `ok`                                                                                                                                                                           |
| Live API documentation             | PASS   | `GET /v3/api-docs`: HTTP 200, JSON                                                                                                                                                                             |
| Saved/live operation compatibility | PASS   | All 85 paths, 97 GET/POST/PUT/PATCH/DELETE operations and 140 component schemas exactly match `default_OpenAPI.json` after ignoring exporter-only `refType` metadata                                           |
| Backend revision                   | PASS   | Running backend image is `ghcr.io/star-ability/code-startrack-backend:sha-e47cbc1`; its OCI revision label is `e47cbc1c3bbb64dbf47cafc6fdf04f7c86ddb458`                                                       |
| CAPTCHA server/schema request      | PASS   | Node request without browser Origin to `POST /api/v1/auth/captcha`: HTTP 200; actual frontend schema accepts UUID challenge, PNG data URL and 180-second expiry; response has `no-store` and no session cookie |

The OpenAPI `info.version` remains `v0.11`; actual paths and component schemas
define the supported public contract. Backend image inspection was read-only.

## Anonymous access and frontend transport

Every one of the live contract's 48 protected GET operations returned HTTP 401
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

## Production-export browser acceptance

After the audit production export, before the chart loading-layout follow-up,
the current `scripts/start.mjs` served `out/`
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
| Anonymous protection of existing read endpoints                                         | PASS    | All 48 advertised protected GET operations                                                            |
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
backend families, which are absent from the currently advertised live OpenAPI:

- `/platform-problems/**` and `/judge-languages`;
- `/submissions/**`;
- `/me/training-records/**`;
- `/me/learning-profile/**` and `/learning-profile-jobs/**`;
- `/me/recommendations/**`;
- the additive `/admin/problem-imports/**` and `/admin/platform-problems/**` proxies.

Six anonymous sample GETs covering platform problems/detail, platform submissions,
training records, latest combined learning profile and latest combined
recommendations returned HTTP 401 `SESSION_EXPIRED`. Authentication runs before
routing, so those responses cannot prove that the additive operations exist or
that an authenticated request would succeed. Their absence from live OpenAPI
leaves real V0.2 integration **BLOCKED** pending a compatible deployed backend or
authoritative authenticated evidence. No frontend endpoint or success payload
was invented to conceal this dependency.

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

Anonymous API compatibility, CAPTCHA server/schema requests and the frontend
error/proxy boundary pass against the real deployed backend. Actual local-browser
CAPTCHA rendering is blocked by the real `ORIGIN_REJECTED` boundary. Authenticated
role workflows and additive V0.2 success/readback remain unverified. Offline tests
cannot substitute for those live release gates; this report does not authorize or
claim a completed release.
