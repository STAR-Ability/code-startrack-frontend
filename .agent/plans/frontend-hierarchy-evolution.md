# Frontend hierarchy evolution

## Goal

Evolve the existing white-led codeStartrack UI so that the next training action,
current status and supporting evidence have distinct visual priority. Retain the
existing product identity, Base UI/Nova primitives and functional architecture.

## Context

The main agent audited the clean `main` working tree before delegating code.
Sources: AGENTS.md, .agent/PLANS.md, README, components.json, global CSS, workspace
layouts, shared components, major product modules, ECharts options/theme,
Storybook stories, API schemas and the current V0.11/V0.12 integration contracts.
CodeGraph was consulted before source inspection. Tailwind v4 owns tokens in
`src/app/globals.css`; there is no separate Tailwind configuration. Base UI/Nova,
Lucide, TanStack Query and ECharts already provide the necessary primitives.

Baseline production build passed. The offline synthetic harness was inspected
on landing, dashboard, practice, profile, analysis, data, accounts, teams, coach,
security, demo and public recommendations. Workspace checks at 1024, 768, 390 and
320 pixels found no document overflow. Screenshots are ignored under test-results.
The browser-review skill's codex-cli.md reference is missing; README and the
actual gateway/E2E configuration supply the current reproducible workflow.

## Audit and approved direction

| Area                  | Observed implementation                                                                                                                                       | Decision                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Visual language       | White cards, navy typography, small blue accents, Geist, thin borders, modest radii and orbital motifs                                                        | Preserve; use existing motifs sparingly on primary recommendations                                                                  |
| Tokens                | Existing info, success, warning, insight, support and canvas families, light/dark values and two shadow levels                                                | Reuse; refine surface contrast and elevation without a new palette                                                                  |
| Reusable components   | Card composition, Panel, MetricPanel, AnalysisView, BatchView, feedback, native/select/toggle controls                                                        | Extend these components instead of creating a competing card family                                                                 |
| Variants              | Card has size and interaction but no content role; semantic badges already exist                                                                              | Add a small role variant set: default, metric, recommendation, analysis and supporting                                              |
| Duplicated components | Public examples already reuse production BatchView and AnalysisView; most specialized team components have distinct permissions/data                          | Retain shared composition; avoid speculative consolidation of unrelated flows                                                       |
| Duplicate information | Dashboard repeats training metrics in a second full ability view; report page expands frozen ALL, frozen recent and current data concurrently                 | Compact dashboard ability summary; disclose report evidence/current profile separately                                              |
| Visual consistency    | Many panels use the same compact padding and full width; purpose is distinguished mainly by titles                                                            | Increase spacing on principal surfaces and use role-specific header/border treatment                                                |
| Hierarchy             | Recommendation rank 1 and later ranks are identical cards; report conclusions compete with large evidence areas                                               | Emphasize backend rank 1, compact secondary recommendations, show conclusions first                                                 |
| Monotony              | Practice is a large neutral intro followed by neutral controls and repeated cards                                                                             | Reduce authenticated intro prominence; group controls and use a soft brand recommendation surface                                   |
| Chart purposes        | Activity line = change over time, radar = relative ability, bars = training coverage, rating line = historical change                                         | Keep chart types and library; remove dashboard's exhaustive distributions from the default overview and retain them on data/profile |
| Background            | Workspace already has a faded dot texture and neutral radial/linear gradients                                                                                 | Refine existing canvas tint; do not layer additional patterns or floating decoration                                                |
| Responsive            | Tested baseline fits all inspected widths; mobile practice spends considerable height before the first recommendation                                         | Preserve navigation/breakpoints and shorten introductory/control regions; adapt hero into stacked content                           |
| Interaction           | Card defaults add hover elevation even on passive content; existing controls/sidebars/reduced-motion handling are sound                                       | Keep navigation/button behavior, use none for data surfaces and deliberate smooth emphasis for actionable surfaces                  |
| Preserve              | Authentication, security, routing, account binding, team permissions/privacy, task lifecycle, query cache boundaries, synthetic labeling, landing composition | No functional refactor or broad page rewrites                                                                                       |
| Redesign              | Shared surface hierarchy, workspace header, practice/recommendation presentation, dashboard overview, report evidence grouping and chart integration          | Focus implementation here; other pages inherit shared improvements                                                                  |

