# AI Development Guide

## 1. Recommended AI Setup

Use **Codex CLI as the primary coding agent**.

See [the project CLI setup](codex-cli.md) for pinned MCP servers, project Skills,
portable tooling, source review and verified commands.

For the current project stage, do not create a custom multi-agent system just to develop the frontend. A single Codex agent with good repository context, tests, MCP tools, and CI is simpler and easier to control.

Recommended setup:

```text
Codex
├── AGENTS.md
├── repository documentation
├── shadcn/ui Skill
├── shadcn MCP
├── Next.js DevTools MCP
├── Playwright MCP + Context7
├── UI review + project browser verification Skills
├── Vitest
├── Playwright
└── GitHub Actions CI
```

## 2. What Each Mechanism Is For

### AGENTS.md

Use for repository-wide rules that should influence normal coding work:

- approved stack;
- architecture boundaries;
- quality requirements;
- testing expectations;
- security rules;
- references to relevant documentation.

Keep it concise enough to remain useful on every task.

### Skills

Use Skills for reusable workflow knowledge.

Required/recommended now:

- shadcn/ui official Skill.
- Vercel web-design-guidelines Skill for UI/accessibility source review.
- codestartrack-browser-review for the established offline E2E/MCP workflow.

Add further custom Skills only when a workflow becomes repetitive and stable enough to justify one.

Good future Skill candidates might include:

- a standardized new-page workflow;
- a release checklist;
- a project-specific API client generation workflow;
- a design-system migration workflow.

### MCP

Use MCP when the agent benefits from live tools or current runtime/registry information.

Recommended:

- shadcn MCP: registry search, component discovery, installation.
- Next.js DevTools MCP: runtime/build errors, routes, logs, app diagnostics.
- Playwright MCP: isolated browser inspection and UI verification.
- Context7: current library documentation; prefer installed Next.js docs first.

MCP is not a replacement for repository documentation.

### Custom Agents / Multi-Agent Systems

Not required for the current frontend repository.

Add specialized agents only when there is a demonstrated need for independent parallel roles or orchestration.

Examples where multi-agent may become useful later:

- independent UI implementation + reviewer;
- large migration with separate planning/testing roles;
- automated release engineering;
- cross-repository frontend/backend coordination.

Until then, prefer one Codex agent plus CI and review.

## 3. Task Workflow

For current V0.1 work, follow the direct-`dev` override in
`repository-management.md` and `AGENTS.md`:

```text
Issue
  ↓
Work on dev
  ↓
Ask Codex to inspect relevant docs/code
  ↓
Implement smallest complete solution
  ↓
Run local checks
  ↓
Review diff
  ↓
Scoped Conventional Commit and push to origin/dev
  ↓
CI
  ↓
Human review
```

## 4. Prompt Style

Do not repeat the entire repository architecture in every prompt.

Good task prompt:

```text
Implement Issue #42: student dashboard recommendation cards.

Use the existing project conventions and relevant repository docs.
Follow the API contract for recommendation data.
Use existing shadcn/ui components before creating custom primitives.

Acceptance criteria:
- show loading, empty, error, and success states;
- responsive on mobile and desktop;
- no hard-coded production data;
- add tests for the data transformation;
- run lint, typecheck, tests, and build.
```

Avoid vague prompts such as:

```text
Make the dashboard modern and complete.
```

## 5. When to Ask Codex to Plan First

Use a plan before implementation when the task:

- changes multiple architectural boundaries;
- introduces a major new subsystem;
- touches many routes/features;
- requires a migration;
- is expected to take several stages;
- has significant rollback risk.

Use `.agent/PLANS.md` as the plan format.

For small changes, skip the plan and implement directly.

## 6. Verification Rules

Codex should verify its own work with executable checks whenever possible.

Minimum:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

For significant user flows:

```bash
pnpm test:e2e
```

Runtime debugging should use Next.js DevTools MCP when it provides useful diagnostics.

UI component discovery should use shadcn Skill/MCP rather than relying on stale memory.

## 7. Human Responsibilities

Codex may write most implementation code, but humans still own:

- product decisions;
- acceptance criteria;
- API contract approval;
- security-sensitive decisions;
- dependency approval for important additions;
- production deployment approval;
- final PR review for high-impact changes.

## 8. Do Not Over-Scaffold the Agent

Avoid:

- giant always-loaded prompts;
- forcing Codex to read every document for every edit;
- creating many overlapping Skills;
- adding MCP servers with no clear use;
- creating several agents before the workflow requires them.

Good context is relevant context, not maximum context.
