# Cervical guided learning — local website delivery

Atlas source `edca765b64dbdc58a75aa80610f42646bdb10511` now supplies the regional
learner and protected Clinical Review. The Spine page's Guided learning tab has
five stops: C1, C2, C3, C7 and T1, with C4–C6 as context. Reuses existing exact
BodyParts3D surfaces, attribution, source frame, flowing1.8s camera transitions,
pause/readiness/reduced-motion behavior and workspace restoration.

The review worksheet includes all eight visible structures and the complete
sequence, references, limitations, camera directions and timings. Limits must
exactly match the source definition; altered or incomplete evidence is rejected.
This is draft teaching, not clinical approval. No private review decisions changed.

## Integration integrity

- Regional module generated/exported from the clean Atlas commit; no generated
  module edited manually. Prior replaced generated assets hash-backed up on D.
- Shoulder export revalidated against the same commit without rebuilding or
  changing any input or payload file: only its provenance manifest advances.
- All136model files/143delivery paths unchanged. Separate lower-limb80ff7f2 and
  female-pelvis84e8d08 modules retain their own source pins and bytes.
- Protected review imports863source files through the existing route adapter.
- Existing Atlas/case/lecture entitlements and private review access unchanged.
- No new dependencies, fonts, models, images, scans, privacy claims or deployment.

## Checks

- 108 website Atlas/review tests pass, including both regional tours and64
  step/modality combinations (44regional plus20shoulder). Source notes and
  imported review topics match exactly; no scan loading or registration implied.
- TypeScript, review viewer build, website production build, review import
  integrity and model inventory checks pass. Existing chunk-size and route
  classification warnings remain; no new build failure.
- Actual375px embedded Spine page: load gate, five successive stops, Play,
  opening CT notes pauses, next step closes/reset notes, Finish restores the
  original workspace, one canvas and no inner/outer horizontal overflow.
- Actual320px protected C1 review: complete five-stop evidence, correct spinal
  limitations and regional learner instructions visible without overflow.
  No approval or draft record submitted; preview uses the existing local test
  identity, not a claim of live production authentication.

One existing dev-server hot-reload failure (vinext ALS recursion) was diagnosed
from the actual error and recovered by restarting that known server. No restart
was made solely for timeout. Current preview remains localhost3000.

## Remaining

Radiologist review must verify identities, fine mesh features, framing and all
teaching before sign-off. Actual scan linkage requires separately cleared cases,
reviewed mappings and Didanix Education access; generic anatomy is not patient
registration. Nothing published. Continue regional guided-learning coverage and
cleared educational imaging integration; do not repeat this completed import.

Evidence logs in the coordination workspace: `work/cervical-tour-website-tests-20260927.log`,
`work/cervical-tour-website-review-build-20260927.log`,
`work/cervical-tour-website-build-20260927.log`. Recovery identities belong in the
post-commit coordination checkpoint rather than self-referential source pins.
