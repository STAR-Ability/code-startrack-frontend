# Chart design research and implementation

Research date: 2026-10-09. Scope: the shared ECharts layer used by personal and
learning profiles, training statistics, rating histories, shared member views,
team analytics and the public product preview. Recommendation coverage/progress
remains a text-and-progress composition where a chart would add no useful data.

## Decision

Retain Apache ECharts 6.1, SVG rendering, lazy loading and the existing CSS-backed
semantic palettes. Improve composition and inspection rather than adding a
second charting runtime. None of the evaluated libraries exposed a missing chart
family or capability that justified migration. No dependency was added and no
reference implementation was copied.

## Sources evaluated

| Source                                                                                                                                                                                                                                                                                                                                              | Observed pattern                                                                                                                                                                | Applied decision                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ECharts ARIA handbook](https://echarts.apache.org/handbook/en/best-practices/aria/)                                                                                                                                                                                                                                                                | Chart descriptions and optional decal patterns supplement visual data. The handbook includes historical option examples, so installed types remain authoritative.               | Keep localized chart descriptions and owner-provided complete text data. Add symbols, dash styles, direct values and native legend controls; an ARIA label alone does not provide point exploration.      |
| [ECharts chart sizing](https://echarts.apache.org/handbook/en/concepts/chart-size/)                                                                                                                                                                                                                                                                 | Containers need measured dimensions; ResizeObserver covers layout changes that do not resize the window; detached charts require disposal.                                      | Keep responsive SVG resizing and disposal. Increase horizontal distribution height with category count and clean up a failed first frame before retry.                                                    |
| [ECharts area example](https://github.com/apache/echarts-examples/blob/gh-pages/public/examples/ts/area-simple.ts), [radar example](https://github.com/apache/echarts-examples/blob/gh-pages/public/examples/ts/radar.ts)                                                                                                                           | Official examples demonstrate area gradients and explicit per-axis radar domains. Source was fetched from the official Apache repository.                                       | Use restrained same-hue fades under strong data strokes. Keep every ability axis at 0–100 rather than adapting its scale to a user's score.                                                               |
| [shadcn Base UI Charts](https://ui.shadcn.com/docs/components/base/chart) and [source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/chart.tsx)                                                                                                                                                                          | Chart labels/colors are separate configuration, with composed tooltips/legends and explicit responsive container height. The current chart component uses Recharts 3.           | Keep configuration and CSS tokens separate from transport data; use existing Base UI Button for keyboard-accessible legend controls. Adopt composition patterns without installing another chart runtime. |
| [Tremor line charts](https://www.tremor.so/docs/visualizations/line-chart), [chart utilities](https://www.tremor.so/docs/utilities/chartUtils)                                                                                                                                                                                                      | Shared category colors, legends, value formatters, explicit domains and null-gap controls support readable analytics.                                                           | Maintain stable semantic palettes across surfaces, preserve domain rules and exact values, and allow a focused series to be selected through a wrapping legend.                                           |
| [Recharts accessibility source](https://github.com/recharts/recharts/blob/main/storybook/stories/API/Accessibility.mdx)                                                                                                                                                                                                                             | Recharts 3 supports keyboard point exploration and tooltip announcements.                                                                                                       | Provide native keyboard legend toggles and retain complete data disclosures. Do not equate this with keyboard exploration of every ECharts point.                                                         |
| [Nivo theming](https://nivo.rocks/guides/theming/), [colors](https://nivo.rocks/guides/colors/), [gradients](https://nivo.rocks/guides/gradients/), [patterns](https://nivo.rocks/guides/patterns/), [scales](https://nivo.rocks/guides/scales/)                                                                                                    | Base theme, series colors, fills, patterns and domains have separate responsibilities. Gradients are visual enhancement rather than another data variable.                      | Derive fills from the resolved series color, keep outlines stronger, and distinguish categorical metrics without a rainbow or a gradient that implies a second measure.                                   |
| [Visx XYChart](https://github.com/airbnb/visx/blob/master/packages/visx-xychart/README.md)                                                                                                                                                                                                                                                          | Quiet horizontal grids, shared nearest-datum tooltips/crosshairs, focus events and nullable series support precise inspection.                                                  | Keep axis-triggered exact-value tooltips and quiet numerical grid lines. Preserve straight segments and data gaps; avoid decorative interpolation.                                                        |
| [Umami chart source](https://github.com/umami-software/umami/blob/master/src/components/charts/BarChart.tsx), [distribution source](https://github.com/umami-software/umami/blob/master/src/components/charts/DistributionBarChart.tsx), [metric source](https://github.com/umami-software/umami/blob/master/src/components/metrics/MetricsBar.tsx) | Metrics precede plots; horizontal category distributions and restrained chart scaffolding improve scanning.                                                                     | Keep prominent overview metrics before secondary distributions; show values beside horizontal bars and allocate enough space for every displayed category.                                                |
| [Plausible dashboard](https://plausible.io/docs/guided-tour), [comparison guidance](https://plausible.io/docs/compare-stats), [official chart image](https://plausible.io/docs/img/v2/top-graph.webp)                                                                                                                                               | Visually inspected reference pairs a strong KPI strip with a saturated trend stroke, pale fill and quiet grid. Comparison/partial-period display depends on an explicit period. | Preserve selected API windows and separate metric summaries from plots. Do not invent deltas, previous periods or partial-day flags unsupported by the contract.                                          |

## Implemented chart system

- `theme.ts` resolves the existing light/dark CSS tokens, including browser
  conversion of modern CSS colors into ECharts-compatible RGBA. Activity keeps
  blue submissions, green solved/accepted counts and amber pending results.
  Team activity uses teal for active members. Distributions compare a neutral
  attempted baseline with green solved counts. Ability uses violet. General
  categorical charts use coordinated blue, violet, teal, green and amber.
- `presentation.ts` applies same-hue line/radar/bar gradients after CSS colors
  resolve, preserving caller-specific style overrides. Opaque bar outlines and
  strong line/radar strokes retain the visible data boundary. This function does
  not sort, normalize, clamp, smooth or otherwise change the supplied data.
  Stable series identity retains its palette slot through reorder/removal.
  Explicit line/item colors keep the plotted stroke, gradient and native legend
  aligned instead of depending on ECharts' retained internal series order.
- Trend series use circles, diamonds and squares; the third series uses a dashed
  stroke. The main area fade is subtle and does not obscure other series.
  Straight segments retain observed samples without suggesting unobserved peaks.
- Count distributions retain separate attempted/solved bars and a zero baseline.
  Horizontal distributions display solved endpoint values and grow by category
  count, so ten categories remain ten readable rows. Owner data disclosures keep
  full category names and every supplied value.
- Radar axis names include the supplied score and denominator. Narrow layouts
  explicitly wrap multiword English names because ECharts radar labels do not
  consistently honor width/overflow. Responsive media rules keep supplied scores
  and the common 0–100 scale intact.
- `Chart` hides the SVG legend and composes wrapping native Button controls with
  `aria-pressed`, visible focus and matching symbols/line styles. Legend state
  survives option/theme/motion changes. Explicit series IDs preserve semantic
  selection across translated labels; otherwise identity follows the series
  name, so reordering accounts does not transfer a hidden selection.
  The actual legend remains mounted from the first loading frame through failure,
  retry and readiness, reserving the full space its labels and wrapping require.
  Its buttons stay disabled until the engine is ready; no fixed legend placeholder
  height is used.
- Tooltips remain confined, exact-value, rich-text rendering with resolved
  popover colors. Their display never interpolates HTML from API labels.
- A chart engine load/first-frame failure shows localized recovery and retry;
  pending engine loading has a Skeleton and status. Data query loading, empty,
  stale and error states remain owned by their feature composition. A real
  zero-valued snapshot remains distinct from missing data.
- Motion settings update live and disable ECharts animation for reduced motion.
  Data, locale, theme and palette updates retain one chart instance. Cleanup
  covers observers, media listeners, failed first frames and detached lazy loads.

## Verification evidence

Focused command:

```bash
pnpm exec vitest run src/lib/charts src/components/workspace/chart.test.tsx
```

PASS: 5 files / 33 tests, including the deferred-loader follow-up. Coverage includes
exact samples and score bounds,
separate count series, category order/density, six radar labels and numeric scores
inside 248–900px SVG surfaces, responsive media restoration, actual ECharts
theme/data/motion changes, native legend selection, account-series reorder,
rejected lazy imports, first-frame disposal, retry and canceled initialization.
Actual engine regressions also prove color/legend/fill alignment after account
reorder, removal and palette changes, plus hidden metric selection after labels
are translated. Every production trend helper caller supplies semantic IDs for
translated metric series.
Scoped ESLint and `pnpm exec tsc --noEmit` also passed.

PASS: the coordinated complete `pnpm check` on stable-layout source `765b55e`
passed lint, formatting, TypeScript, all 57 files / 507 unit tests and the
production build. The deferred-loader regression retains the same complete
legend group and buttons through loading → error → retry → ready, prevents
disabled toggles, initializes the latest retry data and verifies ready toggling.
Its DOM continuity assertions are complemented by the browser geometry evidence
below.

The chart-specific radar E2E negative mutation was updated to remove the
redesigned data stroke and gradient polygon while preserving axes/labels. Its
geometry check still compares all six plotted API scores and rejects a grid-only
chart. Release-wide E2E/build/Storybook results belong to the release report;
they are not implied by this focused unit run.

Before/after desktop screenshots of `/product/profile` and rendered Chinese and
English `/learning-profile` were inspected under ignored
`test-results/chart-redesign/`. A development sweep was stopped before the
production build; the remaining responsive/dark/keyboard sweep runs against the
production offline preview so development overlays cannot invalidate evidence.
The production offline preview passed 13 chart review cases: Chinese and English
at 1440, 1024, 768, 390 and 320px, plus English dark/reduced-motion at 1440, 390
and 320px. Actual radar text stayed inside its surface, legend labels had no
overflow, Enter/Space toggles worked, document width stayed bounded, and no page
or console errors occurred. JSON and screenshots are retained in the ignored
chart review directory.

After the final identity fix and coordinated production rebuild, four additional
actual-browser cases passed at 1440px light, 390px light, 320px dark/reduced-motion
and 1440px dark/reduced-motion. Each hid the accepted-submission series with
Enter, switched English → Chinese → English, verified the metric remained hidden,
and restored it with Space. Computed SVG stroke and native legend colors matched
before and after the interaction in both themes. Radar labels remained bounded;
no document overflow, console/page errors or API writes occurred. Final focused
screenshots and `final-chart-interactions.json` are retained in the ignored chart
review directory. The coordinated affected-route screenshot matrix and complete
release gates are recorded by the release/visual review.

Storybook adds keyboard legend, ten-category distribution, mobile dense
distribution and valid-zero-activity cases alongside the existing light/dark,
mobile radar and owner loading/empty/error compositions.

### Loading geometry follow-up

The earlier full E2E run passed 330 tests and failed four locator checks after
native legend buttons and radar score labels introduced legitimate duplicate
names or values. The corrected locators retain the original assertions. A later
earlier-export replay was stopped after 268 passes, one English response-wait
timeout, one interrupted test and 64 tests not run. That timeout occurred before
any UTC-formatting assertion: no submissions request followed the intended mode
click. The trace showed three ready-only legends inserting their content and
moving the following controls by approximately 96 CSS pixels. This supports a
layout/readiness race; the trace does not prove the exact missed event dispatch.
These partial failed runs remain retained evidence, not complete E2E acceptance.

PASS: eight browser cases against the production offline preview on `765b55e`
delayed the actual lazy ECharts
package chunk in isolated contexts at 1440, 768, 390 and 320 pixels, in English
and Chinese. The chunk was identified by its `_echarts_instance_` module marker.
All 24 chart frames and 56 native legend buttons were present before the engine
was released, with no chart SVG and a visible loading state. The complete legend
groups, labels, selected states and DOM nodes persisted after initialization;
buttons changed from disabled to enabled.

Full chart frames, surfaces, legends, buttons, the Personal data group and its
controls, and the downstream Submissions heading had exactly 0px measured
displacement. Measurements used document coordinates (`rect.top + scrollY`)
with the same viewport, locale and supplied data. In all eight cases, a real
Submissions mode click while the engine remained held produced an HTTP 200
submission-list response from the local fixture API and stayed selected after
engine readiness. No browser
errors, failed API requests, external requests or API writes occurred. The
network log retains 16 aborted frontend-route requests. The focused script,
combined `loading-geometry.json`, eight case JSON files and 24 full-page state
screenshots remain under ignored `test-results/route-design-audit/`.

The first final stable-layout Storybook replay exposed a separate play-function
readiness failure in `workspace-chart--keyboard-legend`. Its `findByRole` found
the now-present disabled Solved button before the engine was ready. The preserved
trace shows a disabled, pressed button with loading visible, then an assertion
expecting `aria-pressed="false"` but receiving `"true"`, and only later an enabled
button. `KeyboardLegend` now explicitly awaits the enabled state before focusing
and sending Enter and Space; both pressed-state assertions remain intact.
PASS: scoped story ESLint and formatting, rebuilt static Storybook, both targeted
keyboard viewport checks (2 tests) and the complete final suite (486 tests).
The final log is `test-results/final-ready-storybook-gate.log`, with exit code 0
and no skipped tests. The original interrupted replay and disabled-button trace
remain under ignored `test-results/final-layout-storybook-gate.log` and
`test-results/storybook-initial-disabled-legend/`; earlier success is retained
separately from acceptance of the corrected story.

## Boundaries

Native legend toggles are keyboard accessible, while individual ECharts data
points are inspected by pointer/touch or through complete owner text data. This
is not a claim of full screen-reader point exploration or a full WCAG audit.
Chart design does not add unsupported APIs, fabricate comparisons, combine
private data with shared team DTOs or replace missing analysis with sample data.
