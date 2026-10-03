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

References: [official Next.js adapter](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite),
[decorators](https://storybook.js.org/docs/writing-stories/decorators).
