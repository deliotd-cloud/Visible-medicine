# Hepatobiliary quick checks: local website import

8 October 2026. The learner's existing Quiz/Quick check panel and protected
Clinical Review now use Atlas `ee6647564d871ebc86fa81c44c87718feb178567`.
This supersedes the source-only checkpoint, not the requirement for radiologist
review. Nothing was publicly deployed.

## Content and identity

Five exact existing structures receive original four-choice questions, answers,
explanations and references: liver, gallbladder, hepatic portal vein, cystic duct
and common hepatic duct. Select one in the whole-body Atlas, then open Quiz.
The legacy pelvis identifier for gallbladder is retained for compatibility, not
a claim about its anatomical location. Clinical Review uses the identical source
questions and rejects previous or altered question/answer/source packets.

The source documentation `docs/HEPATOBILIARY_QUIZ.md` contains provenance and
clinical limitations. No external illustrations, text passages, scans, meshes or
new dependencies were acquired. Existing commercial-use notices remain intact.
These are drafts: neither clinical approval, actual bile/blood flow, verified
duct continuity nor patient-space CT/MRI registration is established.

## Verified integration

- Learner manifest SHA-256: `fa163811c0e91524796258d9d546c95a5db1cee20d03fdc44e0df4ccdbaf11d7`.
- Source inputs SHA-256: `783db418320bf44f5279c29f81003657651a7789f39dd4d571dfc82f81be1aeb`.
- Protected Review integration: `5480cb7b294776054dc6d8939c8359e0aa37ebc4cd32654be488ed6c3b8f2c44`.
- 1,074 learner inputs and 1,107 Review imports; 136 regional models and all
  12 scopes unchanged. The independent plexus material remains unchanged.
- 13 affected tests pass across the initial 12 passes and one focused rerun.
  The initial failure was a stale fixed body-content digest in the girdle test;
  the three-line new resolver addition was inspected before advancing that pin.
  No assertion was removed. The original failure log is retained.
- Canonical TypeScript, combined Review verifier and local website build pass.
- 46 HTTP/access checks, 18 exact learner-asset readbacks and nine repeated
  anonymous denied-save/page-recovery checks pass. Model and Review access remain
  protected; tests did not sign in, write clinical decisions or bypass access.
- The source checkpoint verified five actual Quick check component interactions.
  This import changes teaching, not controls/layout; no new browser/GPU,
  signed-in native-image or clinical acceptance is inferred.

## Recovery and continuation

Evidence and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261008-hepatobiliary-integration/saved-state.json`.
32 obsolete generated chunks have verified previous copies there. 144 redundant
build-only model copies were removed only after checking existing E recovery
hashes; canonical originals remain unchanged.

Main preview: `http://127.0.0.1:3000`, session 89124, using the established isolated
current-runtime launcher. Previous session 9876 stopped; historical port 3001
untouched. Same-machine recovery is not GitHub or off-device backup.

Continue substantive source-backed regional and multimodal learning work. Keep
review-ready drafts queued without stalling independent development. Preserve
specialist edits, accepted masks, clinical PACS and independent entitlements.
