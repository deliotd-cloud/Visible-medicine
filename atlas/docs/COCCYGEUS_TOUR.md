# Coccygeus & pelvic landmarks — source-bound draft

This four-stop draft uses the native root-body display catalog at Atlas source `6ce2153ec403e2abdd41a1cce897dc08f5caf338`. The exact catalog JSON SHA-256 is `109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7`. Both coccygeus records and the right/left hip bones and sacrum occur once, include the `pelvis` region, and retain `unvalidated` / `anatomicalReview:false`. The three referenced GLBs were checked against catalog byte lengths and SHA-256 hashes by `scripts/pin-coccygeus-tour.mjs`.

| Stop | Selection and camera | Purpose |
| --- | --- | --- |
| 1 | Right hip bone, anterior; right hip + sacrum frame | Orient the right side near the usual ischial-spine origin without pretending the spine is a separate source landmark. |
| 2 | Right coccygeus, superior; right muscle close-up | Show the supplied right surface and describe the usual course toward lower sacrum/coccyx. |
| 3 | Left coccygeus, superior; both labelled representations | Compare the supplied source positions without inferring symmetry. |
| 4 | Sacrum, posterior; sacrum + both muscles | Relate both muscles to a whole-bone posterior landmark. |

The ordinary guided player supplies smooth transitions, caption timing, reduced-motion handling and speed controls; this proposal adds no player logic. All four steps use the same verified [TTUHSC pelvic-wall anatomy table](https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html) as an anatomical education reference. Captions are original and avoid a nerve-supply claim. That source describes the usual ischial-spine to lower-sacrum/coccyx course and membership with levator ani in the pelvic diaphragm. The labelled left representation includes two source files, so this tour does not claim a single original left muscle mesh or bilateral symmetry. Here, levator ani, coccyx, sacrospinous ligament and precise attachment footprints are **not** separately rendered. Fading is visual emphasis in an assembled source, not dissection or proof of contact.

## Integration recipe

`REGISTRY_RECIPE.json` supplies three exact, one-occurrence replacements for `lib/regional-tours.ts`, pinned to its baseline SHA-256 `c41ed833cdfac7ca925023221298bcdd3c57e46030121c61db27437259c968d7`. Add the import/export, append `coccygeusTour` after the existing final hamstring spread, and add its fail-closed matcher guard before generic ID resolution. Do not reorder or change any previous tour. The new module imports the existing `sourceCanonical` helper after integration; the two support copies in this isolated proposal are byte-identical to baseline and are not integration targets.

Main must run native affected tests and generation/binding checks in the integrated candidate, then review the actual contained runtime at all four camera stops. These source bounds establish a proposed frame, not screen legibility or clinical acceptance. Radiologist review remains revision-bound. No new CT/MRI/X-ray placement or patient registration is proposed; the coccygeus X-ray pending state stays untouched.

## Focused proposal check

From this proposal directory with the Atlas baseline available:

```sh
node --max-old-space-size=512 --import tsx scripts/pin-coccygeus-tour.mjs --check --atlas-root=F:/VisibleMedicine/staging/20261026-tongue-imaging-native/atlas
node --max-old-space-size=512 --import tsx scripts/test-coccygeus-tour.mjs --atlas-root=F:/VisibleMedicine/staging/20261026-tongue-imaging-native/atlas
```