Semantic color responsibilities remain: info/blue = recommendation and interaction,
insight/violet = ability and analysis, success/green = solved/completed,
warning/amber = pending or stale, neutral = account management/supporting details.
Dark mode remains compatible with Storybook even though production is white-led.

Recommendation DTOs support rank, problem metadata/difficulty/tags/platform,
reasonCode/reason, matchedDimension, solvedSinceGeneration, targetRating and
targetDimension. Do not invent estimated time, learning-gain percentages,
confidence, difficulty categories or new API fields. Preserve backend ordering
and reason semantics. A matched dimension is evidence of coverage, not a measured
ability gain. Localized reasonCode copy is retained for bilingual presentation.
Difficulty may be shown against batch targetRating as two factual numbers, without
assuming a rating ceiling or deriving a new recommendation score.

## Scope

### In Scope

- Refine existing shared CSS tokens/surfaces, Card variants and metric hierarchy.
- Evolve workspace headers using existing layout primitives.
- Feature backend rank 1; group batch context, reason, matched dimension and CTA.
- Present secondary recommendations compactly without removing metadata/actions.
- Compact the dashboard; retain backend aggregate queries, source accounts, zero
  evidence, team, invitations and notifications and links to detailed workspaces.
- Report conclusion layout, collapsible frozen evidence/current analysis with
  clear context and preserved historical snapshot values.
- ECharts tooltip/theme integration, readable legends and existing text values.
- Bilingual copy, responsive/reduced-motion handling and representative stories.
- Behavioral regression tests for new hierarchy/disclosure and final browser review.

### Out of Scope

- Dependencies/framework upgrades, new design system or chart library.
- API/client/schema/cache/permissions/authentication changes.
- Production data writes, deployment, commits or publication.
- Rebuilding landing/auth/team management pages or adding speculative features.

## Acceptance Criteria

- [x] Main-agent audit and design decisions exist before delegated implementation.
- [x] Shared variants express semantic roles consistently and remain backward compatible.
- [x] Rank 1 is visually emphasized without changing order, rank or completion state.
- [x] Recommendation reasons, actual matched dimensions and source metadata remain accessible.
- [x] Dashboard distinguishes current activity, ability direction and secondary work.
- [x] Report conclusions remain visible; frozen/current evidence is clearly separated.
- [x] Empty/error/stale/loading and historical cases retain functional behavior.
- [x] Layout fits desktop/laptop/tablet/390px/320px, both locales and 200% text size.
- [x] Full diff reviewed by the main agent; relevant checks and browser review pass.

## Implementation Stages

### Stage 1 - Audit and decision

Files/areas: existing sources and rendered baseline.
Expected result: the decisions recorded above.
Validation: baseline build and offline browser audit.

### Stage 2 - Shared foundation

Files/areas: globals.css, Card, MetricPanel, Panel, WorkspacePage, chart theme.
Expected result: existing primitives gain consistent content-role hierarchy.
Validation: Storybook variant examples, lint/type checks.

### Stage 3 - Product composition

Files/areas: recommendation-card, practice experience, RecommendationsPage,
UserDashboardPage, AnalysisView, PersonalReportView/PersonalReportsPage, i18n.
Expected result: focused recommendation and overview, conclusion-led reports.
Validation: realistic content/nullable/completion/history/error cases.

### Stage 4 - Main-agent review and verification

Files/areas: complete diff, regression tests, docs and rendered frontend.
Expected result: reviewed implementation and documented executable evidence.
Validation: lint, format, typecheck, unit, production build, E2E, Storybook
build/tests and manual offline responsive/keyboard/locale review.

## Testing

- Unit: existing Vitest suite; add logic tests only where behavior warrants them.
- Integration: retain contract/idempotency/account/audience regression coverage.
- E2E: full existing suite plus focused hierarchy/disclosure coverage.
- Build/type/lint: repository scripts; Storybook build and browser suite.
- Manual: offline synthetic preview; no real backend mutations/external navigation.

