# Codex CLI frontend environment

## Goal

Provide a reproducible project-scoped CLI environment for code understanding,
current documentation and safe browser verification on the existing Intel Mac.

## Context

Next 16.3.6, React 19, Tailwind 4, Base UI/Nova, Node 24 and pnpm 12.8.1.
Existing shadcn/Next MCP configuration uses unpinned downloads. Existing offline
E2E covers desktop/mobile, keyboard, locales and browser errors. No CodeGraph index.
Global Codex authentication and project trust already exist; preserve them.

## Scope

### In Scope

Audit configuration and official upstreams; pin useful MCP servers; add focused
project skills and documentation; supply missing CLI tooling; verify all gates.

### Out of Scope

Product changes, system upgrades, credential provisioning, live backend writes,
additional agent orchestration and unnecessary overlapping MCP servers.

## Acceptance Criteria

- [x] Codex identifies project MCP and Skills.
- [x] Browser MCP and documentation retrieval have executable evidence.
- [x] Install, lint, format, typecheck, unit, build and E2E checks pass.
- [x] Development server starts and browser UI checks pass.
- [x] Audit lists scope, provenance, limitations and manual authentication steps.

## Implementation Stages

### Stage 1 - Audit and configuration

Files: `.codex`, `.agents/skills`, package metadata, AGENTS and development docs.
Validate official sources, configuration discovery and dependency installation.

### Stage 2 - Verification and review

Run quality gates, MCP protocol probes and browser checks; review the complete
diff, document evidence and commit/push the completed task on `dev`.

## Testing

- unit: existing Vitest suite.
- integration: MCP initialization/tools and Codex skill discovery.
- E2E: existing isolated desktop/mobile Playwright suite.
- build/type/lint: all repository quality gates.

## Risks

Remote docs have availability/rate limits. MCP processes execute local code;
browser isolation is not a security boundary. Authentication is user-owned.

## Rollback / Reversibility

Revert this task's commit and reinstall the lockfile. No global configuration or
system packages should need rollback; portable ignored tools can be removed.

## Progress

- [x] Baseline audit
- [x] Configuration
- [x] Verification and review

## Decisions / Deviations

Keep existing global model/login settings. Prefer existing offline fixtures to
live API interaction. GitHub CLI is missing; GitHub MCP would overlap with it.

Outcomes: all four MCP servers and three project Skills discovered by Codex;
CLI connectivity response succeeded; Context7 real docs retrieved; dev and offline
production browser probes succeeded. Install/lint/format/typecheck/build passed,
122 unit tests and 80 desktop/mobile E2E tests passed. Scoped MCP SDK override
removed the detected advisory; final audit and peer checks are clean.

GitHub CLI is installed locally but user login remains deliberately pending.
Generated stale Next caches were archived in `/tmp` rather than discarded.
Global configuration, credentials, system tools and application code are preserved.
