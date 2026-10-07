---
name: codestartrack-browser-review
description: Verify codeStartrack UI changes with the project's offline Playwright harness and browser MCP. Use for responsive layout, keyboard/accessibility, locale, console/hydration, or E2E regression checks in this repository.
---

# codeStartrack browser review

Read `README.md` and `package.json` for the current setup and scripts. Use the
README-designated `prompts/前端api文档.md`, `prompts/V0.12-前端api文档.md` and
`docs/development/default_OpenAPI.json` for API ownership. Inspect affected routes
and `docs/development/ui-surface-hierarchy.md`; historical delivery plans do not
establish current scope or service availability.

Keep Base UI / Nova, the installed shadcn CLI (`pnpm exec shadcn`), ECharts,
TanStack Query and bilingual dictionaries. Before Next-specific changes, read the
relevant installed guide in `node_modules/next/dist/docs/`. Use version-matched
external documentation only when local source and guides cannot answer the
question, without sending private source, learner data or environment files.

## Reproducible offline verification

1. Run `pnpm build` before preview or E2E. Build and development share `.next`;
   do not run them concurrently.
2. Run `pnpm test:e2e` for regression coverage. It owns loopback ports 3100/3210
   and starts its own synthetic fixture. Stop preview first; never share a fixture
   between independent reset/mutation scripts or a performance benchmark.
3. For interactive MCP review, run `pnpm preview:offline` after building and visit
   `http://127.0.0.1:3100`. The harness selects its synthetic upstream directly;
   private environment files cannot redirect it to production. Stop it before E2E.
4. Inspect console/page errors, hydration, failed network requests, accessibility
   snapshots and actual rendered screenshots. Check both zh-CN and en at desktop,
   laptop, tablet, 390px and 320px, including 200% text and reduced motion. Measure
   useful reading space and child/text containment as well as document width.
5. Exercise entry → practice → profile, language switching and changed flows.
   Check visible focus, skip links, overlay entry/dismissal/focus return and
   loading/empty/error/cached recovery. Keep external problem links local for
   inspection. Business mutations belong to the synthetic fixture. Production
   session acceptance follows the current task's explicit authorization and
   permitted scope; an authorization already given does not need to be repeated.
6. Keep screenshots, traces and measurements under ignored `test-results/`.
   Report defects with route, viewport, locale and severity. Deterministic visual
   baselines supplement hierarchy, zoom and keyboard review; review changed
   images and verify that a deliberate layout defect fails the comparison.

Browser MCP uses an isolated headless Chrome profile and does not inherit the E2E
network guard. Inspect destinations and apply loopback-only request guards when
running offline scripts. `tests/e2e/fixtures.ts` rejects external requests and
legacy API paths, records runtime errors and allows only fixture API mutations.
Expected resource failures are filtered for deliberate error-state cases; inspect
the failing request when diagnosing a new issue.

For development diagnosis, `pnpm dev:offline` (`dev:mock` is an alias) starts Next
on port 3000 with a synthetic backend on an available loopback port. Its printed
`/__control` URL is fixture-only; `MOCK_PORT=3210` requests a fixed fixture port.
Stop development before rebuilding. Use any configured Next DevTools with that
explicit frontend port.

These checks establish bounded UI evidence, not full WCAG compliance or live
backend acceptance. The image-only CAPTCHA still needs a backend-supported
nonvisual alternative; preserve the challenge rather than inventing a bypass.
