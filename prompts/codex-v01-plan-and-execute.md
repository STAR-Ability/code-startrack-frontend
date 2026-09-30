# Codex Master Prompt — Plan V0.1 from the Four Approved Product Documents

You are working in the `codeStartrack` frontend repository.

This task is a **planning task**.

You must use the four approved V0.1 product documents as the primary product source, create the implementation planning artifacts, and complete the planning work in this same task.

Do **not** stop after writing a planning prompt.

Do **not** implement application code yet.

---

# 1. Primary Source Documents

Read these four files completely before planning:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

These four files define the current approved V0.1 product scope.

Also read only the engineering documents needed to make the plan executable:

```text
AGENTS.md
docs/architecture/tech-stack.md
docs/development/coding-standards.md
docs/development/repository-management.md
.agent/PLANS.md
```

Do not let older Demo V2 scope override the current V0.1 scope.

If older repository documents conflict with the four approved V0.1 product documents, report the conflict and follow the current V0.1 product documents for product scope.

---

# 2. Product Model to Preserve

The current product model is:

```text
One codeStartrack user
        ↓
Zero or more connected external accounts
        ↓
Multiple accounts may eventually share the same platform
        ↓
Each account synchronizes independently
        ↓
Backend combines / normalizes / deduplicates training data
        ↓
One unified training profile
        ↓
One unified recommendation experience
        ↓
Each recommended problem retains its source platform and external URL
```

Platforms are data sources / connectors.

They are **not** product modes.

Do not create:

```text
Codeforces mode
Codeforces dashboard
Codeforces learner profile
platform-specific learner routes
```

---

# 3. Approved V0.1 Demo Assumptions

Treat these as already decided for V0.1:

```text
DEMO_USER_ID = 1
```

The internal user already exists in the backend database.

The frontend backend base URL comes from:

```text
NEXT_PUBLIC_API_BASE_URL
```

Therefore:

- do not plan user registration;
- do not plan login;
- do not plan authentication;
- do not plan session provisioning;
- do not treat internal user identity as a V0.1 blocker;
- do not request backend identity changes;
- do not hardcode the backend host;
- do not scatter the literal user ID throughout the codebase.

The fixed Demo user ID should be centralized in one replaceable frontend configuration location.

---

# 3.1 Live Backend for Frontend Development — READ-ONLY

For the current frontend development phase, use this existing backend:

```text
http://116.62.214.151:8080
```

Configure it locally through:

```env
NEXT_PUBLIC_API_BASE_URL=http://116.62.214.151:8080
```

Use `.env.local` for the real local value and keep it out of version control.

If `.env.example` exists or is created, keep it environment-neutral:

```env
NEXT_PUBLIC_API_BASE_URL=
```

## Hard Network Safety Constraint

During this task and in every implementation prompt produced by this task:

> **The live backend is READ-ONLY. Only GET requests may be sent to `http://116.62.214.151:8080`.**

Do not send any live:

```text
POST
PUT
PATCH
DELETE
```

requests to this backend.

This restriction applies to:

- browser code;
- Server Components;
- route handlers;
- Server Actions;
- API clients;
- curl;
- shell scripts;
- manual verification commands;
- Playwright;
- integration tests;
- setup scripts;
- debugging utilities.

Do not intentionally trigger write/mutation endpoints.

Do not use the backend to initialize, bind, synchronize, reset, seed, or modify data.

## Allowed Live Backend Requests

The frontend may use the existing Demo user `1` with read-only endpoints such as:

```text
GET /api/users/1/profile
GET /api/users/1/recommendations?limit=1
```

If necessary for documentation inspection, a safe GET to the backend's API documentation endpoint may be used:

```text
GET /v3/api-docs
```

Do not broaden live access beyond required GET reads.

## Explicitly Prohibited Live Calls

Do not execute:

```text
POST /api/accounts
POST /api/accounts/{accountId}/sync
POST /api/problems/sync/{platform}
```

even though these endpoints exist in the documented API.

Do not call them from frontend code, tests, scripts, curl, or Playwright during this phase.

## Consequence for V0.1 Development

The current live-development slice is therefore:

```text
DEMO_USER_ID = 1
        ↓
GET /api/users/1/profile
        ↓
GET /api/users/1/recommendations?limit=1
        ↓
Render unified training profile
        ↓
Render one recommendation
        ↓
Open returned external problem URL
```

Account binding and synchronization remain part of the product design, but they are **not active live-backend operations in this development phase**.

