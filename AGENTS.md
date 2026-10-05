
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# codeStartrack Frontend — Agent Instructions

This repository is developed with substantial AI-assisted engineering.

Treat this file as the repository-level operating contract for Codex and other coding agents.

This file defines **long-lived engineering rules only**.

It must not be used to record:

- current release scope;
- milestone progress;
- temporary implementation status;
- sprint priorities;
- temporary route requirements;
- current server/container state;
- one-off deployment instructions;
- historical product decisions;
- temporary Git workflow exceptions.

Those belong in Issues, product documentation, development documentation, or execution plans.

---

# 1. Project Identity

Product name:

```text
码练星轨
```

Engineering / English name:

```text
codeStartrack
```

Use `codeStartrack` consistently in engineering documentation and code-related naming unless a user-facing branding requirement explicitly specifies another presentation.

Do not reintroduce deprecated historical project names unless required when discussing migration history.

---

# 2. Instruction Precedence

When instructions conflict, use the following priority:

1. Explicit instructions from the current task.
2. This `AGENTS.md`.
3. Approved product and API documentation.
4. Architecture documentation.
5. Development documentation.
6. Existing implementation patterns.
7. Agent assumptions.

Never silently resolve a meaningful conflict.

If two authoritative sources disagree:

- identify the conflict;
- determine which implementation areas are affected;
- avoid inventing a resolution;
- follow an explicitly newer or higher-priority instruction when one exists;
- otherwise report the conflict before relying on either assumption.

---

# 3. Sources of Truth

Before implementing a task, inspect only the repository sources relevant to that task.

Typical sources include:

```text
docs/product/
docs/architecture/
docs/development/
.agent/
.github/
```

For API work, use the repository's current API contract or explicitly designated backend documentation as the source of truth.

For visual work, use the current design-system documentation, existing design tokens, shared components, and actual rendered UI as the source of truth.

For architecture work, inspect the relevant architecture documentation and existing code before introducing a new pattern.

Do not treat old plans, abandoned prompts, archived files, or historical implementation notes as active requirements unless the current task explicitly references them.

---

# 4. Do Not Infer Project Progress

Do not infer the current development stage from:

- filenames;
- old commits;
- archived prompts;
- old version numbers;
- historical plans;
- unused routes;
- commented-out code.

Do not assume that a feature is required merely because code or documentation for it exists.

Do not assume that an existing implementation is correct merely because it is already committed.

Always evaluate the repository as it exists at the start of the task.

---

# 5. Development Workflow

For non-trivial work, follow this sequence:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Implement
    ↓
Verify
    ↓
Review
    ↓
