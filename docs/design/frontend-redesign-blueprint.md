# codeStartrack frontend redesign blueprint

Audit date: 2026-10-07 (Asia/Shanghai). Baseline: `c3aba367672d6719f802a8c2f0023f5e40897daf`, application package 0.13.3. This is a future implementation specification; no production presentation is changed by the audit.

Read alongside [the evidence audit](frontend-design-audit.md), [the skill/library evaluation](ui-skill-library-evaluation.md), and [the execution prompt](../../prompts/frontend-visual-overhaul.md). The execution agent must inspect current source before editing, but need not repeat ecosystem research.

## 1. Design intent

Design an **evidence-led training observatory**: a calm, precise place to understand coding practice and choose the next exercise. The Chinese identity is **码练星轨**; the engineering name is **codeStartrack**. A fine orbit, an ordered trajectory, or a six-dimensional outline can express that identity. It must never suggest a fabricated score, prediction, or improvement guarantee.

The product should feel analytical, encouraging, and trustworthy. Its distinguishing quality comes from a clear training narrative—records → evidence → direction → practice—and careful composition of real supplied information. Preserve the existing restrained light palette, Geist/CJK typography, Lucide icons, semantic blue/violet/teal accents, and readable surfaces. Elevate them into a consistent system instead of adding decorative libraries.

The change is substantial at the composition level: shorten repetitive overview pages, rebuild submission presentation, improve public storytelling, and establish repeatable settings/collaboration layouts. Existing primitives and data architecture are the foundation.

### Reference principles, not templates

