# Codex CLI environment

Audited on 2026-10-02. This setup is for codeStartrack V0.11, not a generic starter.

## Local audit and architecture

The audited machine is Intel x86_64 macOS 15.7.9, originally with Node 24.18.0, pnpm 12.8.1,
Apple Git 2.39.5 and Codex CLI 0.160.0 already installed. Codex is logged in with
ChatGPT and this repository is already trusted. No Codex App, OS upgrade,
Homebrew upgrade, global package upgrade or model/provider change is required.

The repository uses Next 16.3.6 App Router, React 19.2.8, TypeScript strict,
Tailwind 4, shadcn Base UI/Nova, TanStack Query, Zod and React Hook Form. Existing
ESLint, Prettier, Vitest and Playwright/CI provide the quality gates. Node types
were still on major 20, conflicting with Vitest 5; they now match Node 24.

- `src/app`: statically exported App Router pages and layouts.
- `src/components/{ui,layout,landing,workspace,auth}`: primitives, shell and features.
- `src/lib/api`: backend boundary, validation and error mapping.
- `src/lib/i18n`: zh-CN/en strings and locale handling.
- `tests/e2e`: browser flows and accessibility checks using guarded fixtures.
- `tests/gateway-server.mjs`: static export server/proxy on 3100 and synthetic backend on 3210.
- `docs/product`: approved scope and API reality; `docs/development`: workflow.
- `.agent/plans`: execution plans; `.agents/skills`: discoverable project Skills.
- `.codex/config.toml`: project MCP configuration. No CodeGraph index exists.

The current implementation is V0.11: static export to `out/`, same-origin
`/api/v1/**` proxy, Session authentication, multiple accounts and account-scoped
training data. The active API contract is `docs/product/api-contract.md` and its
linked V0.11 prompts. The former fixed-user GET gateway is historical.

On 2026-10-02 the user authorized integrating remote PR #7 (`12f4705`) with the
local CLI setup commit (`8ce4463`). Both histories are preserved by a merge;
there is no force push or replacement of the V0.11 product implementation.

## Start here

From the repository root:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev:doctor
codex
```

On this Mac, fnm selects Node 24.21.0 from `.nvmrc` in new zsh sessions.
Run `fnm use` if needed; the original system Node 24.18.0 remains available.
For a new machine, install Node 24 and the exact pnpm version in `package.json`
using their official installers. Do not run system upgrades to repair a project.
`pnpm dev:doctor` reports prerequisites and local configuration without printing env
files or authentication tokens. Its MCP listing is discovery, not a connection
test; its Chromium check is file existence, not a browser launch test.

Project config loads only for trusted projects. On a new machine, inspect these
files before accepting Codex's trust prompt. The existing machine needs no trust
change. Restart Codex after MCP edits; new Skills are discoverable on the next
turn, or after restart if the client caches them. Use `/mcp` to inspect connections
and `/skills` (or `$` completion) to inspect Skills.

Global `~/.codex/config.toml`, credentials, existing Skills/plugins, approval
rules are preserved. Shell startup files have additive PATH/fnm setup and backups
as documented below. Do not use `codex mcp add` for these
project servers: it would normally write user-level configuration instead.

## Selected MCP servers

| Server        | Source/version                                         | Purpose and boundary                                                                                                                                      |
| ------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn        | Existing `shadcn` dependency, lockfile resolves 4.21.0 | Component registry/docs; preserve Base UI/Nova.                                                                                                           |
| next-devtools | Vercel `next-devtools-mcp` 0.4.0                       | Runtime errors, routes, logs; use installed Next docs first. Duplicate `browser_eval` is disabled.                                                        |
| playwright    | Microsoft `@playwright/mcp` 0.0.83                     | Stateful browser inspection, screenshots, accessibility snapshots, console/network. Headless installed Chrome, isolated profile, service workers blocked. |
| context7      | Upstash `https://mcp.context7.com/mcp`                 | Current dependency docs; anonymous service tested, subject to rate limits. No local package/key installed.                                                |

