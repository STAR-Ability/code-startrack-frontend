# server2 image publication and deployment guide

## Goal

Commit completed work on dev, merge through existing PR #42 and mandatory GitHub checks, publish the production linux/amd64 image using the existing release workflow, and deliver a complete Chinese server2 deployment guide with the actual immutable registry digest. Do not deploy.

## Context

The user explicitly stopped all further development, visual reviews and additional testing. This release-preparation request supersedes the unfinished visual and live-integration stages of earlier plans. Existing completed application work is at dev commit `944e20b0dbdac8bbf1e3ecbc4706aecdbeab0f9e`; an uncommitted related release-ledger update records its completed evidence. Package version is `0.14.0`. PR #42 targets main. Active main ruleset 24550440 requires a pull request and successful `quality` and `storybook` checks, with no bypass actors. The existing main-only `release.yml` repeats its mandatory checks and rejects version-tag reuse.

## Scope

### In Scope

- Preserve and commit the completed release-ledger update.
- Add `docs/deployment/server2-frontend.md` in Chinese, grounded in the actual static-export/nginx runtime and existing server2 evidence.
- Push dev, update and ready PR #42, await required checks, and merge normally.
- Dispatch the existing production image workflow from the accepted main commit.
- Record actual version/commit tags, SHA256 digest, platform, source SHA and Actions evidence.
- Land the post-publication receipt through another protected documentation PR if necessary, because an actual image digest is available only after publication.

### Out of Scope

- Application changes, visual reviews or additional local test execution.
- Applying prepared visual correction snapshots.
- SSH, deployment, ingress changes, backend changes or HTTP 500 fixes.
- Workflow changes, weakened CI, branch-rule bypasses, secrets or unrelated files.

## Acceptance Criteria

- [ ] Completed work and deployment-guide draft committed and pushed to dev.
- [ ] PR #42 merged with required checks successful on its final head.
- [ ] Existing release workflow completes successfully on the intended main source.
- [ ] Published production image has actual tag, immutable SHA256 digest and linux/amd64 evidence.
- [ ] Chinese guide includes Compose, registry login, environment, proxy/HTTPS, backend 8081, deployment, updates, rollback and troubleshooting.
- [ ] Final publication receipt committed and present on dev and main through normal PR checks.
- [ ] No server2 deployment, backend fixes or unrelated infrastructure changes performed.

## Implementation Stages

### Stage 1 - Preserve and document

Files: existing release ledger, this plan and the new Chinese deployment guide. Inspect source/configuration and branch rules without running additional tests. Commit only explicit task files.

### Stage 2 - Protected integration

Push dev, refresh PR #42 to the final scope, mark ready, await required GitHub CI, and merge without bypass flags. Record actual merge SHA and source head.

### Stage 3 - Existing workflow publication

Dispatch `release.yml` on main only after mandatory main CI succeeds. Observe the workflow's mandatory checks, container acceptance and GHCR pushes. Record only successful terminal results and actual registry data.

### Stage 4 - Publication receipt

Replace pending receipt values with actual image evidence. Commit on dev and merge a documentation follow-up through required checks. Keep the image's source SHA distinct from the later documentation merge SHA.

## Testing

- Unit/integration/E2E/visual/local build/type/lint: no additional local executions, as explicitly requested.
- Mandatory GitHub CI and existing release/container checks: run unchanged through the existing workflows.
- Read-only GitHub/registry/source checks: permitted to establish actual publication results.
- server2 deployment and production acceptance: NOT RUN by explicit user instruction.

## Risks

Existing backend catalog and judge-language HTTP 500 errors prevent full real judge-flow acceptance. Broad visual acceptance and prepared corrections remain unfinished and are documented, not completed. server2 has no confirmed frontend ingress or deployed frontend rollback baseline in the existing inspection. A successful image publication does not establish successful deployment or backend correctness.

## Rollback / Reversibility

No server changes occur. Preserve existing immutable GHCR tags; use the guide's future operator-controlled digest rollback. Do not delete branches, images, containers or volumes.

## Progress

- [x] Read repository instructions, release workflow, runtime configuration and main ruleset.
- [ ] Stage 1
- [ ] Stage 2
- [ ] Stage 3
- [ ] Stage 4

## Decisions / Deviations

The Chinese guide is explicitly requested by the user and takes precedence over the default English engineering-documentation convention. Existing unfinished-task instructions to continue visual correction or deploy are superseded by this request. The post-publication documentation merge does not rebuild or overwrite the versioned image.
