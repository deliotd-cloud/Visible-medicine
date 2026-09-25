# First-release CT-head handoff

Read-only coordination check, 25 September 2026. The specialist task
**Visible medicine— CT Head Atlas** continues to own source data, segmentation,
accepted boundaries and its clinical review history. Nothing in this plan changes
its masks, approvals or storage. Didanix Education/light is the target; clinical
PACS is excluded.

## Current boundary to preserve

The specialist's current state now records 44 accepted core entries and zero
core drafts. Its current annotation metadata records whole-entry acceptance for
the midbrain, pons and medulla, tied to their geometry hashes. This supersedes
the 18 September handoff's pending-midbrain description; historical partial
acceptance notes must not be mistaken for the latest whole-entry decision.
Conversely, a summary count alone is not evidence for an individual revision.
Retained older provenance flags can still conflict with newer structured events;
report these for the specialist rather than rewriting them in this task.

This is a handoff dependency, not permission for the main Atlas task to edit those
masks. The current release state remains **NOT_FOR_PUBLICATION**. Final visual
refinement, smoothing decisions, label placement, overlap QA and export readiness
remain with the specialist and radiologist. Recorded acceptance is neither
independent geometry verification nor publication/privacy clearance. Select the
first released case/structure only from an approved and separately cleared
revision with the radiologist and specialist owner.
No patient identifiers, scene archives or segmentation derivatives belong in this
repository or the website build.

## Local revision preflight

`scripts/ct-handoff-preflight.mjs` reads only the current state, its referenced
annotation JSON and the existing brainstem reference catalog. It does not read
geometry files, scan pixels, label coordinates or scene archives. It verifies
the annotation bytes against the state's recorded digest, then checks three
explicit brainstem candidates against their per-entry recorded acceptance and
selectable Atlas source identities. A missing, mismatched or incomplete binding
is held; a name match cannot create an approved correspondence.

Run from the Atlas checkout, supplying absolute paths:

```sh
node scripts/ct-handoff-preflight.mjs --state "ABSOLUTE_LOCAL_STATE_JSON" --out "ABSOLUTE_ATLAS_CHECKOUT/.local/ct-handoff/new-report.json"
node --test scripts/test-ct-handoff-preflight.mjs
```

Reports are local-only and must not be uploaded. They are not LearningDocuments,
clearance records, entitlement grants, patient registrations or working viewer
links. No production registry or website data is populated by the preflight.
Actual accepted geometry hashes are recorded metadata, not recalculated from
mask files by this tool. Neither old partial notes nor this tool may supersede
the specialist's revision-bound decisions.

Before adapting a candidate to the existing learning registry, bind the complete
current nested representation (parent and child bundle/source hashes), and bind
the image, annotation and segmentation revisions in the host's reviewed material
manifest. The same image series with a different segmentation must invalidate
its old correspondence even if the pixel data is unchanged. The host must verify
the opaque frame/annotation locator against that manifest and recheck clearance
and independent access immediately before media is opened. Do not invent frame
IDs or silently treat a reference surface as a patient-space mask.

## Integration work order

1. Identify one approved structure and its exact stable specialist code and
   source revision; do not infer approval from its name or an old screenshot.
2. Receive a metadata-only handoff: opaque case/series identifier, modality,
   intended educational scope, privacy/reuse clearance evidence, accepted
   segmentation revision, permitted distribution and required entitlement.
3. Choose the narrowest honest link: a named structure/case link first. Use a
   specified frame/location only when its series identity, orientation and
   coordinate conventions are validated. A reference-model surface is not a
   patient-registered segmentation.
4. Use existing shared anatomical-ID and Didanix Education interfaces. Preserve
   separate Atlas, imaging-case and lecture rights; metadata must not confer
   access to the underlying images.
5. Test allowed and denied routes, expired entitlement, wrong/missing series,
   unsupported structure, changed source revision and return-to-Atlas selection.
   Fail clearly instead of substituting an unrelated image or silently granting
   access. No paid lecture is needed to complete the basic learning journey.
6. Have the radiologist verify the actual displayed location and label against
   the exact cleared case. Record whether the link is navigational, approximate
   or spatially validated. Only then include it in the release evidence.

The first-release imaging gate remains pending. Existing adapter tests, source
teaching notes and ID hooks do not establish a live cleared case connection.
Routine source Atlas improvements can continue while this handoff is prepared.
