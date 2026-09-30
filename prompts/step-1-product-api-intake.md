# Step 1 Prompt — Product & API Intake

Use this prompt from the root of the initialized `codeStartrack` frontend repository.

---

Read the repository instructions first.

At minimum inspect:

- `AGENTS.md`
- `docs/architecture/tech-stack.md`
- `docs/development/repository-management.md`
- `docs/development/coding-standards.md`
- `docs/product/project-plan.en.md`
- `docs/product/apidocs.md`

Do **not** implement product features in this task.

Your goal is to convert the approved product plan and the currently documented backend API into a reliable frontend product specification.

## Source Rules

Treat:

```text
docs/product/project-plan.en.md
```

as the approved product direction and Demo V2 scope.

Treat:

```text
docs/product/apidocs.md
```

as the currently documented backend API reality.

Do not assume that every product requirement already has a backend endpoint.

Do not assume that every existing API belongs in the final Demo V2 user flow.

Do not silently reconcile contradictions.

## Tasks

### 1. Understand the Product

Extract and summarize:

- product positioning;
- target users;
- primary user mental model;
- student training loop;
- coach role;
- Demo V2 P0 scope;
- explicit out-of-scope features;
- success criteria.

### 2. Build a Requirement Matrix

For each important Demo V2 capability, classify it as:

```text
A. Product requirement + API already documented
B. Product requirement + API missing / incomplete
C. Existing API + not clearly required by the current Demo V2 flow
D. Conflict / ambiguity requiring a product or backend decision
```

At minimum evaluate:

- user/demo entry;
- account binding;
- external training-data sync;
- user profile;
- recommendation;
- problem detail;
- run sample;
- code submission;
- judge result;
- submission history;
- progressive Agent hints;
- training result persistence;
- next recommendation;
- coach overview;
- coach member detail.

For every gap, identify what frontend implementation is blocked or would require an approved mock.

### 3. Create / Update Structured Product Documents

Based only on the supported requirements, update or create:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/api-contract.md
docs/product/design-system.md
```

Rules:

- preserve the intent of `project-plan.en.md`;
- do not invent important business behavior;
- do not fabricate API endpoints;
- clearly mark unresolved product decisions as:

  `TODO: Requires product decision`

- clearly mark unresolved backend/API requirements as:

  `TODO: Backend API required`

### 4. API Contract

In `docs/product/api-contract.md`:

- document only existing endpoints as existing;
- preserve exact HTTP methods, paths, required parameters, status codes, and meaningful response fields from `apidocs.md`;
- distinguish currently documented behavior from proposed/missing Demo V2 endpoints;
- create an explicit "API Gaps for Demo V2" section;
- do not convert a missing endpoint into a fake confirmed endpoint.

### 5. Frontend Page Model

For every confirmed or planned page, describe:

- purpose;
- primary user;
- major sections;
- user actions;
- required data;
- loading state;
- empty state;
- error state;
- responsive behavior;
- API dependencies;
- unresolved dependencies.

### 6. Design Direction

Keep the design aligned with the product plan:

- student side is primary;
- `/training` is simple and focused;
- one next recommended problem is the main CTA;
- coach experience is secondary;
- do not create a large generic analytics dashboard;
- preserve the repository's current shadcn Base UI + Nova visual foundation.

Do not invent detailed brand colors if no approved brand palette exists.

Mark missing design decisions as TODO instead.

### 7. Final Report

At the end, report:

1. product understanding;
2. files created or updated;
3. API capabilities that already support Demo V2;
4. API gaps that block Demo V2;
5. contradictions or ambiguities;
6. product decisions requiring human confirmation;
7. backend decisions requiring human confirmation.

Do not implement pages, components, mocks, or API clients in this step.
