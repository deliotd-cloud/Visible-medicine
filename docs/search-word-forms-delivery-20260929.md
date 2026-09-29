# Anatomical search word forms: local website delivery

Atlas `1c3dca274a958a88d583989b769d4b05296622d8` adds bounded collicular/colliculus/
colliculi and brachium/brachia matching. Names, source IDs and actions are retained;
brachia is not a fuzzy match for brachial arteries or brachialis. FMA numeric tokens
require complete IDs. Learner and protected Clinical Review use the same source.

No geometry, teaching content, source admissions, patient data, dependencies or
assets are added. All137 registered model hashes/144 paths remain unchanged.
Shared display fingerprints are refreshed; they do not approve clinical material
or rewrite previous review records. Atlas, case and lecture access remain separate.

`tests/clinical-review-search-word-forms.test.ts` checks shared source hashes,
both side-specific worksheet links, exact source tokens, model destinations,
stale-token rejection, held superior brachia and whole-word/numeric negatives.
The prior search/access/review/model suites remain enabled.

Fracture work remains separate and excluded from this integration commit.
Final test/browser/recovery evidence is recorded in the main coordination
checkpoint. This delivery is local-only, not publication or clinical acceptance.

Acceptance: all269 website tests, TypeScript and production build passed. At
375x812, learner search returned both inferior brachia and selected right FMA73463.
Review search for the left side opened its exact worksheet, the contained model
selected left FMA73464, and Back to worksheet restored the original source-bound
URL. No horizontal overflow in host/iframe/worksheet; no review decision submitted.
The old preview developed an ALS-registry hot-reload recursion error; restarting
that owned dev process restored both routes without changing application code.
