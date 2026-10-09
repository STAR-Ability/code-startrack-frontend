# Frontend Audit, Redesign and Release

## Goal

Audit and improve the complete existing codeStartrack frontend, verify its supported workflows and visual quality, and release only a verified main commit through protected PR/CI to the inspected server2 frontend deployment.

## Context

The starting worktree is clean on dev at 41ccd2b. Current architecture uses Next.js 16.3.6 static App Router export, React, Base UI / shadcn Nova, bilingual tokens, TanStack Query, Zod and ECharts SVG. Current contracts include retained CF/collaboration and additive V0.2 platform learning. Existing historical release receipts do not prove present deployment or API availability.

## Scope

### In Scope

- Full source, contract, route, Git-history and feature audit; actionable frontend fixes.
- Significant shared visual, route-composition and chart improvements with research references.
- Desktop, laptop, tablet and mobile rendered review, keyboard, locale and reduced-motion checks, with iterative refinement.
- Lint, formatting, types, unit, Storybook, E2E, build and container verification.
- Real backend authentication, permission and supported workflow verification through the requested SSH tunnel, using authorized existing test credentials.
- Commit and push dev, required PR/CI/review merge, verified main Docker build and safe server2 frontend-only update with rollback.

### Out of Scope

- Backend code/database changes, invented APIs and judge-service development, deployment or independent testing.
- Branch protection bypass, force pushes, destructive cleanup, unrelated service/configuration changes and private data disclosure.

## Acceptance Criteria

- [x] Every existing route/component family is audited and actionable frontend defects addressed.
- [x] Fixed decorative background, coherent sophisticated surfaces and meaningful metric hierarchy are rendered and inspected.
- [x] Chart research covers ECharts, shadcn, Tremor, Recharts, Nivo and Visx; plots communicate distinct categories and preserve actual data.
- [x] Desktop/tablet/mobile screenshots in both locales, reduced motion and keyboard review prove quality after iterative refinement.
- [x] All required local automated gates pass without hidden/skipped failures.
- [ ] Supported real backend workflows, authentication and roles are verified; unsupported contracts and unavailable credentials are explicitly recorded.
- [x] Completed implementation is independently reviewed, committed and pushed to dev.
- [ ] Release acceptance combines fresh exact-head required CI receipts in PR #42 with the unresolved real-backend gates.
- [ ] Verified dev is merged into main through branch protection.
- [ ] Production image is built from exact verified main commit and passes container acceptance.
- [ ] Existing server2 frontend is safely updated with an immutable rollback reference and browser/API verification.
- [x] Audit, verification evidence, release status and unresolved blockers are delivered accurately.

## Implementation Stages

### Stage 1 - Establish current evidence

Files/areas: AGENTS.md, README, current integration/design/deployment docs, Git, live OpenAPI and read-only server2 inventory.
Expected result: route/contract/gate inventory and real environment constraints.
Validation: CodeGraph plus current source, SSH read-only inspection, protected branch/PR state.

### Stage 2 - Audit and implement

Files/areas: API/query feature logic, shared tokens/surfaces/layouts, all route families, ECharts infrastructure and relevant tests.
Expected result: concrete defects fixed and coherent substantive visual redesign.
Validation: targeted unit tests, existing rendered baseline, reference research and independent cross-agent review.

### Stage 3 - Iterate and verify

Files/areas: production static export, Storybook and browser suites, ignored screenshot/trace artifacts.
Expected result: complete checks plus desktop/tablet/mobile bilingual review and refinement.
Validation: repository scripts, browser screenshots, console/network/hydration inspection, keyboard and reduced motion.

### Stage 4 - Protected release

Files/areas: dev commits, PR, CI, main image and inspected frontend deployment only.
Expected result: verified release with immutable rollback and recorded receipt, or explicit external blocker.
Validation: exact commit checks, review status, container gate, production browser and API acceptance.

## Testing

- Unit: complete Vitest suite and meaningful regression tests for discovered bugs.
- Integration: current DTOs versus real OpenAPI and authorized session-based APIs; no direct database access.
- E2E: complete synthetic suite and route/viewport/locale visual review.
- Storybook: static build and complete browser suite.
- Build/type/lint: pnpm lint, format:check, typecheck, test, build.
- Container: pnpm test:container against exact release image when Docker is available.

## Risks

- Real backend may not implement additive V0.2 contracts; do not fabricate success or weaken frontend validation.
- Authenticated integration requires designated existing credentials; anonymous 401s do not establish private workflow behavior.
- Historical deployment docs may disagree with server2; inspect authoritative state before any deployment.
- Required independent reviewer, branch protection, CI or registry access may block release.
- Shared development fixture and build outputs require serialized fixture resets and stopping dev before production build.

## Rollback / Reversibility

Keep scope-specific commits and preserve unrelated modifications. Before deployment retain exact current image digest, Compose files and restricted backup. Replace only the existing frontend service after the verified image is available; rollback only that frontend to its prior immutable image. Never remove volumes or unrelated containers.

## Progress

