# Frontend visual regression

`tests/e2e/redesign-visual.spec.ts` compares the desktop dashboard, mobile first
recommendation, desktop ability evidence and enlarged-text login composition.
The tests use an explicit viewport, synthetic API values, fixed browser date,
loaded production fonts and reduced motion. Semantic assertions verify exact
scores, timestamps and unavailable destinations before screenshot comparison.
Business writes are rejected.

Build the production export first. Stop any offline preview before running these
commands: the host tests own ports 3100 and 3210 and their synthetic fixture.

```bash
pnpm build
pnpm test:e2e tests/e2e/redesign-visual.spec.ts --project=chromium
```

The explicit compositions run in the Chromium project. The mobile project skips
these four comparisons; the recommendation comparison itself uses a 390px
viewport. Other mobile behavior tests still run normally. Expectations under
`tests/e2e/redesign-visual.spec.ts-snapshots/` are platform-specific.

For an intentional design change, generate expectations explicitly, inspect all
four complete images and their attached semantic evidence, then compare again
without an update flag:

```bash
pnpm test:e2e tests/e2e/redesign-visual.spec.ts --project=chromium --update-snapshots
pnpm test:e2e tests/e2e/redesign-visual.spec.ts --project=chromium
```

An existing Linux test image can run the same comparisons with
`tests/container/visual-regression.mjs`. It requires Node 24 and the installed
project Playwright version under `/checks/node_modules`. Set
`VISUAL_REGRESSION_IMAGE` to that already-built image. The runner uses
`--pull=never`, no network or published ports, a read-only repository mount and a
container-local fixture. Only expected-image and evidence mounts are writable.
Generate and review Linux expectations separately; do not copy Darwin images.

```bash
node tests/container/visual-regression.mjs --update-snapshots
node tests/container/visual-regression.mjs
```

The comparator must reject a real defect. This probe adds 48px dashboard padding
only to the live test DOM and must fail at image comparison with a diff:

```bash
VISUAL_REGRESSION_PROBE=1 pnpm test:e2e tests/e2e/redesign-visual.spec.ts --project=chromium --grep="dashboard overview"
VISUAL_REGRESSION_PROBE=1 node tests/container/visual-regression.mjs --grep="dashboard overview"
```

Probe mode rejects baseline updates. Keep the failure evidence, confirm expected
image hashes are unchanged, and rerun all four clean comparisons. A missing
baseline, failed semantic assertion or failed font load does not prove that the
comparator detected the intended defect. Normal comparisons require existing
reviewed baselines; the default tolerance is 30 differing pixels at threshold
0.15. These bounded comparisons supplement rendered hierarchy, locale, zoom,
state and keyboard review.
