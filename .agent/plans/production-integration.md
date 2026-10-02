# Production backend integration and deployment

## Goal

Validate the current frontend against the deployed V0.11 contract, test its Docker runtime locally, merge dev into main, publish an immutable GHCR image and deploy the frontend on startrack-prod.

## Context

Next.js 16 static export, nginx same-origin /api/v1 proxy, opaque Session cookies and account-scoped DTOs. The backend container startrack-app currently uses host networking on port 8081. Existing user edits in AGENTS.md and .codex/config.toml must be preserved. The current user instruction explicitly authorizes the release merge and production frontend deployment.

## Scope

### In Scope

- Read-only production inspection and API documentation checks through SSH tunnels.
- Frontend integration fixes, local fixture mutations, quality checks and Docker/browser verification.
- Conventional commits on dev, merge to main, GHCR publication and frontend-only deployment with rollback evidence.

### Out of Scope

- Production data mutations, backend/container changes, volume deletion and unrelated service or system configuration.
- Implementing the unavailable algorithm service.

## Acceptance Criteria

- [x] Live OpenAPI paths, parameters, DTOs and Session/Origin behavior reviewed.
- [x] Standard quality checks, E2E and local Docker acceptance pass.
- [x] Runtime proxy reaches the backend through an SSH tunnel locally.
- [ ] dev is fully merged into main and an immutable main image is in GHCR.
- [ ] Production frontend is healthy; pages and read-only API checks pass.
- [ ] Limitations and rollback are documented.

## Implementation Stages

### Stage 1 - Audit and integration

Review source, Docker, deployed OpenAPI and current server topology. Correct demonstrated frontend mismatches and record unavailable capabilities.

### Stage 2 - Local verification

Run lint, format, typecheck, unit, production build, E2E and isolated Docker tests; then check read-only backend connectivity through the tunnel.

### Stage 3 - Release and deployment

Review all changes, preserve user configuration edits, commit/push dev, merge main and publish its image. Inspect and back up the exact frontend deployment target before replacement. Verify and retain rollback artifacts.

## Testing

- Unit: API validation and relevant integration regressions.
- Integration: live OpenAPI/read-only requests, isolated proxy cookies/Origin and failure behavior.
- E2E: offline Playwright desktop/mobile flows.
- Build/type/lint: all standard pnpm checks and local Docker startup.

## Risks

- No live authentication or business mutations are permitted; authenticated behavior can only be fixture-tested and contract-reviewed.
- Algorithm-dependent functionality may remain unavailable.
- The backend's actual PUBLIC_ORIGIN and cookie settings may restrict production login; do not silently modify backend configuration.
- Registry publication must use existing authentication or repository Actions permissions, without exposing credentials.

## Rollback / Reversibility

Retain the old frontend image and exact container configuration, back up frontend deployment files, and pin new deployments by digest. Recreate only the frontend with the prior image/configuration if validation fails. Never remove volumes.

## Progress

- [x] Stage 1
- [x] Stage 2
- [ ] Stage 3

## Decisions / Deviations

- Production validation is GET-only; all mutation tests use the isolated synthetic backend.
- The explicit release request supersedes the repository's general prohibition on direct main changes for this merge.
- No CodeGraph index exists; ordinary scoped source inspection applies.
- Live audit: 31 frontend operations matched the deployed OpenAPI methods, paths, query names and body fields using an in-memory transport interceptor. Fourteen DTO schemas matched 377 nested field/type checks. Generated OpenAPI omits nullable/required/enum detail; retain the explicit DTO contract for these constraints.
- Seventeen private GET routes returned valid 401 SESSION_EXPIRED envelopes through the SSH tunnel. Backend health is 200; no production mutation was attempted.
- Production keeps the existing acm.qlluck.com ingress and loopback port 3000. A separate frontend Compose file reaches the host-network backend through host-gateway. Backend COOKIE_SECURE=false is compensated in nginx without changing the backend; Origin is preserved.
- Quality: lint, formatting, typecheck, 73 unit tests and static production build passed. Full E2E rerun passed 110 tests with one intentional mobile skip. An initial recommendation-history test raced its independent refresh; it now selects the newly returned batch only after that row appears.
- Offline browser MCP mobile inspection passed with zero console errors/warnings. Screenshots and live audit artifacts remain ignored.
- Initial Docker build could not pull nginx from Docker Hub. Pulled the official Docker-library mirror from public.ecr.aws and tagged it locally. No daemon configuration was changed.
- Existing public HTTPS ingress returned a SafeLine HTTP 468 browser challenge before deployment. Existing direct TLS ingress uses a certificate not trusted by the server curl bundle. Do not alter WAF/TLS configuration to make automated checks pass.
- Local GitHub OAuth lacks package scopes. Publication uses the repository's temporary Actions GITHUB_TOKEN, not a new PAT or an extracted credential.
- Final Docker acceptance passed: static pages, browser account selection, Cookie/Origin preservation, HTTPS forwarding, Secure/HttpOnly/SameSite flags, forbidden legacy API paths and frontend health after fixture shutdown. Fixed stale fixture mounts and preserved the shared Mock API's loopback guard using a Docker-only relay on the internal test network. Cleanup removes only test containers/network, never volumes, and prints logs on failure.
- The local nginx image also passed 20 desktop/mobile live-tunnel page checks, three same-origin private GET checks, liveness and legacy-path rejection. The browser guard blocked non-GET traffic before transport, including automatic captcha requests. No page errors or horizontal overflow occurred.
- Final lint, format, typecheck and 73 unit tests passed after the test harness fixes. The complete E2E pass remains applicable because subsequent changes affect only the Docker fixture harness.
- Preserve the user's local .codex/config.toml preference edits uncommitted; perform the release merge in a clean main worktree. Include the user's task-relevant AGENTS.md server-operation instructions in the scoped deployment commit.