- [x] Stage 1 - current evidence
- [x] Stage 2 - implementation
- [x] Stage 3 - iterative local verification
- [ ] Stage 4 - protected release

## Decisions / Deviations

- Existing synthetic dev harness on 127.0.0.1:3000 is used for baseline review before edits.
- Six specialized agents own feature audit, shared visuals, route design, chart redesign, backend verification and release inspection. Root coordinates independent review and final gates.
- Initial live OpenAPI omits V0.2 platform-learning endpoint families; final real integration and release remain unproven.
- Initial server2 inventory differs from historical startrack-prod frontend topology; no deployment change is authorized by an assumed path.

- Core frontend fixes are implemented with scoped regression evidence; an independent reviewer found no blocking defect in session/source/task ownership and keyboard behavior.
- Candidate package version is 0.14.0 because the immutable 0.13.3 tag is already published; product V0.2 contract naming is unchanged.
- Docker is available through existing colima-startrack-v02 (29.5.2); use task-scoped DOCKER_CONTEXT without altering the global default context.
- Initial 37-route development sweep covered five widths with no document overflow; cold/HMR warnings require settled production-export revalidation.
- Development was stopped before Next production build. Final stable-layout `pnpm check` passes lint, formatting, TypeScript, 507 unit tests across 57 files and production export. The rebuilt complete Storybook suite passes all 486 tests; the complete E2E replay passes all 334 tests with no skips. No merge or deployment has occurred.
- Final rendered evidence includes 222 route observations, 24 member views, 72 shared visual checks, 54 affected-route recaptures with 174 SVGs and four final chart interaction cases.
- Independent final review found a crafted raw-path protocol-relative redirect in the local Node server. Its Location now collapses leading slashes; the raw HTTP regression reproduced the failure before the fix and all 25 static-server tests pass afterward. This script/test change is excluded from Docker production inputs and does not affect rendered app assets.
- A complete E2E run exposed four selector collisions; a later replay confirmed about 96px layout movement as chart legends appeared. Legends now mount in the first loading frame and remain disabled until ready. A deferred-loader regression and eight real delayed-chunk browser cases prove node continuity, zero measured displacement and successful mode switches before engine readiness. Original failures and interrupted replays remain retained.
- The rebuilt keyboard Storybook play waits for its actual legend button to become enabled before preserving the original Enter/Space assertions; both viewport checks pass. E2E score assertions now distinguish semantic definitions from identical radar labels.
- The new local Docker candidate passes all unchanged exact-image assertions. Its 223 production inputs match `765b55e` with manifest `c8f4c6a0aae89aded02cd04d91d66730961dd7a6c1eadaf3a7f8268be27b37af`; image digest is `sha256:70f4840c2264fbd945b575d793938fcf2ee73407e8aa780f79d8c2647870e228`. Qualified fixture-volume transport and earlier failed bind-mount evidence are recorded. This is not a merged-main publication.
- A real browser request through the local backend tunnel preserves its Origin and is rejected with `ORIGIN_REJECTED` by the deployed backend. Successful Node CAPTCHA calls without a browser Origin are transport evidence only. Matching-origin browser authentication remains a release dependency; no Origin or backend security rule was weakened.

- Final local verification is complete: 507 unit tests, 486 Storybook tests, 334 E2E tests, lint/format/types, production export, responsive/browser review and qualified exact-image acceptance pass. Original failures and interrupted replays remain retained.
- Source and test commits through `c5c339d` are pushed to dev. PR #42 is draft because designated real sessions, matching browser Origin, V0.2 backend support and server2 topology remain unresolved. Fresh final-head CI is tracked in that PR; no main merge, image publication or production deployment occurred.
- The first final-head CI on `bf528dd` passed Storybook but failed two desktop disclosure-date assertions (332 passed in each run). The native date and the SVG axis shared text during collapse. The single assertion now targets the existing definition-list time, preserving keyboard actions, values and budgets; all 6 affected-file checks pass. Application inputs and Docker acceptance are unchanged. Original CI logs/traces are retained; the corrected head needs fresh complete CI.
- Two independent fully drawn-chart browser cases pass: an actual SVG tick and native date share text while the list is open; Enter unmounts both that native date and the first raw fixture date while retaining the visible tick and supplied values. Both locales pass at 1440px, with no API failure, browser error or business write. Task-owned preview/browser resources are closed.
- Both corrected `b88aaee` CI runs succeeded with 507 unit tests across 57 files and 334 E2E tests. Push Storybook passed 486 tests; PR Storybook recorded 485 passed plus one mobile dialog geometry flake that passed its retry. The original log measured 768.0000305175781px against a 768px limit; its runner artifact was not uploaded by the successful workflow.
- The existing dialog assertion now allows 0.001 CSS pixels of Chromium rounding while retaining the 32px viewport allowance, all six Tab checks, Escape and focus return. Five repetitions per viewport pass (10 tests, no retries/skips). Production inputs are unchanged; original logs are preserved and fresh final-head full-suite receipts remain in PR #42. The plan's release stage remains open because real sessions, browser Origin, backend capability and server2 topology are unresolved.
