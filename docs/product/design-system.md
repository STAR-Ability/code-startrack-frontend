# Active visual system — October 2026

The current V0.11 UI preserves Base UI / Nova and the static Next.js architecture.
This section supersedes historical palette and page assumptions below.

## Foundations

White cards sit on a cool neutral canvas. Ink primary actions, restrained borders,
soft elevation and generous section spacing establish hierarchy. Colors communicate
meaning, never platform identity. All color values live in src/app/globals.css.

| Token | Purpose |
| --- | --- |
| background / card / canvas / muted | White page, white surface, neutral canvas, inset surface |
| foreground / muted-foreground | Primary text and readable supporting text |
| primary / primary-hover | Ink action and hover state |
| info / info-soft | Core data, links and informational badges |
| success / success-soft | Accepted, solved and successful completion |
| warning / warning-soft | Stale, pending and attention states |
| destructive / danger-soft | Errors and failed operations |
| insight / insight-soft | Ability dimensions and explanatory accents |
| support / support-soft | Secondary data distinctions |
| shadow-surface / shadow-raised | Quiet resting elevation and purposeful hover |

Chart series use these same computed CSS tokens. A chart has at most four primary
colors; most use blue plus gray, with green reserved for solved/accepted values.
Always retain labels, icons or explicit status text so color is not the only cue.
Dark token counterparts remain supported; the product defaults to light.

## Composition and motion

Keep the existing compact workspace and accessible Base UI primitives. Public
product pages may use larger type, editorial layouts and faint orbit/grid details.
Decorations are noninteractive and hidden from assistive technology. Cards preserve
white content surfaces; insets and chart regions may use the canvas tone.
Hover uses small elevation/translation changes. Entrance animations run once.
Respect reduced-motion, preserve visible content without JavaScript and provide
keyboard equivalents for meaningful interactions. No new animation dependency.

## Audit findings and decisions

- src/components/layout/app-header.tsx:32 — public links currently target anchors
  and private workspaces; replace with distinct public routes and mobile navigation.
- src/components/workspace/chart.tsx:27 — chart palette differs from global tokens;
  centralize semantic palettes and resolve CSS values for ECharts.
- src/app/globals.css — preserve the orbit motif, reduce blue surface tint, bound
  decorative authentication/practice loops, and define shared surface elevation.
- src/components/ui/badge.tsx — add semantic variants; preserve text/status codes.
- src/components/workspace/recommendations-page.tsx — extract existing display card
  for reuse and documentation without moving queries or mutation logic.
- Existing forms, Session handling, query keys, validation, Mock transport and API
  contracts are retained. Existing loading/empty/error UI remains authoritative.

---

# codeStartrack V0.1 Design Direction

## Approved UI redesign — 2026-09-30

The user-approved [UI redesign](../../prompts/codestartrack-ui-redesign.md)
supersedes the historical two-page presentation below. The implemented routes are
`/` (brand landing), `/profile` (unified profile) and `/practice` (one recommendation).
`/dashboard` redirects to `/practice` for existing links. The profile page reads E1
only; practice reads E1 then E2, reusing successful data within a shared workspace
cache. Retries remain scoped to the failed operation. No backend contract changes.

The landing page makes no learner requests. Its interactive cards, journey and
problem stack are explicitly labeled illustrations from `src/lib/demo/preview.ts`.
Future connectors and queues remain unavailable. Optional login opens an honest
unavailable dialog with a demo link; there are no credentials, authentication calls
or fake sessions. Both locales, visible focus, reduced-motion support and the
existing white/neutral palette, fonts, radius scale and Base UI/Nova remain intact.
See the [execution record](../../.agent/plans/ui-redesign.md) for decisions and checks.
Older dashboard descriptions below record the pre-redesign slice and do not
supersede this amendment. All API, read-only and deferred-capability limits remain.

## Current read-only execution decisions

The user's later gateway/read-only instructions govern current implementation. Browser API requests go only to the Next.js application: `GET /api/training/profile` and `GET /api/training/recommendation` forward server-side to `GET /api/users/1/profile` and `GET /api/users/1/recommendations?limit=1`. Use one `DEMO_USER_ID = 1` and server-only runtime `BACKEND_BASE_URL`; never expose the backend through `NEXT_PUBLIC_*`. No POST, PUT, PATCH, DELETE, HEAD or OPTIONS may reach the live backend. E3/E4/E5 and the binding/synchronization flows described below remain deferred specifications, not current executable work.

