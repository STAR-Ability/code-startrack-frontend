# Design system, product pages and component documentation

## Goal

Unify codeStartrack's white-led visual language, provide four distinct public
product pages, document real UI states in Storybook, and publish a verified
production image from main with an executable deployment guide.

## Context

Next 16.3.6 static export, React 19, strict TypeScript, Tailwind 4, Base UI/Nova,
ECharts, TanStack Query and the V0.11 Session/account-scoped API remain in place.
Current dev baseline is aec2bcc. User changes in .codex/config.toml and .gitignore
are preserved and excluded from task commits. The explicit task authorizes
staged dev pushes and a final tested merge/push to main, superseding the older
repository prohibition. Production changes are limited to image publication and
deployment documentation; no server replacement was requested in this task.

## Scope

### In Scope

- Semantic tokens, surface hierarchy, restrained motion and responsive navigation.
- Public capabilities, profile, recommendations and about pages in both locales.
- Consistent chart/status semantics and small presentation extractions.
- Official Next.js Storybook integration, stories, build and CI coverage.
- Local Mock, browser, Docker validation, immutable GHCR release and deployment guide.

### Out of Scope

- New backend endpoints, algorithm service, live mutations, database or ingress changes.
- UI library/preset migration, broad business logic rewrites, production deployment.

## Acceptance Criteria

- [x] Public product links reach four distinct pages, with honest capability boundaries.
- [x] Tokens drive UI/chart colors; motion respects reduced-motion and keyboard use.
- [x] Storybook documents primitives and business states using real components.
- [x] Mock preview, all quality gates, E2E and Docker acceptance pass.
- [x] Verified dev is merged into main, immutable image published, guide records evidence.

## Implementation Stages

Each stage is reviewed, validated, committed and pushed to origin/dev before the
next stage. Use pnpm check for implementation stages; browser checks match scope.

1. Design tokens: globals.css, Badge/Card and design documentation; full quality gate.
2. Background hierarchy: landing/workspace/auth surfaces and motion; responsive browser check.
3. Homepage and product routes: localized, distinct compositions; navigation/locale E2E.
4. Charts and data: ECharts theme and status mappings; chart/metric browser checks.
5. Shared components: extract existing recommendation presentation; regression checks.
6. Storybook setup: official Next.js Vite adapter, providers, CSS, smoke story; start/build.
7. Stories: primitive and domain states, interactions, responsive docs; browser acceptance.
8. CI/build: static Storybook artifact and checks, release version; local workflow equivalents.
9. Final fixes: all checks, Mock, mobile/keyboard/motion, API diff, Docker acceptance.
10. Release: dev push, merge main, recheck/build, main push, GHCR image build/push.
11. Deployment guide: inspect actual host safely, record digest/commands/rollback, docs-only integration.

## Testing

- Unit: existing Vitest suite; add only behavior regression tests where needed.
- Integration: API contracts and synthetic data remain authoritative for mutations.
- E2E: existing Playwright suite plus public product and Storybook checks.
- Build/type/lint: pnpm check, build-storybook, local Docker build/start/test.
- Preview: coordinate existing dev:mock on 3000/3210; stop before builds/E2E,
  restore after each stage. Never share/reset the user's running fixture during E2E.

## Risks

- Historical V0.1 plan/docs differ from active V0.11; active contract takes precedence.
- Algorithm service remains unavailable; marketing must distinguish current/future capabilities.
- Storybook dependencies must support pinned Next/React/Node; verify official guidance and peers.
- Existing production WAF may limit automated public access; preserve configuration.

## Rollback / Reversibility

Use scoped revert commits and immutable image tags/digests. Retain v0.11.0 image.
Do not reset history, remove volumes, or recreate the backend.

## Progress

- [x] Audit: structure, tokens, landing/workspace, data components, motion, CI and Docker.
- [x] Baseline: lint, formatting, typecheck, 73 unit tests and static build passed.
- [x] Stage 1: semantic tokens and elevation; pnpm check passed; commit 31f0ec4.
- [x] Stage 2: surfaces and bounded motion; pnpm check and 1440/390/320px checks passed; commit c83f0c1.
- [x] Stage 3: four public pages and navigation. pnpm check passed. Full E2E: 113 passed, one existing skip, one new 200% zoom overflow found. Fixed grid min-width; rebuilt and all eight product/accessibility tests passed. API/Mock source unchanged.
- [x] Stage 4: semantic chart palettes, status maps and metric accents; pnpm check and desktop/320px chart inspection passed.
- [x] Stage 5: extracted FormInput/recommendation presentation, localized primitive labels and removed orphan styles; pnpm check passed; focused E2E 29 passed, one existing mobile-only skip.
- [x] Stage 6: official Next.js Vite Storybook, isolated providers, local Geist fonts and semantic toolbar; pnpm check, static build and browser startup/theme/locale checks passed.
- [x] Stage 7: 73 stories / 12 component docs, typed controls and local fixtures; pnpm check, Storybook build and 180 desktop/mobile/interaction/accessibility checks passed. Fixed error-token contrast (including hover) and profile definition-list semantics found by the addon.
- [x] Stage 8: independent Storybook CI job/artifact; release workflow tests the exact
      image before immutable version/SHA/latest publication; V0.12.0 version. Local
      frozen install, lint, formatting, strict typecheck, 73 unit tests, production
      build, 114 E2E passes (one existing mobile skip), 180 Storybook checks and
      supplied-image Docker acceptance passed.
