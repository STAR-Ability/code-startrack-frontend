<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# codeStartrack Frontend — Agent Instructions

This repository is developed primarily with Codex.

Treat this file as the repository-level operating contract for AI-assisted development.

---

## 1. Project Identity

Product name:

```text
码练星轨
```

English product name:

```text
codeStartrack
```

Use `codeStartrack` consistently in engineering documentation unless a user-facing branding decision explicitly requires another presentation form.

Do not reintroduce the old name `codeStartrail`.

---

## 2. Primary Repository Sources

Current V0.11 integration supersedes historical V0.1 API assumptions below.
Use `docs/product/api-contract.md`, `prompts/前端api文档.md` and
`prompts/前端需要知道的数据库.md` for the active contract. The app is statically
exported; browser requests use `/api/v1/**` through a same-origin proxy.
Validate mutations only against the isolated local fixture, never the live backend.

Before implementing product-facing work, use the repository sources in the following order:

1. The explicit current task / Issue.
2. `docs/product/project-plan.en.md` — approved product direction and Demo V2 scope.
3. `docs/product/apidocs.md` — currently documented backend API behavior.
4. Structured product documents under `docs/product/`.
5. `docs/architecture/tech-stack.md`.
6. Development rules under `docs/development/`.

Do not treat undocumented assumptions as confirmed requirements.

If two sources conflict, do not silently choose one. Report the conflict and identify the affected implementation.

---

## 3. Current Product Direction

The product must stay centered on one visible user mental model:

```text
Programming Practice + Agent Assistance
```

The primary loop is:

```text
Training Goal
    ↓
Recommended Problem
    ↓
Training
    ↓
Run / Submit
    ↓
Judge Result
    ↓
Progressive Agent Assistance if needed
    ↓
Training Result
    ↓
Next Recommendation
```

Do not turn ACM, 408, interviews, courses, or job preparation into separate homepage products.

They are future training policies / goals, not separate primary interfaces.

---

## 4. Demo V2 Priority

The Demo V2 goal is to validate the smallest real training loop.

Student-side priority is higher than coach-side priority.

Do not expand Demo V2 into a complete commercial platform.

Explicitly avoid implementing out-of-scope features such as:

- a real LLM Agent unless a later task explicitly adds it;
- vector database;
- RAG;
- AI problem generation;
- large-scale problem bank;
- complex learner profiling;
- a radar-chart-centered product;
- multi-language Judge;
- microservice cluster;
- community;
- leaderboard;
- payments;
- complex organization permissions;
- mobile app.

---

## 5. API Reality and Contract Discipline

`docs/product/apidocs.md` describes the currently documented backend API.

Important rules:

- Use documented endpoints exactly as documented.
- Do not invent production API endpoints in page code.
- Do not assume a backend capability exists only because it appears in the product plan.
- If Demo V2 requires a capability that is not documented in `apidocs.md`, record it as an API gap.
- Do not hide API gaps by hardcoding fake production behavior into normal page components.
- If temporary mock behavior is explicitly approved, isolate it behind a mock/data-access layer so it can be replaced cleanly.

The product plan and the current API documentation may represent different implementation stages.

Before implementing a feature that depends on the backend, compare the requirement with `apidocs.md`.

If the API contract changes, update the relevant API documentation / structured contract together with the frontend integration.

---

## 6. Approved Frontend Stack

Follow:

```text
docs/architecture/tech-stack.md
```

The intended stack includes:

- Node.js LTS
- pnpm
- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- TanStack Query
- Zod
- React Hook Form
- Apache ECharts
- Vitest
- Playwright
- ESLint
- Prettier
- TypeScript Strict

Preserve the shadcn/ui configuration already initialized in this repository.

The repository currently uses the selected shadcn Base UI foundation and Nova preset. Do not switch the base component library or visual preset without explicit approval.

---

## 7. Next.js Rules

- Use App Router.
- Keep TypeScript strict.
- Prefer Server Components by default.
- Add `"use client"` only when interactivity, browser APIs, hooks, client-side state, or client-only libraries require it.
- Keep Client Component boundaries as narrow as practical.
- Avoid unnecessary `useEffect`.
- Follow the APIs and behavior of the installed Next.js version.
- For Next.js-specific uncertainty, inspect the version-matched local Next.js documentation and/or use the configured Next.js DevTools MCP.

---

## 8. UI Rules

- Use Tailwind CSS.
- Prefer existing project components.
- Prefer shadcn/ui primitives and patterns.
- Use Lucide React for production interface icons.
- Do not introduce another general-purpose UI library without explicit approval.
- Preserve the Nova design language.
- Keep the main student experience visually simple and focused.
- Avoid turning `/training` into a large dashboard.
- Do not use emoji as production UI icons.
- Implement loading, empty, error, and success states for data-driven UI.
- Support desktop and mobile layouts.

