# Source-checked independent study links

In kidney, female-pelvis, abdominal-wall and back-layer viewers, expand **Link & review this structure** beneath Learn. Copy/open the exact selection or open its private review worksheet. Existing UM **Link to this study** now also links to that exact regional review scope. During identification practice the normal dissection panel is replaced; these controls do not reveal answers.

The private review worksheet's **Open this exact structure in 3D** links back to the relevant source selection and a study containing it. Its name remains selected and the camera frames it; source context remains available. The original positions are restored with zero separation and empty Undo/Redo history. Regional close-up does not override the selected-object framing. This is navigation, not animation of a surgical plane or a recorded custom dissection.

## Identity and failure behaviour

- The four new routes use `ref=independent-1` plus exact specimen key, reference frame, structure ID, display-model SHA256, source/recipe revision, optional study ID and view. Only declared routes/views are accepted; duplicate, incomplete, mixed body/UM or unknown reference fields are rejected.
- The revision hashes the full source navigation payload, studies, bounds, transforms, limitations and omitted-face count. The receiving viewer verifies these against its own definition before displaying the selection. Missing/changed sources, another specimen, held/foreign structures and incompatible study membership cannot silently open a substitute.
- While checking, no linked model is rendered. A failure explains the problem; opening the current default source requires an explicit button. Late results from a replaced request/definition are discarded.
- With a named study, the selected object is framed and its study context is retained. A custom dissection shares the selected object with others faded, not arbitrary hidden-tissue edits. Free-orbit pose, separation, inspection state, quiz answers and unsaved review edits are not encoded.
- HRA frame identity is its existing `hra-united-female-v1.10:lps-mm`. Version-3 adapters use `bodyparts3d-v3-20110915:source`; UM reviews use `um-5t6tz7-v1-2:source-lps`, with the original source-basis caveat that display scaling is not calibrated measurement. These names are source namespaces, not DICOM FrameOfReferenceUIDs. No transform to a patient or another body model is asserted.
- Existing UM link grammar and source pins remain compatible. UM regional selections now receive selected-object framing while retaining their original study membership. Overlapping regional review keys are distinct; a whole-limb approval does not become a knee/hip/foot approval.

Source and recipe hashes identify content; they are not signatures, authentication, subscription entitlements, clinical approvals or CT/MRI registration. Separate lectures and imaging resources must still enforce their own access rules. No patient identifiers, acquired-image series or private review records appear in these links.

## Verification and next work

`npm run independent-navigation:test` verifies 875 selection/study round trips across 32 new-route studies, 116 invalid/changed-source rejections, all354 review links,267 distinct source IDs,354 distinct review fingerprints,32 actual React-to-scene initialisation cases and9 exact model-bundle hashes. The existing UM suite separately verifies its five source pins and446 link round trips. Twenty-one representative original source/teaching/migration/lockfile paths are unchanged from the prior saved milestone; no new mesh/data licence is introduced.

These are source/React/scene-prop tests, not browser/GPU/device measurements. Actual touch framing, rotated labels, clipboard fallback, keyboard focus and warning recovery still require device acceptance. Clinical validation, direct imaging registration and nested-organ review adapters remain outstanding.
