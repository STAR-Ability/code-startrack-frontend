# Codex Prompt — Update V0.1 Docs for Multiple Accounts on the Same Platform

You are working in the `codeStartrack` frontend repository.

This task is **documentation-only**.

Modify only these four files:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

Do not implement frontend code.
Do not modify backend code.
Do not invent new existing API behavior.

Before editing, read:

```text
AGENTS.md
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
docs/product/apidocs.md
docs/development/v01-demo-assumptions.md
```

---

# 1. New Product Requirement

The product model must support:

```text
One codeStartrack user
        ↓
Multiple external accounts
        ↓
Including multiple accounts from the same platform
```

Example:

```text
codeStartrack user #1

Connected accounts:
- Codeforces: account_A
- Codeforces: account_B
- Codeforces: account_C
- Future: LeetCode account_D
- Future: AtCoder account_E
```

All connected accounts belong to the same codeStartrack learner.

Their training data should contribute to:

```text
one unified training dataset
→ one unified learner profile
→ one unified recommendation experience
```

Do not create one learner profile per external account.

Do not create a "Codeforces mode".

---

# 2. Important Current API Conflict

The current backend API documentation does **not** support this requirement yet.

`POST /api/accounts` currently documents:

```text
one platform account can belong to only one student
AND
the same student can bind only one account per platform
```

Therefore the current backend permits conceptually:

```text
user #1
├── one Codeforces account
├── one future LeetCode account
└── one future AtCoder account
```

but it does **not** permit:

```text
user #1
├── Codeforces account_A
├── Codeforces account_B
└── Codeforces account_C
```

This must be represented honestly in the four documents.

Do not claim the current E3 contract already supports multiple same-platform accounts.

Do not invent an undocumented endpoint or silently remove the current 409 behavior.

---

# 3. What Already Fits the Desired Model

The existing profile endpoint is already conceptually compatible with multiple external accounts.

`GET /api/users/{userId}/profile` documents aggregation across all accounts linked to one user:

- solved problems are deduplicated and aggregated;
- average difficulty is weighted over problems with difficulty values;
- the response is user-level, not account-level.

This supports the desired architecture:

```text
multiple connected accounts
→ one user-level profile
```

However, the current account-binding constraint prevents multiple Codeforces accounts from reaching that aggregation through the documented API.

The recommendation endpoint is also user-scoped:

```text
GET /api/users/{userId}/recommendations
```

so the high-level recommendation model should remain learner-level rather than account-level.

---

# 4. V0.1 Status

Keep the current approved Demo identity assumption:

```text
DEMO_USER_ID = 1
```

and backend base URL configuration:

```text
NEXT_PUBLIC_API_BASE_URL
```

Do not re-open authentication/user-provisioning work.

However, distinguish these two facts:

```text
Internal user identity:
resolved for V0.1 with userId = 1

Multiple Codeforces accounts per user:
NOT supported by the current documented backend contract
```

If multiple same-platform accounts are required for the actual V0.1 implementation, mark the feature:

```text
BLOCKED_BY_API
```

until the backend constraint changes.

If the implementation remains one Codeforces account for the first V0.1 demo, document multiple same-platform accounts as an approved product requirement / future backend capability, not as currently working behavior.

---

# 5. Required Changes — product-requirements.md

Update the product model from:

```text
one external account per platform
```

to the intended product model:

```text
one codeStartrack user
→ zero or more connected external accounts
→ zero or more accounts may come from the same platform
→ all account data contributes to one unified learner profile
```

Add an explicit requirement similar to:

```text
A codeStartrack user may connect multiple external accounts,
including multiple accounts from the same platform.
```

Clarify:

- external account identity is distinct from internal user identity;
- each external account has its own `account_id`;
- each account is synchronized independently;
- all successfully synchronized accounts contribute to the same user-level analysis;
- source provenance must be retained;
- duplicate submissions/problems across accounts/platforms require backend-defined normalization/deduplication;
- the frontend must not present separate learner profiles for each account.

Update the requirement/API matrix:

```text
Multiple same-platform accounts
→ BLOCKED_BY_API / backend contract change required
```

Current E3 must be cited as the conflicting constraint.

Do not mark E1/E2 as blocked conceptually; they are already user-scoped.

---

# 6. Required Changes — page-structure.md

Keep the V0.1 route model:

```text
/
/dashboard
```

Do not create account-specific dashboards or platform-specific routes.

Update `/` so that the account area is modeled as a true **Connected Accounts** collection.

Conceptual example:

```text
Connected Accounts

Codeforces
├── tourist           Connected
├── QLluck            Connected
└── + Connect another account
```

For the current backend reality:

- only show `+ Connect another account` as usable when the backend supports it;
- until then, document the action as blocked/not yet available;
- do not fake successful second-account binding.

Each account row should conceptually support:

- platform;
- public username;
- connection status;
- account-specific sync state;
- last sync time when known;
- per-account re-sync when supported.

The `/dashboard` remains one unified profile.

It may show contributing sources/accounts as context, for example:

```text
Data sources
Codeforces · tourist
Codeforces · QLluck
```

but must not split the profile into separate account panels.

---

