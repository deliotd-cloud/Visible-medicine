# Popliteal artery and vein study

One searchable **Knee: popliteal artery and vein** focus is available in Leg and
Whole body Dissect. It combines four existing vessel selections with bilateral
popliteus and femur, tibia, fibula and patella context: 14 selections with both
sides shown, seven for either side. No anatomy mesh is added or modified.

Use Search atlas to find “popliteal artery vein”, preview the study, then open
it. Choose Left or Right for one knee, rotate, select a vessel, remove covering
context and Undo to restore it. Existing separation controls remain available;
return to 0% before comparing original source positions. No extra toolbar,
drawer, permanent button or separate pop-out window is introduced.

## Source and camera safeguards

- Exact current records, bundle bytes and coordinate system are pinned in
  `content/popliteal-vessel-study-pins.json`. The artery IDs are FMA77380/77381;
  the veins are FMA44328/44329. Duplicate, missing, moved or changed records
  reject source-bound access rather than substituting another structure.
- Scoped dissection checks preserve laterality and all required source bindings.
  Opposite-side sources may be absent only in an actual side-filtered scope.
- The display-only close-up includes complete supplied vessel and popliteus
  envelopes. Whole bones remain selectable; camera framing is not segmentation.
  Pinned framing remains steady when an individual context structure is removed.
- Label anchors use the existing mesh-backed close-up helper. Unsupported
  presentation states retain existing framing behavior rather than inventing
  anatomical positions.

These source surfaces do not establish a universal artery/vein ordering,
continuous lumen, patency, compressibility, flow, a complete popliteal fossa,
nerve/fascial boundaries, procedural access or patient registration. Teaching
and source relationships still require revision-bound radiologist review.

## Verification

```sh
npm run popliteal-vessel:test
npm run popliteal-vessel:history
npm run dissection-history:test
npm run study-library:test
npm run study-links:test
```

The focused test exercises six region/side scopes, 56 deep links and actual
mesh-backed label anchors, readiness/identity rejection, search previews,
Remove/Undo/Redo and stable close-up bounds. An exact historical transition
records the new focus/reference additions while retaining every previous
recipe and teaching topic; negative tests reject unrelated edits.

The existing genicular study, 36-scope dissection history, study-library/deep-link
checks, content contract, body review, TypeScript, targeted project lint and
shared production build also pass. The broader content check found an existing
stale shoulder display fingerprint for `app/body-explorer.css`, independently
confirmed at parent `8bb434c`. Regenerating current review fingerprints and the
shoulder export refreshed only display-bound geometry revisions, not mesh bytes,
teaching or private clinical decisions. The old genicular negative test now
expects strict rejection of unrelated profile edits; no baseline hash is relaxed.

Browser acceptance remains incomplete: local Search displayed the new study and
its confirmation, but development state retained an earlier missing-file error
while the new pin file was being created. A fresh route navigation was then
blocked by the browser client. Production compilation and source-level tests
are separate evidence, not a substitute for final desktop/mobile visual QA.
Before release, reload the completed build, verify that Open study view replaces
the previous focus, and inspect sided camera framing, labels and Remove/Undo.

Follow-up: [sampled local browser QA](STUDY_CLOSE_UP_CAPTIONS.md) verified study
opening, paired labels, left-vessel selection/Remove/Undo and mobile laterality.
It also corrected the whole-body caption. Full device acceptance remains open.
No hosted publication or clinical approval is claimed by this source change.

## References and reuse

Original brief orientation copy references the TTUHSC El Paso
[lower-limb artery](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html)
and [vein](https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html) tables.
No publisher diagrams, tables or screenshots are copied. Existing BodyParts3D
CC BY 4.0 attribution remains intact. No new asset, dependency, font, texture,
service or fee is introduced; scan privacy and independent entitlements are
unchanged.
