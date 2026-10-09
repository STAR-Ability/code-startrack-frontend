# server2 frontend release inspection — 9 October 2026

This task authorizes backend integration and frontend deployment only on
`ssh server2`. The previous server was not contacted. This report records fresh
inspection and browser evidence acquired on 2026-10-09 from approximately
08:30 UTC onward;
historical receipts from other hosts do not establish server2 acceptance.

**Latest health, login and current-session logout: PASS; complete integration and release: BLOCKED.**
At 10:33 UTC, server2 health recovered to HTTP 200 and Docker healthy; the
10:58 UTC read-only audit confirms that state. Direct and replacement-tunnel
health reads at 11:33, 11:34 and 11:49 UTC also returned 200. The
designated test account subsequently logged in successfully through the actual
frontend, with `ADMIN` and `STUDENT` roles. Authenticated problem catalog and
judge-language reads still return HTTP 500 `INTERNAL_ERROR` on the tenth export
at 11:50 UTC; successful personal
learning reads currently contain empty or null data. The tenth export verifies
logout 204, `/me`401 and session-cookie removal; local acceptance processes are
closed. Production ingress remains unconfigured. Earlier health failures below
are retained historical evidence.

This is a pre-release snapshot after conclusive eleventh local acceptance.
The final documentation push starts a new exact-head CI run; terminal required
`quality` and `storybook` results on
[PR #42](https://github.com/STAR-Ability/code-startrack-frontend/pull/42)
are authoritative after this snapshot. No protected merge or deployment is
authorized while the real-integration and production-destination gates remain
blocked.

## Initial 08:30 backend and local connection

These initial observations predate the designated test-account login below;
the authenticated acceptance supersedes the initial credential gate.

| Check                                        | Status  | Initial evidence                                                                                                                                                                                                                                        |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSH and read-only Docker access              | PASS    | `server2`, account `ubuntu`; Docker inspection requires working `sudo -n`                                                                                                                                                                               |
| Backend health                               | PASS    | `GET http://127.0.0.1:8081/health` on server2 returns 200, `{"status":"ok","service":"backend"}`                                                                                                                                                        |
| Backend artifact                             | PASS    | Healthy `startrack-app`, host network, image `ghcr.io/star-ability/code-startrack-backend:sha-318b841`; OCI revision `318b84170860b6e4ca6931712554474a531acfcb`                                                                                         |
| Current public API inventory                 | PASS    | Fresh `GET /v3/api-docs`: 112 paths, 126 GET/POST/PUT/PATCH/DELETE operations, 199 schemas; advertised `info.version` remains `v0.11`                                                                                                                   |
| Baseline operation compatibility             | PASS    | All 97 operations and 140 schemas from `docs/development/default_OpenAPI.json` are unchanged after removing exporter-only `refType`; 27 paths, 29 operations and 59 schemas are additive                                                                |
| Anonymous protected-read enforcement         | PASS    | All 66 advertised protected GETs return 401 `SESSION_EXPIRED`, valid error envelopes, UUID request IDs, `no-store`, and no mock header                                                                                                                  |
| Actual frontend adapter/proxy error handling | PASS    | 22 read-only `api`, `v012` and `v02` calls pass through `createFrontendServer` to server2 and produce validated `ApiError` 401 results; transport retains `credentials: include`, `cache: no-store`, `redirect: error` and same-origin `/api/v1/` paths |
| Real judge-language capabilities             | BLOCKED | `GET /api/v1/judge-languages` requires a session and returns 401 anonymously                                                                                                                                                                            |
| Authenticated workflows and permissions      | BLOCKED | No designated test credentials or active test session were found in the task or documented local setup                                                                                                                                                  |

The additive API includes platform problems, judge languages, submissions,
training records, learning profiles, learning recommendations and administrator
problem management. The two advertised internal event paths were observed only
in OpenAPI and were never requested. No backend, database, algorithm or judge
configuration was changed, and no business write was submitted.

A task-owned loopback tunnel was created at `127.0.0.1:18081`, forwarding to
server2 `127.0.0.1:8081`. The existing ignored `.env.local` was updated only to
`BACKEND_BASE_URL=http://127.0.0.1:18081`; its previous remote target must not be
used for this task. Its original owning tool session was `72789`. The 09:11 UTC
readiness recheck found no listener on 18081, and the original process handle was
missing. That tunnel is stopped. The root task owns any subsequent tunnel and
must revalidate its live handle before integration testing. No tunnel was
restarted by this readiness recheck. The temporary adapter proxy was closed.

The current backend `PUBLIC_ORIGIN` permits:

- `https://acm.qlluck.com`
- `http://server2.qlluck.com:8081`
- `http://localhost:8081`
- `http://127.0.0.1:8081`
- `http://117.72.146.39:8081`

For a matching local browser Origin, serve the frontend on port 8081 and keep
the backend tunnel on 18081. Retain browser Origin and cookie security; do not
rewrite Origin or weaken backend checks to make another development port work.
No real browser acceptance is claimed by the adapter checks above.

A separate root-owned browser check establishes **PASS** for successful CAPTCHA
rendering from the permitted `http://127.0.0.1:8081` Origin with the initial
`3dac8c2` export and a real server2 upstream through tunnel 18081. The CAPTCHA
request returned HTTP 200 and its PNG loaded; authentication controls were
present, with no mock notice, console errors or page overflow. No login was
attempted. The rendered PNG, network status and browser evaluation establish this
result; a text-wait timeout caused by the refresh control's differing accessible
label does not contradict the image/network evidence. This resolves local Origin
routing for that baseline artifact. It does not certify the redesigned final
artifact, authenticated workflows or production routing; repeat browser
acceptance after the final build.

## Contract discrepancy requiring authenticated evidence

The fresh OpenAPI schema advertises `ProblemRef.platform` as
`STARTRACK`/`CODEFORCES`. The designated V0.2 API contract and frontend runtime
schemas require `startrack`/`codeforces`. Actual authenticated payloads must
establish whether this is annotation drift or a runtime compatibility defect.
No frontend normalization was added to hide this unresolved difference.

Existing static contract inspection also records incomplete required-property,
nullability and response-status annotations. Fresh anonymous protection checks
cannot prove successful payload acceptance, role permissions, owned-account
isolation, problem content, editor language support, submissions, profiles or
recommendations. These remain explicit release gates.

## Actual frontend deployment state

| Item                                     | Current server2 evidence                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Host architecture                        | `x86_64`; frontend image target must support `linux/amd64`                                                                  |
| Docker Compose                           | `v5.6.0`                                                                                                                    |
| Existing frontend container              | None in `docker ps -a`                                                                                                      |
| Historical frontend deployment directory | `/opt/projects` absent; no server2 frontend release baseline was identified                                                 |
| OpenResty container                      | `1Panel-openresty-FxeV`, host network                                                                                       |
| Site configuration                       | `/opt/1panel/www/conf.d` empty; `/opt/1panel/www/sites` absent                                                              |
| Active OpenResty routes                  | Successful `nginx -T` shows only default sites on 8080/8443, default document root, no domain site or frontend `proxy_pass` |
| Existing root registry configuration     | `ghcr.io` entry present; authenticated manifest read succeeds without printing credentials                                  |
| Existing frontend registry artifact      | `v0.13.3`, `linux/amd64`, digest `sha256:6a4e7904c0d9bd91d6ed1dadc5554fe165268829f9b5713fb3a38b8c3e28bfb3`                  |

The historical deployment guide describes the previous host, its container and
its ingress. Those values must not be copied as server2 facts. A production
frontend domain/port and corresponding ingress destination must be established
before release. Backend allowed-Origin configuration alone does not prove that
the same domain currently routes to server2. No ingress, frontend service,
registry configuration or remote file was modified during this inspection.

There is no existing server2 frontend container to use as an inspected rollback
baseline. The release operator must record a concrete rollback procedure before
the first deployment and preserve unrelated infrastructure and backend services.

## GitHub release gates

The active main ruleset requires a Pull Request and successful `quality` and
`storybook` checks. It requires zero approving reviews, permits merge/squash/rebase,
and has no bypass actors. GitHub CLI is authenticated as `QLluck` with repository
push/admin permissions; no credential value was exposed or changed.

At inspection, remote `dev` was
`3dac8c297626d6998ef91ce46c6534b4c9d9895d` and `main` was
`dfeddc20cd2155dda201e9dd45bd610cc7b2d9b9` (package version `0.13.3`).
[PR #42](https://github.com/STAR-Ability/code-startrack-frontend/pull/42) was a
draft `dev` to `main` PR with passing required checks at that dev revision.
Those results do not cover subsequent redesign changes.

The main-only publication workflow repeats quality, build, E2E, Storybook and
exact-image container acceptance, rejects an existing version tag, and publishes
immutable version and commit tags plus a mutable convenience tag. The latest
successful publication remains the previous main release. Anonymous GHCR reads
return 401 and cannot establish tag absence. Authenticated server2 manifest
inspection at 08:38 UTC returned `manifest unknown` for `v0.14.0`; its prior
`v0.13.3` manifest read succeeded. Recheck the final candidate version before
publication because registry state may change.

The remaining order is: complete and review redesign milestones, push each to
dev, validate the final source and authenticated server2 workflows, make the PR
ready, satisfy exact-head CI, merge through the ruleset, publish from the accepted
main commit, record the immutable image and rollback, deploy only the frontend,
then inspect actual production rendering and backend connectivity. No PR, Git
ref, image publication or deployment was mutated by this inspection.

## 09:12 release-readiness recheck

Read-only server2 inspection from `2026-10-09T09:12:26.483855Z` through
`09:12:42.328847Z` revalidated the following current facts:

| Gate                              | Status  | Fresh evidence                                                                                                                                                               |
| --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend health and revision       | PASS    | Health 200; healthy host-network backend remains revision `318b84170860b6e4ca6931712554474a531acfcb`                                                                         |
| Published contract inventory      | PASS    | 112 paths, 126 primary operations, 199 schemas; uppercase `ProblemRef.platform` annotation remains unresolved                                                                |
| Protected anonymous reads         | PASS    | Fresh OpenAPI-driven sweep: all 66 GETs return 401 `SESSION_EXPIRED`, valid UUID/error envelopes, `no-store` and no mock header                                              |
| Candidate version availability    | PASS    | Existing authenticated server2 registry access reads `v0.13.3` successfully at the unchanged digest; candidate `v0.14.0` returns `manifest unknown` at `09:12:42Z`           |
| Frontend deployment route         | BLOCKED | No frontend container; `conf.d` remains empty, `sites` and `/opt/projects` absent; successful `nginx -T` still has only default 8080/8443 sites and no frontend proxy/domain |
| Authenticated release acceptance  | BLOCKED | No designated user-provided credential location or session has been established; no credentials were guessed or login attempted                                              |
| Final-artifact browser acceptance | NOT RUN | Root owns the forthcoming real-browser check after the final build and a new verified live tunnel                                                                            |

The original tunnel's absent socket and missing process handle were verified
before this recheck; it was not restarted. These remote HTTP checks ran directly
over `ssh server2` and do not depend on a local tunnel. No remote service, source,
database, ingress or registry credential was changed. Registry tag absence is a
point-in-time observation and must be checked again immediately before publishing.

The fresh structured receipt is
`test-results/server2-release-20261009/readiness-recheck-0912.json`, containing
OpenAPI, anonymous response metadata, selected Docker metadata, relevant ingress
lines and authenticated manifest results. Credentials are not included.

## Historical 09:33 backend health failure

Independent inspection at `2026-10-09T09:32:52.389900Z` found `startrack-app`
still running the same `318b84170860b6e4ca6931712554474a531acfcb` artifact, with
zero restarts and its original `02:22:52Z` start time. Docker health was
`unhealthy`, with failing streak 7; all three retained recent Docker health
checks exceeded their 5-second timeout.

Direct server2 `GET http://127.0.0.1:8081/health` probes beginning at
`09:32:52.444951Z`, `09:32:59.480162Z`, and `09:33:06.482901Z` each returned
HTTP 503 with `{"status":"unavailable","service":"backend"}` after approximately
5 seconds. An independent request through the root task's newly started local
18081 tunnel also returned the same HTTP 503 body at `09:32:51.799920Z`, taking
5.144 seconds. The tunnel delivered an actual backend response; the observed
failure is not a refused or missing SSH forwarding connection.

Read-only container statistics were CPU 0.96%, memory 489.6 MiB of 7.751 GiB,
and 50 PIDs. Those measurements and the health timeout do not establish the
underlying cause. No backend service was restarted or reconfigured by this task, and no
backend source, database or judge operation was performed.

At `09:34:28Z`, direct anonymous `/api/v1/me` and `/api/v1/judge-languages`
remained reachable and returned 401 `SESSION_EXPIRED`, `no-store`, UUID request
IDs and no mock header. `/v3/api-docs` returned 200 and retained 112 advertised
paths. These limited HTTP gates do not certify successful authenticated business
workflows or supersede the failed health gate.

Receipts are `test-results/server2-release-20261009/backend-health-0933.json`
and `reachable-gates-0933.json`. Backend health must be revalidated before
claiming real integration or production readiness. Until a later healthy receipt
exists, final browser checks may verify honest unavailable/error presentation;
they must not be reported as successful healthy-backend acceptance.

## Sixth redesigned export: historical anonymous browser acceptance

The final sixth production export was served locally at
`http://127.0.0.1:8081` through the task-owned server2 tunnel on 18081. Two fresh
isolated browser contexts checked Chinese and English at 390px across `/login`,
`/problems`, `/learning-profile`, `/learning-recommendations` and `/submissions`.
All ten observations have no horizontal overflow, Mock indication or uncaught
page errors. Both CAPTCHA requests returned 200 and the images loaded. Each
protected workspace correctly received 401 from `/api/v1/me` and presented its
anonymous gate. Local frontend `/healthz` returned `{"status":"ok"}`.

These are **PASS** results for actual anonymous rendering and proxy connectivity.
No login or business mutation was attempted. They do not prove successful private
payloads, permission behavior after authentication, submissions, backend health
or production routing. The repeated backend `/health` check still returned 503;
the backend health gate was **BLOCKED** at that inspection. The later
10:33 and 10:58 receipts establish recovery.

Screenshots and structured MCP receipts are stored under the ignored
`test-results/server2-release-20261009/final-sixth-browser/`. The root-owned
replacement tunnel used tool session `8676`; local frontend acceptance used session
`84651`. Both were stopped after acceptance, and a listener check confirmed that
local ports 8081 and 18081 were closed. They were local testing processes, not a
server2 deployment. The ignored `.env.local` retains the permitted loopback
upstream. A replacement tunnel was started for the later authenticated checks.

## Historical 10:04 server2 readiness

This historical read-only receipt retains direct server2 observations from
`2026-10-09T10:03:57Z` to `10:04:02Z`. Backend `/health` still returned HTTP 503
after 5.032 seconds, and Docker health remained `unhealthy` with failing streak 61. Revision, original start time and zero restarts remained unchanged. Anonymous
`/api/v1/me` and `/api/v1/judge-languages` still returned 401 `SESSION_EXPIRED`,
with `no-store` and no mock header; OpenAPI remained reachable with the same
112 paths, 126 operations, 199 schemas and unresolved uppercase platform enum.
No frontend container or configured public frontend ingress was found.

Authenticated registry reads at `10:04:32Z` and `10:04:39Z` retained the existing
`v0.13.3` digest and returned `manifest unknown` for `v0.14.0`, respectively.
This is a point-in-time availability observation, not publication or image
acceptance. Recheck immediately before any future publication. No service,
database, source, ingress or registry setting was changed.

Fresh receipts are
`test-results/server2-release-20261009/backend-health-final-1004.json` and
`registry-manifest-final-1004.json`. The root-owned local acceptance processes
are stopped; subsequent direct SSH checks did not need those processes.

## 10:33 recovered health and designated authenticated acceptance

Read-only server2 observations at `10:33:18Z`–`10:33:19Z` establish Docker
`healthy`, failing streak zero and a successful recent Docker health check. Two
direct `/health` requests returned HTTP 200 in approximately 34 ms and 4 ms.
The backend artifact revision remains `318b84170860b6e4ca6931712554474a531acfcb`,
but its observed start time changed to `10:26:49Z`; restart count is zero.
No cause or operator is inferred from these facts. The task made no service
change. `readiness-recovered-final.json` preserves this sanitized observation.

The user supplied a designated test account. A real browser on the permitted
`http://127.0.0.1:8081` frontend Origin completed CAPTCHA and login against
server2. `/api/v1/auth/login` returned HTTP 200, the frontend accepted the
validated user and entered `/dashboard`. Subsequent `/me` and `/me/roles` reads
returned 200, with primary role `ADMIN` and role membership `ADMIN`, `STUDENT`.
The session cookie is HTTP-only with SameSite Lax on this allowed local HTTP
Origin. No cookie value, password or authentication request body is retained in
the acceptance artifacts. No Origin/session security setting was weakened.

The seventh export's authenticated diagnostic reads at `10:37Z` and `10:39Z`
establish the following actual response behavior:

| Authenticated endpoint family                                       | Status      | Actual result                                                                                        |
| ------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Identity and role membership                                        | PASS        | `/me` and `/me/roles` return 200; frontend session is authenticated                                  |
| Platform problem catalog                                            | BLOCKED     | `/platform-problems?status=PUBLISHED&page=1&pageSize=20` repeatedly returns 500 `INTERNAL_ERROR`     |
| Judge language capabilities                                         | BLOCKED     | `/judge-languages` repeatedly returns 500 `INTERNAL_ERROR`                                           |
| Submission and training lists                                       | PASS, empty | Both return 200 with empty arrays                                                                    |
| Latest learning profile/recommendations                             | PASS, empty | Both return 200 with null data                                                                       |
| Learning/recommendation history                                     | PASS, empty | Both return 200 with empty arrays                                                                    |
| Bound platform accounts                                             | PASS, empty | Account list returns 200 with an empty array                                                         |
| Populated learning/problem payloads and frontend submission/results | BLOCKED     | No valid problem/language response or populated test data is available to exercise the complete flow |

All retained responses have `no-store` and no mock header. The real problem
page renders the authenticated workspace, usable filters and honest retry/error
feedback. The two 500 responses are backend response failures, distinct from
frontend schema rejection or invalid credentials. Empty success responses do
not resolve the uppercase/lowercase `ProblemRef.platform` discrepancy because
they contain no ProblemRef values. No problem was imported/published, record or
recommendation generated, account bound, source submitted, or backend/judge
service changed to manufacture successful data.

Sanitized response metadata, role codes and cookie flags are retained in
`test-results/server2-release-20261009/admin-authenticated-seventh/sanitized-api-receipt.json`.
That historical receipt retained session cookies only in the isolated browser
context. Later tenth-artifact reads and current-session logout are recorded
below. The production
frontend container and domain/proxy configuration remain absent after recovery.

## 10:58 health and frontend destination recheck

Direct server2 `/health` returned HTTP 200 in 34 ms at `10:58:11Z`. Docker was
healthy with failing streak zero, on the same backend revision and observed
`10:26:49Z` start time. No frontend container was present. OpenResty configuration
testing passed, but only default 8080/8443 sites were configured; `conf.d` was
empty and no frontend domain or proxy route was established. No credentials,
sessions, services, files or ingress configuration were changed by this audit.

The sanitized receipt is
`test-results/server2-release-20261009/readiness-latest-authenticated-audit.json`.
This health result does not supersede the authenticated catalog/language HTTP
500 failures or establish production frontend accessibility.

## Ninth export: tunnel recovery and authenticated reads

Initial ninth-export reads at `11:32:30Z` returned frontend HTTP 502. The
task-owned local SSH tunnel had exited with a reset/broken-pipe error, and local
port 18081 no longer listened. These responses were a local transport failure;
they do not establish invalid credentials or a backend business-API result.
The original session was `14520`. Root replaced only that local tunnel with
session `40405`, forwarding loopback 18081 to server2 loopback 8081. Direct
server2 health at 11:33 UTC and health through the replacement tunnel at 11:34
UTC returned HTTP 200. No remote service or configuration was changed.
The dedicated `tunnel-recovery-latest.json` receipt confirms the replacement
listener and HTTP 200 upstream health at `11:49:21Z`; it retains the historical
missing-socket and process-error diagnosis separately from that fresh probe.

With that connection restored, the authenticated ninth export repeated the
same eleven read-only calls at `2026-10-09T11:36:33.904Z`. `/me` and `/me/roles`
returned 200 with primary role `ADMIN` and memberships `ADMIN`, `STUDENT`.
The catalog and judge-language endpoints again returned 500 `INTERNAL_ERROR`.
Submission, training, learning/recommendation history and bound-account lists
returned 200 with empty arrays; latest profile and recommendations returned 200
with null data. All responses retained `no-store` and no mock header. Empty
payloads still cannot resolve the populated `ProblemRef.platform` contract
discrepancy or establish successful problem-to-submission behavior.

The sanitized receipts are
`test-results/server2-release-20261009/admin-authenticated-ninth/initial-502-receipt.json`
and `sanitized-api-receipt.json` in the same directory. The ninth response
receipt identifies its compiled source digest; later layout changes are not
silently attributed to this artifact. The isolated session was retained
for the subsequent tenth-artifact reads and current-session logout. No business
write or logout-all operation was performed during the ninth check.

## Tenth export: authenticated rendering, logout and local cleanup

At `2026-10-09T11:50:39.886Z`, the tenth export repeated the eleven authenticated
reads. Identity and roles remained 200 with `ADMIN`/`STUDENT`; catalog and
languages remained 500 `INTERNAL_ERROR`. The seven personal endpoint families
continued to return valid empty arrays or null data with `no-store` and no mock
header. These establish successful authentication and honest empty/error
rendering, while complete real-flow integration remains **BLOCKED**.

The real browser inspected `/problems`, `/submissions`, `/training`,
`/learning-profile` and `/learning-recommendations` in both locales at 1440 and
390px: twenty captures, no document overflow, Mock indication, uncaught runtime
error or business mutation. Catalog failures remained visible as recoverable
error UI; the successful personal reads displayed their empty states. Canceled
linked-route requests with `net::ERR_ABORTED` are retained in the receipt, so
this review does not claim zero network failures. Independent screenshot review
accepted nineteen settled images and records the Chinese desktop training
capture as faded during its entrance transition. Mobile notices can overlay body
content while their Close control remains available.

An ordinary UI current-session logout at `11:53:46Z` returned HTTP 204 from
`/api/v1/auth/logout`, navigated to `/login`, removed the session cookie and
loaded the CAPTCHA. A subsequent `/me` read returned 401 `SESSION_EXPIRED`.
Logout-all was not called. Cookie flags and presence, status, paths and request
IDs are retained without cookie values, passwords or authentication bodies.

Cleanup at `11:54:26Z` closed the isolated browser, stopped root's local frontend
session `33806` and replacement tunnel `40405`, and confirmed no listeners on
8081, 18081, 3101 or 3211. These were local acceptance processes, not a frontend
deployment. The ignored local upstream setting remains loopback-only.

The four sanitized receipts are under
`test-results/server2-release-20261009/admin-authenticated-tenth/`:
`sanitized-api-receipt.json`, `browser-receipt.json`, `logout-receipt.json` and
`cleanup-receipt.json`. They identify tenth source digest
`5c45cecb1f365db63d19b1311c4a557e975f4cf6a77736301ec49c6155ce8abe`.
Subsequent draft, header and public layout corrections require an eleventh
export. These tenth authenticated observations retain their artifact scope;
real editor/problem-to-submission acceptance still cannot proceed while catalog
and languages return 500. No additional business or session operation is used
to manufacture a successful flow.

## Frontend implementation and local acceptance

The six baseline application milestones end at
`995a4e291cfc3109e82be854c1f233bc0c323223`; they were separately reviewed,
committed, pushed to `dev` and verified against the remote ref. The follow-up
notification milestone is pushed at
`8af72bc0c32e304fc08750c9e1ca4bf620c2ecd1`. Its required quality checks failed,
so that checkpoint does not establish final acceptance. The verified draft fix
is separately pushed at `475142fac97710360ad0eddc8cd1f0c46fd394e1`, with the
exact remote `dev` ref confirmed. Recovery-test correction
`b4574f8c1d32ec58b3571ba2efb6d32b8dcf138d` is pushed with exact remote `dev`
verification. Final public layout milestone
`4e5a9fbe2b685d2a00f96e4918682ddc3cfe9a35` is also pushed and remotely verified.
Conclusive eleventh compiled public/header review passes all twelve cells.
Required CI must still cover the final documentation/evidence head.

| Commit    | Milestone                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `6e4a739` | Seven fixed geometric compositions and shared visual system                                               |
| `c024543` | KPI-first learning and workspace composition                                                              |
| `1d96d07` | Safe chart tooltips and responsive category labels                                                        |
| `63249f2` | Public product, landing, showcase and demo composition                                                    |
| `4997fb9` | Shared feedback, security/results/training and narrow/zoom controls                                       |
| `995a4e2` | Professional resizable coding workspace and behavioral regressions                                        |
| `8af72bc` | Contained bottom notifications, queue focus and narrow/enlarged-text regression coverage                  |
| `475142f` | Synchronous private compiler-draft preservation with four behavioral regression units                     |
| `b4574f8` | Ordinary notification dismissal followed by exact-source and synthetic session-recovery regression checks |
| `4e5a9fb` | Responsive capability labels, readable footer actions and public header flow at enlarged text             |

CodeMirror 6 is the chosen mature editor equivalent, bundled locally without
external editor assets. It supplies C/C++ syntax, line numbers, search/replace,
undo/redo and editing preferences. Statement/editor and console separators
support pointer and keyboard interaction. Accessible plain mode and actual
chunk-failure fallback retain editable source. Compiler changes preserve the
private language-specific draft but reset editor undo history. Core editor
extensions are included in the initial problem-route bundle; the client-only
wrapper does not make the complete editor engine lazy-loaded.

The supported submission lifecycle stays behind the existing validated query/API
layer. Public samples display input and expected output; actual execution and
custom test management remain unavailable where the documented backend does not
support them. No production capability is represented by synthetic fixture data.

| Verification                                       | Status  | Result                                                                                                                              |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Ninth `pnpm check`                                 | PASS    | Lint, formatting, types, 518 unit tests in 59 files and ninth production build; exit 0                                              |
| Ninth Storybook build                              | PASS    | Static build exit 0; final story-trigger change subsequently passes scoped lint, formatting and types                               |
| Complete ninth `pnpm test:storybook`               | PASS    | 494 passed, zero failed, 9.8 minutes; exit 0; ninth immutable static artifact                                                       |
| Added toast Storybook cases                        | PASS    | Eight desktop/mobile cases on the ninth build: queued Escape/keyboard Close focus and enlarged-text long-message action behavior    |
| Focused workspace E2E                              | PASS    | 24 desktop/mobile cases on the sixth export                                                                                         |
| Ninth delayed-radar and slow-CAPTCHA regressions   | PASS    | Two delayed-radar cases and two settled bottom-toast CAPTCHA cases; original failures/canceled runs retained                        |
| Ninth compiled toast/header browser inspection     | PASS    | Actual delayed navigation, queue promotion/focus, touch/keyboard scrolling, editor-error and Sheet behavior; compiled CSS verified  |
| Tenth `pnpm check`                                 | PASS    | Lint, formatting, types, 518 unit tests in 59 files and tenth production build; exit 0                                              |
| Tenth Storybook build and affected cases           | PASS    | Tenth static build and eight desktop/mobile toast cases; zero failures, 17.5 seconds, exit 0                                        |
| Complete tenth local Storybook suite               | NOT RUN | Ninth 494-case pass retained; exact final-head CI will rebuild and run all 494 cases                                                |
| Complete tenth `pnpm test:e2e`                     | BLOCKED | Terminal 349 pass, three failures, 16.5 minutes, exit 1; mixed test inputs disclosed; original traces retained                      |
| Complete final `pnpm test:e2e`                     | NOT RUN | Final frozen focused regressions and exact final-head full CI must establish acceptance                                             |
| Tenth capability-map enlarged-text inspection      | PASS    | Ten compiled capsule cases pass; a separate 320px/200% footer CTA wrapping defect requires ProductShell correction                  |
| Tenth targeted toast/header browser inspection     | PASS    | Four 320px/667-or-900px/200% bilingual cells pass against verified tenth compiled CSS                                               |
| Eleventh final-source `pnpm check`                 | PASS    | Lint, formatting, types, 522 unit tests in 60 files and production build; exit 0, no source mismatch                                |
| Eleventh Storybook build and targeted cases        | PASS    | Static build and six queue/long-notification cases; zero failures, 15.4 seconds, exit 0                                             |
| Complete eleventh local Storybook suite            | NOT RUN | Exact final-head CI will rebuild and run all 494 cases                                                                              |
| Eleventh focused E2E                               | PASS    | 22 immutable corrected-input cases, zero failures, 59.5 seconds, exit 0; unchanged compiled export                                  |
| Eleventh compiled public/header browser review     | PASS    | Twelve conclusive bilingual cells with settled font/geometry, exact served HTML/CSS and no overrides; original cancellations scoped |
| Independent final source review                    | PASS    | Public/header and corrected recovery source review passes, with all 357 final-follow-up source hashes matching                      |
| Actual server2 authenticated acceptance            | PASS    | Tenth identity, empty/error page rendering and current-session logout; catalog/language and populated-flow gates remain blocked     |
| Current-session logout and local cleanup           | PASS    | Logout 204, login navigation, `/me`401, session-cookie absence; browser/frontend/tunnel closed and local sockets absent             |
| Exact `8af72bc` required CI                        | BLOCKED | Both push/PR quality jobs failed; both Storybook jobs succeeded; subsequent draft/header/public fixes are absent from that head     |
| Exact final-head CI                                | NOT RUN | Required `quality` and `storybook` must complete on the final pushed evidence commit                                                |
| Exact-main production image and server2 deployment | NOT RUN | Protected merge, real integration and production destination gates remain unmet                                                     |

Both push and PR CI at exact commit `995a4e2` passed 518 units, 352 E2E and
486 Storybook cases (runs `37915249423` and `37915255329`). These baseline
results do not certify the subsequent toast, test or capability-map changes.
At exact notification commit `8af72bc`, PR run `37926744512` and push run
`37926740199` both ended with failed `quality` jobs at approximately 12:10 UTC.
Their `storybook` jobs succeeded at approximately 12:04 and 12:02 UTC,
respectively, with all 494 cases passing. Both quality jobs passed lint,
formatting, types, units and build, then ended with 351 E2E passes and one failure:
the old uncertain-submission Retry click was intercepted by the visible bottom
error notice in the initial attempt and both retries. The scoped ordinary
Close, hidden-notice/exact-source check and Retry correction directly covers
that failure; no toast source change is needed for this test sequence.
Successful Storybook alone does not satisfy the protected release ruleset.
The ninth source manifest is
`test-results/visual-upgrade-20261009/ninth-source-manifest.json`, with source
digest `5cd1031c115341a35b4a37155f93e91ee0b4b37caaf6cc2d76bcd94bb4f11023`.
The ninth complete Storybook suite used its frozen static build. Source changes
to capability CSS/component classes and the separate CAPTCHA E2E assertion
occurred afterward; the receipt records those differences explicitly. Exact
final-head CI must rebuild and test the final source rather than reuse ninth
CSS evidence.
The frozen tenth manifest is
`test-results/visual-upgrade-20261009/tenth-source-manifest.json`, source digest
`5c45cecb1f365db63d19b1311c4a557e975f4cf6a77736301ec49c6155ce8abe`.
Its build receipt records no source mismatch. The tenth Storybook receipt
independently confirms matching source hashes through the final affected run;
its complete local suite was deliberately not repeated, and is not claimed as
PASS for the tenth artifact.

The tenth full E2E run terminated with 349 passes and three failures in 16.5
minutes (exit 1); `tenth-e2e-summary.json` preserves its terminal outcome and
trace locations. One failure was a desktop submission-retry timeout: a still-visible
bottom error notice intercepted the ordinary Retry click. The trace retains the
available Dismiss action and records no runtime fault. The follow-up regression
now dismisses the notice with an ordinary click, confirms preserved editor text,
then retries with stronger exact-body, source and idempotency-key assertions.
The failed-session mobile recovery test receives the same ordinary Dismiss
sequence with stronger source and anonymous-state assertions. Scoped
lint/formatting pass; the eleventh compiled focused reruns are pending.
This test-only edit occurred while the tenth full suite was running. Its eventual
receipt must disclose potentially mixed test inputs, and that run cannot be
claimed as a full immutable final-source pass. Exact final-head CI will run all
final tests together after the source is frozen and pushed.

The third failure exposed an actual private-draft race: genuine C++ keyboard
input followed by a compiler switch approximately 3 ms later returned to an
empty document. The strict browser assertions remain unchanged. The frozen
correction persists editor changes synchronously to the existing private query
cache, with a guarded passive write for migration. Four behavioral unit
regressions cover the uncommitted external edit, newer-cache protection and
migration behavior. The final candidate passes eleven scoped editor unit cases,
types, lint, formatting and source review. The eleventh full check subsequently
passes all 522 units in 60 files and the production build. The unchanged
keyboard flow passes all twelve compiled editor cases in the focused rerun;
original failing experiments and the tenth trace remain in
`eleventh-compiler-draft-receipt.json` and its referenced logs.

The eleventh freeze contains 357 source inputs, with source digest
`734d7bc65b4dbd1aa4ece3ae5180893d214ba6e98f447290545dc21488c0df8b`.
Full source checks and production/Storybook builds pass with no source mismatch.
The production export contains 295 files, digest
`1612ee956a5a3950fd77fb2c1a11533a600fe04131aa8887c516da882383a58f`.
Six targeted Storybook queue/long-notification cases pass in 15.4 seconds.
The complete 494-case Storybook suite awaits exact final-head CI. The final E2E
inventory is 356 cases in 33 files. The corrected frozen-input focused rerun
passes all 22 cases: twelve editor, four footer, four 404/503 session-recovery and
two uncertain-submission cases in 59.5 seconds. Conclusive compiled public/header
review passes all twelve cells. Exact final-head complete CI acceptance remains
pending at this snapshot.

The initial eleventh focused run kept all inputs frozen and terminated with
sixteen passes and six failures in 3.8 minutes. Each failure used a role locator
for the visible Close control while Base UI intentionally marked it
`aria-hidden` in its collapsed, unfocused viewport. Independent installed-source
review confirmed that upstream behavior. The two recovery test files now locate
the exact translated accessible label; ordinary click, hidden-notice, recovery,
exact-source and idempotency assertions remain intact. Scoped lint and formatting
for both corrected test files pass. The unchanged production export passes the
corrected 22-case input set with no end-source mismatch; all rerun inputs remain
immutable through completion.

`eleventh-test-followup-manifest.json` records the separate final test-input
digest `a270177a253743bc64657b4ecdd8fab637782d9378c41f7a65cecd21770cec49`.
Its production-source digest remains
`509d0e28f95c811e3ecaee3df589e21f2358794e35c32a3f86c46bef7b5fa745`, and
the compiled export digest remains `1612ee956a5a3950fd77fb2c1a11533a600fe04131aa8887c516da882383a58f`.
The original immutable run and archived traces are retained in
`eleventh-e2e-initial-summary.json` and `eleventh-e2e-initial-selector-failures/`;
the corrected pass is recorded in `eleventh-e2e-corrected-summary.json` and
`eleventh-e2e-corrected-targeted.log`. Full-suite final acceptance still awaits
exact final-head CI.

The independent final audit confirms a visible editable source canvas and
reachable Submit at 320/390/768/1280 widths with 200% text in both locales.
Genuine keyboard entry and immediate compiler switches preserve exact source
and trailing newlines; a 90-line document, maximum result console, actual chunk
failure, COACH/ADMIN focus and private-storage exclusion pass. The ninth compiled
toast correction passes actual slow-request locale navigation at 320/390 widths,
667/900 heights and 200% text in both locales, including independent four-cell
320px inspection. Close remains outside the scrollable message/action region;
the default one-visible-toast limit retains queued notices. A guarded
frame-after-dismissal retry preserves keyboard focus when Base UI initially
attempts to focus a promoted notice while it is still inert. Eighteen compiled
queue cells and sixteen long-action/message cells pass, including Escape,
Enter/Space Close, touch/PageDown/End scrolling and final trigger focus.
Temporary notices can overlay some body text; this acceptance establishes usable
navigation and retained complete notice text, not continuous visibility of every
Mock-description glyph. Tenth compiled capsule and four targeted toast/header
rechecks pass; the subsequent conclusive eleventh review resolves the footer CTA
wrapping and public header findings. Synthetic role
substitution does not establish real authenticated role acceptance.

The public AppHeader keeps the header in normal document flow
below the desktop breakpoint so its enlarged-text navigation cannot cover the
page body. Scoped lint, formatting and source review pass. Twelve prototype
cells covered mobile, laptop and desktop at normal and 200% text; those
historical prototypes are superseded by conclusive compiled acceptance.
The final twelve-cell run checks both locales at 320×667/900 with 200% text,
390×900, 1024×768 and 1440×900 with normal/200% text as applicable. It waits for
the expected root font size and three stable geometry frames. Both desktop
200% closed headers measure 247px. Capability capsules, footer actions and
ordinary navigation pass with exact disk/served product HTML and CSS, unchanged
source and no overrides. Zero non-cancellation failures or business writes are
recorded; 84 canceled local HEAD probes remain in the raw receipt. Browser
contexts are closed, the task-owned preview exits zero, and local 3101/3211/3102
sockets are absent.

Conclusive evidence is in `eleventh-combined-public/results.json` and
`summary.json`. The initial provisional twelve-cell raw JSON/screenshots were
overwritten during the stable-geometry rerun. A superseded audit note records
the earlier unsettled measurement; those provisional artifacts are not retained
or reconstructed. The final twelve-cell acceptance is retained and conclusive.

Earlier independent route review covered 37 routes and 170 captures; final
rechecks targeted changed behavior. Chart review covers 64 rendered charts and
actual keyboard legend interaction. Public screenshots initially came from the
third export, while final editor and narrow/zoom checks use the sixth export.
The ninth public review found no document overflow in its normal eighteen
captures, but four 320px/200% cases revealed capability label clipping inside
their capsules. Document overflow alone is insufficient text-containment
evidence; this finding prompted the scoped tenth correction. Canceled linked
route HEAD requests remain recorded separately from failed GET/API requests.
The artifact names and receipts retain that distinction; a broad earlier
capture is not silently relabeled as a final-source observation.

Selected inspected visual evidence under ignored `test-results/`:

- `public-final/home-zh-1440.png`: public journey and prominent summary composition.
- `visual-upgrade-20261009/final-charts/demo-1440-en-light.png`: KPI-first training, radar, activity and distributions.
- `visual-upgrade-20261009/editor-final/editor-final-rich-desktop.png`: sixth-export split coding workspace.
- `visual-upgrade-20261009/independent-final-six/editor-en-320-text-200-source-visible.png`: sixth-export enlarged-text source canvas.
- `server2-release-20261009/final-sixth-browser/zh-CN-login.png`: real server2 CAPTCHA and anonymous login rendering.

Detailed source/build/browser receipts and original failed or canceled runs are
retained under `test-results/visual-upgrade-20261009/`, including
`final-check-editor-fixes.log`, `final-storybook-build-editor-fixes.log`,
`storybook-sixth-build-summary.json`, `storybook-sixth-build-full.log`,
`final-storybook-affected-sixth.log`, `final-e2e.log`, `editor-final/` and
`independent-final-six/`. Ninth receipts additionally include `ninth-check.log`,
`ninth-storybook-build.log`, `ninth-storybook-summary.json`,
`ninth-storybook-full.log`, `ninth-e2e-qa-followup.json`,
`ninth-auth-toast-placement-settled.log`, `bottom-toast-ninth/`,
`bottom-toast-ninth-compiled/final-compiled-receipt.json`,
`independent-header-ninth-compiled/results.json` and `final-public-ninth/`.
Final-build checks are recorded in `tenth-check.log`,
`tenth-storybook-summary.json`, `tenth-storybook-build.log` and
`tenth-storybook-affected.log`; targeted toast provenance is in
`bottom-toast-tenth/final-targeted-receipt.json`.
Eleventh build/source receipts are `eleventh-source-manifest.json`,
`eleventh-check.log`, `eleventh-storybook-summary.json`,
`eleventh-storybook-build.log`, `eleventh-storybook-targeted.log` and
`eleventh-e2e-list.log`.
Final corrected-input and combined browser evidence is in
`eleventh-test-followup-manifest.json`, `eleventh-e2e-corrected-summary.json`,
`eleventh-e2e-corrected-targeted.log` and `eleventh-combined-public/`.
Ignored local artifacts are review evidence in this
workspace; they are not published repository artifacts or a production release.

## Evidence and unresolved gates

Ignored local receipts are under `test-results/server2-release-20261009/`:
`openapi.json`, `openapi-comparison.json`, `protected-paths.json`,
`anonymous-get-sweep.json`, `adapter-read-acceptance.json` with its script,
`registry-manifest-receipt.json`, `readiness-recheck-0912.json`,
`backend-health-0933.json`, `reachable-gates-0933.json`,
`readiness-latest-authenticated-audit.json`, `tunnel-recovery-latest.json` and the sanitized seventh/ninth/tenth
authenticated receipt directories. These contain contract, transport and
limited authenticated metadata, not credentials or
authenticated customer data.

- **PASS:** Earlier backend health snapshots, baseline contract retention, anonymous access
  enforcement, actual frontend error/proxy transport and authenticated registry
  manifest access; historical sixth-export bilingual CAPTCHA rendering and
  anonymous workspace gates through the permitted local Origin.
- **PASS:** Latest recovered backend health, designated account login, actual
  identity/role reads, empty personal learning/submission/training responses,
  bilingual desktop/mobile empty/error rendering, current-session logout and
  local testing-process cleanup.
- **NOT RUN:** Other authenticated role/ownership combinations, business
  writes, candidate publication, production deployment and production verification.
- **BLOCKED:** Authenticated catalog/language HTTP 500 responses, populated V0.2
  payload compatibility and full problem-to-submission acceptance, plus an
  established server2 production frontend destination.

Frontend implementation, conclusive compiled browser review and scoped local
regressions pass. The eleventh full source check passes 522 units plus lint,
formatting, types and build; focused E2E passes 22 and Storybook passes six.
Complete final-head 356-case E2E and 494-case Storybook results remain pending
at this pre-release snapshot and must be checked on PR #42. Complete real-flow
integration and protected production release remain blocked by the gates above.