When using shadcn/ui:

1. inspect installed components;
2. use the shadcn Skill / MCP when current component information is useful;
3. reuse or compose existing primitives;
4. create a custom primitive only when necessary.

---

## 9. Internationalization

Engineering language:

```text
English
```

Product UI:

```text
zh-CN — default
en    — supported
```

Rules:

- Repository instructions, code identifiers, engineering docs, and AI prompts should be written in English.
- User-facing UI text must be treated separately from engineering language.
- Do not use Chinese variable, function, or file names.
- Do not translate API field names based on UI locale.
- Do not hard-code reusable user-facing strings when the repository's i18n layer is available.
- New user-facing text should include translations for all required locales once i18n is enabled.
- Backend error codes remain language-independent; UI translation belongs to the frontend.

---

## 10. Data and API Access

Keep backend integration centralized under:

```text
src/lib/api/
```

Use TanStack Query for client-side server state when caching, invalidation, refetching, or request lifecycle state is useful.

Use Zod where runtime validation of external data improves correctness.

Do not scatter raw backend `fetch()` calls throughout presentation components.

Never expose backend secrets to browser code.

Only intentionally public browser configuration may use the `NEXT_PUBLIC_` prefix.

---

## 11. Forms

- Use React Hook Form for non-trivial forms.
- Use Zod for validation where appropriate.
- Keep frontend validation consistent with the backend contract.
- Handle backend validation / conflict / not-found errors explicitly.
- Prevent duplicate submissions during an active request.

---

## 12. Charts

Use Apache ECharts for product analytics / visualization when charts are actually required.

Do not add a chart merely because the library exists.

The current Demo V2 explicitly does not require a complex ability radar chart as a core experience.

---

## 13. Product-Specific UI Constraints

### Regular-user navigation

Keep the regular-user information architecture centered on:

```text
Training
History
Profile
```

### Core routes from the current plan

```text
/training
/history
/profile
/problem/[id]
```

Coach routes are conditional and secondary:

```text
/coach
/coach/students
/coach/student/[id]
```

Do not expose the coach experience as a primary regular-user navigation destination.

### `/training`

Emphasize:

- current goal;
- one recommended problem;
- recommendation reason;
- start training.

Recent training / streak / recent errors may appear with lower visual priority.

Do not display a large recommendation grid unless a later approved requirement changes this rule.

---

## 14. Testing and Quality

For normal implementation work, run the relevant checks:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

For major user-facing flows:

```bash
pnpm test:e2e
```

Use:

- Vitest for unit / logic tests;
- Playwright for important end-to-end flows.

Do not disable lint, strict TypeScript, tests, or CI merely to make a task pass.

Bug fixes should include regression coverage when practical.

---

## 15. Git and Repository Scope

Follow:

```text
docs/development/repository-management.md
```

Key rules:

- for current V0.1 development, work directly on `dev`; do not create task branches or PRs;
- inspect tracked and untracked files; commit legitimate project files while excluding secrets, local env files, dependencies, build output and temporary artifacts;
- after each completed V0.1 stage/Issue, run its required checks/tests, review the full diff, make a scoped Conventional Commit and immediately push to `origin/dev` before starting the next stage;
- preserve unfinished work separately; do not mix stages in a commit;
- never modify or push directly to `main`, force push, or use destructive reset/clean operations;
- keep work scoped to the active Issue;
- do not perform broad unrelated refactors;
- outside this explicit V0.1 exception, the normal task-branch/PR workflow in repository management still applies.

The user's 2026-09-30 direct-`dev` instruction supersedes earlier V0.1 branch/PR requirements in repository documents and prompts. It does not relax quality checks, live-backend GET-only restrictions or Issue scope.

---

## 16. AI Development Rules

Before changing code, read only the repository documents relevant to the task.

Do not load every document for trivial edits.

For product work, inspect:

```text
docs/product/project-plan.en.md
docs/product/apidocs.md
```

plus the specific structured product documents relevant to the task.

Codex must not:

- invent product behavior;
- invent production APIs;
- silently resolve contradictions between plan and API docs;
- add a major dependency without a reason;
- replace the approved UI system;
- build features outside the current task;
- hide missing backend functionality inside page components;
- commit secrets, credentials, `.env` files, private certificates, or production data.

Codex should:

