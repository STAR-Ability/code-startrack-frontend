# Frontend release inspection — October 2026

This is a read-only inspection snapshot taken on 2026-10-09, before the current
frontend audit and redesign are released. It is not a release receipt. Current
source, PR checks and deployment metadata must be inspected again after the final
changes. No repository publication, workflow dispatch, deployment, backend change
or database change was performed by this inspection.

## Source and GitHub gates

| Item                     | Verified value                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Repository               | `STAR-Ability/code-startrack-frontend`                                                                                    |
| Initial local/remote dev | `41ccd2ba279a25e7c748cdbf66996c6e8dd21ddb`                                                                                |
| Remote main              | `dfeddc20cd2155dda201e9dd45bd610cc7b2d9b9`                                                                                |
| Initial divergence       | dev ahead 8 commits, behind 0                                                                                             |
| Existing release PR      | [#42, dev → main](https://github.com/STAR-Ability/code-startrack-frontend/pull/42)                                        |
| Initial PR state         | OPEN, MERGEABLE, CLEAN; no reviews or requested reviewers                                                                 |
| Initial dev push CI      | [PASS, run 37748556222](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37748556222), head `41ccd2b` |
| Initial PR CI            | [PASS, run 37748562267](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37748562267), head `41ccd2b` |
| Initial package version  | `0.13.3`, on both dev and main                                                                                            |
| Existing publication     | [PASS, run 37413062692](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37413062692), current main   |

Main is protected through active [ruleset 24550440](https://github.com/STAR-Ability/code-startrack-frontend/rules/24550440),
not the legacy branch-protection API. It requires a PR and the exact checks
`quality` and `storybook` from GitHub Actions integration `15368`. Required
approving reviews are zero; there is no CODEOWNERS, last-push approval, stale
review dismissal or thread-resolution requirement. The ruleset reports
`require_extra_approval_for_unattributed_changes=true`. Merge, squash and rebase
are allowed. Strict up-to-date checks are disabled. There are no bypass actors;
the inspecting account's bypass permission is `never`. Branch deletion and
non-fast-forward updates are prohibited. dev has no applicable rules or branch
protection.

The current task authorizes release through PR, CI and review. That newer explicit
instruction supersedes the earlier delivery-only instruction in the V0.2
integration guide to leave the PR unmerged until approved. Independent review and
the final head's required CI remain release gates.

`ci.yml` covers lint, formatting, strict types, unit tests, production export,
offline E2E, Storybook build and Storybook tests. `release.yml` repeats those
checks, builds the image from main, runs exact-image container acceptance, then
publishes version, commit and convenience tags. It refuses an existing version
tag. The candidate package version is now `0.14.0`; do not overwrite `v0.13.3`
or reuse its publication as proof of the new source. The initial CI rows above
do not verify the candidate head; fresh candidate checks are tracked in PR #42
and the audit ledger.

The inspecting local GitHub credentials cannot enumerate GHCR package versions:
the package API returns 403 for absent `read:packages`, and anonymous manifest
inspection returns 401. This does not prevent the existing publication workflow
from using its own `GITHUB_TOKEN` with `packages: write`. Registry access on a new
host must be verified without printing credential files or tokens.

## Initial deployment-target snapshot: server2

The task names `server2` as the frontend deployment target. The initial inspection
found a different topology from the historical deployment guide, which describes
`startrack-prod`. This table preserves that initial snapshot; its absent-backend
statement is superseded by the timestamped reinspection below. The two SSH aliases
resolve to separate hosts:

| Item                             | server2 inspection                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| SSH target                       | `ubuntu@server2.qlluck.com`, port `1022`                                                        |
| Hostname                         | `lavm-r9f519u1z2`                                                                               |
| Architecture                     | `x86_64` / `linux/amd64`                                                                        |
| Docker / Compose                 | `29.8.2` / `v5.6.0`                                                                             |
| Docker access                    | ubuntu lacks Docker socket access; read-only `sudo -n docker` succeeds                          |
| Free disk                        | approximately 112 GiB on the root filesystem                                                    |
| Frontend container/image/project | None found in complete Docker container/image and Compose inventories                           |
| Frontend listener                | No port 3000 listener                                                                           |
| Backend listener                 | No port 8081 listener at the initial inspection                                                 |
| Frontend checkout                | None found in a bounded scan of standard roots; restricted judge directory was excluded         |
| Existing ingress                 | `1Panel-openresty-FxeV`, host network; SafeLine project also exists                             |
| Existing website configuration   | `/opt/1panel/www/conf.d` is empty; `/opt/1panel/www/sites` does not exist                       |
| OpenResty route                  | Default `server_name _`/`127.0.0.1`, ports 8080/8443, static default root; no frontend upstream |
| Networks                         | `1panel-network`, `safeline-ce`, and standard Docker bridge/host/none                           |

The bounded filesystem scan covered `/opt`, `/home`, `/root`, `/var/www` when
present, and `/srv`, to depth four. It excluded credentials, caches, logs,
container storage, certificates and the judge deployment directory. No judge
service was inspected beyond its name in a host inventory, tested, changed or
restarted. Existing algorithm, ingress, SafeLine and other services were untouched.

At that initial inspection there was no existing frontend, matching backend
runtime destination, frontend ingress or frontend rollback baseline. Copying the
old production Compose file would have targeted the then-absent host port 8081.
The fresh inspection below establishes that a backend now exists; those
absent-runtime conclusions must not be repeated as current facts. The continuing
gap is the absent frontend deployment and unverified public frontend domain and
ingress route. Do not silently substitute server1 for the explicitly requested
server2.

## Fresh server2 snapshot — 2026-10-09 03:44:38 UTC

A separate read-only reinspection found material infrastructure change. This is
independent evidence from the initial snapshot; no frontend agent deployed or
changed the new backend.

| Item                                   | Fresh verified value                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Host                                   | `lavm-r9f519u1z2` / SSH alias `server2`                                                                                     |
| Inspection UTC instant                 | `2026-10-09T03:44:38.715251+00:00`                                                                                          |
| Backend container                      | `startrack-app`, running and healthy                                                                                        |
| Backend image                          | `ghcr.io/star-ability/code-startrack-backend:sha-318b841`                                                                   |
| Backend OCI revision                   | `318b84170860b6e4ca6931712554474a531acfcb`                                                                                  |
| Backend creation UTC instant           | `2026-10-09T02:22:52.633126541Z`                                                                                            |
| Backend networking                     | host network; actual `*:8081` listener                                                                                      |
| Backend Compose configuration          | `/opt/startrack/docker-compose.yml`, project `startrack`                                                                    |
| Frontend containers / images / project | None found in complete Docker/Compose inventories                                                                           |
| Frontend port                          | No 3000 listener                                                                                                            |
| Frontend source                        | No frontend-named path or Git checkout found in the bounded standard-root scan                                              |
| Website configuration                  | `/opt/1panel/www/conf.d` remains empty; `/opt/1panel/www/sites` remains absent                                              |
| Domain/ingress evidence                | OpenResty/SafeLine configuration inspection found only default `_` / `127.0.0.1` server names, with no frontend proxy route |

The backend image metadata and health state do not prove API compatibility,
authentication, supported roles, browser Origin or V0.2 business workflows. Those
require separate backend verification. The local backend listener is now real;
the old claim that server2 has no backend destination is historical. It does not
establish an approved public frontend domain or authenticated browser route.

**BLOCKED: existing-frontend rollout on server2.** No existing frontend deployment
or frontend rollback baseline was found. No configured public frontend domain or
ingress route was evidenced. A new server2 frontend setup still needs its intended
domain, ingress and verified frontend-to-backend/browser-Origin route established;
server1's existing public deployment must not be silently substituted. Existing
ingress, WAF, services and configuration remain untouched.

The raw current receipt is ignored at
`test-results/release-inspection/server2-current-20261009.json`, with its read-only
collection script and stderr log alongside it. Historical evidence is preserved
separately as `initial-server2-snapshot-from-bf528dd.md` and
`initial-server2-snapshot-metadata.json`. The original document records an
inspection date, not a precise UTC instant; its source commit is not presented as
the observation time. No backend HTTP/API/authentication request, private
environment read, database operation or judge-service test was performed by this
infrastructure reinspection.

## Existing production frontend: startrack-prod / server1

A read-only comparison confirmed that the historical deployment still exists on
`startrack-prod`, which resolves to `root@server1.qlluck.com`, port `22`.

| Item                            | Verified value                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hostname                        | `iZbp1fsjn9nj3bri4egumpZ`                                                                                              |
| Frontend container              | `code-startrack-frontend-frontend-1`                                                                                   |
| Compose project / service       | `code-startrack-frontend` / `frontend`                                                                                 |
| Current release directory       | `/opt/projects/code-startrack-frontend-deploy/releases/v0.13.3`                                                        |
| Current immutable image         | `ghcr.io/star-ability/code-startrack-frontend@sha256:6a4e7904c0d9bd91d6ed1dadc5554fe165268829f9b5713fb3a38b8c3e28bfb3` |
| OCI revision                    | `dfeddc20cd2155dda201e9dd45bd610cc7b2d9b9`, exactly current remote main                                                |
| OCI version / architecture      | `v0.13.3` / `amd64`                                                                                                    |
| Container health / restarts     | healthy / zero                                                                                                         |
| Frontend binding                | `127.0.0.1:3000` → container port 80                                                                                   |
| Frontend network                | `code-startrack-frontend_default`                                                                                      |
| Persistent mounts               | none                                                                                                                   |
| API destination                 | `http://host.docker.internal:8081`                                                                                     |
| Host mapping                    | `host.docker.internal:host-gateway`                                                                                    |
| Cookie hardening setting        | `FRONTEND_COOKIE_SECURE=true`                                                                                          |
| Frontend config/env permissions | current Compose 0600 / env 0600                                                                                        |
| Previous retained baseline      | v0.13.2, image digest `sha256:922e53977352a6e0e5f18e7665160edcaf4ab2b8206205392097356da865c96d`                        |
| Previous baseline OCI revision  | `80db13b546eb37eb99aa573eeab90858d62ecd6f`                                                                             |

PASS: current and previous Compose configurations validate with `config --quiet`.
Current nginx syntax validates; `/healthz` returns 200 and `{"status":"ok"}`.
GET `/` and `/dashboard` return HTML 200. `/api/v1/me` returns JSON 401 without a
Session, and obsolete `/api/training/profile` returns 404. These checks prove
liveness and unauthenticated proxy behavior, not authenticated workflows or
rendered UI quality.

NOT VERIFIED: direct public `https://acm.qlluck.com/` probe from the workstation
timed out after 15 seconds (curl exit 28 / HTTP 000). Historical WAF responses are
not a current acceptance result. Public browser/connectivity acceptance remains
separate from the successful existing-host loopback checks.

Existing restricted backups and release directories from v0.11.0 through v0.13.3
remain present. Previous frontend images are retained. For a later authorized
replacement on this host, the actual current v0.13.3 release is the immediate
rollback baseline; do not select v0.11.0 merely because historical examples name it.

An additional read-only path probe found `/dashboard/` returns 403 while
`/dashboard` returns 200. The deployed nginx static-export configuration also
falls back to `/index.html` for unknown paths. This is reported to the feature
audit for canonicalization/404 review and does not establish that a missing page
exists just because a request returns 200.

## Commands and remaining release gates

After final changes, version preparation, independent review and final-head CI,
the root release owner can inspect and merge through the existing PR:

```bash
gh pr checks 42 --repo STAR-Ability/code-startrack-frontend --required
gh pr view 42 --repo STAR-Ability/code-startrack-frontend \
  --json headRefOid,mergeable,mergeStateStatus,reviews,statusCheckRollup
gh pr merge 42 --repo STAR-Ability/code-startrack-frontend \
  --merge --match-head-commit "$RELEASE_HEAD"
gh api repos/STAR-Ability/code-startrack-frontend/branches/main --jq .commit.sha
gh workflow run release.yml --repo STAR-Ability/code-startrack-frontend --ref main
gh run list --repo STAR-Ability/code-startrack-frontend \
  --workflow release.yml --branch main --limit 3 \
  --json databaseId,headSha,status,conclusion,url
```

Use a merge commit to preserve dev lineage. Match the accepted PR head exactly,
then verify publication `headSha`, OCI revision and immutable digest against the
accepted main commit. Existing passing runs at the initial head are not proof of
subsequent source changes.

Deployment remains pending the target/topology resolution. If an existing
frontend-only Compose deployment is approved, inspect it again, back up its
restricted matching config/env and metadata, retain its exact image, prepare a
new release directory, validate/pull the new immutable image before replacement,
and update only the `frontend` service with `up --no-build --no-deps -d --wait`.
Do not use `down`, remove-orphans, volume cleanup or image pruning. A failed
replacement must restore the previously inspected frontend-only Compose release.
The detailed existing-host procedure is in the
[production deployment guide](../deployment/frontend-production-deployment.md).

Release completion still requires final local/CI checks, reviewed merge,
exact-image publication/acceptance, resolved deployment target, retained rollback,
browser rendering at desktop/tablet/mobile, bilingual charts and keyboard checks,
console/network inspection, authentication and real-backend acceptance. Public
edge success must be recorded separately from loopback/container evidence; leave
the existing ingress, WAF, certificates and security configuration intact.

No secrets, private environment contents, authenticated responses or customer
data are included in this inspection. No commits, pushes, PR mutations, release
dispatches or deployments were performed.

## Initial local exact-image acceptance (6777343)

The existing local `colima-startrack-v02` Docker context is running Docker 29.5.2.
Its unrelated PostgreSQL containers are outside this task. The initial
`pnpm test:container` frontend build failed because the VM's `/etc/resolv.conf`
points to a missing systemd stub resolver. Docker therefore gave the build
container unreachable fallback resolvers `8.8.8.8` and `8.8.4.4`; package lookups
returned `EAI_AGAIN`. After proving that condition, the root agent stopped only
the task-owned build container and observed the verification process exit 1 with
cleanup. That stopped-container exit 137 was deliberate cancellation, not
evidence of an out-of-memory failure.

A disposable task-owned Node container verified HTTPS, including certificate
validation, against resolved addresses for the package mirror, package CDN and
Google font hosts. It exited successfully and was removed. Per-build `--add-host`
arguments can repair this build's resolution without changing the Dockerfile,
VM, global Docker configuration, trust settings or unrelated containers:

```bash
DOCKER_BUILDKIT=0 docker --context colima-startrack-v02 build \
  --add-host registry.npmmirror.com:123.6.195.35 \
  --add-host cdn.npmmirror.com:124.163.197.109 \
  --add-host fonts.googleapis.com:114.250.66.33 \
  --add-host fonts.gstatic.com:114.250.63.34 \
  --label org.opencontainers.image.version=v0.14.0 \
  --label codestartrack.acceptance.source=working-tree \
  --tag codestartrack-frontend:acceptance-0140-20261009 .
DOCKER_CONTEXT=colima-startrack-v02 \
  CONTAINER_TEST_IMAGE=codestartrack-frontend:acceptance-0140-20261009 \
  pnpm test:container
```

These addresses were verified for this preparation only; resolve and validate
them again before a future build. The exact browser-check tool image/dependency
layers were already built by the initial run and were reused from cache.

The candidate was built from the frozen V0.14.0 working tree, using the unchanged
Dockerfile. All 839 dependencies installed, production Next.js compilation and
TypeScript passed, and all 40 static pages were generated. Build session `90409`
completed with exit code 0. This is a local candidate, not an image built from a
merged main revision or a published GHCR release.

After the root agent committed the source, all 223 captured production input
file contents were independently compared against the Git blobs in local commit
`6777343a8d70930931a31e59efe8212a6cf07c91`. Every hash matched. That establishes
input equivalence to the local source commit; the image still has no accepted-main
OCI revision and is not a production publication.

| Item                                       | Local candidate receipt                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Tag                                        | `codestartrack-frontend:acceptance-0140-20261009`                         |
| Image ID / local digest                    | `sha256:59b4c93b5ae7e87102e38d3edf2dec5b54de343d914661cc5da4b1803b3b31f2` |
| Platform / size                            | `linux/amd64` / 27,844,270 bytes                                          |
| OCI version / source label                 | `v0.14.0` / `working-tree`                                                |
| Production input files                     | 223                                                                       |
| Input manifest SHA-256                     | `bbb6040c9a910124221829d2a231766888c4f25ec7be86044e835fbba2a88f1f`        |
| Input stability                            | Same manifest before build, after build and after acceptance              |
| Initial supplied-image run                 | FAIL, session `11874`, exit 1; fixture bind mounts unavailable            |
| Transport-corrected exact-image run        | PASS, session `12489`, exit 0; unchanged script/assertions                |
| Main merge / GHCR publication / deployment | NOT RUN                                                                   |

The initial supplied-image standard invocation failed before browser assertions:
Colima could not see the Mac checkout's fixture bind mounts, so the disposable
relay could not load `/app/tests/container/upstream.mjs`. nginx subsequently could
not resolve the stopped fixture. The script removed its project containers and
network. That failure is retained in the evidence and is not counted as a passing
standard run.

The corrected run kept `pnpm test:container`, `tests/container/verify.mjs`, the
candidate image and every browser assertion unchanged. It copied the original
fixture roots (`tests`, `src/lib/demo`, `src/lib/mock`, `src/lib/api`, and the
resolved `node_modules/zod` package) into a task-owned named Docker volume. A
temporary Docker wrapper, supplied only through that command's PATH, added a last
Compose override replacing the unavailable fixture bind mounts with one read-only
`/app` volume. A configuration comparison proved that only fixture mounts changed;
frontend/secure-frontend images, browser tooling, commands, environment and the
isolated internal network remained identical. No global Colima mount, VM/Docker
configuration or source file changed.

All standard script steps ran: Docker/image inspection, Compose validation,
browser-tool image build, frontend/secure-frontend/fixture health wait, exported
file presence and runtime isolation checks, all unchanged browser checks,
fixture stop, backend-independent frontend health, and Compose cleanup. The
browser check reported `V0.12/V0.2 nginx/static-export/browser acceptance passed.`
This covers the frontend against synthetic fixtures; it does not verify a live
judge service, real authentication, production API capability or deployment.

Both test projects' containers and networks were verified absent afterward. The
task-owned external fixture volume and temporary wrapper directory were removed;
only the candidate and cached test-tool images remain. The two preexisting
unrelated PostgreSQL containers are still running and were untouched. No image
pruning or unrelated resource removal occurred.

Ignored evidence under `test-results/release-candidate/` includes `build-inputs.json`,
`image-receipt.json`, the build log, the failed initial acceptance log, the passing
volume-transport acceptance log, `fixture-transport.json`, and copies of the
temporary override/wrapper. A successful local candidate test does not prove
publication or production deployment from the eventual accepted main commit.

## Final local exact-image acceptance (765b55e)

A subsequent cold-engine E2E trace exposed actual layout movement when chart
legends appeared after initialization. The root agent corrected `chart.tsx` to
mount the wrapping legend in its first loading frame, keep it through errors and
retries, and disable its controls until the chart is ready. This changes the
production input manifest, so the earlier candidate's receipt remains historical
evidence and does not verify the final source.

A new candidate was built with the unchanged Dockerfile and the same four
per-build host mappings, under a distinct tag. Dependency layers were reused.
Production compilation passed in 67 seconds, TypeScript passed in 90 seconds,
and all 40 static pages were generated. Build session `20418` completed with
exit code 0.

| Item                                   | Final local candidate receipt                                             |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Tag                                    | `codestartrack-frontend:acceptance-0140-layout-20261009`                  |
| Image ID / local digest                | `sha256:70f4840c2264fbd945b575d793938fcf2ee73407e8aa780f79d8c2647870e228` |
| Platform / size                        | `linux/amd64` / 27,842,613 bytes                                          |
| Input-equivalent local source          | `765b55e7504ca6b023e028fab8e17512b11de9c3`                                |
| Production input files                 | 223                                                                       |
| Input manifest SHA-256                 | `c8f4c6a0aae89aded02cd04d91d66730961dd7a6c1eadaf3a7f8268be27b37af`        |
| Changed input since previous candidate | `src/components/workspace/chart.tsx` only                                 |
| Exact-image acceptance                 | PASS, session `73988`, exit 0                                             |
| Main merge / publication / deployment  | NOT RUN                                                                   |

All 223 captured production input contents were compared directly against the
local source commit's Git blobs. Every hash matched, and the complete manifest
remained unchanged after build and after acceptance. Documentation and excluded
test changes do not enter the production context.

The final run reused the verified fixture-transport correction, with a fresh
task-owned read-only volume and temporary Compose override. It ran the unchanged
`pnpm test:container` entry point, verification script and all browser assertions.
A fresh configuration comparison again proved that only fixture mount transport
changed; runtime images, service commands, environment, browser tooling and the
isolated internal network were identical to the standard configuration. The
standard Colima bind-mount failure remains recorded under the earlier candidate;
it was not relabeled as a pass.

Every standard verification step ran, including runtime file isolation, all
V0.12/V0.2 nginx/static-export/browser assertions, fixture stop and
backend-independent frontend liveness. The script removed its test containers and
network. The remaining task-owned volume and temporary wrapper directory were
removed afterward, and cleanup was verified. No unrelated containers, volumes or
configuration were changed.

Final ignored evidence is in `test-results/release-candidate-layout/`, including
the build-input manifest, image receipt, build/acceptance logs, fixture transport
receipt and copies of the temporary override/wrapper. Original evidence remains
in `test-results/release-candidate/` and is also retained under
`test-results/release-evidence/6777343/`. Both candidate images remain available.
The final receipt verifies the local frontend against isolated synthetic fixtures;
it does not prove real authentication, live backend capabilities, a judge service,
GHCR publication or production deployment from an accepted main revision.
