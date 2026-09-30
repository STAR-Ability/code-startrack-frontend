
# Codex Prompt — Rewrite V0.1 Product Documentation for Unified Multi-Platform Analysis

You are working in the `codeStartrack` frontend repository.

Your task is **documentation-only**.

Do not implement pages, components, API clients, mocks, routes, or business logic in this task.

Rewrite only these four files:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

Before editing, read:

```text
AGENTS.md
docs/architecture/tech-stack.md
docs/development/coding-standards.md
docs/development/repository-management.md
docs/product/project-plan.en.md
docs/product/apidocs.md

docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

The current product documents were previously written around a larger Demo V2 scope.

The immediate milestone is now:

```text
codeStartrack V0.1
```

---

# 1. Critical Product Model

Do **not** model codeStartrack as:

```text
Choose platform
→ enter platform account
→ get a platform-specific profile
→ get platform-specific capabilities
```

That is incorrect.

The correct product model is:

```text
One codeStartrack User
        ↓
Connect one or more external programming-platform accounts
        ↓
Collect training data from every connected platform
        ↓
Normalize and store the data
        ↓
Merge all supported platform data into one unified learner dataset
        ↓
Generate one unified personal training profile
        ↓
Generate recommendations from the unified learner state
```

Platforms are **data sources / connectors**, not product modes.

A user's abilities, profile, training goal, and product experience do not change because a different platform is connected.

The product should never imply:

> "Choose Codeforces mode"
> "Choose LeetCode mode"
> "Choose AtCoder mode"

Instead:

> "Connect your programming-platform accounts. codeStartrack combines your training data and analyzes you as one learner."

---

# 2. V0.1 Reality

The long-term product is multi-platform and performs unified analysis across all connected platforms.

However, **V0.1 currently has only one working data connector: Codeforces**.

Therefore:

```text
Product architecture:
Multi-platform unified analysis

V0.1 available data source:
Codeforces only

Future:
Additional platform connectors feed the same unified learner profile.
```

Do not redesign the user's abilities, profile, recommendation logic, or navigation when new platforms are added.

Future platforms should be added as additional data sources to the same learner model.

---

# 3. V0.1 Product Goal

V0.1 validates the first usable version of this unified-analysis architecture using Codeforces as the first available source.

The V0.1 flow is:

```text
User enters their Codeforces account
        ↓
Bind the external account to the codeStartrack user
        ↓
Synchronize public Codeforces training data
        ↓
Store normalized data in the backend database
        ↓
Build the user's unified personal training profile
        ↓
Generate recommended problems from the user's current profile
        ↓
Show recommendation reason
        ↓
Open the recommended problem through its source URL
```

Important:

Even though Codeforces is the only current source, the documents must describe the profile as:

```text
the user's codeStartrack training profile
```

not:

```text
the user's Codeforces profile
```

Codeforces is the current **input source**, not the identity of the product.

---

# 4. Core Product Mental Model

The V0.1 user experience should feel like:

```text
Connect my training account
        ↓
codeStartrack collects my training history
        ↓
codeStartrack analyzes me as one learner
        ↓
I see my current training profile
        ↓
