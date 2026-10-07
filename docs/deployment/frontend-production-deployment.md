# codeStartrack frontend production deployment

This guide records the inspected `startrack-prod` architecture and established
publication/rollback method. Reinspect the live frontend before selecting any
versioned example below. The [five-iteration redesign plan](../../.agent/plans/frontend-visual-overhaul.md)
describes the V0.14.0 release gates; [Issue #29](https://github.com/STAR-Ability/code-startrack-frontend/issues/29)
retains the preceding V0.13.3 publication and authenticated acceptance evidence.

The historical [V0.13.1 release acceptance Issue #23](https://github.com/STAR-Ability/code-startrack-frontend/issues/23)
and [V0.13.2 radar correction Issue #25](https://github.com/STAR-Ability/code-startrack-frontend/issues/25)
record the previous releases and the correction discovered during locale-switch
inspection. Keep their original image tags immutable. The
[V0.12.1 production receipt](v0.12.1-production-release.md) records an older
retained rollback baseline. Architecture, versioned examples and V0.12.0 evidence
below retain their historical inspection context; inspect the current deployment
before selecting a release or rollback reference.

## Architecture and host inspected before V0.12.1

```text
Browser: https://acm.qlluck.com
  → existing public edge / SafeLine / 1Panel OpenResty ingress
  → http://127.0.0.1:3000
  → frontend nginx:80 (Next.js static export)
      ├─ pages and /_next/static/* from /usr/share/nginx/html
      └─ /api/v1/* → http://host.docker.internal:8081
                      → existing host-network startrack-app
```

The frontend has no production Node process, database connection, algorithm proxy,
or build-time private API reads. nginx preserves the `/api/v1/` path, Cookie and
Origin; other `/api/` paths return 404. `/healthz` checks frontend liveness, not
backend readiness. Only exported assets and the nginx template enter the runtime
image; Storybook, source, tests and private environment files are excluded.

| Item                             | Inspected value                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| SSH alias                        | `startrack-prod`                                                                |
| Host architecture                | `x86_64` / image platform `linux/amd64`                                         |
| Existing frontend                | `code-startrack-frontend-frontend-1`                                            |
| Frontend Compose project/service | `code-startrack-frontend` / `frontend`                                          |
| Current deployment directory     | `/opt/projects/code-startrack-frontend-deploy/releases/v0.11.0`                 |
| Current deployment files         | `compose.production.yml`, `.env`                                                |
| Frontend binding                 | `127.0.0.1:3000` → container `80`                                               |
| Frontend network                 | `code-startrack-frontend_default`                                               |
| Backend                          | `startrack-app`, host network, port `8081`                                      |
| Backend Compose directory        | `/opt/startrack` — outside frontend operations                                  |
| Container-to-host mapping        | `host.docker.internal:host-gateway`                                             |
| OpenResty                        | `1Panel-openresty-nbtA`, host network, configured listeners `8080` / TLS `8443` |
| Existing ingress files           | `/opt/1panel/www/conf.d/acm.conf`, `/opt/1panel/www/sites/acm/proxy/*.conf`     |
| Existing ingress upstream        | `proxy_pass http://127.0.0.1:3000`                                              |

Public ports 80/443 belong to the existing ingress. Do not bind the frontend to
these ports, publish port 3000 on all interfaces, edit ingress/WAF settings, or
attach it to the backend Compose project. The root development Compose defaults
to `http://backend:8081`; that service name does not exist in this production
frontend project. Use `deploy/compose.production.yml` for this host.

An algorithm container was observed during the current inspection. Container
presence does not establish usable analysis/recommendations; their unavailability
is outside this frontend release gate. Keep null, empty, error and partial-sync
states. Do not invent responses or reconfigure that service.

## Historical V0.12.0 publication and evidence

| Item                                  | Value                                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Source Git commit on main             | `545d3669ae012d6f56ff099745c975bb72eac703`                                                                             |
| Image / GHCR path                     | `ghcr.io/star-ability/code-startrack-frontend`                                                                         |
| Immutable version tag                 | `v0.12.0`                                                                                                              |
| Commit tag                            | `sha-545d3669ae012d6f56ff099745c975bb72eac703`                                                                         |
| Convenience tag                       | `latest` — mutable; do not use for production pinning                                                                  |
| Published digest                      | `sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491`                                              |
| Recommended reference                 | `ghcr.io/star-ability/code-startrack-frontend@sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491` |
| Publication / exact-image acceptance  | [GitHub Actions release run](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37119658178)         |
| Verified dev CI                       | [Quality and Storybook](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37119069485)              |
| Verified main CI                      | [Quality and Storybook](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/37119564823)              |
| Previous compatible version           | `v0.11.0`                                                                                                              |
| Previous immutable rollback reference | `ghcr.io/star-ability/code-startrack-frontend@sha256:036c3fb29a4eec9df67cafb65acac471a1c463fb935f08841045b7fb731517f0` |

The old version/digest was checked against the registry and was the production
frontend at that inspection. The release workflow refuses to overwrite an existing version or commit tag.
Only an exact registry `manifest unknown` establishes absence; authentication,
network and other lookup failures stop publication. Version and SHA descriptors
must contain matching valid SHA256 digests before `latest` or success evidence
advances. A later documentation-only commit records this receipt; the image's
OCI revision always identifies the build commit above.

Validation passed: TypeScript, ESLint, formatting, 73 unit tests, production
Next.js static export, 114 E2E tests (one intentional mobile skip), 180 Storybook
checks covering 73 stories / 12 docs, Mock and Storybook startup, 50 public-page
checks across two locales and five widths, and actual Docker browser acceptance.
Docker acceptance uses an internal synthetic backend and verifies Session cookie
flags/forwarding, Origin and HTTPS forwarding, private API routing, public desktop
and 320px pages, legacy API rejection, output isolation and backend-independent
frontend health. It does not mutate production data.

These are the build and push commands executed by the publication workflow on a
Linux GitHub Actions runner, from the verified commit checkout:

```bash
RELEASE_SHA=545d3669ae012d6f56ff099745c975bb72eac703
IMAGE=ghcr.io/star-ability/code-startrack-frontend
VERSION=v0.12.0

docker build --pull \
  --label "org.opencontainers.image.source=https://github.com/STAR-Ability/code-startrack-frontend" \
  --label "org.opencontainers.image.revision=$RELEASE_SHA" \
  --label "org.opencontainers.image.version=$VERSION" \
  --tag "$IMAGE:$VERSION" --tag "$IMAGE:sha-$RELEASE_SHA" --tag "$IMAGE:latest" .
CONTAINER_TEST_IMAGE="$IMAGE:$VERSION" pnpm test:container
docker push "$IMAGE:sha-$RELEASE_SHA"
docker push "$IMAGE:$VERSION"
docker push "$IMAGE:latest"
```

Use `gh workflow run release.yml --ref main` from an authenticated development
checkout for future publication, after bumping the version on dev and completing
the release gate. The workflow uses a temporary Actions `GITHUB_TOKEN` with
`packages: write`; no developer or server token is committed. Never rerun
publication to overwrite `v0.12.0`.

## Prerequisites, access and registry login

Use the configured SSH alias and existing authorized key:

```bash
ssh startrack-prod
uname -m
docker version
docker compose version
```

The operator needs Docker permissions and, for private GHCR pulls, a GitHub account
with access to the project's package. Use a read-only classic PAT with
`read:packages` (and any organization-required authorization) or the host's existing
approved registry credential. Do not reuse the short-lived Actions token or copy
SSH keys/tokens into this repository. GitHub CLI login alone need not grant private
GHCR access. These requirements follow [GitHub’s GHCR authentication documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry).

Interactive login avoids placing the token in command arguments or shell history:

```bash
read -r -p 'GitHub username: ' GHCR_USER
read -r -s -p 'GHCR read:packages token: ' GHCR_READ_TOKEN
printf '\n'
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
unset GHCR_READ_TOKEN
```

Protect the account's Docker credential storage; prefer an existing credential
helper. Do not print its contents or copy it into a Compose/env file.

## Inspect the server before an operator deployment

These commands are read-only:

```bash
docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}'
docker inspect code-startrack-frontend-frontend-1 \
  --format 'image={{.Config.Image}} network={{.HostConfig.NetworkMode}} ports={{json .NetworkSettings.Ports}}'
docker inspect code-startrack-frontend-frontend-1 \
  --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
docker inspect startrack-app --format 'image={{.Config.Image}} network={{.HostConfig.NetworkMode}}'
ss -ltn
cd /opt/projects/code-startrack-frontend-deploy/releases/v0.11.0
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml ps
curl --noproxy '*' -fsS http://127.0.0.1:3000/healthz
curl --noproxy '*' -fsS http://127.0.0.1:8081/health
```

Repeat inspection if another operator has upgraded the host. Do not assume that
the current frontend release directory or backend image will remain unchanged.
Do not dump private backend `.env` files or complete container environments.

## Runtime environment

| Variable                 | Current production setting / responsibility                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `FRONTEND_IMAGE`         | Complete immutable GHCR digest in frontend release `.env`                         |
| `BACKEND_BASE_URL`       | `http://host.docker.internal:8081`, injected by production Compose                |
| `FRONTEND_COOKIE_SECURE` | `true`, injected by production Compose                                            |
| Backend `PUBLIC_ORIGIN`  | Inspected allowlist includes `https://acm.qlluck.com`; owned by backend           |
| Backend `COOKIE_SECURE`  | Inspected as `false`; frontend adds Secure/HttpOnly/SameSite=Lax to `cst_session` |

No frontend secret, database credential, JWT key or `NEXT_PUBLIC_*` deployment
backend URL is required. The backend origin must have no trailing API path.
`FRONTEND_COOKIE_SECURE=false` is only for isolated HTTP fixtures. Browser calls
use same-origin `/api/v1/**`; never remove Origin to bypass backend checks.
Cookie hardening applies only through the frontend proxy, not direct backend
access. Backend cookie/origin configuration remains outside this task.

## Operator upgrade with Docker Compose

The inspected deployment is already a frontend-only Compose project. Use the same
project and service to replace only its frontend. Do not run these commands in
`/opt/startrack` and do not use `down`, `--remove-orphans` or volume-removal flags.

First back up the current frontend's files and metadata on the server:

```bash
umask 077
DEPLOY_ROOT=/opt/projects/code-startrack-frontend-deploy
CURRENT_RELEASE="$DEPLOY_ROOT/releases/v0.11.0"
install -d -m 700 "$DEPLOY_ROOT/backups"
BACKUP_DIR="$(mktemp -d "$DEPLOY_ROOT/backups/pre-v0.12.0.XXXXXX")"
cp "$CURRENT_RELEASE/.env" "$CURRENT_RELEASE/compose.production.yml" "$BACKUP_DIR/"
docker inspect code-startrack-frontend-frontend-1 > "$BACKUP_DIR/frontend-inspect.json"
printf 'Frontend backup: %s\n' "$BACKUP_DIR"
install -d -m 700 "$DEPLOY_ROOT/releases/v0.12.0"
```

From the verified development checkout, copy only the production Compose file:

```bash
scp deploy/compose.production.yml \
  startrack-prod:/opt/projects/code-startrack-frontend-deploy/releases/v0.12.0/compose.production.yml
```

On the server, pin, pull, validate and recreate only the frontend:

```bash
cd /opt/projects/code-startrack-frontend-deploy/releases/v0.12.0
umask 077
printf '%s\n' 'FRONTEND_IMAGE=ghcr.io/star-ability/code-startrack-frontend@sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491' > .env
chmod 600 .env
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml config --quiet
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml pull frontend
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml up --no-build --no-deps -d --wait frontend
```

`up` discovers the existing `code-startrack-frontend-frontend-1` in the same project.
Do not delete it separately before the image is available. The frontend has no
persistent volume. Its replacement does not require backend/database migrations.
For later releases, use a new version directory and immutable digest; inspect and
back up the then-current release instead of assuming V0.11.0 is still deployed.

## Optional Docker-only canary

An operator may test a pulled image on a spare loopback port without replacing the
current frontend. Verify that 3300 is free first. This example is not the production
Compose deployment and was not run on the production host during this release:

```bash
docker pull ghcr.io/star-ability/code-startrack-frontend@sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491
docker run -d --name codestartrack-frontend-canary \
  --add-host host.docker.internal:host-gateway \
  -e BACKEND_BASE_URL=http://host.docker.internal:8081 \
  -e FRONTEND_COOKIE_SECURE=true \
  -p 127.0.0.1:3300:80 \
  ghcr.io/star-ability/code-startrack-frontend@sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491
curl --noproxy '*' -fsS http://127.0.0.1:3300/healthz
docker logs --tail 80 codestartrack-frontend-canary
docker rm -f codestartrack-frontend-canary
```

Keep canary checks GET-only. Do not test login, captcha POST, email, binding,
synchronization or recommendation generation against production records.

## Lifecycle and logs

Run from the selected frontend release directory; use its matching `.env` and
Compose file:

```bash
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml ps
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml stop frontend
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml start frontend
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml restart frontend
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml logs --tail 100 frontend
docker compose --project-name code-startrack-frontend --env-file .env -f compose.production.yml logs -f frontend
docker exec code-startrack-frontend-frontend-1 nginx -t
docker inspect code-startrack-frontend-frontend-1 --format '{{json .State.Health}}'
```

`restart` does not load a new image/environment; use the upgrade `pull` / `up`
sequence for changes. Inspect nginx stdout/stderr and avoid retaining logs containing
sensitive application data in public reports.

## Page, API and ingress acceptance

After an authorized replacement, verify health separately from the backend and
check real pages/assets:

```bash
curl --noproxy '*' -fsS http://127.0.0.1:3000/healthz
curl --noproxy '*' -fsS http://127.0.0.1:8081/health
for path in / /product /product/profile /product/recommendations /about /dashboard /practice /profile; do
  curl --noproxy '*' -fsS -o /dev/null -w "$path HTTP %{http_code}\n" "http://127.0.0.1:3000$path"
done
curl --noproxy '*' -sS -o /dev/null -w '/api/v1/me HTTP %{http_code}\n' http://127.0.0.1:3000/api/v1/me
curl --noproxy '*' -sS -o /dev/null -w '/api/training/profile HTTP %{http_code}\n' http://127.0.0.1:3000/api/training/profile
curl -sS -o /dev/null -w 'Public HTTPS HTTP %{http_code}\n' https://acm.qlluck.com/
```

Without a Session, `/api/v1/me` must return 401 (`SESSION_EXPIRED`), not successful
HTML. The legacy API returns 404. These checks returned health 200 and Session 401
on the inspected V0.11.0 host. A page status alone is insufficient: inspect the
new release in a browser at desktop and 320/390px, keyboard focus/navigation,
charts, locale changes and console/network errors. Use an SSH tunnel for a
loopback page check if needed; never publish a new port for convenience:

```bash
ssh -o ExitOnForwardFailure=yes -N \
  -L 127.0.0.1:13000:127.0.0.1:3000 startrack-prod
```

Earlier public-edge automation received SafeLine HTTP 468; ordinary HTTPS status
and browser behavior must be rechecked for each release. Preserve the WAF and
complete its normal human verification for public browser acceptance. This is a
separate limit from successful container and loopback health/API checks. Do not
use insecure TLS options, disable WAF, or change system trust to make a probe pass.

## Immutable rollback

The inspected compatible rollback is V0.11.0, not the historical V0.1 frontend.
It uses the same current API contract. Keep the previous image, its release files
and restricted backups. On the server, recreate only the frontend from the old
release's already-pinned `.env`:

```bash
cd /opt/projects/code-startrack-frontend-deploy/releases/v0.11.0
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml pull frontend
docker compose --project-name code-startrack-frontend \
  --env-file .env -f compose.production.yml up --no-build --no-deps -d --wait frontend
docker inspect code-startrack-frontend-frontend-1 --format '{{.Config.Image}}'
curl --noproxy '*' -fsS http://127.0.0.1:3000/healthz
```

Confirm the reference matches the previous digest listed above and repeat page/API
checks. For a future rollback choose the actual previous compatible immutable
release. Do not roll back the backend, database or volumes as a side effect.

## Troubleshooting and safety

- **GHCR unauthorized:** authenticate as an account allowed to read the package,
  with `read:packages`; verify organization authorization. Never print/copy tokens.
- **Port 3000 in use:** inspect the existing frontend/project. Reuse that project's
  `frontend` service; do not kill unrelated listeners or use a public binding.
- **502 / host not found:** inspect `BACKEND_BASE_URL`, `extra_hosts`, backend host
  networking and `http://host.docker.internal:8081/health` from the frontend. Do not
  substitute `backend:8081` in the production standalone project.
- **401 is expected while logged out:** Session failure is not frontend liveness
  failure. Do not weaken authentication or perform a production login to test it.
- **Origin / Cookie failures:** retain HTTPS forwarding and the browser Origin;
  inspect backend ownership/configuration with its operator. Keep frontend cookie
  hardening enabled; this release does not change backend `COOKIE_SECURE=false`.
- **Health is green but a page fails:** check route HTML, `_next/static` requests,
  console/hydration and nginx logs; `/healthz` only proves the frontend is running.
- **Slow GHCR/base-layer transfers:** retry the identical pinned digest. Do not
  substitute an unverified image, change global registries, or remove old images.
- **Analysis/recommendations unavailable:** preserve the documented empty/error
  behavior; do not require algorithm availability or fabricate successful data.
- **Public HTTP 468:** complete normal human verification and check loopback/API
  independently; leave SafeLine, OpenResty, 1Panel and SSH configuration unchanged.

All server work for the historical V0.12.0 publication was inspection/GET only. Upgrade and
rollback commands target only the frontend. Never delete databases, Docker volumes,
old releases/images, or unrelated containers; never use project-wide backend
cleanup. Real login/email/account mutations remain separately authorized tests.