- inspect existing code before adding abstractions;
- prefer the smallest complete change;
- reuse established patterns;
- report product/API gaps explicitly;
- validate work with executable checks;
- summarize unresolved risks at the end.

---

## 17. Planning

Small and local tasks may be implemented directly.

For substantial work spanning multiple routes/modules, major architecture changes, or staged migrations, create an execution plan under:

```text
.agent/plans/
```

Follow:

```text
.agent/PLANS.md
```

---

## 18. Definition of Done

A task is complete only when:

- requested behavior is implemented;
- implementation matches the approved product scope;
- backend usage matches the documented API or an explicitly approved mock strategy;
- relevant tests pass;
- lint/type checks pass;
- production build passes;
- relevant docs/contracts are updated when needed;
- no secrets or debugging artifacts remain;
- the final report lists changes, validation performed, API/product gaps, and remaining risks.

## 19. Codex CLI environment

Project setup, tool provenance and verification: `docs/development/codex-cli.md`.
MCP lives in `.codex/config.toml`; project Skills live in `.agents/skills/`.
Start Codex from the repository root after `pnpm install --frozen-lockfile`.
Use installed Next.js docs first, Context7 for other version-specific library
questions, Next DevTools for runtime diagnostics, and Playwright MCP for browser
inspection. Use the offline harness for UI exploration; browser MCP does not
inherit the E2E network guard. Do not send private code or data to docs services.
Preserve the user's global model, authentication and approval configuration.

## 20. Frontend CLI tool selection

Check availability with `command -v` and inspect the relevant version before
assuming a tool exists. Prefer existing tools and project scripts over installing
another dependency. The inventory in `docs/development/codex-cli.md` describes
this Mac, not prerequisites that every contributor must install.

| Task | Preferred tool and fallback order |
| --- | --- |
| Understand indexed code | Follow the CodeGraph rule above when `.codegraph/` exists; otherwise proceed directly with the tools below. Do not create an index implicitly. |
| Search source text | `rg` → `grep -R -n`; scope paths and exclude dependencies, generated output and private env files. |
| Locate files | Start repository inventories with `rg --files`; use `fd` for dedicated filename/path discovery when installed → `rg --files -g '<pattern>'` → scoped `find`. `fd` is currently absent. Remember that rg normally skips ignored/hidden files; inspect those explicitly when the task requires it. |
| Read/transform JSON | `jq` → a small Node script using `JSON.parse` / `JSON.stringify`. Do not parse structured JSON with grep/sed. |
| Version control | `git`; inspect status, diff and history first. Preserve the branch/push rules in section 15. No destructive fallback. |
| GitHub Issues, PRs and CI | `gh` → `pnpm gh` (repository portable wrapper) → Git for Git operations and browser/read-only API inspection where sufficient. Report unsupported actions or missing authentication rather than extracting credentials. |
| Node version | `fnm` with `.nvmrc` → an already-installed Node satisfying `package.json#engines` (or an existing version manager). Use Node 24 here; never select a new major merely because it is latest. In a shell without fnm initialization, use `fnm exec --using=24 -- node ...` or initialize fnm explicitly. |
| Dependencies and scripts | `pnpm` at `package.json#packageManager` → an already-provisioned compatible Corepack shim. If neither exists, report the bootstrap requirement; do not substitute npm/yarn, rewrite the lockfile or auto-download an arbitrary CLI. Prefer frozen-lockfile installs for verification. |
| Temporary JS/TS | `node` for JS/ESM and Node 24 native erasable TypeScript (`.mts`/`.ts`) → existing local `pnpm exec tsx` when TSX or unsupported TS syntax is needed. `tsx` is currently absent; use an appropriate existing TypeScript/Vitest workflow or justify adding it. Native Node does not typecheck or implement tsconfig path aliases/TSX. Avoid implicit `npx ...@latest` downloads. |
| Browser/UI verification | Configured Playwright MCP for interactive inspection; `pnpm test:e2e` for repeatable regression checks → the installed `@playwright/test` browser API for a focused script. Use the offline harness and browser-review Skill. HTTP checks with curl/Node are useful but do not replace browser, console, responsive or interaction checks. |

Do not default to Python for ordinary frontend file edits, JSON processing,
automation or temporary scripts. Use Node/shell and the tools above. Python is
appropriate only when the task demonstrably benefits from it, such as an existing
Python workflow or specialized data tooling; explain that choice briefly.

Do not install a large toolchain just to satisfy a preferred command. Check
existing equivalents first. For necessary updates, check official sources,
compatibility and checksums, preserve existing installations/configuration and
re-run relevant checks. Stop the affected step for administrator privileges,
account login/OAuth, API keys or potentially destructive environment changes.
