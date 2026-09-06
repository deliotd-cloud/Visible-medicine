# Clinical review and future imaging gate

## Separate status tracks

`lib/review-status.ts` defines the conservative default tracks. The dedicated shoulder now loads the signed-in user's persisted review status and links to `/review`. Its expanded schema, checklists, evidence, issues, version-bound approvals and append-only history are described in [REVIEW_WORKSPACE.md](REVIEW_WORKSPACE.md). No reviews are pre-approved, no acquired imaging is loaded, and the whole-body viewer remains outside the shoulder-pilot review scope. The earlier `content/review-record.schema.json` is the legacy minimal contract, not the expanded dashboard save format.

An approval must include an identified reviewer, date, evidence URLs, the exact mesh/content/imaging revision hash, and the scope reviewed. Replacing an asset or changing content invalidates approval for that track until re-reviewed. Source/licence provenance never implies anatomical correctness. Keep an append-only review history; do not overwrite a sign-off with an unrelated revision.

## Shoulder pilot acceptance checklist

- Anatomist: verify laterality, scapular/clavicular/humeral shape, source alignment, rotator cuff insertions and surfaces, long-head biceps representation, cropping and labels in all four illustration views.
- Clinical reviewer: verify every Anatomy, Function, Pathology and Clinical statement and all quiz answers for all nine entries. Check omissions and wording against the intended learner level.
- Radiologist: verify CT/MRI/ultrasound teaching descriptions separately. No acquired study is currently supplied.
- Interaction reviewer: ensure layer changes and exploded positioning are understood as teaching transforms, not surgical planes, biomechanics or separation distances in a patient.
- Product owner: approve final teaching scope, accessibility, source-credit presentation and website placement before public release.

## Priority gap queue

| Order | Missing work | Input required before inclusion |
| --- | --- | --- |
| 1 | Shoulder capsule, glenoid labrum, subacromial/subdeltoid bursa and key ligament detail | Commercial reuse rights; validated surface/attachment landmarks; anatomist approval |
| 2 | Brachial plexus and major upper-limb peripheral nerves | Registered branch topology and course, laterality and relationship review |
| 3 | Abdominal wall and missing intrinsic/extrinsic back muscles | Same-body meshes or validated non-rigid registration; do not mix v3 and v4 by guessed translation |
| 4 | Pelvic floor and fuller pelvic organ coverage | Resolved mapping/laterality; clinically reviewed male/female reference scope |
| 5 | Lower-limb nerves and remaining regional fine structures | Rights, branch continuity, spatial validation and content review |

Consult `GAP_FILLING.md` for the actual quarantined candidates and source evidence; a candidate on this queue is not loaded anatomy.

## 3D ↔ CT/MRI pipeline

1. Acquire explicitly licensed, de-identified scans with approved teaching use and retain the rights record. Do not fetch or import patient data through the current module.
2. Preserve image position, orientation, pixel spacing, frame of reference, series identity and coordinate units. The DICOM image-plane standard defines these fields; slice number alone is not a spatial registration. [DICOM PS3.3 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html).
3. Define and validate the image-to-model transform with landmarks and an explicit error report. A reference-body mesh is not automatically registered to another person's scan.
4. Bind anatomical IDs to reviewed segmentations/landmarks. Use source-space coordinates at explode = 0; never register against the presentation displacement.
5. Test both-direction selection events, missing mappings, frame mismatches and transformed plane display. Treat ultrasound separately, since arbitrary probe images do not necessarily have a CT-like volume registration.
6. Require a radiologist's signed revision-bound review before describing any spatial synchronisation as validated. The new [imaging selection contract](IMAGING_LINK.md) is a tested software framework, not working multimodal patient registration. The reference plane remains an illustration; no acquired imaging or imaging approval is supplied.