The `/` connected-account/onboarding UI may be designed and implemented visually, but it must not send a POST request.

Do not present a disabled/non-executed account-binding interaction as a successful real connection.

If the existing Demo user has no synchronized profile or recommendations and GET returns an error/404:

- show/report the real read-only failure;
- do not attempt to repair it with POST;
- do not mutate backend data;
- do not fabricate live data;
- report that backend/demo data preparation is required outside this frontend task.

## CORS / HTTP Development Note

This backend uses plain HTTP.

For local development over HTTP, use it as configured.

If the frontend is later served over HTTPS, browsers may block requests to an HTTP backend as mixed content. Do not add an insecure workaround. Report the deployment issue and require an HTTPS backend/proxy decision separately.

If CORS blocks the read-only GET requests, report the actual integration error. Do not bypass it by changing backend data or inventing unsupported mutation flows.

---


# 4. Current V0.1 Backend Reality

Use the API behavior documented in:

```text
docs/product/api-contract.md
```

Current relevant endpoints:

```text
POST /api/accounts
POST /api/accounts/{accountId}/sync
GET  /api/users/{userId}/profile
GET  /api/users/{userId}/recommendations
POST /api/problems/sync/{platform}
```

Important current constraints:

- Codeforces is the only currently working connector.
- The first Codeforces account can be bound to Demo user 1.
- E4 synchronization is account-scoped.
- E1 profile is user-scoped.
- E2 recommendations are user-scoped.
- E5 catalogue synchronization is an operator prerequisite, not a normal user action.
- `skills` is placeholder data and must not be shown as trustworthy ability analysis.
- recommendation behavior is currently placeholder / hardcoded and must be presented honestly.
- one user connecting multiple Codeforces accounts is an approved product requirement but is currently `BLOCKED_BY_API`.
- account discovery / listing after reload is not currently documented.

Do not invent APIs to solve these limitations.

---

# 5. V0.1 Scope

The approved product flow still includes connection and synchronization, but the **current live-development execution path is read-only**.

Product flow:

```text
Connect Codeforces account
→ bind
→ sync
→ profile
→ recommendation
```

Current live frontend-development path:

```text
Use existing DEMO_USER_ID = 1 and existing backend data
        ↓
GET /api/users/1/profile
        ↓
GET /api/users/1/recommendations?limit=1
        ↓
Show unified training profile
        ↓
Show one primary recommendation
        ↓
Open the returned external problem URL
```

Do not execute the POST binding/synchronization steps against the live backend in this phase.

Primary routes:

```text
/
/dashboard
```

Do not add product routes outside the approved V0.1 page structure unless a route is strictly required by the existing Next.js structure and does not change the product model.

---

# 6. Explicitly Out of Scope

Do not plan or implement these as V0.1 work:

- user registration;
- authentication;
- full session system;
- internal code editor;
- internal problem workspace;
- Run Sample;
- internal Judge;
- submission workflow;
- AC / WA / TLE / CE / RE experience;
- progressive Agent hints;
- real LLM Agent;
- coach pages;
- team management;
- role switching;
- platform-specific dashboards;
- real additional platform connectors;
- skill radar;
- large analytics dashboard;
- RAG;
- vector database;
- AI-generated problems;
- community;
- leaderboard;
- payments.

Multiple same-platform accounts remain part of the approved product architecture, but the current backend does not support them. Do not let that block the first single-account V0.1 vertical slice.

---

# 7. Brand and UI Direction

Preserve the approved V0.1 design direction:

```text
white-first
modern
minimal
clean
developer-oriented
trustworthy
calm
technology-forward
```

Foundation:

```text
Next.js
React
TypeScript
Tailwind
shadcn/ui
Base UI
Nova preset
Geist
Geist Mono
Lucide React
```

Use a restrained cobalt / indigo accent direction through semantic theme tokens.

Avoid:

- heavy gradients;
- neon / cyberpunk styling;
- excessive glassmorphism;
- colorful admin dashboard cards;
- giant decorative illustrations;
- emoji icons;
- excessive animation;
- school administration dashboard styling.

The recommendation should be the strongest actionable element on `/dashboard`.

---

# 8. Planning Goal

Create an implementation plan that is small enough for a small team and AI-assisted development.

Optimize for:

```text
working vertical slice
small reviewable PRs
low coupling
clear API boundaries
easy replacement of Demo assumptions later
fast validation
```

Do not over-engineer future multi-platform infrastructure.

Preserve extension points, but build only what V0.1 needs.

---