- [x] Stage 9: `pnpm check` passed (73 unit tests), complete E2E passed
      (114, one existing mobile skip), Storybook start/build and 180 checks passed.
      `dev:mock` passed 50 public route/locale/viewport combinations at
      1440/1280/768/390/320px; inspected desktop/mobile screenshots, keyboard skip
      link/focus, chart rendering and reduced motion. Existing suites cover hover,
      loading/empty/error/disabled states. Production Docker build and exact-image
      acceptance passed. API client/schemas/endpoints, Mock protocol and nginx proxy
      have no diff from the pre-design baseline. Stage 8 commit: c92debd.
- [x] Stage 10: final dev 82ee707 and its remote CI passed; clean worktree.
      Merged without conflicts to main 545d366; identical dev/main code tree.
      Re-ran `pnpm check`, Storybook build and 17 critical E2E tests before main push.
      Main CI passed both jobs. Built/tested a local main image with OCI revision.
      Publication run 37119658178 independently passed 73 unit / 114 E2E (one
      existing skip) / 180 Storybook tests and exact-image Docker acceptance.
- [x] Stage 11: added `docs/deployment/frontend-production-deployment.md` from
      read-only current host inspection; includes actual Compose paths/network/ports,
      GHCR auth, immutable receipt, executable frontend-only lifecycle/upgrade/rollback,
      health/API/page checks, troubleshooting and data-safety boundaries. No production
      frontend replacement, backend change or live business mutation was performed.

## Decisions / Deviations

- Preserve neutral Nova components and existing orbit motif; use softer neutral
  canvas, white surfaces, blue primary data, green success and amber warnings.
- Existing chart theme has only blue/grays and default metrics/status badges do
  not distinguish semantics. No raw color proliferation was found in page code.
- AppHeader currently hides public navigation below xl and sends profile/problem
  links into workspaces. Replace these with public routes and accessible mobile navigation.
- Existing login/practice decorative loops run indefinitely. Bound their duration;
  retain the explicit pause control for the landing strip.

- Stage 8 isolates E2E artifacts under `test-results/e2e` and
  `playwright-report/e2e`. Concurrent local E2E startup had deleted Storybook trace
  files; all 180 Storybook checks passed after isolation. CI jobs already use
  separate runners; publication runs suites sequentially.
- The release uses an isolated dev worktree to preserve unrelated user edits and
  document removals. Colima does not expose `/tmp` bind mounts; move this worktree
  under `/Users/jack5/QLluckGithub` for final container acceptance. The initial
  supplied-image acceptance passed using the repository's mapped fixture paths.

- Stage 9 corrects zh-CN/en showcase availability copy. A read-only host inspection
  now finds an algorithm container, so the UI describes the user-specified
  unavailable capability without asserting that no service was deployed. No
  algorithm readiness or live business mutation is required for this release.
- Stage 8 remote CI passed both quality and Storybook jobs (run 37118417359).
  Existing production frontend remains v0.11.0, digest
  `sha256:036c3fb29a4eec9df67cafb65acac471a1c463fb935f08841045b7fb731517f0`.
  Host inspection confirmed standalone frontend Compose, loopback port 3000,
  host-gateway backend on 8081 and OpenResty forwarding to 127.0.0.1:3000.
  Public edge GET still returns the pre-existing SafeLine HTTP 468.

- Published `ghcr.io/star-ability/code-startrack-frontend:v0.12.0`,
  `sha-545d3669ae012d6f56ff099745c975bb72eac703` and `latest`; all three registry manifests resolve to
  `sha256:83b425ed01a9737b3f8c5c393b5bfeb91ba071f3f71fd3cb82174152ddc55491`. The registry image config ID matches the exact-image acceptance
  output. The old `v0.11.0` registry digest is unchanged. Source image commit is
  main `545d3669ae012d6f56ff099745c975bb72eac703`; subsequent docs-only integration is excluded from Docker inputs.
- Final dev/main source review found no release-blocking issue. The inherited
  mobile-only test skip, SafeLine HTTP 468 automation limit, unavailable analysis
  and existing Actions Node 20/runner migration notices remain non-blocking.
  All 33 unrelated original-worktree changes remain byte-for-byte preserved.
