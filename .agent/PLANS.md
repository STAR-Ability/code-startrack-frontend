# Execution Plans

Use an execution plan only for substantial work.

Examples:

- a new cross-cutting subsystem;
- a large feature spanning multiple routes/modules;
- a major migration;
- a significant architectural refactor;
- work that must be completed in several dependent stages.

Small bug fixes, isolated UI changes, documentation edits, and straightforward components do not need an execution plan.

Create task-specific plans under:

```text
.agent/plans/
```

Example:

```text
.agent/plans/student-dashboard-v01.md
```

## Required Plan Structure

```md
# <Plan Title>

## Goal

What user-visible or system outcome must exist when this plan is complete?

## Context

What existing architecture, constraints, APIs, and files matter?

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Acceptance Criteria

- [ ] ...

## Implementation Stages

### Stage 1 - ...

Files/areas:
- ...

Expected result:
- ...

Validation:
- ...

### Stage 2 - ...

...

## Testing

- unit:
- integration:
- E2E:
- build/type/lint:

## Risks

- ...

## Rollback / Reversibility

How can this change be reverted safely?

## Progress

- [ ] Stage 1
- [ ] Stage 2

## Decisions / Deviations

Record important decisions or deviations discovered during implementation.
```

The plan must stay synchronized with the actual implementation when the implementation materially changes direction.
