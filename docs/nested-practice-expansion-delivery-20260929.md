# Expanded nested practice — local website delivery

29 September 2026. Imports Atlas `2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65`
into regional learner modules and protected Clinical Review. No publication.

Practice now covers 58 exact named selections, including 50 additional brain,
pulmonary, hepatic, renal, visual-pathway, cricothyroid and coronary-venous source
selections. Controls stay folded. Deep/overlapping Find targets can be separated
into a label-free tray, explicitly distinguished from anatomical positions.
Eligibility, load/renderer, isolation, cutaway and pulmonary filter guards remain
active. Rounds are formative, not validated exams or clinical assessments.

All 137 model hashes / 144 paths, 108 nested geometry identities and 75 teaching
bindings remain unchanged. Renderer fingerprints changed and require their own
review; prior approvals are not silently carried forward. No new assets, fonts,
datasets, dependencies or licence obligations. No scans/masks, entitlements,
desktop PACS or fracture work were changed by this import.

The head-neck coverage sentence now reads its counts directly from the delivered
manifest (291 regional / 77 nested), avoiding stale manually maintained totals.

Verification: all 259 website tests passed, with the amended manifest-count
assertion subsequently passing its targeted rerun; TypeScript, production build
and Clinical Review integrity checks passed after the final source edit.
The import checked every delivered file and preserved all existing model bytes.

Actual mobile learner journey at localhost:3000: search for hippocampus, open
cerebral dissection, select Hippocampi, choose Name mode, start two questions.
Choosing Left for both produced the expected wrong Right / correct Left feedback
and 1/2 score. Retry had only one missed question. Return restored Hippocampi;
host and iframe had no horizontal overflow. Screenshot inspected.

Actual protected review journey: exact left-hippocampus worksheet to model,
five-question Find round, separated tray and skip/reveal, 0/5 result, return to
dissection, then exact originating worksheet. No private decision was saved or
history expanded. Earlier standalone desktop/mobile acceptance is recorded in
the Atlas source delivery document; this is not physical-device or clinical QA.

The long-running local development server encountered a recursive framework
reload error. Its confirmed session was restarted without clearing user files;
the same localhost:3000 routes then returned 200 and completed these journeys.
Production build passed. This does not claim a permanent upstream framework fix.

Superseded generated learner chunks were copied to the coordination workspace's
`work/nested-practice-expansion-prior-generated-20260929` before replacement.
Git retains prior review viewer chunks. Nothing was published or approved.