Report
```

Before editing:

1. read the relevant instructions;
2. inspect existing implementation;
3. inspect related shared components and utilities;
4. inspect tests where relevant;
5. identify constraints and affected modules;
6. determine whether a written execution plan is required.

Do not immediately rewrite code before understanding the existing implementation.

---

# 6. Planning

Small, local and low-risk changes may be implemented directly.

For substantial work involving any of the following:

- multiple routes;
- multiple feature modules;
- architectural changes;
- design-system changes;
- migrations;
- large refactors;
- major API integration;
- substantial UI redesign;
- deployment-sensitive changes;

create or update an execution plan under:

```text
.agent/plans/
```

Follow the planning conventions defined by:

```text
.agent/PLANS.md
```

A plan should describe:

- objective;
- constraints;
- affected areas;
- implementation stages;
- verification strategy;
- risks;
- unresolved questions.

Plans should describe the work, not pretend that unfinished work is already complete.

---

# 7. Approved Frontend Stack

Use the project's existing frontend stack unless the current task explicitly approves a change.

Expected technologies include:

```text
Node.js
pnpm
Next.js
React
TypeScript
App Router
Tailwind CSS
shadcn/ui
Lucide React
TanStack Query
Zod
React Hook Form
Apache ECharts
Vitest
Playwright
ESLint
Prettier
```

Use the versions declared by the repository.

Do not upgrade major framework or library versions as a side effect of unrelated work.

Do not replace an established library merely because another library is more familiar.

---

# 8. Package Management

Use:

```text
pnpm
```

Respect:

```text
package.json
pnpm-lock.yaml
packageManager
engines
.nvmrc
```

where present.

Rules:

- keep `pnpm-lock.yaml` committed;
- do not replace pnpm with npm or Yarn;
- do not regenerate the lockfile unnecessarily;
- prefer `pnpm exec` for project-local binaries;
- avoid implicit `npx ...@latest` usage;
- do not add dependencies when existing platform or project capabilities are sufficient.

Before adding a dependency, ask:

1. Can the requirement be implemented with the existing stack?
2. Is there already a project dependency that solves it?
3. Is the package actively maintained and compatible?
4. Does the added bundle/runtime complexity justify its use?

Major dependencies require a clear reason.

---

# 9. Next.js Rules

Use App Router.

Follow the APIs supported by the installed Next.js version.

Prefer Server Components where appropriate.

Use `"use client"` only when required by:

- hooks;
- client state;
- event handlers;
- browser APIs;
- client-only libraries;
- interactive components.

Keep Client Component boundaries as narrow as practical.

Avoid unnecessary `useEffect`.

Do not move logic to the client simply because implementation is easier there.

Do not rely on remembered Next.js behavior when the installed version may differ.

For version-specific uncertainty:

1. inspect the installed Next.js documentation;
2. inspect existing project patterns;
3. use configured development tooling where useful.

---

# 10. React Rules

Prefer:

- composition;
- explicit data flow;
- small focused components;
- reusable primitives;
- predictable state ownership.

Avoid:

- giant page components;
- unnecessary context providers;
- duplicated state;
- unnecessary effects;
- unnecessary memoization;
- abstractions created before a real reuse case exists.

Keep business logic separate from purely presentational concerns where practical.

Do not introduce clever abstractions that make normal feature work harder to understand.

---

# 11. TypeScript Rules

TypeScript strictness must remain enabled.

Do not weaken compiler settings merely to make a task pass.

Avoid:

```ts
any
```

unless genuinely unavoidable and documented.

Prefer:

- precise interfaces and types;
- discriminated unions where useful;
- type-safe API boundaries;
- inferred types where they remain readable;
- explicit types at important public boundaries.

Do not duplicate backend models blindly throughout the UI.

Separate:

- transport/API types;
- validated data;
- view models;

when doing so materially improves correctness.

---

# 12. Project Structure

Respect the existing directory architecture.

Before creating a new directory, inspect whether an equivalent location or pattern already exists.

Prefer feature placement that makes ownership obvious.

Do not create multiple competing locations for:

- API clients;
- schemas;
- constants;
- hooks;
- shared components;
- utilities;
- types.

Shared abstractions must have a genuine cross-feature use case.

Keep feature-specific code close to the feature when practical.

---

# 13. Component Rules

Before creating a new component:

1. inspect existing project components;
2. inspect installed shadcn/ui components;
3. determine whether composition can solve the requirement;
4. only create a new primitive when necessary.

Prefer:

```text
existing project component
        ↓
shadcn/ui primitive
        ↓
composition
        ↓
custom primitive
```

Do not introduce another general-purpose component library without explicit approval.

Use Lucide React for normal production interface icons unless a specific visual requirement calls for something else.

Do not use emoji as production UI icons.

---

# 14. Design System

The design system is a system, not a collection of independent page styles.

Use shared:

- design tokens;
- spacing;
- typography;
- radii;
- borders;
- shadows;
- colors;
- interaction states;
- motion principles.

Do not hard-code arbitrary visual values repeatedly across pages when a token or shared utility should exist.

When improving visual design, preserve hierarchy and usability before decoration.

Visual novelty must not reduce:

- readability;
- accessibility;
- navigation clarity;
- performance;
- responsiveness;
- consistency.

A new page may have a distinctive composition while still belonging to the same product.

---

# 15. UI Quality

Production UI should account for:

- default;
- hover;
- focus-visible;
- active;
- disabled;
- loading;
- empty;
- error;
- success;

states where relevant.

Avoid creating interfaces that only look correct with ideal demo data.

Test realistic cases including:

- long labels;
- long usernames;
- large values;
- missing optional data;
- empty lists;
- loading data;
- API failure;
- narrow screens;
- translated strings.

Do not solve hierarchy problems by putting every section inside another Card.

Use whitespace, typography, grouping, separators, background hierarchy and layout before adding unnecessary containers.

---

# 16. Responsive Design

All user-facing work must consider responsive behavior.

At minimum inspect:

- large desktop;
- laptop;
- tablet;
- mobile.

Avoid desktop-only assumptions.

Do not simply shrink a desktop layout until it fits.

Adapt:

- navigation;
- grids;
- typography;
- spacing;
- charts;
- dialogs;
- tables;
- controls;

to the available viewport.

Avoid horizontal scrolling unless the interaction genuinely requires it.

---

# 17. Accessibility

Accessibility is part of implementation quality.

Use semantic HTML wherever possible.

Requirements include:

- keyboard accessibility;
- visible focus states;
- correct button/link semantics;
- associated labels;
- accessible form errors;
- meaningful alternative text;
- appropriate ARIA only where necessary;
- sufficient color contrast;
- non-color-only state communication.

Do not add ARIA attributes to compensate for incorrect semantic HTML when native elements solve the problem better.

---

# 18. Motion and Animation

Animation should communicate:

- hierarchy;
- causality;
- state change;
- focus;
- continuity.

Avoid animation solely because an element can be animated.

Do not use:

- abrupt movement;
- excessive bouncing;
- excessive scaling;
- excessive parallax;
- continuous distracting motion;
- animations that cause layout shifts.

Hover interactions should feel physically continuous rather than instantaneous.

Prefer transform and opacity for performant motion.

Respect:

```css
prefers-reduced-motion
```

Avoid adding a large animation dependency unless existing capabilities are insufficient and the dependency is justified.

---

# 19. Internationalization

Engineering language should remain English for:

- code identifiers;
- filenames;
- technical comments;
- engineering documentation;
- architecture documentation;
- development instructions.

User-facing product language is independent from engineering language.

Do not:

- use Chinese identifiers in code;
- translate API field names;
- hard-code reusable strings when the project's localization system should own them.

When adding user-facing copy, follow the localization architecture already established by the repository.

Layouts must tolerate translated strings with different lengths.

---

# 20. API Architecture

Keep backend integration centralized in the established API/data-access layer.

Do not scatter raw `fetch()` calls throughout presentation components.

Prefer a structure where responsibilities are clear:

```text
UI
 ↓
