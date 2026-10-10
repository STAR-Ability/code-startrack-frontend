# UI surface hierarchy

codeStartrack keeps the existing shadcn Base UI/Nova composition, near-white primary
surfaces, dark typography, brand blue and Geist typography. Tailwind v4 resolves
the shared tokens in `src/app/globals.css`; Storybook imports that same stylesheet.

## Viewport background and scrolling content

RootLayout renders one `aria-hidden` fixed SVG background behind the application.
Its viewport bounds stay stationary while reading cards, section surfaces and
local illustrations follow normal content flow. Public, overview, insight,
training, collaboration, account and authentication routes each select a distinct
composition from the same orbital geometry.

The artwork combines larger concentric circles, weighted arcs, a clustered
architectural grid, translucent rounded polygons, complementary accents and soft
glows. Cobalt, slate, lavender, teal, amber and restrained coral supply depth in
the gutters. Near-opaque reading surfaces keep text and charts legible.

| Token                | Opacity / responsibility                                        |
| -------------------- | --------------------------------------------------------------- |
| `surface-reading`    | 98% card color; primary text, forms, recommendations and charts |
| `surface-panel`      | 97% card color; focused metrics and workspace context           |
| `surface-supporting` | 94% card color; history, sources and secondary information      |
| `surface-border`     | 92% border color; boundaries between surface layers             |

These surfaces use alpha composition without backdrop blur. Do not apply opacity
to entire components: labels and controls retain full contrast. The body uses
`isolation: isolate`, the negative background layer paints above its canvas, and
transparent route shells expose the artwork. `pointer-events: none` and hidden
SVG semantics keep decoration out of navigation and interaction.

Keep transforms, filters and containment off the background's ancestors because
they can change its fixed containing block. Only local SVG children are rotated.
The viewport layer uses no scrolling listeners, animation, backdrop blur or
permanent promotion hints. Light and dark surface colors use the shared tokens.

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

`size` controls spacing and `interaction`
controls hover behavior. Use `interaction="none"` for passive data and charts;
reserve `lift` for actionable discovery surfaces. Keep the established CardHeader,
CardTitle, CardDescription, CardContent and CardFooter composition. Extend Panel
through its Card props instead of creating a separate general-purpose card.

Selected metric, analysis and recommendation panels carry a clipped orbital
corner accent behind their content. Ordinary reading surfaces use a quiet neutral
wash. Shared two-layer shadows and a lighter upper edge separate all surfaces
from the canvas. Larger inset spacing and stronger titles provide hierarchy
before decoration. Cards retain isolation locally; the viewport background
shells never acquire transforms or containment.

MetricPanel uses tabular Geist numerals, semantic tints and a larger value than
its explanatory label. Four-value panels use container queries: two columns in
split desktop panels and four when a full-width panel has enough room. Narrow
or enlarged-text layouts fall back to the content-aware metric minimum. A
missing value remains text with a neutral tone.

## Page responsibilities

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
Theme-resolved tooltips, wrapping keyboard-accessible legends, SVG rendering,
responsive resize and reduced-motion support remain centralized in the shared
chart layer. Restrained same-hue fills supplement strong data strokes; symbols
and dashed lines supplement color. Radar axes show supplied scores, and dense
horizontal distributions grow with category count. Engine loading failures show
localized retry without replacing the owner's complete text data.

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
