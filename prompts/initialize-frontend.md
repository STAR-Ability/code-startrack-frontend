

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->

# Codex Bootstrap Prompt

Use this prompt from the root of a newly created Code Startrack frontend repository after `AGENTS.md`, repository docs, Codex MCP configuration, and the shadcn Skill are available.

---

Initialize this repository as the Code Startrack frontend according to the repository documentation.

First inspect the current repository state and the relevant instructions. Use:

- `AGENTS.md`
- `docs/architecture/tech-stack.md`
- `docs/development/coding-standards.md`
- `docs/development/repository-management.md`
- `docs/development/ai-development-guide.md`
- `docs/product/*` only where those documents contain actual requirements

Do not invent missing product behavior. The goal of this task is engineering bootstrap, not feature implementation.

Requirements:

1. Verify the project is a current Next.js App Router + React + TypeScript project using pnpm.
2. Keep TypeScript strict.
3. Verify Tailwind CSS and shadcn/ui are correctly initialized.
4. Verify Lucide React is the icon library.
5. Install/configure the approved data/form/chart dependencies if missing:
   - TanStack Query
   - Zod
   - React Hook Form
   - Apache ECharts
6. Configure:
   - ESLint
   - Prettier
   - Vitest
   - Playwright
7. Add/verify package scripts for:
   - dev
   - build
   - start
   - lint
   - format
   - format:check
   - typecheck
   - test
   - test:watch
   - test:e2e
8. Create a minimal maintainable source structure consistent with `coding-standards.md`.
9. Add only the minimum provider setup actually needed for the approved libraries.
10. Do not build product pages that are not yet specified.
11. Add a minimal smoke unit test and a minimal Playwright smoke test so the test infrastructure is verifiably working.
12. Run:

- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

13. Fix failures caused by the bootstrap changes.
14. Review the final diff for:

- unnecessary dependencies;
- duplicate configuration;
- accidental secrets;
- unrelated changes.

15. At the end, report:

- files changed;
- dependencies added;
- validation commands and results;
- anything still requiring human configuration.

Use the shadcn Skill/MCP when you need current shadcn information.

Use Next.js DevTools MCP when runtime diagnostics are useful.

Do not change the approved stack without explicit approval.
