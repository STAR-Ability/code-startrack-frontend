# Frontend Coding Standards

## 1. Goals

The codebase should remain:

- easy for a small team to understand;
- easy for Codex to navigate and modify safely;
- strongly typed;
- testable;
- consistent;
- deployable at all times.

Prefer simple, explicit solutions over unnecessary abstraction.

## 2. Recommended Source Structure

```text
src/
├── app/                  # App Router routes, layouts, route-local files
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # shell, navigation, headers, sidebars
│   └── features/         # reusable product-facing components
├── hooks/                # shared React hooks
├── lib/
│   ├── api/              # API client, schemas, request helpers
│   ├── query/            # TanStack Query helpers / query keys
│   ├── charts/           # shared ECharts configuration/helpers
│   └── utils/            # general utilities
├── types/                # shared application types when needed
└── styles/               # global style-related files when needed
```

Keep route-specific components close to their route when they are not reused elsewhere.

Do not create a global abstraction for code used only once.

## 3. TypeScript

- Keep `strict` enabled.
- Avoid `any`.
- Prefer `unknown` for untrusted values and narrow it safely.
- Prefer inferred types when the inferred type is clear.
- Export shared types only when they are actually shared.
- Do not duplicate API types across multiple files.
- Validate external/untrusted runtime data with Zod when correctness matters.

## 4. React and Next.js

- Prefer Server Components.
- Use Client Components only when required.
- Keep `"use client"` boundaries as narrow as practical.
- Do not put browser-only code into Server Components.
- Avoid unnecessary `useEffect`.
- Derive values during render when possible instead of syncing derived state.
- Keep page/layout files focused on route composition and data boundaries.
- Extract reusable business UI into components.

## 5. UI

- Use Tailwind CSS.
- Prefer shadcn/ui primitives and established project components.
- Use semantic design tokens rather than arbitrary one-off colors.
- Use Lucide React for icons.
- Preserve accessible labels, keyboard behavior, focus states, and semantic HTML.
- Every async UI should consider loading, empty, success, and error states.
- Every major page should be usable on desktop and mobile; tablet behavior should not break.

## 6. Data Fetching

Centralize backend integration under:

```text
src/lib/api/
```

Recommended pattern:

```text
src/lib/api/
├── client.ts
├── schemas/
├── users.ts
├── profile.ts
└── recommendations.ts
```

Rules:

- Keep base URL and shared request logic centralized.
- Do not hard-code environment-specific URLs in components.
- Use TanStack Query where client-side server-state management is useful.
- Keep query keys predictable and centralized when the query surface grows.
- Validate responses with Zod when external data shape cannot be trusted.

## 7. Forms

- Use React Hook Form for non-trivial forms.
- Prefer Zod schemas as the shared validation definition when practical.
- Display validation errors next to the relevant field.
- Disable duplicate submissions while a submission is in progress.
- Handle backend validation errors explicitly.

## 8. Charts

- Use Apache ECharts.
- Do not mix large chart option objects with unrelated page markup.
- Provide responsive sizing.
- Handle empty datasets.
- Avoid misleading axes, scales, or labels.
- Keep chart labels and units explicit.

## 9. Error Handling

- Do not swallow errors silently.
- Show user-safe error states.
- Keep sensitive internal details out of browser-facing error messages.
- Log enough information during development to diagnose failures.
- Use Next.js error boundaries/conventions where appropriate.

## 10. Naming

Use:

- `PascalCase` for React components and component files when appropriate.
- `camelCase` for functions and variables.
- `kebab-case` for route segment names and branch names.
- descriptive names over abbreviations.

Avoid generic names such as `data`, `item`, or `handler` when a more specific name improves clarity.

## 11. Imports

Prefer the configured alias:

```text
@/*
```

Avoid deeply nested relative imports when the alias is clearer.

Keep imports organized and remove unused imports.

## 12. Testing

Vitest:

- utilities;
- schema validation;
- data transforms;
- isolated behavior;
- regression tests where appropriate.

Playwright:

- authentication flows;
- major navigation;
- key dashboard flows;
- forms that are critical to the product;
- other end-to-end behavior with high user impact.

Do not create brittle tests that depend on incidental DOM structure.

## 13. Formatting and Linting

Formatting is automated.

Do not manually fight Prettier formatting.

Expected commands:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

## 14. Dependencies

Do not add a second library for a problem already covered by the approved stack without a concrete reason.

Examples:

- do not add another general UI library alongside shadcn/ui;
- do not add another general icon library alongside Lucide React;
- do not add Redux by default when local state + TanStack Query is sufficient;
- do not add another form framework alongside React Hook Form without a specific need.

## 15. Comments

Write comments for:

- non-obvious business rules;
- important constraints;
- unusual browser/framework workarounds;
- decisions that would otherwise be easy to "simplify" incorrectly.

Do not comment obvious syntax.

## 16. Accessibility

For user-facing UI:

- use semantic HTML;
- associate labels with inputs;
- preserve keyboard navigation;
- provide accessible names for icon-only controls;
- keep focus states visible;
- do not use color as the only way to communicate status.