Local servers run through `pnpm exec` against the committed lockfile rather than
unreviewed `@latest` downloads at each launch. Install before launching Codex and
start it from this repository. Browser artifacts go to ignored `test-results/mcp`.
The published MCP package internally pins Playwright 1.64 alpha; it is separate
from the existing E2E runner 1.63.0. Keep that upstream pairing intact and retest
on updates. The MCP action timeout is 15 seconds after this Intel Mac exceeded
the default 5 seconds when capturing screenshots.

Chrome is already installed on this Mac; a teammate without Chrome must install
it through the official browser distribution or explicitly choose another
supported Playwright MCP browser. E2E uses Playwright's bundled Chromium instead.

The MCP browser profile does not attach to personal logged-in browser tabs.
Isolation and allowed-origin settings are not a network security boundary.
Prefer `preview:offline` and inspect navigation destinations; the E2E request
interceptor does not automatically apply to MCP sessions. Never expose dev/MCP
servers publicly. Context7 queries leave the machine: send library names,
versions and generic questions, not private source, env files or learner data.
Remote tool/doc content is untrusted reference material, not task authorization.

GitHub's official MCP was evaluated but omitted: Git/`gh` already cover this
small team's repository, Issue and CI workflows without a second credential/tool
surface. Chrome DevTools MCP overlaps with Playwright and Next DevTools. Extra
filesystem, shell, memory, search and multi-agent servers are unnecessary here.
Microsoft's Playwright CLI + Skills is an alternative for token-efficient batch
work; the existing Playwright Test CLI covers regression runs and the selected
MCP covers stateful inspection, so a third browser runner was not installed.

## Selected Skills

| Skill                          | Scope                        | Purpose                                                                                                              |
| ------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `shadcn`                       | Existing project Skill       | Base UI/Nova composition, Tailwind tokens, forms and existing component reuse.                                       |
| `web-design-guidelines`        | Added project Skill          | Vercel UI, responsive and accessibility source review.                                                               |
| `codestartrack-browser-review` | Added project-authored Skill | Routes, locales, offline harness, browser checks and relevant Next/React/TypeScript/Tailwind documentation workflow. |

