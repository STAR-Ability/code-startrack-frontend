# Repository Management

> This document defines the Git and GitHub workflow for the Code-Startrack frontend repository.
>
> The repository uses a **simplified Git Flow** designed for a small team with frequent AI-assisted development:
>
> `main + dev + task branches`
>
> This document is written primarily for developers and AI coding agents such as Codex. Treat the rules below as repository-level development constraints.

---

## Current V0.1 workflow override — 2026-09-30

The user explicitly replaced the task-branch/PR workflow for current V0.1 development. This section takes precedence over branch, PR and merge requirements elsewhere in this document and in older prompts. The general workflow below remains the default outside this V0.1 exception.

- Work directly on `dev`; do not create feature/task branches or PRs for V0.1.
- Inspect the complete working tree, including tracked and untracked files, before establishing the baseline. Include legitimate scaffold, documentation, configuration and source files. Exclude `.env.local`, other private env files, secrets, dependencies, build output, caches, test artifacts and temporary/unrelated files. The neutral `.env.example` remains legitimate configuration.
- For each completed stage/Issue, run all required checks/tests, review the full diff (including new files), commit only that stage's changes with a clear Conventional Commit, and immediately push to `origin/dev` before beginning the next stage. Keep unfinished work out of completed-stage commits.
- Preserve existing user changes. Never modify or push directly to `main`, force push, run `git reset --hard` or run `git clean`. Do not bypass repository protection or disable CI if a push is rejected; report the exact blocker.
- CI runs on pushes to `dev` as well as the existing PR/manual triggers. Product decisions and API gaps retain their documented status; removing PRs does not claim that pending decisions have been accepted.

