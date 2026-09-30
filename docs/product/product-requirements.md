# codeStartrack Product Requirements

## Current read-only execution decisions

The user's later gateway/read-only instructions govern current implementation. Browser API requests go only to the Next.js application: `GET /api/training/profile` and `GET /api/training/recommendation` forward server-side to `GET /api/users/1/profile` and `GET /api/users/1/recommendations?limit=1`. Use one `DEMO_USER_ID = 1` and server-only runtime `BACKEND_BASE_URL`; never expose the backend through `NEXT_PUBLIC_*`. No POST, PUT, PATCH, DELETE, HEAD or OPTIONS may reach the live backend. E3/E4/E5 and the binding/synchronization flows described below remain deferred specifications, not current executable work.

P-01–P-05 are [resolved for this read-only slice](product-requirements.md#approved-v01-product-decisions): `/` links to the existing Demo `/dashboard`; retry only a failed GET; visibly disclose early placeholder recommendations; zh-CN default/en on the same routes, external problems in a new tab; white/neutral-first colors with blue only as an accent. The dashboard is a planned destination, not an already implemented scaffold route. No product UI is added by V01-01.

## Milestone and source authority

**V0.1 — Unified Training Profile & Recommendation (Codeforces First)**

Rewritten 2026-09-30 under [the V0.1 rewrite instruction](../../prompts/v01-doc-rewrite.md). This explicit instruction defines the immediate milestone and supersedes the larger Demo V2 scope previously assigned to these four product documents. [AGENTS.md](../../AGENTS.md) and [Project Focus V2](project-plan.en.md) still describe that larger direction; their training/Agent/coach loop and navigation are not V0.1 acceptance requirements. Those source files are unchanged. Deferred capabilities are listed under **Future / Post-V0.1** below.

[API v0.1](apidocs.md) remains authoritative for existing wire behavior. See the [API contract](api-contract.md), [page structure](page-structure.md), and [design direction](design-system.md). This is a documentation specification, not a statement that the frontend flow is implemented or that live services have been tested.

The [same-platform account update](../../prompts/v01-doc-update-multiple-same-platform-accounts.md) additionally approves multiple external accounts from the same platform and fixes the V0.1 Demo assumptions below. Its referenced `docs/development/v01-demo-assumptions.md` was not present at this review; the values are explicitly authorized by the current prompt itself. No additional assumptions are inferred and no file outside these four product documents is created.

## Approved V0.1 Demo assumptions

- Internal identity: `DEMO_USER_ID = 1`, a temporary Demo assumption, resolved for V0.1. E3 uses `user_id = 1`; E1/E2 use `userId = 1`. This is not a production identity or authentication design.
- Backend base URL: environment-configured through server-only runtime `BACKEND_BASE_URL`; do not hardcode a deployment URL or put secrets in it.
- Current first-run demo: one Codeforces account can be connected, synchronized, and analyzed for that Demo user with the documented backend unchanged, provided user 1 exists and has no conflicting binding and the backend/catalogue are available.
- Multiple Codeforces accounts: an approved product requirement, currently **BLOCKED_BY_API** by E3. It is not working behavior in the first-run demo. If required in the actual V0.1 implementation, that capability remains blocked until the backend contract changes.

Authentication/user provisioning is not reopened by this task. Knowing user 1 does not provide a connected-account list or recover lost `account_id` values; those remain separate account-management gaps.

## Product architecture and terminology

**码练星轨 (codeStartrack)** treats a person as one learner across programming platforms. Platforms are data sources and connectors, never product modes.

```text
One codeStartrack user
  → zero or more connected external accounts
  → multiple accounts may share the same platform
  → independent synchronization for each account through its connector
  → normalized combined training data in the backend
  → one unified training profile
  → one recommendation experience based on the learner
  → each recommended problem retains its source platform and external URL
```

| Concept                              | Meaning                                                                                                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| codeStartrack user                   | One internal learner identity, independent of external account handles.                                                                                                                                                  |
| External account / connected account | A public account linked to one codeStartrack user, with its own `account_id`. The target permits multiple accounts on the same platform; the current E3 restriction remains a backend limitation, not the product model. |
| Platform connector                   | The integration that fetches and normalizes a particular source's public training data.                                                                                                                                  |
| Unified training data                | Training records combined after ingestion, conceptually platform-neutral where practical while retaining source provenance. The current normalization schema is not documented.                                          |
| Unified training profile             | One profile for the codeStartrack user, aggregating their available connected-account data; never a separate learner profile per platform.                                                                               |
| Recommendation                       | A problem presented to the learner with its source metadata and URL. The intended reasoning input is the unified learner state, not a selected platform mode. The current algorithm is a placeholder.                    |

Connecting a source must not change learner identity, abilities, goals, navigation, or the product mode. Additional sources may improve the evidence available for the same profile; this does not create a new learner. V0.1 adds no goal-editing flow or new goal API.

## V0.1 availability and product goal

The architecture supports multi-platform unified analysis over time. **Codeforces is the only currently available connector in V0.1.** LeetCode, AtCoder, NowCoder, and other platforms are future connectors, not working integrations or selectable training modes.

V0.1 validates the usable connection-to-profile-to-recommendation flow using public Codeforces data. The profile is the **user's codeStartrack training profile**, with Codeforces identified as its current input source. Brand and navigation remain codeStartrack-owned.

```text
Enter a public Codeforces handle
  → bind it to an established codeStartrack user
  → synchronize public training data
  → backend stores imported data for the unified learner model
  → load the user's training profile
  → display real supported metrics
  → load one primary recommendation and its reason
  → open the problem on its source platform
```

The flow uses the approved Demo user 1 and server-only runtime `BACKEND_BASE_URL`; G-01 is resolved for this Demo, without adding a user-creation API. A failed binding must remain an error: neither the Demo assumption nor a local account name overrides the backend's ownership or per-platform restriction.

## Approved multiple-account requirement

**MA-01:** A codeStartrack user may connect zero or more external accounts, including multiple accounts from the same platform. All successfully synchronized accounts contribute to one unified training dataset, one learner profile, and one recommendation experience.

- Each external account has its own backend-issued `account_id`; its public username never replaces internal `userId`.
- E4 synchronization is independent per account. E1 profile and E2 recommendations remain user-scoped, not selected-account views.
- Retain source platform/account provenance through ingestion. Backend-defined normalization and deduplication must address overlapping submissions and solved problems across accounts and, later, across platforms; the browser must not sum separate profiles or raw per-account totals to invent unified metrics.
- Current E3 permits at most one account per user per platform and returns 409 for an existing platform binding. MA-01 is **BLOCKED_BY_API** (G-09); E1/E2 are conceptually compatible and are not themselves blocked by the desired model.
- Until the backend changes, the first-run demo uses one Codeforces account. Do not fake another successful binding or make Connect another account usable. The approved target remains in the product model even while its backend implementation is pending.

Do not work around E3 by creating extra codeStartrack users for one learner, merging their profiles in the browser, constructing account IDs, hardcoding account records, writing database rows from the frontend, hiding 409, or treating browser-local names as backend-bound accounts.

## First-run connection requirements (deferred execution)

| ID     | Requirement and acceptance evidence                                                                                                                                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V01-01 | Use `DEMO_USER_ID = 1` for the temporary V0.1 Demo throughout binding/profile/recommendation reads, and configure the backend through server-only runtime `BACKEND_BASE_URL`. Keep each backend-issued external `account_id` distinct from that identity. G-01 is resolved for the Demo. |
| V01-02 | Model Connected Accounts as a collection, allowing repeated platform names in the target. Only the first Codeforces account is currently bindable; adding another is **BLOCKED_BY_API** (G-09). Request public handles only, never platform passwords, cookies, secrets or sessions.     |
| V01-03 | Bind through E3, then synchronize the returned account through E4. Communicate that synchronization can take seconds to tens of seconds and prevent duplicate operations while pending.                                                                                                  |
| V01-04 | Treat `new_submissions = 0` as successful synchronization. `total_submissions` is the stored total for that external account, not the current import size or a fabricated unified total.                                                                                                 |
| V01-05 | Load E1 by user ID and present one lightweight unified profile using `totalSolved`, `averageDifficulty`, `maxDifficulty`, `recentActivity.last_7_days`, `recentActivity.last_30_days`, and `updatedAt`. Distinguish submission counts from solved-problem counts.                        |
| V01-06 | Explain that average difficulty excludes unrated problems. Do not claim that source difficulty scores are a validated universal ability scale. `skills` is placeholder data and must not be presented as measured ability or a radar chart.                                              |
| V01-07 | Use E2 to show one primary recommendation, with source platform, external problem ID, title when available, nullable difficulty, available tags, reason, and the returned external URL. Requesting `limit=1` supports the one-item presentation; ranking semantics remain G-04.          |
| V01-08 | Make the external CTA source-aware, for example Open on Codeforces. Use the supplied source URL, not an internal training route. An absent title can fall back to the supplied external problem ID; missing difficulty/tags must not become invented values.                             |
| V01-09 | Disclose that current recommendations are hardcoded/placeholder behavior. V0.1 validates the product flow and architecture, not mature personalization. A backend reason must not be endorsed as proven weakness analysis when its underlying algorithm is absent.                       |
| V01-10 | Show operation-specific pending, empty, failure, and success states. Preserve successful binding/sync context when a later operation fails; do not rerun binding as a generic recovery step.                                                                                             |
| V01-11 | Use only `/` for connection/onboarding and `/dashboard` for unified profile plus recommendation. No platform-specific routes, mode selector, or per-platform learner dashboards.                                                                                                         |
| V01-12 | Retain the account/connector/source boundaries so additional accounts, including same-platform accounts after G-09 is resolved, contribute to the same profile and recommendation. No per-account dashboards or usable unsupported connectors.                                           |

E1 already documents user-level aggregation across connected accounts; E2 is also user-scoped. These concepts fit MA-01. E3 currently prevents a second Codeforces account from reaching that aggregation through documented binding. E4 documents per-account storage/deduplication, but does not fully specify duplicate handling across several accounts. Normalization, provenance and overlapping-account deduplication need G-08 verification before MA-01 is considered complete; future cross-platform difficulty comparability remains unspecified.

## Requirement / API matrix

**A** = existing documented support; **B** = required contract missing/incomplete; **C** = operator or future concern outside the end-user P0 interaction; **D** = ambiguity or limitation requiring resolution. A documented endpoint does not imply a live-service verification.

**Resolved for Demo** identifies an explicitly approved temporary assumption. **BLOCKED_BY_API** identifies an approved product requirement that cannot be implemented truthfully with the current backend contract.

| Capability                              | Class                     | Current support / boundary                                                                                                     | Frontend consequence                                                                                                                                                 |
| --------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal codeStartrack user identity    | Resolved for Demo         | `DEMO_USER_ID = 1` is explicitly approved for V0.1; the API still does not document user provisioning.                         | Use the temporary Demo identity consistently. G-01 is not a V0.1 blocker; do not add authentication/provisioning work.                                               |
| External account connection             | A, B                      | E3 issues `account_id` for a binding, but currently allows only one account per user per platform. Listing/recovery is absent. | One Codeforces account works for Demo user 1 subject to documented errors; returning-state/409 recovery needs G-02.                                                  |
| Platform/source representation          | A                         | E3 has `platform`; E2 carries source identifiers and URL.                                                                      | Treat these as connector/provenance metadata, not global application mode.                                                                                           |
| Codeforces connector                    | A                         | E3 explicitly supports only `platform = "codeforces"` in v0.1.                                                                 | Only Codeforces can be connected now; no inferred support for other platforms.                                                                                       |
| Synchronization                         | A, D                      | E4 blocks until public-history import/storage completes, deduplicates, and returns counts.                                     | Honest pending state and zero-new-record success; timeout/retry/freshness details need G-05.                                                                         |
| Normalized/unified profile              | A, D                      | E1 aggregates connected accounts by user; summary metrics are real and `skills` remains placeholder. E2 is user-scoped too.    | No conceptual E1/E2 block for MA-01. E3 blocks additional same-platform bindings; G-08 must verify cross-account normalization/deduplication.                        |
| Recommendation                          | A, D                      | E2 is user-scoped but currently hardcoded; batch freshness depends on profile freshness.                                       | One primary card with a clear limitation notice; ordering, empty behavior, and refresh need G-04.                                                                    |
| External source link                    | A                         | E2 provides `platform`, `externalProblemId`, and `url`.                                                                        | Open the returned problem on its source platform; the learner stays the same codeStartrack user.                                                                     |
| Future additional connectors            | C, D                      | Generic account/source fields support the direction, not actual additional integrations.                                       | Future extension only; document source provenance/normalization without inventing APIs (G-08).                                                                       |
| Operator catalogue synchronization      | A, C, D                   | E5 populates a shared source catalogue required by E2; its 200 body schema is absent.                                          | Operational prerequisite, not a user onboarding step or public CTA. Owner/setup and payload need G-06.                                                               |
| Multiple same-platform accounts (MA-01) | **BLOCKED_BY_API** / B, D | E3's one-account-per-user-per-platform rule and 409 conflict with the approved target.                                         | G-09 requires a backend contract change; G-02 account discovery and G-08 deduplication also need definition. Never simulate success for a second Codeforces binding. |

## Account-connection operation flow (deferred execution)

```text
IDLE → CONNECTING_ACCOUNT → SYNCING_DATA → BUILDING_PROFILE
     → LOADING_RECOMMENDATION → READY
```

These are frontend operation labels, not backend job states. CONNECTING_ACCOUNT maps to E3, SYNCING_DATA to E4, BUILDING_PROFILE to the E1 read of computed metrics, and LOADING_RECOMMENDATION to E2, which may reuse a batch. There is no separate profile-build job or force-generation endpoint. Do not invent progress percentages or advance stages on timers.

Errors belong to the failed operation: account not found, account conflict, external platform unavailable, synchronization failure, profile unavailable, or recommendation unavailable. These are UI categories, not invented wire error identifiers. Preserve the documented status codes and confirmed `error` values. If recommendation loading fails, the successful profile can remain visible with a separate recommendation error; do not claim full READY success or erase the profile.

## First-run connection acceptance scenario (deferred execution)

Current first-run prerequisites: the approved `DEMO_USER_ID = 1`, a reachable backend configured by server-only runtime `BACKEND_BASE_URL`, no conflicting existing Codeforces binding for that Demo user/account, and operator-managed catalogue setup. This scenario exercises one Codeforces account, not MA-01. The fixed identity is a temporary Demo assumption, not a claim of a new provisioning API.

1. The user enters codeStartrack.
2. The user connects a supported external training account.
3. V0.1 makes only the Codeforces connector available.
4. The user enters a public Codeforces handle.
5. The frontend binds the first account with `user_id = 1` using the unchanged E3 contract and retains its returned `account_id`.
6. The frontend triggers synchronization for the returned external account ID.
7. The backend stores the imported public training data, with documented deduplication.
8. The frontend loads the user's codeStartrack training profile.
9. The frontend displays the real supported summary metrics and their limitations.
10. The frontend loads one primary recommended problem.
11. The recommendation shows its source and reason, with current placeholder behavior disclosed.
12. The user opens the problem on its source platform.
13. The documentation distinguishes the working single-account demo from approved MA-01: additional accounts, including accounts on the same platform, will feed this same learner profile after backend support is available.

No internal completion event, judge verdict, hint interaction, or coach role switch is needed to pass V0.1. Zero newly imported submissions is a valid successful sync. The documented recommendations can validate the flow only with honest disclosure; the milestone does not certify recommendation quality.

## Approved V0.1 product decisions

The user resolved P-01–P-05 on 2026-09-30 for the current read-only phase. Those user-approved decisions remain resolved. V01-02 supplies the concrete bilingual copy and locale details below. On 2026-09-30 the user delegated project-aligned implementation decisions to Codex and required recording the actions. Under that authorization, the existing proposal is accepted as the implementation baseline without changing P-01–P-05. UI implementation follows in V01-03–06.

| ID   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 | **RESOLVED** — `/` links to the existing read-only `/dashboard` Demo for learner 1. This refers to the approved Demo destination/data; the scaffold has no dashboard page yet, so V01-04/05 implement it before V01-06 exposes the entry link. No account discovery or recovery is implied.                                                                                                                                                                 |
| P-02 | **RESOLVED** — Retry only the failed GET operation. Preserve successful profile/recommendation state; no bind/sync recovery or mutation retry.                                                                                                                                                                                                                                                                                                              |
| P-03 | **RESOLVED** — Recommendations must visibly disclose that current recommendation behavior is an early placeholder. Reasons/scores are not validated personal analysis.                                                                                                                                                                                                                                                                                      |
| P-04 | **RESOLVED** — zh-CN is the default; en is supported on the same routes. External problems open in a new tab, using the supplied safe URL, an accessible notice and `noopener noreferrer`.                                                                                                                                                                                                                                                                  |
| P-05 | **RESOLVED** — Use the exact [white/neutral-first semantic palette](design-system.md#p-05--v01-color-selection-resolved): white background/card, foreground/primary `#111827`, white primary text, hover `#1F2937`, muted `#F8FAFC`, muted text `#64748B`, border `#E5E7EB`, accent `#EFF6FF` with `#1D4ED8` text, and `#2563EB` only for focus, links and limited active emphasis. Apply consistently in later UI Issues, with no theme changes in V01-01. |

Backend status G-01–G-09 and remaining ambiguities are detailed in [API contract](api-contract.md#v01-backend-and-api-gaps). G-01 is resolved for the Demo. MA-01 remains **BLOCKED_BY_API** under G-09; account discovery and cross-account deduplication need G-02/08. Future judging/team capabilities are not V0.1 blockers.

## V01-02 accepted implementation details

Status: accepted under the user’s 2026-09-30 delegation, recorded in the execution plan. The existing 55-key bilingual inventory, read-only states, operation-specific retry, locale cookie and timestamp presentation are the V01-03–06 implementation baseline. P-01–P-05 remain unchanged. No PR or separate Issue comment is required.

### Read-only entry and recovery

- `/` explains the shared read-only Demo and current Codeforces data source, then links to `/dashboard` in the same tab. `/dashboard` also works when opened directly. Navigation never requires account lookup, a handle, binding or synchronization. Provide a quiet return-to-entry link; no new product route is added.
- Omit handle forms, disabled submission forms, fake connected-account rows and unavailable connector tiles in this phase. State that account details are unavailable; do not turn unknown into an empty account collection. Retain the approved many-accounts/one-learner target and backend-blocked work in the deferred sections below.
- Initial dashboard loading reads E1, then starts E2 once after E1 first succeeds. An initial E1 failure leaves E2 unrequested. Retrying E1 repeats E1 only; its first success may then permit the never-attempted initial E2 read. Once E2 has been attempted, an E1 retry must not repeat/invalidate E2. An E2 retry repeats only E2 and preserves the profile. No bind/sync/catalogue recovery or automatic retries/polling/focus/reconnect reads.
- A valid empty recommendation list is successful empty data, with no error-retry CTA or fabricated alternative. Zero profile metrics remain zero, with no inferred absence of accounts. A 404, invalid payload or transport error stays a failed operation. Preserve last successfully loaded data on a later failure, clearly labeled as previously loaded, with its original timestamps.
- This slice needs no successful-state refresh button. If a later explicit task adds one, it must define its GET behavior separately from failure retry. The earlier planning sentence that automatically rechecked E2 after a profile refresh is superseded by the operation-specific rule above; no hidden second operation is attached to Retry.
- A usable supplied external problem URL opens only on explicit activation in a new tab, with `noopener noreferrer` and a visible/accessible new-tab notice. Missing/invalid URLs leave the card visible with an unavailable action. No source-site prefetch, tracking submission, completion claim or synthetic URL is added.

### Locale selection and persistence

- Supported values are exactly `zh-CN` and `en`, on the existing `/` and `/dashboard` routes. A missing/invalid preference resolves to `zh-CN`, irrespective of browser language. Do not add locale-prefixed routes, automatic language redirects or backend locale parameters.
- Show a compact, keyboard-operable language control with the autonyms `简体中文` and `English`. Switching changes the current presentation in place, preserving pathname, query/hash, scroll, focused control and loaded data. Locale is a presentation preference, not learner identity or a server-state query key; changing it must not trigger E1/E2 reads.
- Persist only the validated locale in a host-only frontend cookie named `codestartrack_locale`, with `Path=/`, `SameSite=Lax` and `Max-Age=31536000`; set `Secure` on HTTPS. It contains no account, identity, backend URL or authentication data. It is browser-writable (not HttpOnly), so changing a language needs no new API route, Server Action or backend write. Do not forward this or any other browser cookie upstream.
- On a full page request, use the same resolved cookie value for server-rendered copy, `<html lang>`, initial client locale, title and description. A fresh checkout with no cookie remains Chinese. Next.js's installed async `cookies()` API may make these pages dynamic; this does not authorize backend fetching in layouts or metadata. Do not make the initial client render disagree with the server.
- If browser persistence is unavailable, keep the selected language in memory for the current app visit and announce that it could not be saved. A full reload may return to the valid saved preference or `zh-CN`; do not claim persistence succeeded. No user session, local account storage, cross-tab synchronization or language-detection service is introduced.
- Update visible copy, accessible names, document language and route-specific metadata together after a switch. A frontend refresh used to reconcile server-rendered locale must preserve the client query/cache boundary and perform no backend reads. This is a behavior requirement for V01-03/04 integration, not a new data endpoint.
- Use matching dictionary keys from the [copy inventory](design-system.md#v01-02-bilingual-copy-inventory). Missing-key fallback is the Chinese string, never a raw key, empty label or fabricated backend text; parity checks must catch missing English keys before acceptance. Do not automatically translate backend titles, tags, platform identifiers or recommendation reasons.
- Format counts as locale-aware integers and average difficulty with at most one decimal place; rounding is presentation only. Format timestamps with explicit offsets in UTC, labeled `UTC`, consistently across server/browser. For accepted timestamps without an offset, retain the supplied calendar/time values and label the timezone as unspecified; do not invent a timezone or compare those values as absolute freshness evidence. `updatedAt` and `generatedAt` remain separate; neither is last synchronization time.

The full bilingual inventory and metadata strings are in [Design Direction](design-system.md#v01-02-bilingual-copy-inventory); state-to-copy and retry rules are in [Page Structure](page-structure.md#current-read-only-page-behavior-v01-02) and the [presentation mapping](api-contract.md#frontend-error-presentation-v01-02). Exact P-05 token values remain unchanged. Backend G-02–G-09 gaps and future mutation-recovery decisions remain open; this documentation update neither resolves them nor implements V01-03.

## Non-functional requirements

Preserve Next.js, strict TypeScript, Tailwind, shadcn Base UI / Nova, Geist/Geist Mono, and Lucide. Keep future backend integration centralized under `src/lib/api/`. Use documented APIs and accurate data labels; do not hide unavailable backend behavior in page components or introduce frontend mocks through this rewrite.

Support desktop/mobile web, keyboard interaction, associated form labels, visible focus, accessible errors, and localized UI. Default product language is `zh-CN`, with `en` supported when i18n is enabled. Engineering prose/identifiers stay English; wire fields and error identifiers stay unchanged. The profile and recommendation experience remain stable when future connectors are added.

## Future / Post-V0.1

Deferred: additional platform connectors; internal code editor; `/problem/[id]` workspace; Run Sample; internal submission/Judge and AC/WA/TLE/CE/RE flow; progressive or LLM Agent assistance; internal submission history; coach dashboards; teams and role switching; internal seeded problems/detail API; complex skill radar; large analytics dashboards; RAG; vector databases; AI problem generation; multi-language judging; microservices; community; leaderboards; payments.

The former `/training`, `/history`, `/profile`, `/problem/[id]`, `/coach`, `/coach/students`, and `/coach/student/[id]` route model belongs to the earlier Demo V2 direction, not this milestone. These are deferred references, not approved additions to V0.1 navigation. Adding future connectors must extend ingestion/account management while retaining one codeStartrack user, one unified profile, and one recommendation experience.