# 7. Required Changes — design-system.md

Keep the existing brand direction:

```text
white-first
modern
minimal
developer-oriented
Base UI / Nova
Geist / Geist Mono
Lucide
restrained cobalt / indigo
```

Update the **Connected Accounts** design pattern.

The UI should visually communicate:

```text
many connected accounts
→ one learner
```

Recommended pattern:

```text
Connected Accounts

[Codeforces] tourist
Synced ...

[Codeforces] QLluck
Synced ...

[ + Connect another account ]
```

Rules:

- group/display accounts cleanly without turning platforms into modes;
- repeated platform names are valid;
- account username is secondary metadata, not the learner identity;
- keep account cards/rows compact;
- do not create separate dashboards per account;
- do not make account count the primary visual focus;
- profile and recommendation remain the main outcome.

If the backend still only supports one Codeforces account, the design doc must distinguish:

```text
target interaction
vs
currently implementable interaction
```

Do not present a disabled capability as working.

---

# 8. Required Changes — api-contract.md

Preserve all currently documented E1–E5 behavior exactly.

Do not rewrite E3 as if the backend already changed.

Add a clear section such as:

```text
Multiple Same-Platform Accounts — Contract Gap
```

Document:

## Current E3 behavior

```text
POST /api/accounts
```

currently allows:

```text
one user
→ at most one account per platform
```

and may return:

```text
409
```

when the user already has an account on that platform.

## Desired product behavior

```text
one user
→ multiple external accounts
→ multiple accounts may share the same platform
```

## Required backend change

Mark:

```text
TODO: Backend API required
```

The backend must eventually change the account uniqueness rule from conceptually:

```text
UNIQUE(user_id, platform)
```

to a model that permits multiple account records for the same `(user_id, platform)` while still preventing the same external platform account from being attached incorrectly.

Do not prescribe an exact database constraint unless the backend schema confirms it.

Do not invent a new HTTP endpoint unless required by an approved backend design.

The existing `POST /api/accounts` endpoint could potentially remain the same if the backend changes its validation/uniqueness behavior, but that is a backend decision, not a documented fact.

## Account management gap

Multiple accounts also make returning-state management more important.

Record that the current API still lacks a documented way to:

- list connected accounts for a user;
- recover `account_id` values after reload;
- inspect per-account sync status;
- unbind an account;
- replace/remove an account.

For V0.1, do not invent these APIs.

If needed, mark them as future/backend gaps.

---

# 9. Data Semantics to Preserve

Keep this architecture across all four documents:

```text
codeStartrack user
        ↓
external account A ── sync independently
external account B ── sync independently
external account C ── sync independently
        ↓
normalized / deduplicated user-level data
        ↓
one unified training profile
        ↓
one recommendation experience
```

Important:

- `userId` identifies the codeStartrack learner.
- `account_id` identifies one external connected account.
- synchronization is account-scoped.
- profile is user-scoped.
- recommendations are user-scoped.
- recommendations retain source-platform metadata.
- external account usernames must never replace the internal learner identity.

---

# 10. Do Not Introduce Frontend-Only Workarounds

Do not propose:

- creating multiple codeStartrack users to represent one real learner;
- merging profiles from several internal user IDs in the browser;
- bypassing E3 by manually constructing `account_id`;
- hardcoding multiple account records;
- directly inserting database rows from the frontend;
- hiding the 409 response;
- treating multiple browser-local account names as if the backend had bound them.

These would break the intended learner model.

---

# 11. Documentation Status Language

After the rewrite, clearly distinguish:

## Product requirement

```text
One codeStartrack user can connect multiple accounts,
including multiple accounts from the same platform.
```

## Current V0.1 backend reality

```text
Only Codeforces is currently supported,
and current E3 allows at most one Codeforces account per user.
```

## Current V0.1 first-run demo

```text
DEMO_USER_ID = 1
Backend URL = NEXT_PUBLIC_API_BASE_URL
One Codeforces account can be used with the current backend as-is.
```

## Future/backend work needed for multiple Codeforces accounts

```text
Change account-binding uniqueness/validation
+ document account discovery/listing if required
+ verify user-level aggregation/deduplication semantics
```

---

# 12. Final Review

Before finishing, verify all four files agree on:

```text
one learner
→ multiple external accounts
→ multiple accounts may share a platform
→ one unified profile
→ one recommendation experience
```

while also accurately stating:

```text
current backend E3 does not yet support multiple same-platform accounts
```

Verify that:

- E1 remains user-level aggregation;
- E2 remains user-level recommendation;
- E3's existing 409/one-account-per-platform rule is not rewritten as supported;
- E4 remains account-scoped sync;
- no platform-specific learner profile is introduced;
- no frontend-only workaround is proposed;
- fixed V0.1 user `1` remains a temporary demo assumption;
- backend URL remains environment-configured;
- no backend code is changed in this task.

At the end report:

1. files changed;
2. product-model changes;
3. current API incompatibility;
4. which V0.1 behavior works with the backend unchanged;
5. which behavior remains BLOCKED_BY_API;
6. any new backend-contract gaps revealed by multiple same-platform accounts.

Do not implement code in this task.
