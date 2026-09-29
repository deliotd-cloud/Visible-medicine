# Regional dissection browser evidence — 29 September 2026

Local website `130228c1`, embedded Atlas `2792be3`; source parent `bdb4ad2`.
No runtime, model, teaching or entitlement change. Generated evidence refreshed.

## Checked

- All 11 regional layer sequences: 47 steps including assembled and skeletal
  views. Each offered step was selected through the actual DOM controls. Its
  retained count matched the separate enabled-entry readout.
- Every region: first removal, Undo, Redo and Reassemble returned the expected
  recipe; final-layer Undo/Redo and Reassemble restored expected counts.
- Whole body has independent study windows, not numbered peel layers.
  All 37 offered study groups opened via Preview then Open, with expected
  enabled counts. Final Reassemble returned 1,104 enabled entries.
- Foot removal sample: select Right talus, Dissect, Structure info, Remove.
  Removed count changed 0→1 and selection cleared with a named removal notice.
  Native Escape closed the sheet; tools Undo returned removed count to zero.
  Undo did not automatically reselect the structure; no selection-restoration
  claim is made.
- Browser viewport observed at 375×812. These are DOM-assisted responsive-layout
  tests, not physical touch or a second desktop matrix.

[Raw observations](evidence/regional-dissection-20260929.json) and
[reusable probes](../scripts/regional-dissection-browser-probe.mjs) are retained.
Navigate each regional URL before the layer/history probes; for whole body open
Dissect → Study windows & focuses before the library probe. Assert every
expected/enabled pair, history recipe restoration and final assembled count.

## Supporting source checks

The tracked dissection manifest was stale: it omitted 14 existing focus recipes,
and its report still counted 193 instead of 207 focused views. Regeneration from
unchanged source profiles refreshed the manifest and report. The validator now
supports `node scripts/validate-dissection.mjs --check` to fail on drift without
rewriting evidence. The JSON writer/checker tests cover missing, correct, CRLF,
stale and malformed records, preserving stale bytes on failed checks.

At unchanged runtime sources:
- `node scripts/validate-dissection.mjs`: 4,914 checks; 11,448 camera checks.
- `node scripts/validate-dissection-history.mjs`: 119,729 checks, 36 scopes,
  2,268 replayed transitions, actual handler cases.
- `node scripts/validate-study-library.mjs`: 63,504 assertions, 36 scopes,
  249 groups / 319 source recipes.

## Limits and next work

The DOM enabled count measures visibility state, not loaded mesh identity,
occlusion, spatial accuracy, tissue completeness or an operative sequence.
Some transitions were sampled while bundles were still loading; loading values
are retained in raw observations. The 47 layers are not all 159 source stages,
nor are 37 whole-body groups all regional focus combinations.
No new clinical approval, source media, patient upload, deployment or fracture/
desktop-PACS edits. Exact reassembly transforms, independent/nested specimens,
cross-region URL switching, real devices and clinical validation remain separate
acceptance work. No runtime defect was demonstrated by this sample.
