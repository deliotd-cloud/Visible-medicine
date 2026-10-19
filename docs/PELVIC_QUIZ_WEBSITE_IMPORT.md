# Pelvic quiz website integration — 8 October 2026

The local website learner module and protected Clinical Review now share Atlas source `a453a3708749d1976a1cc18b69d8ece3f0eeec1e`. Five placements cover both testes, both deferent ducts and the male urethra, with three source-backed question concepts, choices, feedback and retry. These are formative drafts, not signed-off examinations.

## Scope and preservation

- Generated regional module exported from committed source; no generated hand edits.
- All 136 regional GLBs and all 12 regional scopes unchanged. Delivery inventory retains 137 models across 144 paths and administrator-review access.
- Clinical Review imports 1,102 source files. Exact quiz/source bindings reject altered answers and earlier revisions; no approvals migrated.
- Dedicated shoulder module, accepted CT/MRI masks, clinical PACS, authentication and independent access rules unchanged.
- No new dependencies, imagery, fees or publication. Anatomy references and commercial-use notices remain in the imported source.

## Verification

Eleven focused integration tests, full canonical TypeScript, combined regional/plexus review verification and sanitized website build pass. Forty-six loopback HTTP checks cover rendered routes, exact generated assets and private-review/model denial.

The actual exported scan-free regional module was checked at a 1057px browser width: testis correct/incorrect feedback, retry clearing, switching to urethra with no retained answer, and urethra correct feedback. No horizontal overflow or browser error logs were observed. This is component/module acceptance, not signed-in website persistence, native patient imaging, clinical acceptance or spatial registration.

## Recovery and preview

`E:/VisibleMedicine-LocalStaging/20261008-pelvic-quiz-integration/saved-state.json` records the committed source checkpoint, evidence and verified incremental bundle. Obsolete generated JS chunks (14 regional and 18 review) have verified recoverable previous copies there; original models remain untouched.

Preview session 77927 serves the integrated local website on port 3000. Historical port 3001 is untouched. Temporary module fixture 20695 and tab 28 were stopped/closed after verification. Recovery is scoped same-machine E storage, not verified GitHub or off-device backup.

Clinical review remains pending against the exact imported revision. Continue independent anatomy/learning and multimodal roadmap work; this draft gate does not stall the goal.