## Risks

- Shared Card/CSS changes affect public examples, dialogs and team pages: inspect
  representative pages and keep default behavior backward compatible.
- Report disclosure must preserve frozen DTO ownership and expose evidence on
  keyboard activation. Update history tests to explicitly expand evidence where needed.
- New matched-dimension copy must describe coverage without promising improvement.
- Long bilingual text and 200% sizing can overflow compact controls/metadata.

## Rollback / Reversibility

Changes are local UI composition and CSS with no schema or persistence migration.
Revert the scoped UI files, stories, tests and this plan through an ordinary diff.
No production state is changed.

## Progress

- [x] Stage 1 - Main-agent audit and approved direction.
- [x] Stage 2 - Shared foundation.
- [x] Stage 3 - Product composition.
- [x] Stage 4 - Review and verification.

## Final verification

| Check                                              | Result                          | Evidence / limits                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main-agent diff review                             | PASS                            | Complete implementation, stories, tests and docs reviewed; no dependency, API, routing, query or permission changes                                                                                                                                                                                                                             |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | PASS                            | Repository scripts plus final scoped formatting checks                                                                                                                                                                                                                                                                                          |
| `pnpm test`                                        | PASS                            | 17 files, 154 tests                                                                                                                                                                                                                                                                                                                             |
| `pnpm build`                                       | PASS                            | Production static export, repeated after final UI corrections                                                                                                                                                                                                                                                                                   |
| `pnpm build-storybook`                             | PASS                            | Rebuilt after the mode-picker correction                                                                                                                                                                                                                                                                                                        |
| `pnpm test:storybook`                              | PASS                            | 306 tests; final mode-picker change separately rechecked with 12 passing tests                                                                                                                                                                                                                                                                  |
| `pnpm test:e2e` and focused hierarchy rerun        | PASS after assertion correction | Full run: 172 passed, 1 intentional mobile skip and 2 failures in the new chart-count assertion. ECharts exposes an outer named image and inner SVG image; the assertion now counts named charts. All 6 hierarchy cases then passed in both projects, including the two previously failing cases. All 174 applicable cases have passing results |
| Manual rendered review                             | PASS                            | Desktop screenshots of landing, practice, dashboard, accounts, team detail, profile, data, security, demo and reports; mobile practice/dashboard/report screenshots; 96 viewport/locale/text-size checks with no document overflow                                                                                                              |
| Keyboard and lifecycle review                      | PASS                            | Frozen/current evidence expands independently; collapsed charts unmount; account confirmation closes with Escape and restores focus; automated control hover/focus/reduced-motion checks pass                                                                                                                                                   |
| Console and network review                         | PASS                            | No console errors or warnings in the desktop page review, no failed API reads; navigation cancels some local route prefetches                                                                                                                                                                                                                   |
| Real authenticated backend / deployment            | NOT RUN                         | All integration/browser checks use the existing isolated synthetic backend; no production writes or deployment                                                                                                                                                                                                                                  |

Final screenshots and command logs are ignored artifacts under `test-results/`.
The durable component/page conventions are documented in
`docs/development/ui-surface-hierarchy.md` and linked from README.

## Decisions / Deviations

- Installed shadcn CLI docs request failed at the registry network boundary;
  official Base UI Card/Badge/Collapsible/ToggleGroup documentation was inspected.
- Preserve the existing useful landing/auth orbital visuals and interactions.
- No additional illustrations, invented analytics or decorative charts are needed.
- Main-agent review removed duplicate dashboard Rating text from the 30D overview;
  the ALL ability summary owns these current/highest values and source-account
  rows retain their distinct provenance.
- Main-agent mobile English inspection found fragmented mode labels despite no
  document overflow. PracticeModePicker now uses a container query to stack
  choices in narrow content areas and show three columns when sufficient space exists.
- Chart disclosures remain unmounted while collapsed; opening a new report resets
  its evidence disclosure through the report ID key.
- The new dashboard regression originally counted the nested SVG as another
  chart. The corrected assertion counts charts with accessible names and retains
  the actual behavior check: one activity chart and navigation to full ability evidence.
