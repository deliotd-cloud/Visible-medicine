# Wrist ultrasound orientation — local draft

Eight exact existing selections (left/right scaphoid, lunate, pisiform and hamate)
gain four original Ultrasound lessons. Whole-bone selections remain anatomically
unvalidated. No new structures, acoustic images, diagnostic cases or procedures.
Existing CT, MRI, X-ray, anatomy, function, clinical, pathology and quiz teaching
are preserved; the existing information panel is reused without additional UI.

## Factual references and commercial scope

Reviewed 2 October 2026: [ESSR wrist technical guidelines](https://essr.org/content-essr/uploads/2016/10/wrist.pdf),
pages 5–7 of the PDF, support the dorsal recess landmarks, proximal tunnel
scaphoid/pisiform, distal tunnel trapezium/hamate hook and adjacent ulnar branch.
[ACR/RSNA musculoskeletal ultrasound information](https://www.radiologyinfo.org/en/info/musculous)
supports the limit of ultrasound to accessible outer bone surfaces rather than
marrow/internal bone anatomy. These are reading links, not asset licences.
No source image, diagram, scan, prose, table, PDF or dataset is redistributed.
Original prose/code use project MIT terms; existing BodyParts3D CC BY 4.0
credits and licences remain. No new dependency, font, texture, paid service or fee.

## Review boundaries

- Confirm the retained side, source surface and visible landmark fidelity before
  accepting any geometry. Hook/tubercle/waist are not independent reviewed parts.
- Review four distinct lesson drafts separately for the eight exact source records.
  The proximal tunnel, distal tunnel and Guyon canal must not be conflated.
- Bone highlighting supplies neither echoes nor a validated nerve/ligament/tendon
  course. Lunate recess orientation is not an assessment of stability or viability.
- Model rotation and separation are not dynamic ultrasound or probe calibration.
  Return separation to zero before spatial comparison. Confirm real patient side,
  orientation, probe position and imaging level independently.
- No fracture exclusion, marrow assessment, diagnosis, registration, measurement,
  procedural safety, imaging-case clearance or paid lecture access is supplied.

## Evidence and integration

`content/wrist-ultrasound-pins.json` binds every complete source record and bundle
to parent `ac88a3c72de1e69971321e00a883e4b88fc356ce`. The targeted check compares
all 9,936 root topic placements with that exact Git parent: eight pending-to-draft
Ultrasound placements only, 9,928 unchanged. It also checks source bundles,
mutated identities, content/export/review consistency and unsigned review state.
The immutable transition supports strict test-only editorial history replay;
it is never a learner fallback or approval migration.

Website integration is saved locally at `dbf3dac8`, importing source `ab3e884b`.
All 360 website tests, types, production build and eight host stages pass. The
compact notice, Whole-body-first region picker and both side panels are retained.
Neither a source commit nor these references confer browser/clinical acceptance.

## Legacy test repaired

The older `scripts/validate-wrist-imaging.mjs` global snapshot incorrectly mixed
historical lessons with today's shoulder and recipes. It now replays its exact
`56e9dc9e` Git epoch and verifies the unchanged catalogue and original pinned
`7e5592d2…` hash. No expected hash is replaced or test waived; original failure
logs remain in the main workspace's `work` directory.

Current corpus protection separately compares the independently pinned wrist
Ultrasound transition: eight additions and 9,928 unchanged placements. All 48
live CT/MRI/X-ray section checks and 960 negative binding checks remain. The test
renders the actual current source-note component for all 48 cases, not a stub.
The validator, immutable pin check, TypeScript and requirement audit pass. This
test/documentation-only repair changes no runtime input, model or review approval;
it needs no website re-import. Passing these checks is not release, visual or
clinical acceptance.