I get the next recommended problem
```

Recommended user-facing idea:

> Connect your programming training accounts. codeStartrack combines your learning history, understands your current training state, and recommends what you should practice next.

For V0.1, only Codeforces can actually be connected.

Do not make Codeforces the central brand identity.

---

# 5. Platform / Connector Semantics

Use these concepts consistently.

## User

The person using codeStartrack.

The user has one unified identity inside codeStartrack.

## External Account

An account belonging to the user on an external programming platform.

Examples:

```text
Codeforces account
LeetCode account
AtCoder account
NowCoder account
```

## Platform Connector

The integration that knows how to fetch and normalize data from one external platform.

Examples:

```text
Codeforces Connector
Future LeetCode Connector
Future AtCoder Connector
```

## Unified Training Data

Normalized training records combined from all connected external accounts.

The internal data model should be conceptually platform-neutral after ingestion where practical.

## Unified Training Profile

One learner profile produced from all available normalized training data.

It should not become one profile per platform.

## Recommendation

A recommended problem based on the user's unified training state.

A recommendation may come from a specific source platform, but the **reasoning input is the user**, not a selected platform mode.

---

# 6. V0.1 Scope

## P0 — Required

### External Account Connection

V0.1 allows the user to connect a Codeforces account.

The UI should present this as:

```text
Connected Accounts
```

or:

```text
Connect Training Account
```

rather than designing the whole onboarding around "Choose your training platform."

Since Codeforces is currently the only supported connector, the UI may directly offer:

```text
Connect Codeforces
```

Future connectors can be added to the same account-management surface later.

The frontend must never ask for:

- platform passwords;
- cookies;
- API secrets;
- browser session data.

Only public identifiers supported by the backend should be requested.

### Data Synchronization

After an external account is connected, codeStartrack synchronizes public training data from that account.

For V0.1:

```text
Source = Codeforces
```

In the future:

```text
Source = Codeforces + LeetCode + AtCoder + ...
```

All supported sources feed the same unified user model.

The UI should communicate that synchronization may take several seconds.

A response with:

```text
new_submissions = 0
```

is still a successful synchronization.

### Unified Personal Profile

After synchronization, show a lightweight personal training profile.

Use only real metrics currently supported by the backend.

Currently documented useful metrics include:

- total solved problems;
- average difficulty;
- maximum solved difficulty;
- recent 7-day submission activity;
- recent 30-day submission activity;
- profile update time.

Important:

The documented `skills` field is placeholder data.

Do not present it as trustworthy ability analysis.

Do not build a radar chart from placeholder data.

For V0.1, the profile should be an honest summary of the learner's current training history.

### Recommendation

Use the currently documented recommendation endpoint.

Show one primary recommended problem.

A recommendation may include:

- source platform;
- external problem ID;
- title when available;
- difficulty when available;
- tags when available;
- recommendation reason;
- external problem URL.

The recommendation component should be **source-platform aware**, but not **platform-mode driven**.

Example:

```text
Recommended for you

Codeforces · 1300
Problem 1234B
Dynamic Programming

Why this problem
...

[ Open on Codeforces ]
```

In the future the same component may render:

```text
LeetCode
AtCoder
NowCoder
...
```

without changing the learner profile or product mode.

### Recommendation Limitations

The current API documentation states that recommendation results are placeholder / hardcoded behavior.

Document this honestly.

V0.1 validates the product flow and architecture, not a mature recommendation algorithm.

---

# 7. Explicitly Out of Scope for V0.1

Move these features to `Future / Post-V0.1`:

- internal code editor;
- `/problem/[id]` training workspace;
- Run Sample;
- internal code submission;
- internal Judge;
- AC / WA / TLE / CE / RE flow inside codeStartrack;
- progressive Agent hints;
- real LLM Agent;
- internal submission history;
- coach dashboard;
- team management;
- role switching;
- internal seeded problem bank;
- internal problem-detail API;
- complex skill radar;
- large analytics dashboard;
- RAG;
- vector database;
- AI problem generation;
- multi-language Judge;
- microservices;
- community;
- leaderboard;
- payments.

Do not let future features alter V0.1 acceptance criteria.

---

# 8. Recommended V0.1 Page Model

Keep the V0.1 product very small.

Prefer:

```text
/
└── account connection / onboarding

/dashboard
└── unified profile + next recommendation
```

Do not create separate routes per external platform.

Do not create routes such as:

```text
/codeforces
/leetcode
/atcoder
```

The user's product experience is unified.

---

# 9. `/` — Account Connection / Onboarding

Purpose:

> Connect the first available external training account and start building the user's codeStartrack profile.

Recommended content:

- codeStartrack branding;
- short value proposition;
- explanation that training data from connected programming platforms is combined;
- Connected Accounts / Connect Account section;
- Codeforces connector as the first available integration;
- public username input;
- primary CTA;
- public-data/privacy explanation;
- synchronization progress state.

Suggested V0.1 copy direction:

```text
Connect your training history

codeStartrack analyzes your programming practice across supported platforms
and turns it into one training profile.

Codeforces
[ username / handle ]

[ Connect and Analyze ]
```

Chinese UI may communicate the same idea naturally.

Do not make the page look like a "Codeforces analytics tool."

---

# 10. `/dashboard` — Unified Learner Profile

Purpose:

> Show the user's unified codeStartrack training profile and the next recommended problem.

Recommended information hierarchy:

```text
User identity
        ↓
Connected accounts / data sources
        ↓
Unified training summary
        ↓
Recent activity
        ↓
Next recommended problem
        ↓
Why this problem
        ↓
Open on source platform
```

The dashboard should not visually separate the learner into multiple platform profiles.

Future example:

```text
Connected:
Codeforces
LeetCode
AtCoder

Unified Profile:
- Solved
- Difficulty level
- Recent activity
- future skill analysis
```

The source platform can appear as metadata on specific records or recommendations.

---

# 11. V0.1 Interaction State

Use a simple operation flow:

```text
IDLE
  ↓
