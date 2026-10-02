# New Repository Bootstrap Checklist

Use this checklist when creating the frontend repository from zero.

## Phase 1 - Repository

- [ ] Create the GitHub repository.
- [ ] Keep `main` as the stable branch.
- [ ] Create `dev`.
- [ ] Add branch protection after the initial bootstrap.
- [ ] Add the repository documentation before large feature development begins.

Recommended initial Git flow:

```text
main
└── dev
    └── feature/*
```

## Phase 2 - Create the Next.js Application

From an empty repository directory:

```bash
pnpm create next-app@latest . \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-pnpm \
  --import-alias "@/*"
```

Use the current supported Next.js release rather than copying an old version from a tutorial.

After generation:

```bash
pnpm dev
```

Verify the app starts successfully.

Current Next.js scaffolding may generate an `AGENTS.md` section for version-matched framework documentation. Preserve the Next.js-managed block between its `BEGIN` / `END` markers. Merge the Code Startrack project rules outside that managed block instead of blindly overwriting it.

## Phase 3 - Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

Use the project defaults unless the design system requires a different preset.

For new shadcn projects, prefer the currently recommended base library unless the project has a specific compatibility requirement.

Install initial primitives only when they are needed.

Example:

```bash
pnpm dlx shadcn@latest add button card input label dialog dropdown-menu tabs table badge avatar tooltip separator skeleton sidebar
```

Do not install the entire registry by default.

## Phase 4 - Install Approved Dependencies

Application dependencies:

```bash
pnpm add \
  @tanstack/react-query \
  zod \
  react-hook-form \
  @hookform/resolvers \
  echarts \
  lucide-react
```

Development/testing dependencies:

```bash
pnpm add -D \
  prettier \
  vitest \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test
```

Install Playwright browser:

```bash
pnpm exec playwright install chromium
```

Codex should configure Vitest and Playwright based on the actual generated Next.js project rather than copying stale configuration blindly.

## Phase 5 - Install AI Skill

Install the official shadcn/ui Skill from the repository root:

```bash
pnpm dlx skills add shadcn/ui
```

Restart/reload the Codex session if required by the local agent environment.

## Phase 6 - Configure Codex MCP

Create:

```text
.codex/config.toml
```

Use the configuration provided in this bootstrap package.

Because project-level Codex configuration is loaded only for trusted projects, mark the repository as trusted in Codex when prompted.

Restart Codex after changing MCP configuration.

Verify configured MCP servers:

```bash
codex mcp list
```

## Phase 7 - Add Repository Documents

Required before serious feature development:

```text
AGENTS.md
docs/architecture/tech-stack.md
docs/development/repository-management.md
docs/development/coding-standards.md
docs/development/ai-development-guide.md
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

Product documents may begin as templates, but the important sections must be completed before Codex is expected to implement the corresponding product behavior.

## Phase 8 - Package Scripts

Ensure `package.json` exposes consistent scripts.

Recommended intent:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Codex should merge these into the generated `package.json`; do not overwrite package metadata blindly.

## Phase 9 - CI

Add:

```text
.github/workflows/ci.yml
```

The required PR gates should include:

```text
install
lint
format check
typecheck
unit tests
production build
```

Enable Playwright E2E as a required gate when the first stable E2E suite exists.

## Phase 10 - Docker / GHCR

Do not block initial UI development on production deployment.

Before the first deploy:

- [ ] add a multi-stage Dockerfile;
- [ ] add `.dockerignore`;
- [ ] add GitHub Actions image build/push workflow;
- [ ] publish to private/public GHCR according to repository policy;
- [ ] tag images with release version and commit SHA;
- [ ] do not rely only on `latest`.

## Phase 11 - First Codex Task

After the repository configuration is in place, start Codex from the repository root and use:

```text
prompts/initialize-frontend.md
```

Review the generated changes before committing them.

## Phase 12 - Initial Commit and Branches

After the base project is verified:

```bash
git add .
git commit -m "chore: initialize frontend project"
git push origin main
```

Create the development branch:

```bash
git switch -c dev
git push -u origin dev
```

Then enable the branch protection rules defined in the repository management document.
