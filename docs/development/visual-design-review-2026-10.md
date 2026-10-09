# Visual design research and review — October 2026

## Scope and direction

The frontend keeps Geist, Tailwind v4, the existing Base UI/Nova primitives,
semantic color families and Apache ECharts. The shared visual system now uses a
cool gray-blue canvas, fixed geometric scenery, near-white reading surfaces and
a blue orbit mark. Metric values and page titles carry the strongest typography;
charts and supporting information follow them. No new dependency, raster artwork
or animation runtime is required.

The starting browser review found three recurring weaknesses: the page canvas
and foreground surfaces were difficult to distinguish, metric values were close
to ordinary body-text scale, and most panels had identical visual priority.
The redesign addresses those through surface separation, value typography,
purposeful Card variants and page composition instead of adding more containers.

## References researched

Research was performed on October 9, 2026. Official award listings were used for
award attribution. The implementation recommendations below are design judgments,
not statements made by the award organizations.

| Reference                     | Verified source                                                                                                                                                                                                                              | Patterns used in codeStartrack                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe Dot Dev                | [Awwwards listing: Site of the Day and Developer Award, October 9, 2024](https://www.awwwards.com/websites/css3-1/?page=45), [FWA case](https://thefwa.com/cases/stripe-dot-dev), [live developer hub](https://stripe.dev/)                  | Clear scale contrast between headlines and metadata; fine structural lines; mathematical geometry as a brand language; substantial whitespace around the primary statement. |
| Notion                        | [2022 Webby winner in productivity and collaboration](https://winners.webbyawards.com/2022/apps-and-software/software-services-platforms/productivity-collaboration/208566/notion), [live site](https://www.notion.com/)                     | Restrained blue emphasis on a predominantly white interface; strong foreground typography; readable grouping; a visible product preview below the primary statement.        |
| Base UI/Nova component system | [Card](https://ui.shadcn.com/docs/components/base/card), [Button](https://ui.shadcn.com/docs/components/base/button), [Dialog](https://ui.shadcn.com/docs/components/base/dialog), [Input](https://ui.shadcn.com/docs/components/base/input) | Preserve component composition, native semantics, focus states and existing component APIs while refining shared tokens and surfaces.                                       |

The current Stripe and Notion homepages were inspected as rendered desktop
screenshots as well as through their public content. Current designs may differ
from the editions originally awarded. The FWA case is available but exposes
little text to the research reader; the Awwwards listing provides the detailed
Stripe award attribution. The Awwwards individual case timed out, so the official
gallery listing was used instead. No third-party award status is presented as an
official fact.

The product translates these references into a practical training workspace:
orbital geometry is static, clipped and low contrast; actions remain ordinary
buttons and links; all data remains supplied by the established API and query
layers. Experimental navigation, oversized motion and decorative WebGL are not
appropriate for repeated learning and account-management workflows.

## Shared implementation

- **Viewport background:** shell pseudo-elements use fixed viewport bounds,
  pointer-event exclusion and isolated stacking. Gray-blue light, a fine grid,
  and top-right/bottom-left concentric arcs remain stable when content scrolls.
  Mobile decoration is quieter. The shells have no transform, filter or size
  containment that would change the fixed decoration's containing block.
- **Foreground surfaces:** reading, metric and supporting layers use 98%, 94%
  and 88% card-color composition. Larger inset spacing, stronger headings, cool
  borders, a lighter upper edge and two-level shadows give modules visible depth.
  Selected metric, analysis and recommendation surfaces carry local clipped
  orbital corners behind their content.
- **Metrics:** values use larger tabular Geist numerals and semantic accents.
  Four-value MetricPanels adapt by container width, so split desktop modules use
  two columns while roomy modules use four. Narrow or enlarged-text layouts use
  the content-aware minimum. Missing data remains neutral and explicit.
- **Navigation and controls:** the blue orbit mark connects public and private
  shells. Active navigation uses meaningful semantic color and an inset marker.
  Buttons, input surfaces, popup depth and dialog headings follow shared tokens.
  Password fields retain the stronger input boundary rather than inheriting the
  faint decorative card border.
- **Charts:** the shared chart surface has a restrained neutral wash and boundary.
  HTML legends wrap, retain keyboard focus, show series-specific marks and expose
  hidden series through both muted swatches and strikethrough labels. Data colors,
  tooltips, axes and chart logic remain owned by the shared ECharts layer.
- **Accessibility:** backgrounds are noninteractive; existing semantic headings,
  skip links, native controls and Base UI focus management remain intact. Motion
  follows reduced-motion settings. Localized copy and values retain the existing
  locale providers and Intl formatting.

## Browser review evidence

Artifacts are written to the ignored `test-results/visual-system/` directory.
They are review evidence, not production assets.

1. **Baseline:** rendered dashboard, comprehensive profile, home and login at
   1440px before editing. These establish the original typography and surfaces.
2. **First redesign pass:** inspected those same routes at 1440px. The primary
   foreground now separates clearly from the canvas; metrics carry more visual
   weight and selected panels have recognizable purpose. A second pass removed
   the authentication card's faint input-boundary override.
3. **Responsive pass:** inspected home, dashboard, comprehensive profile,
   practice, teams, login and password settings at 320px, 390px, 768px and 1024px
   in Chinese and English, plus 200% root text sizing at 320px. Document width
   stayed within the viewport. Screenshots include representative 390px and
   768px layouts in both locales.
4. **Production export:** the shared-surface review completed 72 checks across
   home, dashboard, comprehensive profile, login and practice in both locales at
   1440px, 1024px, 768px, 390px and 320px, with 200% text sizing at 320px. No
   document, metric or reading-card overflow and no console/page errors were
   recorded. Both fixed decoration layers retained stable geometry during
   scrolling, and the keyboard skip link focused the main content in both
   locales. The evidence is `production-verification.json` in the artifact
   directory. Chart review remains a separate gate when chart code changes.
5. **Dialog keyboard review:** the practice snapshot dialog opened with Enter
   at 390px, retained focus within the dialog, closed with Escape, and returned
   focus to its trigger. Its foreground surface and underlying dimmed page were
   inspected in `production-dialog-390.png`.

Orbital gradients paint within panel bounds and do not expand card `scrollWidth`.
The review distinguishes flow-diagram connectors outside cards from actual
content overflow. Checking only document width is insufficient: metric values
and reading cards are also inspected for local clipping. Final release
verification also requires the complete production browser suite and the checks
recorded in the release report.

## Review limits

This document records the visual research and shared-system review. It does not
replace the frontend audit, API integration evidence, production E2E, Storybook,
build, CI or deployment gates. The synthetic browser harness is used for local
visual review; a polished fixture is not proof of real backend behavior.