CONNECTING_ACCOUNT
  ↓
SYNCING_DATA
  ↓
BUILDING_PROFILE
  ↓
LOADING_RECOMMENDATION
  ↓
READY
```

For V0.1, these operations happen through Codeforces-backed APIs.

Do not expose "Codeforces mode" as an application state.

Errors should remain operation-specific:

- account not found;
- account conflict;
- external platform unavailable;
- synchronization failed;
- profile unavailable;
- recommendation unavailable.

Do not invent undocumented backend error identifiers.

---

# 12. API Contract Rewrite

Rewrite `docs/product/api-contract.md` around the distinction between:

```text
Unified product model
```

and:

```text
Current Codeforces-only API implementation
```

The existing documented endpoints remain authoritative:

```text
POST /api/accounts
POST /api/accounts/{accountId}/sync
GET /api/users/{userId}/profile
GET /api/users/{userId}/recommendations
POST /api/problems/sync/{platform}
```

Preserve exact:

- paths;
- methods;
- field names;
- status codes;
- response structures.

Do not invent new endpoints.

## V0.1 Backend Reality

Document clearly:

```text
POST /api/accounts
```

already contains a `platform` field, but V0.1 currently documents only:

```text
platform = "codeforces"
```

This is evidence that the account model is already conceptually platform-aware.

However, do not infer support for other platforms until the backend documents them.

## Important Contract Principle

Frontend/domain concepts should distinguish:

```text
user
external account
platform
training data
profile
recommendation
```

Do not rename backend wire fields, but avoid letting Codeforces-specific wire behavior leak unnecessarily into generic UI architecture.

## Known V0.1 Gap

The current account-binding API requires:

```text
user_id
```

but the current docs do not establish how a frontend obtains or creates that internal codeStartrack user.

Keep this as:

```text
TODO: Backend API required
```

Do not hardcode a production user ID.

## Future Multi-Platform Contract Direction

Document as future architecture only, not as existing APIs:

- a user may own multiple external accounts;
- each external account belongs to a platform;
- synchronized records retain source-platform provenance;
- normalized data contributes to one unified learner profile;
- recommendation outputs retain the source platform and external URL;
- adding a connector should not require changing the high-level product flow.

Do not invent future HTTP endpoints or schemas.

---

# 13. Product Requirements Rewrite

Rewrite `docs/product/product-requirements.md`.

Milestone:

```text
V0.1 — Unified Training Profile & Recommendation (Codeforces First)
```

Primary acceptance scenario:

1. User enters codeStartrack.
2. User connects a supported external training account.
3. In V0.1, the supported connector is Codeforces.
4. User enters a public Codeforces handle.
5. Frontend binds the account using the documented backend contract.
6. Frontend triggers synchronization.
7. Backend stores the imported public training data.
8. Frontend loads the user's codeStartrack training profile.
9. Frontend displays real supported profile metrics.
10. Frontend loads one recommended problem.
11. The recommendation displays its source platform and recommendation reason.
12. User opens the problem on the source platform.
13. The documents make clear that future platform accounts will contribute to the same user profile rather than create separate platform modes.

Useful requirement-matrix rows:

- internal codeStartrack user identity;
- external account connection;
- platform/source representation;
- Codeforces connector;
- synchronization;
- normalized/unified profile;
- recommendation;
- external source link;
- future additional connectors;
- operator catalogue synchronization.

---

# 14. Page Structure Rewrite

Rewrite `docs/product/page-structure.md`.

V0.1 routes:

```text
/
/dashboard
```

No platform-specific page routes.

For every page document:

- purpose;
- primary user;
- major sections;
- actions;
- required data;
- loading state;
- empty state;
- error state;
- success state;
- responsive behavior;
- API dependencies;
- unresolved dependencies.

Place old Demo V2 routes only under:

```text
Future / Post-V0.1
```

if they are retained at all.

---

# 15. Brand & Visual Direction

Rewrite `docs/product/design-system.md` around this brand:

```text
White-first
Modern
Minimal
Clean
Developer-oriented
Trustworthy
Calm
Technology-forward
```

The interface should feel like a modern AI / developer SaaS product, not a school administration system and not a single-platform analytics plugin.

Reference qualities:

- Vercel-like clarity;
- Linear-like discipline;
- GitHub-like developer familiarity;
- modern AI-product simplicity.

Do not directly copy another company's visual identity.

## Colors

Foundation:

```text
Background: white
Primary text: near-black / neutral
Secondary text: cool neutral gray
Borders: very light neutral gray
Cards: white / very light neutral
Primary accent: restrained cobalt / indigo
```

Use semantic theme tokens rather than scattered hard-coded hex values.

## Visual Personality

Use:

- generous whitespace;
- clear hierarchy;
- thin borders;
- restrained shadows;
- Nova-style density;
- medium corner radius;
- crisp typography;
- subtle hover/focus feedback;
- quiet secondary metadata.

Avoid:

- heavy gradients;
- neon/cyberpunk visual language;
- excessive glassmorphism;
- colorful admin-dashboard cards;
- giant decorative illustrations;
- emoji icons;
- excessive motion.

## Typography

Preserve:

```text
Geist
Geist Mono
```

Use a high-quality system CJK sans-serif fallback for Chinese unless a specific font is later approved.

## Iconography

Use Lucide React.

---

# 16. Signature V0.1 UI

## Connected Accounts Surface

The onboarding/account area should visually support future multiple connected accounts.

For V0.1 it may contain only:

```text
Codeforces
Connected / Not connected
username
last sync
```

The structure should be able to accommodate future additional connectors without redesigning the page.

Do not present unsupported platforms as working.

If future platforms are shown, label them clearly as:

```text
Coming soon
```

and keep them secondary.

## Analysis Progress

After connection/sync:

```text
Connecting account
Synchronizing training data
Building your training profile
Generating recommendation
```

Do not show fake percentages.

## Unified Profile Summary

Prefer a few high-signal metrics:

```text
Solved Problems
Average Difficulty
Max Difficulty
Recent Activity
```

The heading should communicate:

```text
Your Training Profile
```

not:

```text
Your Codeforces Profile
```

## Recommendation Card

This is the strongest element on `/dashboard`.

Show:

- source platform;
- problem ID / title;
- difficulty;
- tags;
- reason;
- external CTA.

The CTA label can be derived from source platform:

```text
Open on Codeforces
```

Later:

```text
Open on LeetCode
Open on AtCoder
...
```

The recommendation is still part of one unified codeStartrack product experience.

---

# 17. Responsive & Accessibility

Support desktop and mobile web.

Desktop:

- centered content;
- comfortable max width;
- concise profile summary;
- strong recommendation section;
- no dense admin dashboard.

Mobile:

- single column;
- full-width primary actions;
- connected-account details remain readable;
- recommendation reason remains readable.

Preserve:

- semantic headings;
- keyboard navigation;
- visible focus;
- associated form labels;
- accessible errors;
- icon accessible names;
- adequate contrast;
- status not communicated by color alone.

---

# 18. Terminology Rules

Use these preferred concepts:

```text
codeStartrack user
connected account
external platform
data source
training data
unified training profile
recommendation
source platform
```

Avoid using these as global product concepts:

```text
Codeforces user
Codeforces mode
Codeforces profile
Codeforces product
choose a training mode by platform
```

Codeforces-specific terminology is appropriate only at the actual connector/source boundary.

---

# 19. Files to Modify

Modify only:

```text
docs/product/product-requirements.md
docs/product/page-structure.md
docs/product/design-system.md
docs/product/api-contract.md
```

Do not modify:

- source code;
- `AGENTS.md`;
- backend code;
- routes;
- dependencies.

---

# 20. Final Consistency Review

Before finishing, verify all four documents agree on this architecture:

```text
One codeStartrack user
        ↓
Multiple external platform accounts over time
        ↓
Data synchronization per connector
        ↓
Normalized combined training data
        ↓
One unified learner profile
        ↓
One recommendation experience
        ↓
Recommendation retains its source platform
```

Verify V0.1 is accurately described as:

```text
multi-platform architecture
+
Codeforces-only connector currently implemented
```

and **not**:

```text
a platform-selection product
```

and **not**:

```text
a Codeforces-only product
```

Also verify:

- no internal Judge flow remains in V0.1;
- no coach/team flow remains in V0.1;
- no per-platform learner profiles are introduced;
- no platform-specific top-level routes are introduced;
- `skills` placeholder data is not represented as trustworthy analysis;
- recommendation placeholder limitations remain documented;
- exact API paths still match `apidocs.md`;
- the missing internal `user_id` source remains explicit;
- future platforms are described as additional connectors/data sources, not new product modes;
- brand direction remains white-first, modern, minimal, and developer-oriented.

At the end, report:

1. files changed;
2. corrected product architecture;
3. V0.1 Codeforces-only implementation boundaries;
4. future multi-platform extension points;
5. remaining backend/API gaps;
6. remaining product decisions;
7. any conflicts discovered between existing API docs and the unified-analysis model.

Do not implement product code in this task.