hooks / query layer
 ↓
API client
 ↓
backend
```

Do not invent production API endpoints.

Do not assume backend capabilities that are not documented.

When frontend requirements exceed the current API contract:

- identify the API gap;
- isolate temporary mock behavior if explicitly required;
- do not disguise mock behavior as production integration.

---

# 21. TanStack Query

Use TanStack Query for server state when its capabilities are useful, including:

- caching;
- request lifecycle;
- invalidation;
- refetching;
- mutations;
- synchronization.

Use stable and structured query keys.

Do not mirror query state unnecessarily into local React state.

Mutations should:

- expose pending state;
- prevent accidental duplicate submission where appropriate;
- invalidate/update relevant data deliberately;
- handle expected backend errors.

---

# 22. Runtime Validation

Use Zod where validating data at runtime materially improves correctness.

External data is not trusted merely because TypeScript declares a type.

Consider validation at:

- API boundaries;
- form boundaries;
- persisted external data;
- query-string or route-derived data;

where applicable.

Do not add unnecessary schemas for completely internal compile-time-only values.

---

# 23. Forms

Use React Hook Form for non-trivial forms.

Use Zod when schema-driven validation is appropriate.

Forms should handle:

- validation;
- pending state;
- duplicate submission;
- backend validation errors;
- conflict errors;
- failure recovery;
- disabled controls;
- accessible error messages.

Keep frontend validation compatible with the backend contract.

Frontend validation does not replace backend validation.

---

# 24. Charts and Data Visualization

Use Apache ECharts when a chart materially improves understanding.

Do not add charts merely because chart infrastructure exists.

Choose visualization based on the data and user question.

Charts must account for:

- empty state;
- loading;
- responsive resizing;
- readable labels;
- tooltip clarity;
- accessible surrounding explanation;
- consistent visual tokens.

Avoid excessive colors.

Color should encode meaning rather than decoration.

Do not place critical information exclusively inside chart hover tooltips.

---

# 25. Loading, Empty and Error States

Data-driven UI must not assume successful populated data.

Design appropriate states for:

```text
loading
empty
partial data
error
retry
success
```

Use Skeleton components when useful.

Avoid full-page spinners for local asynchronous operations when a localized loading state is more appropriate.

Errors should help the user understand what can be done next.

Do not expose raw backend stack traces or internal implementation details.

---

# 26. Mock Data

Mock mode and production integration must remain clearly separated.

Do not scatter environment checks throughout presentation components.

Mock data should flow through the same or a deliberately compatible data-access boundary where practical.

Do not modify production behavior merely to make a demo easier.

Do not send destructive or mutating requests to a production backend for frontend experimentation unless explicitly authorized.

---

# 27. Security

Never commit:

- passwords;
- tokens;
- API keys;
- private keys;
- certificates;
- session secrets;
- private `.env` files;
- production customer data.

Never expose server-side secrets through `NEXT_PUBLIC_*`.

Treat any browser-visible value as public.

Do not log sensitive authentication or user data unnecessarily.

Do not weaken authentication, authorization or browser security controls merely to simplify local development.

---

# 28. Performance

Do not optimize blindly, but avoid obvious performance regressions.

Consider:

- JavaScript bundle size;
- Client Component boundaries;
- unnecessary rerenders;
- image loading;
- font loading;
- chart cost;
- animation cost;
- duplicate requests;
- oversized dependencies.

Use lazy loading or code splitting where it provides meaningful benefit.

Do not trade maintainability for micro-optimizations without evidence.

---

# 29. Testing

Use:

- Vitest for unit and logic tests;
- Playwright for important user-facing flows.

Bug fixes should include regression coverage when practical.

Test behavior, not implementation trivia.

Do not disable or delete valid tests merely to make a change pass.

Before considering substantial work complete, run the relevant available checks such as:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

For major user-facing flows, also run the appropriate E2E suite when available:

```bash
pnpm test:e2e
```

Use repository scripts rather than inventing alternative commands when equivalent scripts already exist.

---

# 30. Browser Verification

Visual and interaction changes require browser inspection.

Compilation success is not sufficient verification for UI work.

When tooling permits, inspect:

- rendered layout;
- console errors;
- hydration warnings;
- network failures;
- responsive behavior;
- keyboard interaction;
- loading states;
- hover/focus states;
- animation behavior.

Use the project's configured Playwright/browser tooling when available.

HTTP responses alone do not prove that a UI is correct.

---

# 31. Code Quality

Prefer code that is:

- explicit;
- readable;
- maintainable;
- testable;
- unsurprising.

Avoid:

- speculative abstractions;
- premature generalization;
- duplicated logic;
- unexplained magic constants;
- giant files;
- dead code;
- commented-out obsolete implementations;
- debug logging left in production code.

If a comment is required to understand what the code does, first consider whether clearer structure or naming would solve the problem.

Comments should primarily explain **why**, not restate **what** the code already says.

---

# 32. Refactoring

Do not perform broad unrelated refactors during a scoped feature task.

A refactor is appropriate when it:

- is necessary to implement the requested behavior safely;
- removes significant duplication directly encountered by the task;
- fixes a structural problem blocking the task;
- is explicitly requested.

Keep unrelated cleanup separate.

Do not rewrite stable working code merely to match personal style preferences.

---

# 33. Dependencies

Before adding, removing or replacing dependencies:

1. inspect existing dependencies;
2. inspect existing project usage;
3. confirm compatibility;
4. understand bundle/build impact;
5. explain why the change is needed.

Do not silently migrate libraries as part of unrelated work.

Do not use unmaintained or suspicious packages without justification.

---

# 34. Repository Search and Inspection

Prefer efficient repository-native tools.

Typical order:

```text
rg
fd
git
jq
Node / project-local tooling
```

Use:

```bash
rg --files
```

for repository inventories.

Use scoped searches.

Avoid unnecessarily scanning:

```text
node_modules
.next
dist
coverage
build artifacts
private environment files
```

Do not use grep/sed as a substitute for proper JSON parsing.

---

# 35. CodeGraph

When `.codegraph/` exists and CodeGraph is operational, use it when dependency or symbol relationships would materially improve understanding.

Good use cases include:

- locating symbol relationships;
- understanding component dependencies;
- impact analysis;
- tracing module relationships;
- identifying callers and references.

CodeGraph is an assistance layer, not a source of truth.

Always verify important findings against actual source code.

Do not initialize CodeGraph implicitly during an unrelated task.

If the repository is not indexed, continue with normal repository tools unless the current task explicitly asks for indexing.

---

# 36. Tool Selection

Prefer tools already configured for the project.

Do not install a large toolchain merely to perform a small task.

Before assuming a CLI exists:

```bash
command -v <tool>
```

when appropriate.

Use project-local tools rather than unrelated global versions whenever practical.

Do not automatically download arbitrary latest-version CLIs.

When a task requires external documentation, prefer version-matched official documentation.

---

# 37. Git Safety

Before meaningful changes, inspect:

```bash
git status
git branch --show-current
git diff
```

as appropriate.

Never:

- force push without explicit authorization;
- use destructive reset to discard user work;
- run destructive clean operations casually;
- overwrite unrelated uncommitted changes;
- commit secrets;
- silently alter Git history.

Do not assume a particular branching or push strategy from this file.

Follow the current task and the repository's current Git workflow documentation.

If the user has not asked for commits or pushes, do not assume permission to publish changes.

Keep commits scoped and understandable when commits are requested.

---

# 38. Documentation

Update documentation when implementation changes:

- public behavior;
- architecture;
- API contracts;
- development workflow;
- environment requirements;
- reusable conventions.

Do not update documentation merely to make implementation appear compliant.

Documentation must describe actual behavior.

Do not put temporary project progress into `AGENTS.md`.

Temporary status belongs in:

```text
Issues
.agent/plans/
release notes
task reports
project tracking documents
```

---

# 39. Deployment Safety

Treat deployment as a separate high-risk operation.

Do not deploy automatically merely because implementation and tests succeed.

Before deployment, verify the repository's current deployment documentation.

Never assume:

- production hostname;
- container names;
- ports;
- registry paths;
- environment variables;
- infrastructure topology;

from historical knowledge.

Do not:

- delete production volumes;
- delete databases;
- modify production data;
- remove unrelated containers;
- rotate credentials;

unless the task explicitly requires it and appropriate safeguards exist.

Local development completion and production deployment are separate milestones.

---

# 40. AI Agent Behaviour

The agent must:

- inspect before editing;
- plan substantial changes;
- reuse established patterns;
- keep changes scoped;
- validate assumptions;
- distinguish facts from assumptions;
- report unresolved gaps;
- verify with executable checks where possible.

The agent must not:

- invent requirements;
- invent APIs;
- invent backend behavior;
- assume project progress;
- claim tests passed without running them;
- claim visual quality without inspecting rendered UI when inspection is available;
- hide failures;
- silently skip requested work;
- introduce large dependencies without justification;
- replace established architecture for convenience.

If a requested implementation cannot be completed exactly, implement the safest useful subset and clearly state the remaining gap.

---

# 41. Autonomous Decision-Making

The agent is encouraged to make reasonable implementation decisions when the requirement leaves room for engineering judgment.

Use existing project principles and industry-standard frontend practices.

Do not ask unnecessary clarification questions when repository context can resolve the issue safely.

However, autonomy does not permit:

- inventing product requirements;
- destructive operations;
- changing architecture without reason;
- silently changing public contracts;
- weakening security;
- ignoring explicit instructions.

---

# 42. Visual Design Tasks

For substantial visual work:

1. inspect the existing rendered page;
2. inspect existing components and tokens;
3. identify hierarchy problems;
4. define the intended visual direction;
5. implement incrementally;
6. inspect the result in a browser;
7. revise obvious visual inconsistencies.

Do not treat visual implementation as complete merely because CSS was written.

Evaluate the complete page rather than isolated components.

Avoid randomly adding:

- gradients;
- shadows;
- glass effects;
- animations;
- colored cards;
- decorative shapes;

without a coherent visual purpose.

Distinctive design should still feel systematic.

---

# 43. API and Product Gaps

When the requested frontend requires functionality not supported by the documented backend:

Do not fake a production endpoint.

Instead classify the situation as one of:

```text
frontend-only behavior
mock-only behavior
API gap
backend dependency
```

Keep temporary mock implementation replaceable.

Include unresolved integration gaps in the final task report.

---

# 44. Definition of Done

A task is complete only when all relevant conditions are satisfied:

- requested behavior is implemented;
- implementation follows repository architecture;
- existing functionality has not been unintentionally broken;
- API usage matches the documented contract;
- loading/error/empty states are handled where relevant;
- responsive behavior is reasonable;
- accessibility has been considered;
- relevant tests pass;
- lint/type checks pass;
- build passes when applicable;
- browser verification is performed for meaningful UI changes when possible;
- no secrets or debug artifacts remain;
- relevant documentation is updated;
- unresolved risks are reported.

A task is not complete because the code merely compiles.

---

# 45. Final Task Report

At the end of substantial work, provide a concise report containing:

```text
What changed
Validation performed
Important design/architecture decisions
Known limitations or unresolved gaps
Files or areas requiring future attention
```

Do not claim success for checks that were not executed.

Clearly distinguish:

```text
PASS
NOT RUN
BLOCKED
```

when reporting verification results.

---

# 46. Core Principle

Prefer:

```text
small complete changes
over
large speculative changes
```

Prefer:

```text
existing project conventions
over
personal preferences
```

Prefer:

```text
verified behavior
over
assumptions
```

Prefer:

```text
maintainable product quality
over
short-term demo tricks
```

The purpose of this file is to keep AI-assisted development consistent, safe, maintainable and grounded in the actual repository — regardless of the project's current release, milestone or implementation stage.