- [Linear's UI redesign account](https://linear.app/now/how-we-redesigned-the-linear-ui) supports testing hierarchy across whole view families, aligning application chrome, and separating visual change from product navigation changes. Apply that discipline; do not copy its sidebar, colors, or brand.
- [Vercel Geist](https://vercel.com/geist/introduction) is a reference for typography and consistent interface states, not a replacement component library.
- Award-level craftsmanship means deliberate type, composition, visual continuity, and responsive detail. Awwwards/Webby/FWA recognition is not evidence of accessibility or suitability for a training workspace. No scroll hijacking, cinematic loading gates, or ambient effects are justified here.

## 2. Invariants and truth boundaries

These constrain every design decision. Changing them is outside the redesign.

| Boundary            | Preserve exactly                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime             | Next.js 16.3.6 App Router, React 19.2.8, TypeScript strict, Tailwind v4, `output: "export"`; query-parameter team/member IDs on existing fixed routes                                                                               |
| Components          | Source-owned shadcn `base-nova`, Base UI `render`/`nativeButton` semantics, existing aliases and shared wrappers                                                                                                                    |
| Data                | Central `src/lib/api/` client and runtime validation; same-origin `/api/v1/**`, credentialed sessions, opaque decimal-string bigint IDs and UUIDs                                                                                   |
| State               | TanStack Query keys scoped by user/account/team/audience/window/mode/page/filter; cancellation, cache withdrawal on access loss, session cleanup, mutation ownership guards                                                         |
| Personal evidence   | `/profile` and `/dashboard` use backend-owned deduplicated user aggregates; selecting an account changes only account-scoped views                                                                                                  |
| Historical evidence | Reports/history use their supplied frozen snapshots; current analysis never replaces them; preserve supplied timezone/date/UTC distinctions                                                                                         |
| Recommendations     | Backend order, rank, modes, reasons, matched dimension coverage, counts, limits, explicit generation, idempotent retries, null links, completion, job states and cooldowns                                                          |
| Collaboration       | Additive COACH role, fresh per-team `canManage`, independently authorized member training/ability/submissions/reports, independent privacy scopes and audience caches                                                               |
| Guest behavior      | Workspace chrome and `/practice` remain browsable. Private sections retain their applicable session/role/resource gates; selected-account gates apply only to account-local operations, and private queries never mount prematurely |
| Product claims      | Describe implemented contract capabilities with readiness/permission conditions. Synthetic previews remain explicit. Do not claim live service availability from source, old plans, or audit screenshots                            |
| Deployment          | No deployment, publication, production mutation, credentials, infra changes, or route migration accompanies presentation work                                                                                                       |

Read the installed Next documentation for static exports, client/server boundaries, and lazy loading. Do not add Server Actions, request-time cookie rendering, dynamic team routes, or runtime API handlers to this export. Keep client boundaries narrow where feasible, without moving session-protected data into build-time pages.

## 3. Token system

Use `src/app/globals.css` and its existing `@theme inline` mappings as the only global token authority. Keep Storybook on that stylesheet. The following values are design starting points and acceptance roles, not claims that all current colors have passed contrast testing.

### Color and surface roles

| Role                     | Target light values / treatment                                                       | Constraint                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Canvas                   | Existing `--canvas: #f3f5f8`                                                          | Distinguishes page from reading surfaces; avoid flat white everywhere                     |
| Reading surface          | White, normally opaque or the existing 96% card mix                                   | Forms, reports, dense lists and charts stay legible                                       |
| Context panel            | Existing 86% card mix, or an opaque muted layer where contrast requires it            | Context and selected summaries, not every section                                         |
| Supporting surface       | Existing 76% card mix, or no enclosure with separators                                | Sources, history and metadata; alpha never applies to text                                |
| Main text                | Existing `#111827`                                                                    | Primary actions retain ink/white rather than turning every control blue                   |
| Secondary text           | Existing `#5f6b7d`                                                                    | Verify on the actual composite background, especially small labels                        |
| Interactive blue         | Existing `#315fd3`, soft `#eef3fd`                                                    | Links, active account/context and recommendation actions                                  |
| Evidence violet          | Existing `#7156ad`, soft `#f4f1fa`                                                    | Profile/analysis meaning; never arbitrary alternating cards                               |
| Team teal                | Existing `#22756f`, soft `#edf6f5`                                                    | Shared training/team context, never pending-status orange                                 |
| Success                  | Existing `#187347`, soft `#edf7f0`                                                    | Solved/completed states plus a label/icon                                                 |
| Warning                  | Existing `#946014`, soft `#fcf5e8`                                                    | Pending/stale evidence plus text                                                          |
| Failure                  | Existing `#b32644`, soft `#fff0f3`                                                    | Error/destructive meaning, not general emphasis                                           |
| Divider / control border | `#e5e7eb` for passive separators; existing `#8b95a5` for light control identification | Do not weaken form borders to divider color without another adequate identifying boundary |
| Focus                    | Existing info/ring family with 2px outline and offset                                 | Remains visible on white, tinted surfaces and dark stories                                |

Retain and verify the existing `.dark` tokens in Storybook and chart tests. A public theme-switch feature is not part of this work. Do not paste unrelated dark palette classes over semantic tokens. Selected state, error, success, historical state and permission state must never rely on color alone.

### Typography

Keep Geist Sans, Geist Mono, and the existing PingFang SC/Microsoft YaHei/Noto Sans CJK fallbacks. Do not add a remote display font or a large CJK font download for novelty. Check both locales at actual rendered sizes.

| Role                             | Proposed scale                                   | Usage                                                                    |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Public hero                      | 40–64px fluid, weight 600, line height 1.15–1.25 | One main promise; balanced line breaks, no giant display type in the app |
| Public section                   | 28–36px, weight 600, line height 1.25–1.4        | Clear section rhythm                                                     |
| Workspace page                   | 28–32px desktop; 24–28px mobile                  | One h1 per route, compact page identity                                  |
| Section / primary recommendation | 20–24px; 24–30px for the featured problem        | Separate conclusion/action from metadata                                 |
| Body                             | 14–16px, line height 1.5–1.7                     | Long report prose typically 16px within a readable measure               |
| Control / row                    | 14px, line height ≥1.4                           | Tolerates wrapping, no clipped translated option text                    |
| Metadata                         | 12–13px, line height ≥1.5                        | Dates, provenance, small labels; never the only important instruction    |
| Numeric data                     | 24–32px for selected headline values; 14px rows  | Tabular numerals; mono only for numbers/IDs, not whole paragraphs        |

Use ordinary Chinese tracking; wide English eyebrow tracking must not spread Chinese labels excessively. Avoid italic-looking numerals where data alignment matters. Do not change exact numeric values, rounding contracts, backend ranks or dimension order to balance a layout.

### Spacing, width and grid

Use a 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 and 80px. Encode genuinely shared roles; do not create tokens for every one-off gap. Controls and their labels stay together; a large gap should mark a section change.

- Public pages: outer maximum 1280px, 20px mobile / 32px desktop gutters, 64–80px desktop section intervals and 40–48px mobile intervals. A hero may use more space when its preview earns it.
- Workspace: preserve approximately 240px expanded / 68px collapsed desktop sidebar. Main region uses 24–32px desktop gutters and 16–20px mobile gutters, adapting to real content width after the sidebar.
- Wide workspaces: up to 1200–1280px content, with a 12-column composition where useful; main action/evidence 8 columns and supporting context 4. This is not a rule to force every page into a bento grid.
- Reading/settings: use 640–800px form/prose measure inside the workspace. Auth form approximately 400–480px; surrounding desktop illustration is subordinate.
- Chart geometry uses its container, not only viewport breakpoints. Collapse radar/value columns when their useful width is insufficient even at a nominal desktop viewport.
- At 768px, evaluate both open-sidebar available width and mobile navigation behavior. Do not shrink desktop data tables until they become illegible.
- Mobile becomes a deliberate sequence: page identity → context/control → primary result/action → secondary evidence/history. No horizontal page scrolling at 320px/390px, either locale or 200% text.

### Borders, radius and elevation

Keep the existing 10px base radius. Prefer 6–8px small controls, 10–12px panels, 14–16px major reading/feature surfaces, and up to 20–24px isolated public illustrations. Pill radius is for compact badges, not every control. Establish these roles from the existing radius family instead of scattering hardcoded arbitrary values.

One 1px border separates ordinary surfaces. A semantic side accent belongs on the main evidence/context module, not every repeated submodule. Passive sections need no hover elevation. Existing `--surface-shadow` is sufficient for ordinary panels; `--raised-shadow` is reserved for overlays or one deliberate public/featured surface. Prefer no shadow for dense repeated rows. Never add three nested borders merely to distinguish a label, its section, and its enclosing page.

### Background treatment

Keep shell-owned fixed washes/grids subtle and static. Public and auth pages may use one orbit drawing; workspace evidence should dominate its background. Preserve `isolation: isolate`, noninteractive decoration, and fixed containing-block assumptions. No shell transforms, blur layers, filter/containment changes, scroll listeners for background movement, canvas particles, WebGL, or permanent `will-change` promotion.

Full-page screenshots can paint a fixed pseudo-element only in the initial viewport. Verify a scrolled viewport before diagnosing missing wash; this audit confirmed the workspace wash remains visible while scrolling.

## 4. Composition and component strategy

| Decision                      | Components/areas                                                                                                                                        | Target                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| KEEP                          | Base UI button/input/field/select/dialog/sheet/alert-dialog/toggle/toast wrappers; Lucide; locale/query providers; ECharts adapter and palette resolver | Preserve tested semantics, ownership and import boundaries                                                  |
| REFINE                        | `Card`, `Panel`, `MetricPanel`, `FormInput`, `ChoiceSelect`, `DetailsDisclosure`, page headers, sidebar/account switcher                                | Explicit purpose, density and passive/actionable behavior; narrow extensions with real reuse                |
| REBUILD presentation          | Landing flow/capability narrative; desktop submission listing; dashboard composition; public zoom/header behavior                                       | Clear hierarchy and task-oriented layouts without replacing data owners                                     |
| MERGE presentation            | Repeated context/date rows, generic plus local skeletons, equally prominent support containers                                                          | One context explanation per region; preserve all supplied information in accessible disclosure if secondary |
| REMOVE only proven redundancy | Motion with no user purpose; release label with no verified public meaning; duplicated wrappers; dead CSS after caller verification                     | Never remove a route, permission notice, public mock label, datum, or mutation solely for aesthetics        |

Preserve the current Card semantic variants. Make passive behavior the default or explicitly audit every caller before changing its default. Reserve `lift` for a real discoverable link/action; controls embedded in a passive panel get local feedback without making the whole panel look clickable. Noninteractive five-step landing flow should become a connected ordered rail/list, not five lifting cards. Use source-owned SVG/CSS for its trajectory and mark decoration hidden from assistive technology.

Do not introduce a competing `design-system/MASTER.md`, universal page builder, new context framework, or parallel primitive directory. Existing feature files should own composition. Promote a presentation abstraction only after two actual uses are clear.

### Page-by-page target

| Routes                                                                  | Presentation priority                                                                                                                                                | Behavior/evidence guard                                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                     | Preserve split hero but make product evidence more legible; connected five-step process; fewer repetitive capability containers; one clear next-step CTA per section | Keep practice entry, read-only demo disclosure and actual supported-source claims                                                                  |
| `/product`, `/product/profile`, `/product/recommendations`, `/about`    | A common editorial frame; factual capability explanation, a meaningful sample, then an action; resolve stale global unavailable claims                               | Separate synthetic samples, implemented contract, readiness/permissions, and unimplemented future Agent capability                                 |
| `/demo`                                                                 | Share workspace styling and teach the training loop with a small persistent synthetic label                                                                          | Stay local/read-only; do not blend fixture data into personal API state                                                                            |
| `/login`, `/register`, `/reset-password`                                | Strong field grouping/contrast, concise requirements, local errors and stable pending layout; quieter illustration                                                   | Captcha refresh/expiry, email cooldown/verification binding, password rules, successful reset, session invalidation and reauthentication unchanged |
| `/dashboard`                                                            | Primary next-practice direction, concise ability/activity overview, then report/team updates; shrink repeated wide metric/chart blocks                               | Use `UserDashboardPage`, backend user aggregate; deeper evidence belongs on profile/data and remains reachable                                     |
| `/practice`                                                             | Modes and account context before explicit generate action; result count/time, one featured recommendation, compact remaining queue, secondary source/history         | No auto-generation, rank reshuffle, invented gains, disabled valid actions, or altered idempotency                                                 |
| `/profile`, `/accounts/profile`                                         | Integrated direction+context; meaningful radar paired with six exact rows; secondary evidence/history/source disclosures                                             | User/account scopes remain distinct; null ≠ zero; historical label unmistakable; polygon remains data-driven                                       |
| `/analysis`, `/accounts/analysis`                                       | Conclusion and action before evidence; comfortable report typography; compact history; clear current versus frozen context                                           | No joining live analysis into a report; existing snapshot and pagination behavior preserved                                                        |
| `/data`                                                                 | Compact controls; fit timeline/distributions to data density; aligned desktop submissions with expandable mobile detail                                              | Preserve complete submission metadata, filters, tabs, pagination, pending verdicts, null difficulty and external-link behavior                     |
| `/accounts`                                                             | Selected active binding, sync readiness and action hierarchy; quieter read-only/unbound history                                                                      | Keep bind/unbind confirmation, selected-account isolation, cooldown/error/retry and historical access                                              |
| `/teams`, `/teams/detail`, `/teams/member`                              | Compact team/task lists, a clear team context bar, orderly authorized tabs, shared-domain access explanations                                                        | URL state, fresh capabilities, independently shared domains, archive/dissolve/owner rules and audience isolation unchanged                         |
| `/coach`, `/coach/teams`, `/coach/teams/create`                         | Work queues and managed-team direction before decoration; concise creation form                                                                                      | COACH is additive; global role never substitutes for `canManage`; no invented global queue API                                                     |
| `/privacy`                                                              | Four independently explained settings in a readable form, clear pending/confirmed save                                                                               | Never merge privacy domains, optimistically fake success, or expose revoked data                                                                   |
| `/notifications`                                                        | Scannable rows grouped visually by state/type/time using supplied references                                                                                         | Preserve links and read-state/unread-count invalidation; no fabricated notification grouping semantics                                             |
| `/security`, `/security/password`, `/security/email`, `/security/coach` | A calm identity/security frame with restrained destructive emphasis; field-local recovery                                                                            | Retain identity verification, eligibility, logout/cache clearing and reauthentication                                                              |

A compact dashboard may move detailed charts behind an accessible disclosure or retain a concise version; it must not silently delete the data. Preserve initial filter/tab selections and URLs unless a specific behavior change is separately approved. Do not polish the unrouted legacy `DashboardPage` instead of the current dashboard.

### Representative composition contract

These are proposed arrangements, not descriptions of completed work. They make page-level change testable instead of allowing a token pass to leave the same stacked composition.

| Family               | Proposed composition                                                                                                                                                                                                                                                                                         | Visual proof                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard            | Compact page/context row; main 8-column next-practice direction with a 4-column concise ability snapshot; one activity metric strip and 220–260px timeline; report/team/invitation/notification updates as grouped support rows; deeper distributions/sources/history in clearly reachable secondary regions | At 1280/1440 desktop with settled ordinary fixture, next action and a compact ability/activity summary are visible in the first useful viewport. Supporting rows do not force repeated full-width evidence cards. Mobile follows the same priority order |
| Practice             | Compact page/refresh row → selected account → wrapping mode choice with concise help → count and explicit Generate in one compact control group → batch time/status → featured problem identity/action → remaining queue → sources/history                                                                   | At 390×844 default text with existing batch, reduced chrome makes the result/action recognizable in the first useful viewport. All modes/count/current account remain accessible; expanded help is secondary                                             |
| Analytical reading   | Direction and window controls → meaningful radar/exact six-row pair → concise source/time context → supporting evidence/history; frozen report has its own reading measure and context                                                                                                                       | Compare current/history/null/zero states; actual score vertices and report-owned values survive. No huge empty chart column or repeated context panels                                                                                                   |
| Data/settings        | Desktop filter toolbar and aligned submissions; mobile primary row plus full detail. Settings use a focused form measure with local pending/error/success                                                                                                                                                    | At least three primary submission rows can be compared together in the aligned browsing viewport; every metadata field remains available. Long form text and zoom remain usable                                                                          |
| Collaboration/public | Viewed member and shared-domain identity before evidence; compact team context/tabs and coach support rows. Public pages use an editorial evidence/process narrative with one restrained trajectory illustration                                                                                             | All four member domains retain authorization and provenance. Owner tabs are usable at 320px. Public pages and application share type/shape/colors while serving different reading tasks                                                                  |

Use the already-authorized `TeamMemberDto.user` to name the viewed member separately from the signed-in user. TeamMemberDto contains teamId, not team name: reuse only a correctly scoped permitted source if present, otherwise keep a team link/ID. Do not fetch or combine unrelated private domains to populate a header. Preserve no-binding access on user-aggregate/team/privacy/notification/security pages; selected-account gates belong only to account-scoped operations.

Define shared dense/standard/comfortable control roles of approximately 32/40/48px, with touch hit areas verified separately. An existing prop name may stay compatible; do not proliferate route-local height overrides. Synchronization supports ACTIVE and INVALID bindings for recovery under current guards. Account-local rebuild/recommendation generation requires ACTIVE; aggregate/team actions keep their independent prerequisites.

## 5. Charts and analytical clarity

Keep Apache ECharts 6.1, SVG rendering, lazy loading and centralized browser-resolved CSS colors. No shadcn Recharts chart import. Keep current resize/theme/update/reduced-motion lifecycle fixes.

- Place the question, supplied time window and data context above the plot. State the important takeaway in text without inventing derived analytics.
- Dashboard timeline target height 220–260px; analytical timelines/distributions 240–300px; radar approximately 240–320px depending on actual container. These are starting ranges; label legibility decides final size.
- A sparse valid timeline retains its full requested window and zero-fill display contract. Compress its vertical footprint; do not remove quiet days or imply a trend absent from the DTO.
- Keep consistent blue submissions, green solved, amber pending, neutral attempted, violet ability, teal team participation. Legends and textual values stay available beyond tooltips.
- Preserve all six dimension values, keys, order/rank invariants and weakest-dimension identity. Do not equate a visible empty radar grid with successful plotting.
- At small widths place exact rows below the radar. Use readable axes/legend layout rather than shrinking all labels.
- Null analysis is unknown/not generated, not a zero polygon. Genuine supplied zero evidence keeps zeros and its explanation. Malformed payload remains a data-format error with retry.
- Frozen/current time contexts and report UTC are displayed once clearly and retained in disclosures where necessary.
- Keep bound tag display and accessible complete values; do not turn a display limit into a calculated ranking.

## 6. Feedback and forms

Use one feedback hierarchy: field issue → operation issue → region issue → page access gate. Primary form errors associate with their fields; server/global failures remain a scoped Alert. Toasts supplement actions that leave their origin rather than duplicate every failing query alert.

Refine `DataRegion` loading presentation while keeping its children mounted and cached successes intact. Use shape-matched local Skeletons for first load, small inline refetch indicators for existing data, and stable empty/partial/error regions. Audit duplicate notifications before changing toast coordination; never silence a distinct actionable failure.

Pending controls keep label/width, show Spinner and status text, prevent duplicate submission, and preserve useful focus unless a deliberate success/error recovery moves it. Confirmation dialogs have a title/description, safe initial focus, predictable Escape dismissal and trigger return. Success is perceivable inline as well as by color. Long metadata should wrap or disclose; essential instructions cannot be truncated into inaccessible hover text.

The CAPTCHA contract currently provides only a visual challenge. Do not invent an audio/nonvisual endpoint, hide the CAPTCHA, or bypass it. Improve the surrounding form accessibility and report the external nonvisual alternative as a backend dependency. Do not claim full WCAG compliance while that gap remains.

## 7. Motion contract

The default coherent motion layer is **CSS + existing `tw-animate-css` + Base UI state attributes**. No Motion dependency is needed for these goals. [Base UI animation guidance](https://base-ui.com/react/handbook/animation) supports reversible CSS transitions for interrupted overlay interactions. Consult exact installed component APIs before implementation.

| Event                          | Duration / easing direction            | Rule                                                                        |
| ------------------------------ | -------------------------------------- | --------------------------------------------------------------------------- |
| Hover/focus state color        | 120–160ms ease-out                     | Focus indicator appears promptly; passive panels remain stationary          |
| Press/release                  | 80–120ms                               | Subtle local response; avoid generic 0.97 scaling of every filter/control   |
| Menu/popover/tooltip           | 140–180ms                              | Opacity plus at most 2–4px displacement, reversible                         |
| Dialog/Sheet                   | 180–240ms, `cubic-bezier(.22,1,.36,1)` | Existing Base UI lifecycle, no abrupt visibility switch or bounce           |
| Sidebar change                 | 220–240ms                              | Geometry and labels remain continuous; no orphaned tooltips in mobile Sheet |
| Useful content state entry     | 160–220ms                              | Local continuity, never delay readable results or replay the whole page     |
| One public illustration reveal | At most 300–400ms, once                | Optional; meaningful static version is fully usable                         |

Do not animate route containers as a global exit/entry system. Next navigation, focus, scroll restoration and query observer lifetimes must remain predictable. No indefinite marquee with a meaningless pause control, floating dashboards, cursor tilt around interactive content, animated number counters, error shakes, blanket scroll reveal, route crossfade scaffold or persistent ambient movement.

With `prefers-reduced-motion`, remove nonessential movement, animated chart transitions and scroll behavior. Keep pending state visibly understandable using static status text/icons. Test rapid open-close-open and account/locale switching while motion is active. Do not replace disclosure unmount rules that avoid initializing hidden charts.

Motion (`motion/react`) is a reconsideration candidate only if a specific necessary continuity interaction cannot be implemented robustly with the current tools. Document the case and route baseline; review version/license/SSR assumptions; build a small reversible isolated prototype; then measure the route cost and retain it only if the gates pass. It is not a default phase requirement.

## 8. Accessibility and responsive acceptance

Target WCAG 2.2 AA for frontend-controlled presentation and interaction. Manual checks accompany automated results; an addon or passing overflow assertion cannot certify the product.

- Text contrast ≥4.5:1 for ordinary text and ≥3:1 for eligible large text; identifying control boundaries and essential state graphics ≥3:1. Test composited surfaces and disabled/read-only explanations.
- Controls meet WCAG target-size requirements; aim for 40–44px touch controls without falsely calling 44px a universal WCAG AA minimum.
- Keep one h1, logical headings, landmarks, real links/buttons, labels, accessible errors, live status, and icon names for icon-only controls.
- Keyboard reaches skip link, navigation, mode controls, account choice, disclosure, chart values, form fields and actions. Overlay focus is contained/returned. Escape works predictably; nested tooltips must not consume mobile navigation dismissal invisibly.
- Check closed and expanded public/mobile navigation at 320px with 200% root text sizing. Width alone is insufficient: a large sticky header must not obscure most of the reading viewport. Reflow, local scrolling or nonsticky stacked chrome may solve this without losing actions.
- Check 1440, 1280, 768, 390 and 320px in both zh-CN and en; also test long names, IDs, translated options and dense records. Adapt by available container width and test sidebar collapse/expansion.
- Test default/hover/focus/pressed/disabled/pending/empty/error/success/read-only/stale/partial states. Permission loss withdraws hidden data; it is not merely a visual empty state.

## 9. Phased roadmap and gates

Create `.agent/plans/frontend-visual-overhaul.md` using `.agent/PLANS.md` at implementation start. Record baselines, affected areas, risks, measurable acceptance, rollback and actual progress. Avoid an all-at-once CSS rewrite.

| Phase                    | Work / owners                                                                                                                                 | Exit evidence                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Establish            | Read this pack; check git/current versions; inspect relevant installed guides; capture current routes/states; classify baseline test failures | Source/behavior preservation matrix; before screenshots; current lint/format/type/unit/build results; no live mutations                                                       |
| 1 — Foundations          | Tokens/type/spacing/borders/elevation and Card/Panel/control contracts; production Storybook specimens                                        | Lint, format, type and relevant unit checks; production build; Storybook build/tests; two locales/light+dark specimens; measured contrast/reduced motion                      |
| 2 — Shared chrome        | Public/workspace/auth headers, sidebar and account context, mobile Sheet/zoom composition                                                     | Lint/format/type/unit/build; targeted navigation/entry/locale/accessibility E2E; desktop→mobile screenshots; focus and Escape/zoom results                                    |
| 3 — Training loop        | Dashboard, practice, profile and analysis; chart density and current/frozen context                                                           | Lint/format/type/unit/build; profile-radar/recommendation/loading/states/algorithm/history E2E; actual vertices, rank/data preservation and local feedback evidence           |
| 4 — Data and settings    | Submission presentation, accounts/sync, auth/security/privacy/notifications                                                                   | Lint/format/type/unit/build; filters/pagination/auth/cooldowns/settings/cache/permission E2E; mobile detail and 200% text; form contrast and confirmation review              |
| 5 — Collaboration        | Teams/member domains/coach queues/settings, shared density and task navigation                                                                | Lint/format/type/unit/build; team-workspace/team-analytics/collaboration scenarios + Storybook; authorization/audience withdrawal results; long/dense states                  |
| 6 — Public narrative     | Landing/showcase/about/demo; correct source/doc copy conflict; systematic brand expression                                                    | Lint/format/type/unit/build; public product/demo/entry/locale E2E; both locales on all widths; synthetic disclosure, truthful capability copy, meaningful static illustration |
| 7 — Whole-product review | Remove only verified redundant presentation, harmonize all page families; independent design/accessibility/architecture critiques             | Full checks below; before/after evidence; production export and Storybook inspection; all P1 design defects resolved or explicitly blocked; no API/behavior regression        |

Targeted checks after each phase do not replace final suites. Stop preview before E2E (ports 3100/3210); never build while `next dev` owns `.next`. Storybook's tests own 6007 and must not collide with a manual server. Do not weaken valid tests when a legitimate layout change requires updating an assertion; preserve its behavioral purpose and document why.

Final required commands:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm build-storybook
pnpm test:storybook
```

Also explicitly check formatting of this design pack and the execution prompt because the existing `format:check` script does not cover general `docs/**/*.md` or `prompts/**/*.md`. Container tests are required only if serving/build/container behavior is affected; deployment remains a separate operation.

Add meaningful screenshot regression coverage using the installed Playwright tools when a layout risk merits it. Baselines require direct visual review and documented acceptance in a controlled browser/font/locale/fixture environment, using the existing review workflow without inventing a new user-permission gate. Mask only volatile metadata, never critical evidence or an error. Do not add a SaaS visual service or accept new baselines automatically just to make a check green.

## 10. Performance and definition of done

Record comparable route transfer/JS requests, asset sizes, chart loading, layout shifts and console output before/after. Keep chart code out of public/auth route loads unless their real composition needs it. No eager Motion/WebGL/large image assets, duplicate icon/font libraries, or extra data requests for decoration. Static CSS/SVG is the brand-art default. Treat library size estimates as unknown until measured in this application's production build.

Measure under the same production export, browser version, fixture, viewport and documented network/CPU/cache conditions. Use fresh contexts for comparable cold loads, keep warm loads a separate measurement, record the same explicit UI-ready condition, and repeat timings at least three times to compare medians rather than one noisy sample. Investigate any unexplained >10% increase in key-route transferred JavaScript or measured navigation readiness; this is a proposed review trigger, not a fabricated performance guarantee. Use field Core Web Vitals targets as goals, not claims established by a local screenshot run. Avoid CLS, especially pending buttons, asynchronous context rows and chart initialization.

Done means all listed page families share the system; the primary task is clear in their first useful viewport; behavior/data/privacy invariants pass; every state remains usable; required suites pass in a suitable environment; responsive/manual accessibility evidence exists; there are no unreviewed route/runtime cost regressions; and source-owned components are maintainable. Independent subagents must challenge the final pages, preserve constraints, and revise obvious high-impact defects before the execution agent reports completion.

Known external limitation: nonvisual CAPTCHA requires a backend capability. Report it precisely while completing all frontend-controlled improvements. Audit baseline results and current source take precedence over historical green check claims. Do not claim tests, live backend integration, full WCAG compliance, or performance numbers that were not verified.