The Vercel Skill was inspected before installation from
`vercel-labs/agent-skills`, commit
`063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28). It contains instructions,
not executable installers. It fetches Vercel's current web-interface guidelines
on use; those remote rules are not pinned and must be treated as references.
The existing `skills-lock.json` shadcn entry is preserved; this paragraph records
provenance for the manually installed Skill rather than fabricating a CLI hash.

Vercel's broad React best-practices pack was evaluated but not installed: it
includes SWR and additional package recommendations that need adaptation to this
repository's TanStack Query and constrained scope. Version-matched Next docs,
Context7, existing repository rules and the focused Skill cover the immediate
need without a large overlapping rule pack. No Vue/Pinia/uni-app Skills were
added to this React repository; existing global Skills were not removed.

## Browser and quality workflow

```bash
pnpm check                     # lint, format, typecheck, unit tests, build
pnpm exec playwright install chromium  # only if bundled browser is missing
pnpm test:e2e                  # starts/stops its own isolated harness
```

For interactive review, in separate terminals:

```bash
pnpm build
pnpm preview:offline           # http://127.0.0.1:3100
codex                         # ask Playwright MCP to inspect that URL
```

Stop the manual harness before E2E: both use ports 3100 and 3210.
Check desktop/mobile, 320px width, 200% text sizing, zh-CN/en, keyboard focus,
dialog dismissal, navigation, console and network errors. Existing E2E tests
block nonlocal requests and old API paths. V0.11 auth/account mutations are
allowed only against the local synthetic backend. Inspect screenshots under `test-results` and the HTML report under
`playwright-report`. Do not commit screenshots containing private information.

For HMR/runtime diagnostics:

```bash
pnpm dev:offline               # http://127.0.0.1:3000, synthetic backend on 3210
```

Use Next DevTools with port 3000. This command starts the V0.11 fixture backend
on 3210 and explicitly sets the dev proxy to that loopback origin, overriding
`.env.local`. An occupied fixture port fails before Next starts. Stop this mode
before E2E or production preview, which also require port 3210. An empty backend
variable is insufficient: the V0.11 Next configuration falls back to `backend:8081`. Ordinary `pnpm dev` preserves the existing
`.env.local` behavior. Do not run dev and build concurrently because they share
`.next`. Build uses `next/font/google` and can need Google Fonts network access.
If the local proxy intercepts loopback tests, use
`NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost pnpm test:e2e`.

## Portable GitHub CLI and manual authentication

The audited Mac lacked `gh`. The official GitHub CLI 2.102.0 Intel macOS archive
was checked against release checksums and its release asset digest:

```text
file: gh_2.102.0_macOS_amd64.zip
SHA256: b245f24eb2bf5f75b426b4c26da3651a107f8d5b6f4fddfbfccc5679041378b3
```

The initial binary and license live in ignored `.tools/gh/`. The follow-up audit
also copied this verified release to the user PATH (see below).
`pnpm gh --version` uses that copy, falling back to a system `gh` on other hosts.
This portable binary is local and is not distributed by Git/pnpm. For another
machine, download its architecture's release from `cli/cli`, verify its matching
checksum before extraction, then place the binary at `.tools/gh/bin/gh`, or use
an existing trusted system installation. Do not run shell installers from blogs.

GitHub CLI login was completed by the user and verified on 2026-10-02.
On a new machine only, the user can perform:

```bash
pnpm gh auth login --hostname github.com --web
pnpm gh auth status
```

Do not extract tokens from GitHub Desktop or other applications. Git's existing
credential helper and `gh` authentication are separate. Login may store credentials
in the OS keychain/user config; it is the only anticipated user-owned global
credential step. GitHub MCP is not configured and needs no authorization.

Context7 anonymous access worked during setup. If it later returns 401/429,
stop that step and have the user obtain a key/login themselves. Keep secrets out
of repository config; Codex supports environment-backed authorization. A user
can add a `CONTEXT7_API_KEY` environment variable and configure
`bearer_token_env_var = "CONTEXT7_API_KEY"` in their user-level Context7 entry.
Do not make a missing key mandatory while anonymous access suffices.

## Source and maintenance review

Reviewed official sources (2026-10-02):

- [Codex project configuration](https://developers.openai.com/codex/config-basic),
  [MCP](https://developers.openai.com/codex/mcp),
  [Skills](https://developers.openai.com/codex/skills).
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp): active,
  not archived; repository pushed 2026-09-28; npm repository identity checked.
- [Vercel Next DevTools](https://github.com/vercel/next-devtools-mcp): active,
  not archived; pushed 2026-09-15; npm repository identity checked.
- [Upstash Context7](https://github.com/upstash/context7): maintained hosted docs
  service; generic anonymous MCP requests tested without acquiring credentials.
- [Vercel agent-skills](https://github.com/vercel-labs/agent-skills): fixed commit
  above; reviewed UI skill and rejected overlapping broad React pack.
- [GitHub MCP](https://github.com/github/github-mcp-server): official, omitted.
- [GitHub CLI release](https://github.com/cli/cli/releases/tag/v2.102.0): official
  release archive verified before execution.

No unknown install scripts, admin operations, secret exports or live backend
writes are part of setup. npm metadata/downloads for added MCP packages used
`registry.npmjs.org`; existing user registry/proxy configuration is preserved.
The initial audit found GHSA-345p-7cg4-v4c7 in Next DevTools' pinned MCP SDK
1.25.2. A scoped `pnpm-workspace.yaml` override selects SDK 1.31.0; the official
fix starts at 1.26.0. The advisory concerns shared multi-client transports, not
this single-client stdio setup, but the vulnerable package is removed. Review
and remove the override when upstream updates. The subsequent audit reports
zero known vulnerabilities.

Pinned versions reduce drift, not supply-chain risk. Review upstream diffs and
release metadata before updates, then re-run MCP/browser and quality checks.

## Verification record and remaining limits

The following results describe the original V0.1 environment setup, before the
V0.11 merge. They are historical, not evidence for the merged application:

Original verification results:

- `pnpm install --frozen-lockfile --registry=https://registry.npmjs.org`: passed.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`: passed.
- `pnpm test`: 7 files / 122 tests passed.
- `pnpm test:e2e` with loopback proxy bypass: all 80 desktop/mobile tests passed
  in 2.5 minutes, including both locales, accessibility and negative API states.
