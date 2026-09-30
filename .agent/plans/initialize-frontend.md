# Frontend Bootstrap

## Goal

Make the existing codeStartrack scaffold reproducibly buildable and testable with the approved toolchain, without implementing product features.

## Context

The repository already has Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn Base UI / Nova, Lucide, and every requested runtime and test dependency. Most files are uncommitted. The existing CI file is empty. Follow `prompts/initialize-frontend.md` and the repository development instructions.

## Scope

### In Scope

- Scripts, formatting, unit and browser tests, and pull request CI.
- A minimal branded root placeholder and corrected font token wiring.
- Setup documentation and runtime/package manager pinning.

### Out of Scope

- Product routes, API clients, authentication, charts, forms, and Agent behavior.
- Deployment, publishing, commits, and remote branch changes.

## Acceptance Criteria

- [x] Preserve strict TypeScript and the existing UI foundation.
- [x] Provide all requested package scripts and smoke tests.
- [x] Pass lint, formatting, type checking, unit tests, production build, and E2E tests.
- [x] Document setup, source boundaries, and remaining manual configuration.
- [x] Review task changes against the initial working tree for scope and secrets.

## Implementation Stages

### Stage 1 - Tooling

Files/areas: package scripts, Prettier, ESLint, Vitest, Playwright, runtime version, CI.

Expected result: a reproducible toolchain with separate unit and browser suites.

Validation: installation, lint, formatting, type checking, and unit tests.

### Stage 2 - Minimal application and documentation

Files/areas: root page, layout, global font token, README, smoke tests.

Expected result: a small server-rendered placeholder and clear setup instructions.

Validation: production build and desktop/mobile Chromium smoke tests.

### Stage 3 - Review

Files/areas: changed files and this plan.

Expected result: all checks pass and limitations are recorded.

Validation: compare with the saved initial working tree; inspect dependency, configuration, and secret exposure changes.

## Testing

- Unit: render the root placeholder with Testing Library and Vitest; verify the shared class utility.
- Integration: no backend integration in this task.
- E2E: load the production root page in desktop and mobile Chromium, check metadata, language, and runtime errors.
- Build/type/lint: all commands requested by the bootstrap prompt.

## Risks

- Existing files are largely untracked; Git diff alone cannot identify task changes. A baseline is saved outside the repository for review.
- Google font downloads and Playwright browser installation may require network access.
- The referenced `docs/product/apidocs.md` is absent. Backend integration must wait for a documented contract.

## Rollback / Reversibility

Restore modified files from the pre-task baseline and remove only files added by this task. Do not reset or discard the user's existing uncommitted scaffold.

## Progress

- [x] Stage 1
- [x] Stage 2
- [x] Stage 3

## Decisions / Deviations

- Neither local nor remote `dev` existed. Created a local `dev` baseline from the initial commit, then `chore/initialize-frontend`; no remote changes.
- Keep the existing useful source directories; introduce feature/API/chart directories only when they have real consumers.
- No global provider is needed for the static bootstrap. Add QueryClientProvider at the first client-query boundary; Zod, React Hook Form, and ECharts need no global provider.
- Formatting covers source, tests, configuration, workflow files, README, and execution plans. Imported product/development prose and installed agent skills are outside bootstrap formatting scope.
- The shadcn CLI registry request failed even with network permission. Local `components.json`, the installed button, package versions, CSS, type checking, and production compilation verified the existing Base UI / Nova foundation; the preset was not changed.
- The sandbox first blocked font downloads and Turbopack's local compiler port. The failed build cache retained the error on retries. Moved generated `.next` output to a temporary backup and completed a clean, approved production build without changing the default bundler.
- The local shell's proxy prevented Playwright from detecting the server. Both E2E projects passed with command-scoped `NO_PROXY` / `no_proxy` exclusions for loopback addresses; documented this environment requirement in README.

## Validation Results

- `pnpm install --frozen-lockfile`: passed; no dependency or lockfile changes.
- `pnpm lint`: passed without warnings.
- `pnpm format:check`: passed.
- `pnpm typecheck`: passed, including Next.js route type generation.
- `pnpm test`: 2 tests passed in 2 files.
- `pnpm build`: passed with default Turbopack; root and not-found routes prerendered.
- `pnpm test:e2e`: 2 tests passed (desktop and mobile Chromium), with loopback proxy exclusions and permission to launch the local server/browser.
- Review: compared edits with the pre-task working-tree snapshot, confirmed unchanged dependency sets/lockfile/shadcn config, and checked changed source/configuration for credential patterns. No matches found.
- GitHub-hosted CI has not run; maintainers must publish the initial branches and enable required branch protection checks. No commits, pushes, deployments, or repository-setting changes were made.
