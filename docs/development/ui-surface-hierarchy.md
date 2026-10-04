# UI surface hierarchy

codeStartrack keeps the existing shadcn Base UI/Nova composition, white primary
surfaces, dark typography, brand blue and Geist typography. Tailwind v4 resolves
the shared tokens in `src/app/globals.css`; Storybook imports that same stylesheet.

## Viewport background and scrolling content

The public, workspace and authentication shells own their decorative backgrounds.
Their pseudo-elements use `position: fixed` and viewport bounds, so light, grids,
dots and the public orbit stay visually stable while document content scrolls.
White cards, supporting section surfaces and local illustrations remain in normal
content flow.

Each shell uses `isolation: isolate`; its base paints below the negative decorative
layer and its content paints above it. `pointer-events: none` keeps decoration out
of pointer interaction. Keep transforms, filters and containment off these shell
ancestors: they can change the containing block of a fixed descendant. Apply local
motion to controls or illustrations instead. The viewport decorations use no
scroll listeners, animation, backdrop blur or permanent layer-promotion hints.

The practice intro orbit is a static detail of its card. Card and control motion
continues to follow the shared reduced-motion rules.

## Semantic accents

| Existing token family         | Meaning                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `info` / `info-soft`          | Recommendation context and interactive guidance            |
| `insight` / `insight-soft`    | Ability and analysis                                       |
| `success` / `success-soft`    | Solved problems and successful/completed status            |
| `warning` / `warning-soft`    | Pending work and stale evidence                            |
| `destructive` / `danger-soft` | Failure or destructive actions                             |
| `canvas`, `muted`, `card`     | Page backdrop, supporting areas and primary white surfaces |

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

`variant` expresses content purpose. `size` controls spacing and `interaction`
controls hover behavior. Use `interaction="none"` for passive data and charts;
reserve `lift` for actionable discovery surfaces. Keep the established CardHeader,
CardTitle, CardDescription, CardContent and CardFooter composition. Extend Panel
through its Card props instead of creating a separate general-purpose card.

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