- `BACKEND_BASE_URL= pnpm build`: passed (standalone output).
- `pnpm peers check`: no conflicts; official-registry audit: zero known vulnerabilities.
- `pnpm dev:doctor`: passed required checks; GitHub login reported as manual.
- Codex CLI read-only, ephemeral connectivity request returned `CODEX_CLI_OK`
  using the existing login and configured model; no tools or file changes.
- Codex app-server `--strict-config`: project Skills discovered with no errors;
  shadcn 7 tools, Next DevTools 3, Playwright 25, Context7 2.
- Context7 initialize, resolve-library-id and query-docs returned real React docs.
- shadcn registry read and Next DevTools port-3000 discovery succeeded.
- `pnpm dev:offline`: HTTP 200; Playwright MCP visited the page, resized to
  390/1440, captured screenshots, and reported zero console errors/warnings.
- `pnpm preview:offline`: Playwright MCP clicked entry → practice; the two local
  training GETs returned 200, console errors/warnings were zero, and screenshots
  were saved at 390px and 1440px. After settling, 390px had no horizontal overflow.
- Skill frontmatter validator and Next's own agent-marker validator passed.

Initial sandbox failures were not application failures: install needed access to
the existing proxy/store, and browser/server/Turbopack needed process/port access.
After approved retries, stale `.next/dev` route types and a cached Turbopack panic
were archived under `/tmp/codestartrack-next-*-backup-*` and regenerated. No source
or user settings were discarded. If stale deleted-route type errors recur, stop
Next, archive generated `.next` output and regenerate; do not weaken TypeScript.

Known limits: new-machine GitHub login remains manual; Context7 needs network and can rate
limit; Chrome/Chromium-only checks do not cover Safari/Firefox or constitute a
full accessibility audit. ESLint 9.39.4 is marked unsupported by npm; migrate to
ESLint 10 in a separate compatibility-reviewed task. The MCP dependency uses an
upstream alpha Playwright build. Existing unrelated global plugins/Skills are
still visible, since this task preserves them. There is no CodeGraph index, and
Google Fonts can still make first builds network-dependent.

Browser observation: the dev homepage reported a 391px scroll width at a 390px
viewport during the immediate resize probe. After waiting one second in the production preview, the width was 390/390.
All narrow-screen regression checks passed; no persistent overflow was found.

## Changed file inventory

