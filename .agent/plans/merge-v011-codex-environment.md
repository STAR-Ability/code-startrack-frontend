# Integrate V0.11 and Codex CLI configuration on dev

## Goal

Combine the user's merged V0.11 feature with the local Codex environment and
push a verified, non-destructive merge to origin/dev.

## Context

Local dev at 8ce4463 adds tooling on 471ff2a. Remote dev at 12f4705 merges
feature/v0.11-account-workspace (f1e2f77). User authorized integration on
2026-10-02. The working tree had only ignored portable GitHub CLI binaries.

## Scope

### In Scope

Resolve README conflict, retain both histories, adapt offline dev/Skill/docs to
static export and the V0.11 synthetic fixture; validate merged code and push dev.

### Out of Scope

Product refactoring, live backend operations, force pushes and branch deletion.

## Acceptance Criteria

- [x] Both histories retained and README conflict resolved.
- [x] Offline dev explicitly targets a locally owned synthetic backend.
- [x] Install, lint, formatting, types, unit, build and E2E pass.
- [x] Merge changes reviewed and ready for normal publication to origin/dev.

## Implementation Stages

### Stage 1 - Integrate

Merge origin/dev into local dev without auto-commit. Keep remote README content
plus the tooling guide link. Adapt scripts and documentation to actual V0.11.

### Stage 2 - Verify and publish

Run repository quality gates and dev fixture smoke test; review changes against
both parents, commit the merge and push normally.

## Testing

- unit: full Vitest suite.
- integration: dev server proxies GET /api/v1/me to the synthetic fixture.
- E2E: desktop/mobile production export suite.
- build/type/lint: all repository quality gates.

## Risks

Stale Next caches after branch changes; offline modes share port 3210.
The previous empty dev backend env now selects a network fallback, so replace
it with a locally owned fixture. Real backend writes remain prohibited.

## Rollback / Reversibility

Both parent commits remain available; no published history is rewritten.
Revert the merge with an explicitly selected parent if rollback is requested.

## Progress

- [x] Stage 1
- [x] Stage 2 verification (publication recorded in Git history)

## Decisions / Deviations

GitHub CLI login already works. Preserve the feature branch and PR #7 merge.
No product source changes are needed to resolve the integration.

## Verification Results

Frozen install, lint, formatting, types and static export build passed.
All 50 unit tests and 81 E2E tests passed. Offline dev proxy smoke test verified
the owned fixture destination, rejection of port reuse and cleanup on exit.
Doctor and peer checks passed; GitHub login is active. Old route caches were
archived, and two inherited documentation whitespace issues were trimmed.
