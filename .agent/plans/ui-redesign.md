# codeStartrack UI Redesign

## Goal

Deliver the user-approved landing page, separate profile and practice workspaces,
and restrained interactions described in `prompts/codestartrack-ui-redesign.md`.

## Context

Baseline: `dev` at `1a398f3`, executable V01-01–08 complete. Only the user's
redesign prompt was untracked. No CodeGraph index exists. The new prompt explicitly
supersedes the old two-page layout; it does not reopen API or deployment scope.

## Scope

### In Scope

- Brand landing, labeled illustrative previews, product story and interactive journey.
- `/profile` and `/practice`, shared sidebar/mobile navigation and locale controls.
- Truthful unavailable login dialog, loading/error/empty states, responsive motion.
- Route compatibility, tests, documentation and visual review.

### Out of Scope

- Backend/API changes, authentication, account mutations, new real data fields.
- Theme/preset/font replacement, infrastructure changes, live backend writes.

## Acceptance Criteria

- [x] Landing contains the requested preview, flow, bento, journey, stack and CTA.
- [x] Profile and recommendation have separate focused routes.
- [x] Existing color tokens, Base UI/Nova and bilingual support are preserved.
- [x] Illustrations and future capabilities are clearly separated from real data.
- [x] Keyboard, reduced motion, mobile, long content and text zoom are usable.
- [x] Required checks pass, full diff reviewed, scoped commit pushed to origin/dev.

## Implementation Stages

### Stage 1 — UI redesign (one cohesive delivery)

Files: app routes, shared layout/training/landing components, i18n, UI primitives,
tests and relevant product/planning documentation.

Expected result: complete navigable redesign with unchanged GET gateway contracts.
Validation: lint, format, types, unit tests, backend-free build, guarded desktop/mobile
E2E and screenshot review. Update container acceptance selectors for the new journey.

## Testing

- Unit: preserve API/locale/error/retry/retention coverage and adapt route composition.
- Integration/E2E: isolated synthetic upstream only; assert exact E1/E2 sequencing,
  no homepage API calls, shared cache, login dismissal and responsive interactions.
- Build/type/lint: all repository checks; empty build-time backend configuration.

## Risks

Route split changes test assumptions. Preserve the original state/error assertions
on the appropriate route. Long localized content must not clip at 320px/200% text.

## Rollback / Reversibility

Revert this scoped UI commit. No schema, backend, configuration or deployment changes.

## Progress

- [x] Inspect baseline, task prompt, current code/tests and relevant guides.
- [x] Apply shadcn Skill/MCP; fetch official Base component documentation.
- [x] Implement redesign.
- [x] Validate and visually review.
- [x] Review full diff, commit and push.

## Decisions / Deviations

- 2026-09-30: New prompt overrides historical `/dashboard` layout. Keep its URL as
  a redirect to `/practice`; use a shared workspace QueryClient to retain loaded data.
- Profile reads E1 only. Practice retains E1 → E2 and operation-scoped retries.
- Public demo pages remain accessible. Login is optional and explicitly unavailable;
  no credential collection, fake success or artificial protected-page gate.
- Landing fixtures are isolated from API/data access and visibly labeled illustrative.
- Keep the current direct-dev workflow and record all changes here. No live backend
  calls are necessary for this task. Existing V01-09–14 gates remain unchanged.

### Validation log

- Initial type/build attempt caught a syntax error while moving retention tests;
  corrected the test harness and preserved previous-data/error assertions.
- shadcn's generated mobile hook failed `react-hooks/set-state-in-effect`; replaced
  effect initialization with `useSyncExternalStore`, without disabling lint.
- Lint, types, format, 122 unit tests and backend-free production build passed.
- First browser pass validated shared cache, dialog dismissal/focus return,
  preview popovers, reduced motion and legacy redirect. Text-zoom checks found
  branding, sample-number and CTA overflow; corrected layout/wrapping rather than
  clipping content or relaxing assertions. Subsequent full suite passed.
- Browser MCP offered a separate CLI installation; reused the installed Playwright
  browser and isolated fixture harness, avoiding a redundant global dependency.

- The full first E2E run passed 74/80. Remaining failures were zoomed CTA
  overflow and accessible heading whitespace after splitting the hero into lines.
  Follow-up isolated the CTA root cause: Button emitted both `whitespace-nowrap`
  and `whitespace-normal`. Made wrapping variants mutually exclusive and kept
  shrinkable text spans. Expanded zoom checks to buttons, metric terms/values
  and Card titles. Heading checks now allow the actual accessible line separation.

- Expanded checks also caught the language toggle row at 200% text; allowed the
  group to wrap without changing labels, keyboard behavior or locale persistence.
- Final local checks: lint, format, strict types, 122 unit tests, backend-free
  production build and all 80 desktop/mobile E2E tests passed. All three routes
  passed both locales at 320px and 100%/200% text, including long backend tags/reasons.
- Reviewed desktop/mobile screenshots for landing, profile and practice. Verified
  exact palette equality against HEAD and no changes to API modules, dependency
  manifests, components.json, next.config, Dockerfile or Compose architecture.
- Docker acceptance passed for both synthetic runtime backends, trusted HTTPS,
  identical static assets, non-root/health/error checks and exact E1/E2 reads.
  A final image rerun includes the last wrapping fixes; result recorded below.
- The original user prompt is included. Its two Markdown hard breaks use explicit
  backslashes instead of trailing spaces; wording and requirements are unchanged.

### Final delivery

- Final Docker acceptance passed with image
  `sha256:158f19caff0d4f8812463707799a42b7a433fe0e4fcd9b36e1c0427ea35954da`.
  Test Compose resources were cleaned up; unrelated containers were untouched.
- Additional browser inspection confirmed both login locales fit at 320px/200%
  text with no clipped controls. The temporary frontend server was stopped.
- Reviewed the complete staged diff, new registry sources, moved tests, locale copy
  and source/deployment invariants. No secrets, environment files or test artifacts
  are included. No live backend request was made during this redesign.
- Delivered as one scoped Conventional Commit on `dev`, pushed to `origin/dev`;
  Git history records its immutable identifier. `main` remains untouched.
- Executable UI scope is complete. Real login, account operations, additional
  connectors, daily history and a real multi-problem queue remain unavailable.
  V01-09 stays `OPERATOR_PREREQUISITE`; V01-10/11/14 stay
  `DEFERRED_BY_READ_ONLY_POLICY`; V01-12/13 stay `BLOCKED_BY_API`.