# 9. Inspect the Current Repository Before Planning

Before writing the plan:

1. inspect the current repository structure;
2. inspect installed dependencies;
3. inspect existing Next.js routes/components;
4. inspect the current shadcn configuration;
5. inspect existing API/i18n/query/provider setup;
6. inspect existing test configuration;
7. inspect current package scripts.

Do not assume scaffolding is missing if it already exists.

Do not plan duplicate setup work.

---

# 10. Create the Main Execution Plan

Create or replace:

```text
.agent/plans/v0.1-frontend.md
```

Follow `.agent/PLANS.md`.

The plan must contain at least:

## Goal

What V0.1 must demonstrate.

## Product Constraints

The unified learner model and the Codeforces-first implementation boundary.

## Approved Demo Assumptions

Include:

```text
DEMO_USER_ID = 1
NEXT_PUBLIC_API_BASE_URL
```

## In Scope

Only the approved V0.1 flow.

## Out of Scope

Use the explicit exclusions above.

## Existing Backend Capabilities

Map E1–E5 to frontend responsibilities.

## Known Limitations

At minimum:

```text
G-02 account discovery/recovery
G-03 error/schema precision
G-04 recommendation ordering/freshness/empty semantics
G-05 sync retry/read-after-sync behavior
G-06 catalogue operational readiness
G-07 actual network/CORS integration verification
G-08 cross-account/cross-platform normalization semantics
G-09 multiple same-platform accounts blocked by API
```

Do not mark G-01 as a blocker.

## Implementation Stages

Prefer a vertical-slice sequence.

## Testing Strategy

Unit, component/integration where useful, and E2E.

## Risks

Focus on realistic V0.1 risks.

## Rollback / Reversibility

Explain how temporary Demo assumptions can later be replaced.

## Progress Checklist

Use checkboxes.

---

# 11. Create the GitHub Issue Plan

Create or replace:

```text
docs/development/v0.1-issue-plan.md
```

Break the implementation into small GitHub-Issue-sized tasks.

Each task should be independently reviewable and mergeable into `dev` when practical.

For every Issue include:

### Title

### Type

One of:

```text
feature
fix
refactor
docs
test
chore
```

### Goal

### Scope

### Out of Scope

### Dependencies

### API Status

Use one of:

```text
READY
BLOCKED_BY_API
BLOCKED_BY_PRODUCT_DECISION
DEFERRED_BY_READ_ONLY_POLICY
OPERATOR_PREREQUISITE
FUTURE_ONLY
```

### Expected Areas

Likely files/directories, without inventing exact files that do not yet exist.

### Acceptance Criteria

Use checkboxes.

### Validation

Select relevant commands:

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

---

# 12. Recommended Issue Direction

Use repository evidence to determine the final split, but the likely sequence should resemble:

```text
01. Configure frontend environment and Demo identity
02. Build centralized API client foundation
03. Add API response/request runtime schemas
04. Add shared API error normalization
05. Add V0.1 localization/copy foundation if needed
06. Build account connection/onboarding UI
07. Integrate Codeforces account binding
08. Integrate account synchronization and progress states
09. Build unified training profile summary
10. Build primary recommendation card
11. Add source-aware external problem CTA
12. Handle empty/error/partial-success states
13. Add responsive/accessibility polish
14. Add V0.1 integration/E2E coverage
```

Do not mechanically create exactly 14 Issues if the existing repository makes some tasks too small or redundant.

Combine tasks when doing so creates a cleaner reviewable vertical slice.

Split tasks when a PR would otherwise become too large.

---

# 13. Important Implementation Decisions for the Plan

## Environment

Plan for:

```text
.env.example
NEXT_PUBLIC_API_BASE_URL=
```

Real local values belong in:

```text
.env.local
```

Do not commit deployment-specific `.env.local`.

## Demo User

Centralize:

```text
DEMO_USER_ID = 1
```

Do not scatter `1` through components.

## API Layer

Centralize backend access under the project's approved API area, normally:

```text
src/lib/api/
```

Do not put raw fetch calls throughout UI components.

## Server State

Use TanStack Query where its caching/request lifecycle behavior is useful.

Do not use it mechanically for everything.

## Runtime Validation

Use Zod for external API responses where it materially improves correctness.

## Forms

Use React Hook Form for the account connection form if it is consistent with repository standards.

## Internationalization

Default product UI:

```text
zh-CN
```

Support:

```text
en
```

according to the repository's current i18n setup.