P-01–P-05 are [resolved for this read-only slice](product-requirements.md#approved-v01-product-decisions): `/` links to the existing Demo `/dashboard`; retry only a failed GET; visibly disclose early placeholder recommendations; zh-CN default/en on the same routes, external problems in a new tab; white/neutral-first colors with blue only as an accent. The dashboard is a planned destination, not an already implemented scaffold route. No product UI is added by V01-01.

## Scope and brand

Milestone: **V0.1 — Unified Training Profile & Recommendation (Codeforces First)**. Follow [the current V0.1 instruction](../../prompts/v01-doc-rewrite.md), [product requirements](product-requirements.md), [page model](page-structure.md), and [API contract](api-contract.md). The explicit rewrite changes the immediate scope from the larger Demo V2 plan; deferred interaction surfaces are not part of the current visual hierarchy.

The brand is **码练星轨 (codeStartrack)**: white-first, modern, minimal, clean, developer-oriented, trustworthy, calm, and technology-forward. Aim for the clarity of Vercel, the discipline of Linear, the developer familiarity of GitHub, and the simplicity of modern AI products without copying their identity.

The product presents **one codeStartrack learner** with zero or more external accounts, including multiple accounts on the same platform in the approved target. Their independently synchronized, backend-normalized/deduplicated data contributes to **one unified training profile and recommendation experience**. Platforms are connectors/data sources. Codeforces is the only current connector, not the identity of the product. New sources must not require new learner dashboards, platform modes, or a different product navigation.

The [same-platform account update](../../prompts/v01-doc-update-multiple-same-platform-accounts.md) approves that target while preserving current E3 behavior. V0.1 uses temporary `DEMO_USER_ID = 1` and backend configuration server-only runtime `BACKEND_BASE_URL`; these engineering assumptions do not make a public account username the learner's identity or require exposing configuration values in the UI. Only the first Codeforces account is currently bindable; multiple same-platform accounts are **BLOCKED_BY_API** (G-09).

## Foundation to preserve

- Keep the installed shadcn **Base UI / Nova** foundation and Tailwind semantic-token approach. Do not switch component libraries or presets.
- Preserve **Geist** for interface text and **Geist Mono** for source identifiers or other appropriate technical metadata. Use a high-quality system CJK sans-serif fallback for Chinese unless a specific font is later approved.
- Use **Lucide React** icons with accessible names for icon-only controls. No emoji production icons.
- Prefer existing primitives and variants. Inspect installed components and use the shadcn Skill/MCP workflow when implementation begins; this document does not add components.
- Keep Nova-style density, medium corner radii, restrained shadows, thin borders, crisp type and quiet hover/focus feedback. Preserve the existing radius scale rather than creating a second one.

This rewrite specifies direction only. It changes no CSS, fonts, components, tokens, routes or dependencies.

## Color system

| Semantic role                      | V0.1 direction                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Page background                    | White-first.                                                                                      |
| Primary text                       | Near-black / neutral.                                                                             |
| Secondary text and source metadata | Cool neutral gray, with readable contrast.                                                        |
| Borders and separators             | Very light neutral gray.                                                                          |
| Cards / secondary surfaces         | White or very light neutral.                                                                      |
| Primary action / accent            | Near-black neutral primary actions; blue only for focus, links and limited active emphasis.       |
| Status                             | Clear text plus optional Lucide icon; never color alone. Use compatible semantic feedback tokens. |

Use semantic theme tokens such as background, foreground, muted, border, card, primary and ring. Do not scatter hex values into pages. The installed theme currently provides a neutral baseline; applying the approved accent direction requires a later token implementation, not a preset change.

### P-05 — V0.1 color selection resolved

Decision corrected 2026-09-30 by the user: V0.1 is white/neutral-first, with blue as an accent only. The existing `src/app/globals.css` supplies a white/neutral theme and semantic variables; the installed Base UI/Nova Button uses opacity-based primary hover and focus treatments. Preserve the component foundation, radius scale and fonts, and use the following white/neutral-first palette for all later V0.1 UI Issues. This records a design decision only: V01-01 does not apply CSS changes, modify components or start V01-02.

Values below are exact sRGB colors. Define them once as semantic theme tokens during V01-03; never scatter these literals through pages.

| Semantic token                                        | Exact value | Intended use                                              |
| ----------------------------------------------------- | ----------- | --------------------------------------------------------- |
| `background`, `card`, `popover`                       | `#FFFFFF`   | White-first page and primary surfaces.                    |
| `foreground`, `card-foreground`, `popover-foreground` | `#111827`   | Near-black neutral headings and primary text.             |
| `muted`, `secondary`                                  | `#F8FAFC`   | Very light cool-neutral supporting surfaces.              |
| `muted-foreground`                                    | `#64748B`   | Readable cool-neutral secondary text/source metadata.     |
| `secondary-foreground`                                | `#111827`   | Primary text on secondary surfaces.                       |
| `border`                                              | `#E5E7EB`   | Quiet decorative separators and card borders.             |
| `primary`                                             | `#111827`   | Near-black neutral primary action.                        |
| `primary-foreground`                                  | `#FFFFFF`   | Text/icons on the primary action.                         |
| `primary-hover`                                       | `#1F2937`   | Explicit darker primary hover; preserve white foreground. |
| `ring`, `link`, limited active emphasis               | `#2563EB`   | Opaque focus, links and sparse active emphasis only.      |
| `accent`                                              | `#EFF6FF`   | Sparse pale-blue hover/selection surface when needed.     |
| `accent-foreground`                                   | `#1D4ED8`   | Text/icons on the pale-blue accent surface.               |

Contrast calculations using the sRGB relative-luminance formula: white on primary **17.74:1**; white on primary-hover **14.68:1**; primary text on white **17.74:1**; secondary text on white **4.76:1**, and on the muted surface **4.55:1**; accent-foreground on accent **6.16:1**. These text pairs exceed 4.5:1. The opaque focus color contrasts with white/muted/accent surfaces at **5.17:1 / 4.94:1 / 4.75:1**, respectively. Actual implemented components must still be checked for focus geometry, disabled states and adjacent colors.

For later implementation, map `--primary-hover` into Tailwind's semantic `--color-primary-hover` and use the shared Button variant's `hover:bg-primary-hover`. Map the blue `link` token through `--color-link` and use it consistently for link text, including the shared link Button variant; primary buttons keep their near-black token. Do not retain `hover:bg-primary/80` for white-label primary buttons: transparency changes the chosen contrast. Focus must use an opaque semantic `ring` with at least a 2px visible indicator and a 2px surface-colored separation where needed, including around a near-black primary button; do not rely on the existing `ring-ring/50` or `outline-ring/50` treatment alone. Apply this in shared primitives when V01-03 implements tokens, without page-specific color overrides. The light decorative `border` token is not a sufficient standalone interactive-control boundary; use an adequately contrasting semantic boundary or other clear control affordance where required.

No gradients, neon, cyberpunk effects or colorful dashboard-card palette. No theme switcher or dark-theme redesign is required. P-05 is **RESOLVED**. Blue must remain a limited accent; do not make primary buttons blue or create a blue SaaS/admin-dashboard appearance. Routine layout/copy refinement in later Issues must preserve these decisions and does not reopen the palette.

## V01-02 bilingual copy inventory

Status: accepted for implementation under the user’s 2026-09-30 delegation, recorded in the execution plan; P-01–P-05 remain resolved. Use these stable keys when V01-03–06 implement dictionaries and their consumers. This table defines the runtime dictionary implemented in V01-03 and consumed in V01-04–06. Braced placeholders must match in both locales; interpolate plain text, never HTML. The shared Demo is not presented as the visitor's own connected account.

| Key                                    | zh-CN                                                                              | en                                                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `brand.name`                           | 码练星轨                                                                           | codeStartrack                                                                                                                          |
| `language.label`                       | 语言                                                                               | Language                                                                                                                               |
| `language.zhCN`                        | 简体中文                                                                           | 简体中文                                                                                                                               |
| `language.en`                          | English                                                                            | English                                                                                                                                |
| `language.changed`                     | 语言已切换为{language}。                                                           | Language changed to {language}.                                                                                                        |
| `language.notSaved`                    | 语言已切换，但浏览器未保存偏好；重新打开页面后可能恢复原来的语言。                 | Language changed, but your browser could not save the preference. Reopening the page may restore the previous language.                |
| `navigation.home`                      | 返回首页                                                                           | Back to home                                                                                                                           |
| `navigation.skip`                      | 跳至主要内容                                                                       | Skip to main content                                                                                                                   |
| `demo.label`                           | 只读 Demo                                                                          | Read-only demo                                                                                                                         |
| `demo.learner`                         | 示例学习者                                                                         | Demo learner                                                                                                                           |
| `demo.context`                         | 当前展示共享示例学习者的数据。                                                     | This demo shows a shared learner's data.                                                                                               |
| `entry.title`                          | 训练画像与题目推荐                                                                 | Training profile and recommendation                                                                                                    |
| `entry.description`                    | 以 Codeforces 训练数据为起点，查看统一的学习画像与一道推荐题目。                   | Explore one training profile and one recommended problem, starting with Codeforces training data.                                      |
| `entry.openDemo`                       | 查看只读 Demo                                                                      | View read-only demo                                                                                                                    |
| `entry.readOnly`                       | 当前演示仅供查看，暂不开放账号绑定与同步。                                         | This demo is read-only. Account connection and synchronization are unavailable.                                                        |
| `source.label`                         | 数据来源                                                                           | Data source                                                                                                                            |
| `accounts.unavailable`                 | 已连接账号详情暂不可用。                                                           | Connected account details are unavailable.                                                                                             |
| `profile.title`                        | 训练画像                                                                           | Training profile                                                                                                                       |
| `profile.loading`                      | 正在加载训练画像…                                                                  | Loading training profile…                                                                                                              |
| `profile.error`                        | 暂时无法加载训练画像。请稍后重试。                                                 | Could not load the training profile. Please try again later.                                                                           |
| `profile.timeout`                      | 加载训练画像超时，请重试。                                                         | Loading the training profile timed out. Please try again.                                                                              |
| `profile.retry`                        | 重试加载画像                                                                       | Retry profile                                                                                                                          |
| `profile.totalSolved`                  | 已通过题目                                                                         | Solved problems                                                                                                                        |
| `profile.averageDifficulty`            | 平均难度                                                                           | Average difficulty                                                                                                                     |
| `profile.maxDifficulty`                | 最高已通过难度                                                                     | Highest solved difficulty                                                                                                              |
| `profile.last7Days`                    | 近 7 天提交数                                                                      | Submissions in the last 7 days                                                                                                         |
| `profile.last30Days`                   | 近 30 天提交数                                                                     | Submissions in the last 30 days                                                                                                        |
| `profile.updatedAt`                    | 画像更新时间                                                                       | Profile updated                                                                                                                        |
| `profile.difficultyNote`               | 平均难度仅统计有难度评分的已通过题目；当前评分来自 Codeforces。                    | Average difficulty includes only solved problems with a difficulty rating. Current ratings come from Codeforces.                       |
| `data.previous`                        | 仍显示上次成功加载的数据。                                                         | Showing the last successfully loaded data.                                                                                             |
| `recommendation.title`                 | 推荐题目                                                                           | Recommended problem                                                                                                                    |
| `recommendation.waiting`               | 画像加载成功后将显示推荐题目。                                                     | Recommendations will appear after the profile loads.                                                                                   |
| `recommendation.loading`               | 正在加载推荐题目…                                                                  | Loading recommendation…                                                                                                                |
| `recommendation.error`                 | 暂时无法加载推荐题目。请稍后重试。                                                 | Could not load the recommendation. Please try again later.                                                                             |
| `recommendation.timeout`               | 加载推荐题目超时，请重试。                                                         | Loading the recommendation timed out. Please try again.                                                                                |
| `recommendation.retry`                 | 重试加载推荐                                                                       | Retry recommendation                                                                                                                   |
| `recommendation.empty`                 | 暂时没有可展示的推荐题目。                                                         | No recommendation is available right now.                                                                                              |
| `recommendation.placeholder`           | 当前推荐为早期占位结果，尚不代表经过验证的个性化分析。                             | Recommendations are early placeholders and do not represent validated personalized analysis.                                           |
| `recommendation.reason`                | 推荐说明                                                                           | Recommendation note                                                                                                                    |
| `recommendation.reasonUnavailable`     | 暂无推荐说明。                                                                     | No recommendation note is available.                                                                                                   |
| `recommendation.originalText`          | 推荐说明保留原文。                                                                 | Recommendation notes are shown in their original language.                                                                             |
| `recommendation.platform`              | 题目来源                                                                           | Problem source                                                                                                                         |
| `recommendation.externalId`            | 来源题号                                                                           | Source problem ID                                                                                                                      |
| `recommendation.difficulty`            | 题目难度                                                                           | Problem difficulty                                                                                                                     |
| `recommendation.difficultyUnavailable` | 难度暂无数据                                                                       | Difficulty unavailable                                                                                                                 |
| `recommendation.tags`                  | 标签                                                                               | Tags                                                                                                                                   |
| `recommendation.generatedAt`           | 推荐生成时间                                                                       | Recommendation generated                                                                                                               |
| `recommendation.openExternal`          | 在 {platform} 打开题目                                                             | Open on {platform}                                                                                                                     |
| `recommendation.newTab`                | 将在新标签页打开                                                                   | Opens in a new tab                                                                                                                     |
| `recommendation.linkUnavailable`       | 题目链接暂不可用                                                                   | Problem link unavailable                                                                                                               |
| `time.utc`                             | UTC                                                                                | UTC                                                                                                                                    |
| `time.zoneUnknown`                     | 时区未提供                                                                         | Time zone not provided                                                                                                                 |
| `metadata.homeTitle`                   | 码练星轨 \| 只读 Demo                                                              | codeStartrack \| Read-only Demo                                                                                                        |
| `metadata.dashboardTitle`              | 训练画像与推荐 \| 码练星轨                                                         | Training profile and recommendation \| codeStartrack                                                                                   |
| `metadata.description`                 | 查看示例学习者的训练画像和一道推荐题目。当前仅支持只读浏览，推荐仍为早期占位结果。 | Explore a demo learner's training profile and one recommended problem. This demo is read-only; recommendations are early placeholders. |

Presentation rules:

- The entry uses `entry.title`, `entry.description`, `demo.context`, `entry.readOnly` and the one `entry.openDemo` action. Keep `source.label` plus `Codeforces` quiet. Do not display the deferred form/progress copy below or unsupported connector tiles.
- The dashboard uses `demo.learner`/`demo.context`, one profile and one recommendation. `accounts.unavailable` is context, not an error requiring a Retry/Connect button. Never display a guessed handle or “0 accounts.”
- `recommendation.placeholder` is persistent visible text close to the recommendation note and CTA in both locales, including mobile. It must not be hidden in a tooltip, dismissed, reduced to an icon or replaced by an AI-confidence badge. Retain it in the recommendation region's pending/empty/error states as applicable; do not invent a reason when none is available.
- Preserve supplied backend reason/title/tag text as plain text. Use `recommendation.reasonUnavailable` for an empty/whitespace-only reason; show `recommendation.originalText` when a reason is displayed. A missing/empty title falls back to the supplied external ID. Missing/null difficulty uses its unavailable label; missing/empty tags omit the tags row. Do not add fictional fallback tags or infer that missing difficulty proves “unrated.”
- `recommendation.openExternal` uses `Codeforces` for the known `codeforces` label, otherwise the supplied platform string as plain source metadata; this does not enable another connector. Pair it with the visible `recommendation.newTab` notice and an accessible association. A missing/invalid URL uses the visible unavailable label with no navigable `href`; keep the rest of the card.
- Use operation-specific retry labels. During a retry show the same operation's loading text, prevent duplicate activation and announce meaningful state changes without stealing focus. Last successful data may remain visible only with `data.previous` and the current operation error; never silently present a failed refresh as fresh success.
- Root metadata uses `metadata.homeTitle`; the later dashboard uses `metadata.dashboardTitle`. Both use the locale-matched description. Metadata must never claim an implemented Agent, personalized recommendation quality or account synchronization. No backend data is needed to generate it.
- Reuse the exact P-05 semantic tokens, Base UI/Nova, fonts and visible focus. The copy needs no new visual preset, status-card color system or UI library. Automatically use the installed shadcn Skill and relevant shadcn MCP when the later UI Issues begin.

## Visual personality and hierarchy

Use generous whitespace around the content, clear headings, compact supporting metadata and a small number of high-signal metrics. Keep borders/shadows subtle so the next recommended problem is easy to identify. The result should feel like a focused developer SaaS product, not a school administration system or a source-platform analytics plugin.

Avoid heavy gradients, neon/cyberpunk treatments, excessive glassmorphism, colorful admin-dashboard cards, large decorative illustrations, emoji icons and excessive motion. Motion should clarify an actual change and respect reduced-motion preferences.

Source names and connector icons are metadata. Do not recolor or rename the entire interface for a connected platform. The learner's identity, goals, profile structure and recommendation experience remain the same as connectors are added.

## Deferred `/` account-connection design

Lead with codeStartrack branding and a concise explanation that supported programming-platform histories contribute to one training profile. Use a Connected Accounts / Connect Training Account surface, not a platform-mode selector.

Deferred account-connection copy direction (binding/synchronization are outside the current read-only phase):

```text
Connect your training history

codeStartrack brings your supported programming-platform history
into one training profile.

Codeforces is currently the available data source.
[ Public username / handle ]
[ Connect and Analyze ]
```

Use natural `zh-CN` UI by default, with equivalent `en` strings when i18n is enabled. Keep the current Codeforces-only boundary visible; general multi-source positioning must not imply that other connectors already work.

### Target Connected Accounts pattern

Communicate **many connected accounts → one learner**, including repeated platform labels. Conceptual layout after backend support (not current data or hardcoded fixtures):

```text
Connected Accounts

[Codeforces] account_A
Connected · Synced ...

[Codeforces] account_B
Connected · Synced ...

[ + Connect another account ]
```

Keep rows compact and group them cleanly if useful; grouping is presentation, never a platform mode. Username is secondary source metadata, not the learner identity. Do not make account count the hero metric. Profile and recommendation remain the outcome and strongest elements.

Each row should accommodate platform, public username, connection status, that account's sync state, last sync time when known, and a per-account re-sync action when supported. The underlying account identity is the real backend `account_id`, not a guessed ID, just a platform name, or a browser-local handle. Retain source/account provenance without introducing account dashboards or separate ability panels.

### Documented backend capability (execution deferred)

The unchanged E3 allows one Codeforces account for Demo user 1 and may return 409 when a binding already exists. The first connection and E4 sync are supported; Connect another account is **BLOCKED_BY_API** until G-09 is resolved. If shown, present it as unavailable with a clear explanation; never make it usable or display a fake successful second row.

Only display real known account information. E3/E4 expose current-operation data, but connected-account listing, ID recovery, status inspection, unbind/replace/remove remain undocumented (G-02). Per-account re-sync can use E4 when a real account ID is known; returning status/recovery must not be fabricated. Do not use multiple internal users, frontend profile merging or local account-name lists to emulate the blocked capability.

Only the first Codeforces account connection is supported by the documented E3 contract; it remains inactive under the current read-only policy. Future connectors may be omitted; if later approved for display, label them clearly **Coming soon**, keep them secondary, and prevent them from appearing usable. Do not let unavailable connectors compete with the primary connection action.

Place the public-data/privacy explanation near the input: request only the public identifier supported by the backend, never platform passwords, cookies, API secrets, or browser session data. A binding error belongs to this account operation and must not look like failure of the learner's entire profile.

## Deferred binding/synchronization progress

```text
Connecting account
Synchronizing training data
Building your training profile
Generating recommendation
```

The underlying frontend sequence is `IDLE → CONNECTING_ACCOUNT → SYNCING_DATA → BUILDING_PROFILE → LOADING_RECOMMENDATION → READY`. Reflect real request completion, not elapsed time. No fake percentages, fabricated job counts, or separate platform-mode states.

“Building your training profile” corresponds to fetching E1's computed metrics; there is no documented asynchronous profile-build job. “Generating recommendation” describes the user journey, but E2 may return a cached placeholder batch; Loading recommendation is more precise where generation cannot be established. V0.1 copy must not claim a new AI computation.

Explain that synchronization may take several seconds. A successful `new_submissions = 0` result is not an error. Show sync state and last-sync time per actual account; one completed request must not imply that every account refreshed. Preserve successful account/profile state when a later operation fails. Normalization/deduplication across accounts belongs to the backend (G-08); no browser-summed totals or invented bulk progress.

## `/dashboard` — Unified profile and primary recommendation

Use this information order while giving the recommendation the strongest action emphasis:

```text
User identity
  → connected accounts / contributing data sources
  → Training profile
  → concise summary and recent activity
  → one primary recommended problem
  → Why this problem
  → Open on the source platform
```

Display the profile as the codeStartrack learner's profile. Contributing account labels may repeat a platform, such as two Codeforces usernames after backend support exists, but they are quiet context. Do not split the profile into source-specific or account-specific ability panels. The current data-source label may say Codeforces; the profile heading should say **Training profile**.

Prefer solved problems, average difficulty, maximum solved difficulty and recent activity. Recent activity counts submissions over 7 and 30 days; solved count is a different metric. Average difficulty excludes unrated problems. Profile update time is not account last-sync time or recommendation generation time.

Current data comes from Codeforces, so describe its difficulty scores honestly rather than inventing a universal proficiency band. Future cross-source normalization is a backend contract concern (G-08). Do not use `skills` for ability claims or a radar chart: it is explicitly placeholder data. No large analytics dashboard is needed.

### Recommendation card

The recommendation card is the strongest element on `/dashboard`. It belongs to one learner-level experience and is aware of the recommended problem's source.

Show:

- source platform;
- supplied external problem ID and title when available;
- difficulty when available;
- tags when available;
- recommendation reason;
- a concise notice that current recommendation behavior is a placeholder;
- the primary external CTA, for example **Open on Codeforces**.

Use the backend's `url`; do not invent a new destination from platform strings. An empty title may fall back to the provided external problem ID. Null difficulty stays unavailable; it does not prove the problem is unrated. Absent tags need no replacement. Do not turn a recommendation `score` into a proven confidence or learner-ability score.

The API's current hardcoded reasons may make personal claims that are not backed by an implemented algorithm. Display the limitation prominently enough to prevent those claims from being read as verified analysis; do not add stronger AI/ability marketing. P-03 is resolved: the recommendation must visibly disclose its early placeholder behavior. The V01-02 inventory above supplies equivalent zh-CN/en accepted wording without reopening that requirement.

The same source metadata and CTA pattern can later accommodate additional connectors. Future source-specific labels do not require a different profile or product mode, and no unsupported source is available now.

## State presentation

| State           | Visual and interaction requirement                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading         | Use purposeful pending feedback, retain layout/context, and disable duplicate active operations. No premature zero metrics or fake progress.                                                                                                             |
| Empty           | Distinguish not connected, unavailable profile, valid zero activity, and no recommendation. Do not infer account absence solely from an ambiguous 404.                                                                                                   |
| Error           | Name the failed operation: connection, synchronization, profile read or recommendation read. Associate input errors with the handle field where appropriate. Use confirmed backend identifiers for translation; UI categories are not new wire codes.    |
| Success         | Confirm only completed operations. Zero new submissions is sync success; READY does not certify a mature recommendation algorithm.                                                                                                                       |
| Partial success | A loaded profile remains visible if a particular account sync or recommendation request fails. Retain known real account state; do not show every account as synchronized. Demo identity is fixed; external-account discovery/recovery still needs G-02. |

A real no-data response and an unknown/failed response must never share a misleading “all zero” summary. Unknown account history and unsupported connector state must remain explicit rather than appearing connected.

## Responsive behavior and accessibility

Desktop uses centered content, a comfortable maximum width, concise metrics and a clear recommendation section. Mobile uses a single column, full-width primary actions, readable connected-account details and unrestricted wrapping for the recommendation reason. Avoid dense tables or mode tabs.

Preserve semantic headings/landmarks, keyboard navigation, visible focus, associated form labels, accessible errors, icon accessible names, adequate contrast and non-color status cues. Announce meaningful operation-state changes without repeatedly stealing focus. Keep text readable at zoom and with longer localized labels; use system CJK fallback for Chinese.

P-04 is resolved: zh-CN is the default, en uses the same routes, and external problems open in a new tab with an accessible notice and `noopener noreferrer`. The V01-02 copy and locale-persistence proposal, and later layout details, preserve the approved two-page model and P-05 white/neutral-first tokens. They do not imply a new app flow.

## Future / Post-V0.1

Multiple same-platform accounts are an approved target awaiting backend support; the target collection pattern must not be represented as currently working. Internal editor/Judge/submission-result workspaces, progressive Agent chat, internal history, teams/coaches/role switching, skill radars, and large analytics surfaces are deferred. They do not shape V0.1 navigation, layouts or acceptance. Additional connectors should extend the existing account/data-source surface and feed the same unified profile/recommendation experience without redesigning the learner model.
