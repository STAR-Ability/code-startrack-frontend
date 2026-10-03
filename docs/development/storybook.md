# Component documentation

Storybook uses the official `@storybook/nextjs-vite` adapter (10.6.1) with the
project's Next.js 16, React 19 and Vite 8. It is a separate static documentation
application; it is not part of the production frontend image.

The Next.js Vite adapter keeps Google font URLs remote, so Storybook uses the
same Geist families through `next/font/local` with bundled Latin variable font
files. Chinese text retains the production system font fallback. This makes
preview/build independent of Google font availability. Font sources are
[Geist Sans](https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2)
and [Geist Mono](https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2),
retrieved 2026-10-03. The upstream SIL Open Font License is included in
`.storybook/public/Geist-OFL.txt` and the static output.

```bash
pnpm install --frozen-lockfile
pnpm storybook
# http://127.0.0.1:6006
pnpm build-storybook
# Standalone output: storybook-static/
pnpm test:storybook
# Serves that build on 127.0.0.1:6007 and runs desktop + 320px browser checks.
```

Stories live under `stories/`; configuration lives under `.storybook/`. They
import actual production components, the global Tailwind/PostCSS stylesheet,
Geist fonts, semantic tokens, locale, tooltip and toast providers. The language
and theme toolbar updates component previews. The viewport toolbar includes
320px, 390px and 1440px sizes. App Router navigation is stubbed by the official
adapter and appears in Storybook's action panel.

Use synthetic fixtures and presentation props. Do not import authenticated page
containers or connect stories to a real backend. The isolated QueryClient has
retries disabled; it does not run application session bootstrap. No credentials
or environment files are needed. Static hosting must serve `index.html`,
`iframe.html`, `index.json` and the emitted assets together.

The accessibility addon and generated docs are enabled. Document only states a
component actually supports; show loading/error/empty composition at the owning
container when the primitive has no such state. Native hover and focus must be
tested with browser input instead of copied CSS. Prefer component args and
existing composition over adding production-only switches for documentation.

## Coverage

| Group       | Components                                           | States and behavior                                                                                                |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Foundations | Design tokens, Badge/status mappings, chart palettes | Light/dark, mobile, semantic swatches                                                                              |
| Primitives  | Button, Card                                         | Variants, hover, loading, disabled, empty composition, mobile                                                      |
| Primitives  | Dialog                                               | Open/close, pending confirmation, disabled trigger, scrolling, mobile                                              |
| Primitives  | FormInput + FieldGroup                               | Hint, error, disabled, password reveal, pending form, RHF/Zod validation, mobile                                   |
| Primitives  | Sidebar                                              | Expanded, collapsed, mobile drawer, keyboard toggle                                                                |
| Workspace   | MetricPanel                                          | Populated, loading, zero evidence, unavailable, mobile                                                             |
| Workspace   | Chart                                                | Activity, distribution, loading/empty/error composition, dark, mobile                                              |
| Workspace   | AnalysisView                                         | Profile, statistics, loading, missing, zero evidence, stale, error, mobile                                         |
| Workspace   | RecommendationCard / BatchView                       | Default, hover, completed, missing link, long content, loading, missing batch, no candidates, stale, error, mobile |
| Workspace   | PracticeModePicker, feedback                         | Selection, disabled, empty, loading, retryable/forbidden error, mobile                                             |

There are 73 named stories. The static browser suite renders every story at
1440px and 320px, checks console errors, charts and horizontal overflow, blocks
all backend and external requests, and tests real dialog focus, form validation,
sidebar controls, mode selection, hover, reduced motion, locale and dark charts.
It also checks the accessibility addon's result for each default story and its
mobile-canvas equivalent, and
verifies that autodocs exposes real component controls. The app's existing E2E
suite continues to own authenticated requests and mutation behavior.

When adding a story, keep the typed `Meta`/`StoryObj` pattern, descriptive args,
component-level documentation, and synthetic fixtures. `index.json` drives the
render sweep automatically. Run a fresh static build before the browser suite.
The tests use a separate port and do not share or reset `dev:mock` data.

References: [official Next.js adapter](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite),
[decorators](https://storybook.js.org/docs/writing-stories/decorators).
