# Exact cranial teaching epochs

The costal-cartilage and cranial-boundary transition snapshots record complete
source-era teaching, display identities and dissection recipes. Comparing today's
expanded content against those old full hashes caused an existing regression;
the recorded expected hashes themselves have not changed.

`scripts/exact-cranial-epoch-context.mjs` reuses the existing Git-backed source
resolver with four fixed epoch names. It verifies exact commit, tree, parent and
catalog blob, and reads both API and catalog from that epoch rather than HEAD.
Arbitrary refs, unknown epochs and historical catalog drift fail closed. The
focused validator checks the original pin/transition hashes, target identities,
sections, source licence and bundles, recipes and complete before/after teaching.

The two legacy validators and transition `--check` commands use these epochs for
dated full-snapshot assertions. Their current content/schema export checks still
use the live application; ordinary authoring is not silently redirected to the
old source. The live history-composition test retains idempotence, five newer
branch-mutation refusals and unchanged-live-API checks, independently of the
original full hashes. This is not a runtime or clinical-approval migration.

Run from the Atlas checkout:

```sh
npm run cranial-history:test
npm run costal-cartilage-imaging:test
npm run cranial-boundary-clinical:test
npm run content:test
```

The focused test rejects copied epoch identity, altered pins/transition, target
or unrelated lesson changes, mixed target states, source-name/licence drift and
recipe additions. Historical snapshots cover 9,918 topic placements, whereas the
current separate content contract covers 9,936. Neither substitutes for current
renderer, website, browser, licensing or radiologist review.

Batch evidence: `E:/VisibleMedicine-LocalStaging/20261003-cranial-epoch-repair/`.
The initial failed new preservation assertion remains logged: the selected
epigastric draft was correctly reversed by an existing composed adapter, contrary
to the test author's assumption. The correction changes only that new test;
original adapters, expected hashes, pins and transition data remain untouched.

No application content, models, dependencies, scans, masks, generated shoulder
module, entitlement or private approval changes are intended. The website runtime
remains at its existing da1c7f6 source; scripts-only changes need no regeneration
or publication. Broader historical validators are not claimed repaired by this
bounded batch. The full Atlas goal remains active.
