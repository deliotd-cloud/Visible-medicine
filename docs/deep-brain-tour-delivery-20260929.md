# Deep-brain tour delivered locally

Atlas source `b5447ec5a14f32670ddc591918997b14b62974b7` supplies a six-stop
deep-brain orientation sequence in Head & neck and Whole body Guided learning.
It compares seven unchanged source selections, with smooth camera moves,
local framing and the existing imaging/quiz disclosures. No extra navigation.

Learner export and protected review use the same tour definition. The seven
participating body worksheets bind the complete sequence, captions, references,
source identities and camera frames. No decision is migrated or submitted.
The recently added exact worksheet-return helper is retained unchanged.

## Validation

- Full website run:254/255 tests initially passed. The one failure was an older
  test treating every otherwise-unlisted head-neck tour as the five-stop larynx
  tour. Restricted that assertion to its exact tours and added dedicated
  six-stop deep-brain source/frame/tamper checks. All three tests in that file
  pass on retest; the other252 passes are unchanged.
- Type check and production build pass. No test skipped or tolerance weakened.
- Source mobile375x812: all six stops, labels, first-stop screenshot and Finish
  checked; no horizontal overflow. Earlier pending browser handles completed.
- Website mobile head-neck: four tour options, new tour loads/starts, canvas
  present, host and iframe without horizontal overflow.
- Website desktop1440x1000 whole-body:16 options, all six stops and Finish,
  matching headings and no horizontal overflow.
- Protected mobile Corpus callosum worksheet renders the new tour and captions.
- All136 model assets/143 delivery paths preserved; no new geometry or scans.

Review integration hash:
`315818bab66b0c97549e842934b521559c1836439bb12a5e8277b8dc3ee4ba70`.
884 imported source files;31 review-viewer files;22 packages, unchanged licensing.

Old generated chunks removed during import are retained in the coordination
workspace's `work/deep-brain-tour-prior-generated-20260929/` and prior Git commit.
Fracture-workspace changes preserved. No hosted publication or clinical approval.
FMA61970 remains excluded; no hippocampus or inferred tract/scan alignment added.
Primary-reference links and rights notes are in the Atlas `docs/DEEP_BRAIN_TOUR.md`.