- `.codex/config.toml`: four project MCP servers and local launch settings.
- `.agents/skills/web-design-guidelines/SKILL.md`: fixed upstream UI review Skill.
- `.agents/skills/codestartrack-browser-review/SKILL.md`: project browser workflow.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`: MCP development
  dependencies, Node 24 types, scoped SDK mitigation and convenience scripts.
- `scripts/doctor.mjs`, `scripts/dev-offline.mjs`, `scripts/gh.mjs`: prerequisites,
  fixture-backed dev launch and portable/system GitHub CLI wrapper.
- `AGENTS.md`: valid Next managed block and project tooling guidance.
- `README.md`, `docs/development/ai-development-guide.md`, this document:
  discoverable setup, current workflow, provenance and verification evidence.
- `.agent/plans/codex-cli-environment.md`: execution plan and outcomes.
- `.gitignore`, `.prettierignore`, `eslint.config.mjs`: exclude portable binaries.

The environment integration preserves the remote V0.11 application and tests.
Only tooling, instructions and the README conflict were adapted during merging.
The local `.tools/gh` binary and generated browser evidence remain ignored.

## V0.11 integration verification

Verified after integrating PR #7 on 2026-10-02:

- Frozen-lockfile install, lint, format, typecheck and static export build passed.
- All 50 unit tests and 81 desktop/mobile E2E tests passed.
- `dev:offline` served `/api/v1/me` through the local fixture even with a conflicting
  inherited backend URL; a second instance rejected the occupied fixture port.
  Stopping dev released that port successfully.
- `dev:doctor` and GitHub CLI authentication passed; no peer dependency conflicts.
- Old V0.1 route caches were archived under `/tmp/codestartrack-v011-stale-dev-*`.
- Product source, Next/Playwright configuration and tests match remote V0.11.
  The README preserves V0.11 and adds the environment guide link. Two inherited
  documentation trailing-whitespace issues were trimmed for `git diff --check`.

See `.agent/plans/merge-v011-codex-environment.md` for integration scope.
No live backend calls or production mutations were used for verification.

## User PATH and frontend CLI audit — 2026-10-02

GitHub login and executable discovery are separate: gh was authenticated but
initially reachable only through the repository wrapper. fnm was not installed.
The user requested terminal-wide CLI access and compatible tool updates.

| Tool | Verified state after setup |
| --- | --- |
| gh | 2.102.0, current official release; user PATH and existing portable copy; existing keychain login reused. |
| fnm | 1.39.0, newly installed official macOS binary. |
| Node | 24.21.0 via fnm in this repository; latest Node 24 release in the official index at audit time. System 24.18.0 preserved. |
| rg | 15.2.0 on user PATH; old Homebrew 14.1.1 preserved. Codex already bundled 15.2.0, but normal terminals did not use it. |
| jq | 1.8.2 on user PATH; Apple jq 1.7.1 preserved. |
| Codex / pnpm | 0.160.0 / 12.8.1, already current; no update required. |
| Git | Apple 2.39.5 retained; adequate for this workflow. No Xcode/Homebrew upgrade solely for a newer Git. |
| fd / tsx | Follow-up installation requested by the user: fd 10.5.0 on user PATH; tsx 4.23.15 pinned as a project devDependency. |
| Playwright | Existing locked runner and MCP retained; no product dependency upgrade in this task. |

User-level files (outside Git, no sudo or system-binary replacement):

- `~/.local/share/dev-tools/{gh/2.102.0,fnm/1.39.0,rg/15.2.0,jq/1.8.2}`:
  versioned binaries, exposed by symlinks in `~/.local/bin/`.
- `~/.config/dev-tools/path.sh`: idempotent user-bin PATH setup.
- `~/.config/dev-tools/zsh-env.zsh`: fnm initialization once per zsh process,
  recursive `.nvmrc` discovery, quiet directory switching and preserved pnpm PATH.
  Engine-only inference is disabled to avoid implicit changes in unrelated projects.
- `~/.zshenv`: additive PATH block for noninteractive shells;
  `~/.zprofile` and `~/.zshrc`: additive PATH/fnm blocks for login/interactive shells.
  Existing content is retained. Bash configuration is unchanged.
- Original startup files are backed up under
  `~/.config/dev-tools/backups/2026-10-02T09-39-06.424Z/`.
- fnm stores Node in its standard macOS application-support directory. Its
  default alias is `system`, preserving unmanaged Node outside versioned projects.
  Entering this repository selects the installed Node 24 version; automatic
  switching does not authorize installing versions for other projects.

Open a new zsh terminal or run `exec zsh -l` to refresh an existing terminal.
A plain noninteractive shell receives the executable PATH; use `fnm exec` when
it needs explicit Node selection without startup initialization. Future Node
updates should match the project, not use `fnm install --latest`.

Rollback is scoped: remove only the marked frontend CLI blocks from startup
files (or compare with backups), remove the added user-bin symlinks, and open a
new shell. System binaries are untouched. Do not blindly restore an old backup
over subsequent user edits. Managed binaries and Node versions can remain on
disk until no longer needed.

Official source review and SHA-256 verification before binary execution:

- [fnm v1.39.0](https://github.com/Schniz/fnm/releases/tag/v1.39.0), `fnm-macos.zip`:
  `f046483e85c53b3278efe49a3620c8680f22efa58a8dabfd03eafc6b59b31a25`.
- [ripgrep 15.2.0](https://github.com/BurntSushi/ripgrep/releases/tag/15.2.0), Intel macOS archive:
  `af7825fcc69a2afc7a7aea55fc9af90e26421d8f20fe59df32e233c0b8a231c1`.
- [jq 1.8.2](https://github.com/jqlang/jq/releases/tag/jq-1.8.2), `jq-macos-amd64`:
  `e94b266e3c26690550006abe63152b782280f4e14374accdf04cbde844f00bc0`.
- [Node distribution index](https://nodejs.org/dist/index.json): fnm downloaded
  24.21.0 directly from the official HTTPS distribution. No remote shell installer.
- gh uses the previously verified release recorded above. npm's official
  registry was checked for Codex and pnpm versions; neither required updating.

No new login, OAuth grant, API key, administrator access or dependency was needed.
AGENTS.md section 20 records tool priorities, fallback order and the preference
for Node over Python for frontend tasks. The existing CodeGraph-first rule still
applies if an index is added later; this audit does not create one.

Follow-up verification under Node 24.21.0:

- Login, interactive and noninteractive zsh resolve gh/fnm/rg/jq on the user PATH.
  Repo/subdirectory Node selection and restoration of system Node outside the
  repo passed explicit assertions. Startup syntax checks passed; the original
  content of all three startup files remains an exact prefix of the new files.
- Native `.mts` execution and jq JSON parsing passed. GitHub authentication,
  Codex version/login, MCP discovery and the environment doctor passed.
- Frozen-lockfile install, lint, format, typecheck, all 50 unit tests and static
  export build passed. No package or lockfile changes were needed.
- Browser regression: first run 80/81 passed. The desktop failed-refresh test
  could not find initial recommendation content; it installs a failing route
  after the refresh button is enabled without first waiting for that content.
  The same unmodified test passed on `--last-failed` (1/1). This suggests an
  existing timing race, not a clean first-pass suite. Product code and test
  assertions were not changed; test stabilization remains a follow-up.
- Full repository diff and whitespace checks passed. No live backend writes,
  secrets, shell backups or executable downloads are included in the commit.

## fd and tsx follow-up

At the user's request, installed the following tools after the initial fallback-only audit:

- **fd 10.5.0**: official [sharkdp/fd release](https://github.com/sharkdp/fd/releases/tag/v10.5.0),
  Intel macOS archive, SHA-256 verified against its release asset digest before
  extraction: `7e31028c62c6955877735d0406807aa484c2a5e6f86235a59e26c29c301da590`.
  Binary/licenses live in `~/.local/share/dev-tools/fd/10.5.0/`, with
  `~/.local/bin/fd` on the existing user PATH. No additional shell edits needed.
  Use `fd --type f --extension ts . src` for filename discovery; retain rg/find fallbacks.
- **tsx 4.23.15**: official npm package, repository identity
  [privatenumber/tsx](https://github.com/privatenumber/tsx), Node requirement >=18.
  Pinned in project devDependencies and the lockfile; use `pnpm exec tsx script.ts`
  or `pnpm exec tsx script.tsx`. No global copy, so collaborators use the same
  version after installation. It executes TypeScript/TSX but does not typecheck.
- tsx brings esbuild 0.28.2 and its platform-specific optional binaries. pnpm
  initially blocked esbuild's postinstall script. The project explicitly sets
  `allowBuilds.esbuild: false`, retaining the no-script policy while using the
  installed platform binary. Frozen installation and actual TS/TSX execution
  are checked, not just CLI version output. Keep optional dependencies enabled.
  Additional lockfile entries include platform binaries and Vite/Vitest optional
  peer resolution; application dependency versions are unchanged.

AGENTS.md now prefers fd for dedicated filename discovery and project-local tsx
for TypeScript scripts, retains Node for JS and compatible TS fallbacks, and
continues requiring separate type checking. This supersedes the initial decision
to omit fd/tsx; no other tool policy or system installation is replaced.

Verification: fd found real project files; tsx executed both an enum-based TS
snippet and a React TSX server-render assertion. Frozen install, lint, formatting,
typecheck, all 50 unit tests and build passed; npm audit reported no known
vulnerabilities. Browser E2E was not repeated for this tool-only change; the
previous browser run and its timing caveat remain recorded above.
