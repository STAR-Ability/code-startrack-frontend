# Step 2 Prompt — V0.1 / Demo V2 Frontend Implementation Plan

Use this prompt only after Step 1 has been reviewed by a human and the structured product documents are considered acceptable.

---

Read:

- `AGENTS.md`
- `docs/architecture/tech-stack.md`
- `docs/development/repository-management.md`
- `docs/development/coding-standards.md`
- `docs/product/project-plan.en.md`
- `docs/product/product-requirements.md`
- `docs/product/page-structure.md`
- `docs/product/api-contract.md`
- `docs/product/design-system.md`

Do **not** implement the full frontend in this task.

Your goal is to create an execution-ready frontend delivery plan for the current Demo V2 / V0.1 scope.

## 1. Respect Confirmed Scope

Use the approved product documents as the source of scope.

Do not add:

- unrelated dashboards;
- extra roles;
- extra problem-library experiences;
- real LLM features;
- large analytics features;
- unapproved backend assumptions.

The student-side training loop is the priority.

Coach features are secondary.

## 2. Separate Backend-Ready vs Blocked Work

For each frontend feature, classify it as:

```text
READY
BLOCKED_BY_API
APPROVED_MOCK_REQUIRED
PRODUCT_DECISION_REQUIRED
```

Do not hide missing APIs.

If a feature is blocked by backend work, identify the exact required contract.

## 3. Create an Implementation Plan

Create:

```text
.agent/plans/demo-v2-frontend.md
```

The plan must include:

- goal;
- context;
- in-scope;
- out-of-scope;
- architecture constraints;
- implementation stages;
- dependencies;
- validation strategy;
- risks;
- rollback / reversibility;
- progress checklist.

Prefer a sequence that creates a usable vertical slice early.

## 4. Break Work into GitHub-Issue-Sized Tasks

Create:

```text
docs/development/demo-v2-issue-plan.md
```

Each task should normally be independently reviewable and mergeable into `dev`.

For each proposed task include:

### Title

Use a concise Issue-style title.

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

What outcome should exist after the task?

### Scope

What is included?

### Out of Scope

What must not be implemented in this task?

### Dependencies

List:

- previous frontend tasks;
- backend APIs;
- product decisions;
- shared components.

### Files / Areas

Expected directories or modules, without pretending exact files already exist if they do not.

### Acceptance Criteria

Use checkboxes.

### Testing

Specify:

- unit tests;
- Playwright E2E if required;
- lint;
- format check;
- typecheck;
- production build.

### API Status

One of:

```text
READY
BLOCKED_BY_API
APPROVED_MOCK_REQUIRED
PRODUCT_DECISION_REQUIRED
```

If blocked, state the missing API contract precisely.

## 5. Recommended Ordering

Order tasks by dependency.

Prefer this general strategy when supported by the approved documents:

```text
foundation
    ↓
application shell / i18n / shared providers
    ↓
API client + schemas
    ↓
training page vertical slice
    ↓
problem page
    ↓
judge / submission integration
    ↓
Agent hint interaction
    ↓
history
    ↓
profile
    ↓
coach secondary flow
    ↓
E2E coverage
```

Adjust the order based on the actual API readiness discovered in Step 1.

## 6. Identify the First Implementation Task

At the end, select the first task that is both:

- valuable;
- technically unblocked.

Provide a ready-to-use Codex task prompt for that one task only.

Do not start implementing it.

## 7. Final Report

Report:

1. implementation stages;
2. total proposed Issues;
3. READY tasks;
4. API-blocked tasks;
5. mock-dependent tasks;
6. product decisions still required;
7. recommended first task;
8. critical path to a successful Demo V2.

Do not write product implementation code in this step.
