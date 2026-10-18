# Forefoot muscle questions: local website import

9 October 2026. Atlas source `9b66b2d0ca4a6f02c14826fbfbd5f973ddcf5605`.

The generated regional learner and protected Clinical Review now share three
original question groups for 18 retained bilateral foot-muscle selections:
eight lumbricals, six plantar interossei and four flexor hallucis brevis heads.
The questions replace identification-only Quiz notes; they remain drafts for
revision-bound radiologist review. Existing decisions are not migrated or
treated as approval of the new material.

All 136 regional model bundles and all 12 regional scopes are unchanged.
Source pins, original teaching and generated learner bytes are checked together.
The integration test checks every selection, its four-choice answer, exact
source binding, Review state and rejection of stale, altered-answer or
altered-source packets. The source checkpoint separately verifies actual Quick
Check interactions, retry, feedback, concealment and non-target preservation.

The shared importer, generated Review renderer and existing strict revision
assertions are updated as one import. No hand-edit to the generated shoulder,
source masks, scan packages, CT/MRI behavior, PACS, authentication or entitlement
rules is included. Semantic imaging comparison remains distinct from validated
patient-space registration.

Evidence and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-forefoot-muscle-integration/saved-state.json`.
This is local-only delivery and same-machine recovery, not public deployment,
verified GitHub/off-device backup, clinical approval or new signed-in browser,
GPU or native-image acceptance. Obsolete generated chunks are retained on E;
canonical source assets and specialist work remain intact.

Verification: all 21 affected integration cases, TypeScript, the combined
Clinical Review verifier (1,128 source files), regional module and E website
builds pass. Forty-six route/access HTTP checks and 19 exact learner-asset
readbacks pass. The complete model inventory remains 137 models / 144 paths
with unchanged model records. Preview session 52582 on port 3000 replaces the
deliberately stopped session 78423; historical port 3001 and loaded scan tabs
were not touched. Thirty-two obsolete generated chunks have E recovery copies;
144 redundant build-only model copies were removed after exact recovery checks.