Do not hardcode reusable visible strings if an i18n layer already exists or is introduced by an approved Issue.

---

# 13.1 Read-Only Planning Rule

The implementation plan must distinguish between:

```text
Product capability
```

and:

```text
Allowed live-backend operation in this development phase
```

Account binding and synchronization are documented product capabilities, but because they require POST they must not be executed now.

Classify implementation tasks that would actively call E3/E4/E5 as:

```text
DEFERRED_BY_READ_ONLY_POLICY
```

The plan may still include their future scope and acceptance criteria, but the generated first implementation prompt must not activate them.

Prefer the first implementation work to focus on the live read-only dashboard:

```text
environment
→ GET API client
→ schemas
→ profile
→ recommendation
→ external CTA
```

Any live integration validation or E2E generated by this planning task must use GET requests only.

---

# 14. Connected Accounts Boundary

The target architecture permits:

```text
Codeforces account A
Codeforces account B
Codeforces account C
```

under one user.

But current E3 blocks the second same-platform account.

Therefore the first V0.1 implementation plan must:

- build the account UI so it is conceptually collection-friendly;
- implement only one real Codeforces binding with the current backend;
- not make `Connect another account` behave as a working feature;
- not invent account listing;
- not create multiple internal users as a workaround;
- not merge several users in the browser.

If shown at all, unavailable additional-account functionality must be clearly non-functional / future-facing.

---

# 15. Recommendation and Profile Truthfulness

Profile:

Use only real supported metrics.

Do not present `skills` as measured ability.

Recommendation:

Display returned data, but preserve the fact that recommendation behavior is currently placeholder/hardcoded.

Do not strengthen backend placeholder reasons into claims such as:

```text
AI has accurately identified your weak DP ability
```

Do not turn `score` into a confidence percentage unless the backend contract later defines it that way.

---

# 16. Decide the First Implementation Issue

After creating both planning documents:

1. identify the best first `READY` Issue;
2. explain briefly why it should be first;
3. create a ready-to-use implementation prompt for that Issue at:

```text
prompts/v0.1-first-implementation-task.md
```

This prompt must:

- reference the relevant product docs;
- state exact scope;
- state explicit out-of-scope;
- include acceptance criteria;
- include validation commands;
- require a final diff review;
- prohibit unrelated refactors.

Do **not** execute the implementation prompt in this task.

The current task ends after producing the planning artifacts and the first implementation-task prompt.

---

# 17. Final Review

Before finishing, verify:

- the plan is based on the four current V0.1 product documents;
- no older Demo V2 scope leaked into V0.1;
- G-01 is treated as resolved for V0.1;
- `DEMO_USER_ID = 1` is centralized, temporary, and replaceable;
- backend URL comes from `NEXT_PUBLIC_API_BASE_URL`;
- no backend changes are required by the current read-only frontend plan;
- the live backend is configured as `http://116.62.214.151:8080` through `NEXT_PUBLIC_API_BASE_URL`;
- every live backend request in this phase is GET-only;
- E3/E4/E5 mutation work is classified `DEFERRED_BY_READ_ONLY_POLICY`;
- no generated implementation prompt sends POST/PUT/PATCH/DELETE to the live backend;
- G-09 remains a real backend limitation but does not block the one-account V0.1 vertical slice;
- `/` and `/dashboard` remain the only primary V0.1 product routes;
- the UI remains one unified learner experience;
- Codeforces remains a connector, not a product mode;
- `skills` placeholder data is not promoted to real ability analysis;
- placeholder recommendations are presented honestly;
- E5 is treated as an operator prerequisite;
- tasks are small enough for Issue/branch/PR workflow;
- the first implementation prompt is actionable.

---

# 18. Execute the Planning Work Now

Do not merely describe what you would plan.

Actually create/update:

```text
.agent/plans/v0.1-frontend.md
docs/development/v0.1-issue-plan.md
prompts/v0.1-first-implementation-task.md
```

Then run any non-destructive repository checks needed to validate that the plan references real scripts, directories, dependencies, and conventions.

Do not modify application source code.

Do not install dependencies.

Do not modify backend code.

At the end report:

1. files created/updated;
2. implementation stages;
3. Issue count;
4. READY Issues;
5. BLOCKED_BY_API Issues;
6. DEFERRED_BY_READ_ONLY_POLICY Issues;
7. OPERATOR_PREREQUISITE items;
8. first implementation Issue;
9. remaining risks;
10. any conflicts found between the four product documents, the read-only backend policy, and the actual repository state.
