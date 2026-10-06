# UI surface hierarchy

codeStartrack keeps the existing shadcn Base UI/Nova composition, near-white primary
surfaces, dark typography, brand blue and Geist typography. Tailwind v4 resolves
the shared tokens in `src/app/globals.css`; Storybook imports that same stylesheet.

## Typography, reading measures and control density

Body and heading stacks share Geist, PingFang SC, Microsoft YaHei and Noto Sans
CJK fallbacks. Body line height is 1.6; Chinese headings and eyebrows retain
ordinary character spacing. The shared `page-title`, `section-heading`,
`meta-label` and `headline-number` classes express hierarchy independently from
panel padding. Numeric headlines use tabular figures.

Use the shared reading measures instead of introducing route-local widths:
`max-w-workspace` (80rem), `max-w-reading` (48rem), `max-w-form` (42rem) and
`max-w-auth` (28rem). Their application to page families belongs to the shell and
feature composition. Public section intervals use 48/64/80px across widths.

Control density tokens are `--control-dense` (2rem), `--control-standard` (2.5rem)
and `--control-comfortable` (3rem). Controls can grow for wrapped translated
labels; density must not clip content at increased text sizes.
Icon-only controls use the matching `--control-icon-*` physical 32/40/48px
targets so enlarged text does not consume the entry space of adjoining fields.
The Brand mark also retains its standard physical 40px size while its name scales.

Shared motion roles are 100ms press, 150ms control state, 180ms overlay,
220ms panel and 240ms sidebar, using `--motion-ease` for spatial continuity.
Ordinary controls change color and boundaries without generic lift or scaling.
Decorative public/auth/practice movement is static; local feedback can use a
short opacity transition. Reduced motion keeps state visible without movement.

Anchored menus, tooltips, popovers and directional selects use `popup-motion`
with Base UI starting/ending attributes, opacity and a 4px offset toward their
trigger. Instant paths and aligned `data-side="none"` selects remain stationary.
Modal panels preserve their positioning and focus lifecycle; closing and reopening
reverse transitions rather than replaying entry keyframes. Reduced motion removes
the displacement. Never hide an open modal with responsive CSS: close its Root so
focus and page interactivity recover through the component lifecycle.

## Viewport background and scrolling content

The public, workspace and authentication shells own their decorative backgrounds.
Their pseudo-elements use `position: fixed` and viewport bounds, so light, grids,
dots and the public orbit stay visually stable while document content scrolls.
Reading cards, supporting section surfaces and local illustrations remain in normal
content flow.

The workspace background combines fixed pale blue, violet and teal washes over
the neutral canvas. It remains visible between modules and through the quieter
supporting surfaces. Shared surface tokens use the current card color, so their
light and dark values remain consistent without page-specific color overrides:

| Token                | Opacity / responsibility                                        |
| -------------------- | --------------------------------------------------------------- |
| `surface-reading`    | 96% card color; primary text, forms, recommendations and charts |
| `surface-panel`      | 86% card color; focused metrics and workspace context           |
| `surface-supporting` | 76% card color; history, sources and secondary information      |
| `surface-border`     | 80% border color; quieter boundaries between surface layers     |

These surfaces use alpha composition without backdrop blur. Keep text on a
near-white reading layer when stronger contrast is needed. Do not apply opacity
to entire components: labels and controls must retain their full contrast.

Each shell uses `isolation: isolate`; its base paints below the negative decorative
layer and its content paints above it. `pointer-events: none` keeps decoration out
of pointer interaction. Keep transforms, filters and containment off these shell
ancestors: they can change the containing block of a fixed descendant. Apply local
motion to controls or illustrations instead. The viewport decorations use no
scroll listeners, animation, backdrop blur or permanent layer-promotion hints.

The practice intro orbit is a static detail of its card. Card and control motion
continues to follow the shared reduced-motion rules.

## Semantic accents

| Existing token family         | Meaning                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `info` / `info-soft`          | Recommendation context, account data and interactive guidance |
| `insight` / `insight-soft`    | Ability and analysis                                          |
| `success` / `success-soft`    | Solved problems and successful/completed status               |
| `warning` / `warning-soft`    | Pending work and stale evidence                               |
| `destructive` / `danger-soft` | Failure or destructive actions                                |
| `support` / `support-soft`    | Team context and training participation                       |
| `canvas`, `muted`, `card`     | Page backdrop, supporting areas and primary white surfaces    |

Choose colors by meaning, not by a card's position in a grid. Keep status text or
labels beside the color so that users do not need color alone to understand it.
Light and dark values live in the existing token definitions.

## Existing Card variants

| `variant`        | Use                                                                         |
| ---------------- | --------------------------------------------------------------------------- |
| `default`        | Ordinary content and account management; existing callers remain compatible |
| `metric`         | Current values that answer a focused status question                        |
| `recommendation` | The backend's first recommended problem, with reason and next action        |
| `analysis`       | Ability or report conclusions and their supporting charts                   |
| `supporting`     | Secondary context, history and lower-priority information                   |

`variant` expresses content purpose. The optional `tone` adds `info`, `insight`
or `support` context to a panel without changing its responsibilities. Analysis
and recommendation variants choose insight and info by default. MetricPanel
derives tone from the meaning of its title and each metric; unknown values remain
neutral, while real numeric zero retains its semantic meaning.

`size` controls spacing; CardTitle's `titleRole` chooses default, section or
supporting typography independently of that spacing. Panel and MetricPanel use
the section role for their h2. `interaction` controls hover behavior and defaults
to `none`. Passive forms, data and charts remain stationary;
reserve `lift` for actionable discovery surfaces. Keep the established CardHeader,
CardTitle, CardDescription, CardContent and CardFooter composition. Use a single
semantic cue for evidence/recommendation surfaces rather than stacked gradients,
colored edges, tinted cells and colored numbers. Metric rows keep neutral values
and one semantic accent line. Extend Panel
through its Card props instead of creating a separate general-purpose card.