Baseline audit: `origin/dev` at `9704000f81ff8c670b0a229c641f444e1e582ff8` already contains the legitimate scaffold baseline (former PR #3) and V01-01 (former PR #5). All 87 project files are tracked; no additional untracked project files need integration. The six in-progress V01-02 documents are kept separate from this workflow/baseline update. Ignored local env, dependency, build/test output and scratch files remain local. No empty baseline commit or history rewrite is needed. The workflow update was validated with lint, formatting, type checking, all 103 unit tests, a production build without backend configuration and all 17 offline E2E tests; the full diff was reviewed before its direct push. No live backend request was needed.

---

## 1. Branch Model

The repository has two long-lived branches:

- `main` — stable production branch
- `dev` — active development integration branch

All normal development work must start from `dev`.

Task branches are created from `dev` and merged back into `dev` through Pull Requests.

```text
main
│
└── dev
    ├── feature/*
    ├── fix/*
    ├── refactor/*
    ├── docs/*
    ├── test/*
    └── chore/*
```

Release flow:

```text
dev
 ↓ Pull Request
main
 ↓
Release / Tag
 ↓
Docker Build
 ↓
GHCR
 ↓
Production
```

---

## 2. `main` Branch

`main` is the stable production branch.

Rules:

- Never push directly to `main`.
- All changes must enter `main` through a Pull Request.
- `main` must always remain deployable.
- All required CI checks must pass before merge.
- Production releases must be created from `main`.
- Production Docker images must be built from `main` or from an official release tag.
- Force pushes are prohibited.
- Branch deletion is prohibited.

Example release history:

```text
main
├── v0.1.0
├── v0.2.0
└── v1.0.0
```

---

## 3. `dev` Branch

`dev` is the integration branch for the next version.

Rules:

- All normal development branches must start from `dev`.
- Completed tasks must be merged into `dev` through Pull Requests.
- Never push directly to `dev`.
- Required CI checks must pass before merge.
- `dev` may contain completed features that are not yet released.
- When the next version is ready, open a Pull Request from `dev` to `main`.
- `dev` should remain reasonably stable and testable.

Typical workflow:

```text
Issue
 ↓
dev
 ↓
task branch
 ↓
Pull Request
 ↓
CI
 ↓
Review
 ↓
dev
 ↓
Integration Test
 ↓
Pull Request
 ↓
main
```

---

## 4. Task Branch Naming

Use the following branch prefixes:

- `feature/*` — new features
- `fix/*` — bug fixes
- `refactor/*` — code restructuring without intended behavior changes
- `docs/*` — documentation changes
- `test/*` — testing work
- `chore/*` — tooling, dependency, CI, configuration, or maintenance work

Examples:

```text
feature/dashboard
feature/user-profile
feature/problem-recommendation

fix/login-redirect
fix/mobile-sidebar

refactor/api-client

docs/api-contract

test/dashboard-e2e

chore/update-dependencies
```

Branch naming rules:

- Use lowercase English.
- Use hyphens between words.
- The name must clearly describe the task.
- One branch should normally correspond to one primary Issue or task.
- Do not mix unrelated changes into the same branch.

---

## 5. Creating a Task Branch

Before starting a new task:

```bash
git switch dev
git pull origin dev
git switch -c feature/dashboard
```

Keep the branch reasonably up to date with `dev`.

If needed:

```bash
git fetch origin
git rebase origin/dev
```

If the team is not comfortable with rebase, use merge instead. Do not introduce unnecessary Git complexity.

---

## 6. Commit Messages

Use **Conventional Commits**.

Common commit types:

```text
feat:
fix:
refactor:
docs:
test:
chore:
style:
perf:
ci:
build:
```

Examples:

```text
feat: add student dashboard
feat: add profile radar chart

fix: resolve login redirect issue
fix: handle empty recommendation response

refactor: reorganize API client

docs: update frontend architecture

test: add profile page tests

chore: update dependencies

ci: add pull request checks
```

Required distinction:

```text
Branch:
feature/dashboard

Commit:
feat: add student dashboard
```

Do not use `features:` as a Conventional Commit type.

Preferred format:

```text
<type>: <short description>
```

---

## 7. Issues

Create a GitHub Issue for any non-trivial development task.

Common Issue categories:

- Feature
- Bug
- Refactoring
- Technical Debt
- Documentation
- Testing
- Infrastructure / CI

Each Issue should include, when applicable:

- Background
- Goal
- Scope
- Acceptance criteria
- Related pages
- Related APIs
- Related documents
- Priority
- Milestone

Large features should be decomposed into smaller, independently verifiable Issues.

Do not create a single Issue that attempts to cover an entire large subsystem unless it is only used as an umbrella tracking Issue.

---

## 8. Milestones

Use GitHub Milestones to represent deliverable versions.

Example:

```text
V0.1
├── Login
├── Dashboard
├── User Profile
├── Problem Recommendation
├── API Integration
└── Basic E2E Tests
```

Rules:

- One Milestone should represent one releasable version or clearly defined delivery target.
- Each Issue should belong to the correct Milestone when applicable.
- Do not silently expand the current Milestone with unrelated scope.
- New ideas that are not required for the current version should normally be moved to a later Milestone.

---

## 9. Pull Request Targets

Normal task Pull Requests must target `dev`.

```text
feature/*  ─┐
fix/*      ─┤
refactor/* ─┤
docs/*     ─┤──> dev
test/*     ─┤
chore/*    ─┘
```

Examples:

```text
feature/dashboard → dev
fix/login-redirect → dev
```

Release Pull Requests target `main`:

```text
dev → main
```

Do not open normal feature branches directly against `main`.

---

## 10. Pull Request Requirements

Every Pull Request should include:

- Related Issue
- Summary of the change
- Implementation notes when useful
- Scope of impact
- Testing performed
- Screenshots for meaningful UI changes
- API Contract update status when the API surface changed

Recommended Pull Request template:

```md
## Summary

Briefly describe what this PR changes.

## Related Issue

Closes #123

## Changes

- ...
- ...

## Testing

- [ ] ESLint
- [ ] Prettier
- [ ] Type Check
- [ ] Unit Tests
- [ ] Production Build
- [ ] E2E Tests, when applicable

## Screenshots

Add screenshots for UI changes.
```

---

## 11. Continuous Integration

All Pull Requests must run CI.

Minimum required CI pipeline:

```text
Install Dependencies
        ↓
ESLint
        ↓
Prettier Check
        ↓
TypeScript Type Check
        ↓
Vitest
        ↓
Next.js Production Build
```

Run Playwright E2E tests for critical flows or significant UI changes.

Recommended commands:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Rules:

- A Pull Request with failing required CI checks must not be merged.
- Do not disable tests or quality checks merely to make CI pass.
- Fix the underlying problem.
- If a check is intentionally removed or changed, document why.

---

## 12. Code Review

Pull Requests must be reviewed before merge when team capacity allows.

Review should verify:

- The implementation matches the requested behavior.
- Existing behavior is not unintentionally broken.
- Project architecture is respected.
- Existing components are reused when appropriate.
- shadcn/ui conventions are followed.
- No unnecessary UI library is introduced.
- API usage follows the API Contract.
- There are no obvious security issues.
- There is no unnecessary complexity.
- Tests are appropriate for the change.
- The change stays within the task scope.

AI-generated code must follow the same review standard as human-written code.

"Generated by Codex" is not a reason to skip review.

"Build passes" is not sufficient evidence that the implementation is correct.

---

## 13. Merge Strategy

Use:

```text
Squash and Merge
```

Reason:

- Keep `dev` and `main` history readable.
- Collapse noisy development commits into one logical change.
- Make reverting a Pull Request easier.
- Avoid preserving temporary AI-generated commits.

Example:

```text
feature/dashboard

20 development commits
        ↓
Squash and Merge
        ↓
dev

feat: add student dashboard
```

---

## 14. Branch Protection

### `main`

Recommended protections:

- Require a Pull Request before merging
- Require status checks to pass
- Require conversation resolution
- Block force pushes
- Block branch deletion
- Require branch to be up to date before merging when the workflow becomes stable enough

### `dev`

Recommended protections:

- Require a Pull Request before merging
- Require CI status checks
- Block force pushes
- Block branch deletion

Do not add unnecessary approval bureaucracy during the early small-team stage.

The goal is to prevent accidental damage, not to create process overhead.

---

## 15. Code Ownership

Use:

```text
.github/CODEOWNERS
```

to define responsible reviewers for important areas.

Example:

```text
/src/app/              @frontend-maintainer
/src/components/       @frontend-maintainer
/src/lib/api/          @frontend-maintainer
/docs/                 @project-maintainer
/.github/              @project-maintainer
```

For a very small team, only define ownership for critical directories.

---

## 16. AI / Codex Development Rules

Before changing code, Codex must read the relevant repository instructions.

At minimum:

```text
AGENTS.md
CONTRIBUTING.md
docs/architecture/tech-stack.md
docs/development/repository-management.md
docs/development/coding-standards.md
```

For product-facing tasks, also read the relevant product documents:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/user-flow.md
docs/product/api-contract.md
```

Codex must not:

- Push directly to `main`.
- Push directly to `dev`.
- Bypass CI.
- Disable checks just to make a task pass.
- Introduce a new UI framework without explicit approval.
- Modify the API Contract without explicit task scope or approval.
- Perform broad unrelated refactors while implementing a focused task.
- Modify unrelated modules unless necessary.
- Add dependencies without a clear reason.
- Duplicate an existing component when reuse is reasonable.
- Hard-code mock data directly into production page components when a mock layer should be used.
- Commit secrets, credentials, tokens, `.env` files, or production data.

Codex should:

- Inspect existing code before creating new abstractions.
- Prefer the smallest change that fully satisfies the task.
- Reuse existing project components.
- Follow the established directory structure.
- Run required local checks before considering the task complete.
- Report any requirement ambiguity instead of silently inventing behavior.
- Keep changes scoped to the relevant Issue.

---

## 17. Versioning

Use **Semantic Versioning** for official releases:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
v0.1.0
v0.2.0
v0.2.1
v1.0.0
```

Meaning:

- `MAJOR` — significant incompatible change
- `MINOR` — backward-compatible feature release
- `PATCH` — backward-compatible bug fix

During the startup / MVP phase, use:

```text
v0.x.x
```

Move to:

```text
v1.0.0
```

when the product reaches the team's definition of a stable production release.

---

## 18. Release Process

Recommended release flow:

```text
All required Milestone Issues completed
        ↓
dev CI passes
        ↓
Integration testing
        ↓
Open dev → main Pull Request
        ↓
Review
        ↓
CI
        ↓
Merge
        ↓
Create Git Tag
        ↓
Create GitHub Release
        ↓
Build Docker Image
        ↓
Push Image to GHCR
        ↓
Deploy to Production
```

Example release:

```text
v0.1.0
```

Recommended Docker image tags:

```text
ghcr.io/star-ability/code-startrack-frontend:v0.1.0
ghcr.io/star-ability/code-startrack-frontend:sha-<commit>
```

Production must not depend only on:

```text
latest
```

A versioned or immutable image reference should be available for rollback.

---

## 19. Hotfixes

During the early `v0.x` stage, do not maintain a permanent `hotfix` branch.

For an urgent production issue:

```text
main
 ↓
hotfix/critical-login-error
 ↓
Pull Request
 ↓
main
```

After the fix is merged into `main`, synchronize the same fix back into `dev`.

Do not allow `main` and `dev` to diverge permanently.

A fuller:

```text
release/*
hotfix/*
```

workflow may be introduced later if the product reaches stable production operation and the additional complexity becomes justified.

---

## 20. Repository Workflow Summary

Normal development:

```text
GitHub Issue
      ↓
Assign Milestone
      ↓
Create task branch from dev
      ↓
feature/* / fix/* / ...
      ↓
Codex / Developer
      ↓
Local Checks
      ↓
Pull Request → dev
      ↓
CI
      ↓
Code Review
      ↓
Squash and Merge
      ↓
dev
```

Release:

```text
dev
 ↓
Integration Test
 ↓
Pull Request → main
 ↓
CI
 ↓
Review
 ↓
main
 ↓
Tag / Release
 ↓
Docker Build
 ↓
GHCR
 ↓
Production
```

---

## 21. Core Principles

The repository workflow is based on the following principles:

1. `main` must remain stable and deployable.
2. `dev` integrates the next release.
3. Development work must happen on isolated task branches.
4. Important changes must go through Pull Requests.
5. Failed required CI checks block merge.
6. AI-generated code and human-written code follow the same quality requirements.
7. One branch should solve one clearly defined problem whenever practical.
8. Do not add process complexity before there is a real need.
9. Documentation defines the rules; GitHub protections and CI enforce the rules.
10. Optimize for a small team, fast iteration, clear ownership, and low coordination overhead.
11. Prefer reversible changes and small Pull Requests over large risky changes.
12. Keep repository history understandable enough that a new developer or AI agent can reconstruct why a change was made.

---

## 22. Default Decision Rules for AI Agents

When repository instructions are incomplete, use these defaults:

1. Do not modify `main` or `dev` directly.
2. Do not invent new architecture unless required by the task.
3. Reuse existing patterns before introducing new ones.
4. Prefer an existing dependency over adding another dependency with overlapping purpose.
5. Prefer small, scoped Pull Requests.
6. Preserve backward compatibility unless the Issue explicitly requires a breaking change.
7. Treat API contracts, public types, and shared component interfaces as stable boundaries.
8. Do not delete code, migrations, configuration, or tests unless their removal is part of the task.
9. Do not expose secrets or production data.
10. If requirements conflict, stop and report the conflict rather than guessing.