## Page responsibilities

WorkspacePage's `measure` selects workspace, reading or form width independently
of authorization. Form routes use the focused measure; chart-heavy analysis stays
wide until its internal composition supplies a narrower reading region. The shared
page header uses the page-title role without repeating the sidebar brand or selected
binding. Signed-in identity lives in the sidebar footer, including the mobile Sheet;
the account selector and binding status appear on account-scoped routes. Aggregate,
team and security views retain their independent no-binding access rules.

Navigation group choices persist across client route/query changes, desktop
collapse and mobile Sheet dismissal. Long navigation labels wrap and grow; only
collapsed desktop icons own tooltips. Sidebar geometry uses physical 240px/68px
widths so enlarging text does not consume the reading column; expanded labels
grow while invisible collapsed labels are clipped. Form grids respond to the
containing panel's available width rather than only the viewport breakpoint.
On route entry the sidebar reveals an available active link within its own
scrolling pane, preserving document scroll, focus and closed group choices.
Narrow public chrome scrolls with the page,
and its menu uses a locally scrolling Sheet bounded to half the viewport.

- Dashboard: current activity, concise ability direction and entry points to
  deeper work. Full ability evidence belongs on profile; detailed distributions
  belong on data/profile rather than being repeated on the overview.
- Practice: training controls, ranked recommendation, then remaining problems,
  source snapshot and history. Backend rank/order and completion state remain
  unchanged. Matched dimensions describe supplied coverage, not predicted gains.
- Analysis: report conclusions and actions first. Frozen report evidence and
  current aggregate evidence are separate disclosures; each retains its own DTO
  and time context. Never replace frozen numbers with a current query response.
- Account and team management: retain existing navigation, authorization and
  mutation boundaries. Shared surface changes do not change their data sources.

## Charts and disclosures

Keep ECharts and the existing CSS-backed palettes. Activity uses blue for
submissions, green for solved problems and amber for pending results. Attempted
versus solved distributions use neutral and green; ability uses insight.
Theme-resolved tooltips, scrollable legends, SVG rendering, responsive resize and
reduced-motion support remain centralized in the shared chart layer.

Use the existing DetailsDisclosure for secondary evidence. Its panel variant
provides a wrapping, keyboard-accessible trigger. Chart disclosures opt out of
`keepMounted`, so collapsed evidence does not initialize invisible charts. Inline
text disclosures keep their established default behavior. Expanded evidence still
provides text values and headings; charts are not the only access to information.

Check both locales, long metadata, nullable difficulty, missing URLs, completed
recommendations, empty candidates and stale/error states. Verify at 320px, 390px,
tablet, laptop and desktop widths, with keyboard input and 200% text sizing.

## Evidence and recommendation context

Missing analysis is unknown, not a zero-valued profile. Keep metric and evidence
section structure during loading or failure, use Skeleton for pending data and
the existing unavailable/empty feedback after it settles. Initialize a radar and
dimension bars only when a real analysis DTO exists. A genuine zero-evidence
snapshot retains its supplied zeros and explicit no-evidence explanation.

Activity charts expose their plotted values through a keyboard-accessible
DetailsDisclosure. Shared training views expose only their authorized DTO values;
they do not join private ability data. Tag charts display at most ten supplied
tags in their original order, with complete values available below. This is a
display bound, not a calculated ranking. Rating trends reuse the established
axis, tooltip and legend conventions; contest entries retain exact ratings.

The featured recommendation remains stationary while its controls respond
locally. Supporting problems use compact composition rather than repeating the
hero. Generated timestamps use the existing locale formatter and explicit UTC
context, retaining the original instant in `time[datetime]`. Backend ordering,
rank, completion, mode and generation behavior remain unchanged.

## Supporting information and absence

Use the embedded EmptyState composition inside existing cards and chart panels;
the enclosing surface already supplies grouping. Keep the standalone variant for
page-level guidance. A missing aggregate profile composes its account/rebuild
guidance into the dimension section once rather than repeating empty containers.
Unknown metric values use neutral text; valid numeric zero retains the metric's
semantic tone.

The dashboard gives the personal report a distinct analysis surface and groups
teams, invitations and notifications as supporting updates. Destination links
name their purpose, and lists retain complete supplied names and counts. Guest
practice uses one authentication prompt beside the history explanation. Reuse
Field and FieldLabel with native checkbox semantics for history filtering; keep
the whole label clickable, visible keyboard focus and the original read-only
behavior.

Responsive checks must inspect overflow inside cards and feedback actions, not
only document width. Empty headers and guidance accept their available width;
recovery actions wrap, and nested guest prompts use the enclosing card's spacing
on narrow screens. The metric strip uses a content-aware minimum below desktop
width so enlarged text can stack instead of becoming letter-width columns.

Recommendation reads with no known result show the shared loading feedback.
Render the settled empty batch only after that initial read resolves; retain
known cached results while a refresh is pending.

QueryFeedback owns inline read recovery and accepts a localized resource name so
independent failures remain distinguishable. Read errors do not create global
notifications by default. ErrorNotice retains action notifications; CAPTCHA and
async AI/synchronization job monitoring explicitly opt in to query notifications.
Retries, cooldowns and diagnostic disclosures remain local to each operation.

DataRegion keeps its children mounted during loading and errors. Use
`showInitialLoading={false}` only when those children already own a shape-matched
skeleton; accessible loading status remains, and cached refetches retain the small
refresh indicator. Other initial reads keep the generic loading presentation.
