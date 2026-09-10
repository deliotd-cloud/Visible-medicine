# Organ-dissection cutaway

The shared cutaway also covers the optic-pathway and [pancreatic duct study](PANCREATIC_DISSECTION.md). The pancreatic frame uses both selectable source components, independent of envelope visibility. Cutting these surfaces does not demonstrate an open duct or reconstruct tissue.

The existing eye cutaway is now shared by the ventricular, brainstem, cerebral, cardiac, pulmonary, hepatic and renal workbenches. Open a structure's dissection, then expand **Cutaway** beside the model. Choose axial, coronal or sagittal, move the 0–100% slider, and reverse the retained side if needed. The control starts collapsed and adds no global toolbar or route. Cutting renal surfaces does not reconstruct missing kidney tissue.

## Behaviour

- Axial runs inferior → superior; coronal posterior → anterior; sagittal anatomical right → left in the existing source coordinates. These are not screen-left/right labels or radiology display conventions.
- Each nested study's complete selectable source bounds define its cut range. Hiding, fading, selection, optional context and separation do not redefine that range. Context surfaces are clipped against the same plane but are not included in the percentage range.
- The existing clipping plane follows each displaced component, preserving its assembled cut during lift, spatial spread and flat-plate separation. This is not a stationary surgical plane through the exploded layout.
- Selected components are also cut. A source-bounds warning distinguishes partial clipping from a fully removed selection; it cannot prove visibility, occlusion or surface completeness on screen. The existing renderer omits clipped label anchors and rejects clipped surface hits.
- **Restore whole view** disables the cut only. Selection, hidden parts, camera and separation are preserved. It does not restore manually hidden structures. **Reassemble** and study presets reset the cut and separation. Closing/changing the keyed study starts a fresh inspection.

## Implementation and scope

`app/cutaway-controls.tsx` owns the shared stateless control. `app/eye-layers.tsx` preserves its prior `EyeCutawayControls` export and default labels. `app/ventricles.tsx` controls the six additional study families. `BodyScene.inspectionBounds` is optional: it supplies a stable clipping frame without changing the existing camera frame. Existing regional/eye callers retain the prior default. Shared section geometry, raycasting, labels, meshes and anatomical IDs are unchanged.

No new dependency, font, model, texture, dataset or paid service is introduced. Existing BodyParts3D credit and licence requirements remain. No source registration, clinical approval, patient image, imaging entitlement or paid lecture access is added.

## Acceptance and limits

Run `npm run nested-cutaway:test`, `npm run eye-layers:test` and `npm run inspection:test`. The new test executes real control callbacks/static markup for all seven non-eye parent views, checks presets/recovery/context invariance and tests source-bound corner retention with translated planes. Existing inspection tests cover raycasting/material behaviour. These checks do not replace GPU/browser/mobile testing.

All cuts are **artificial open-surface cuts, not CT/MRI images, reconstructed tissue, histology or new interior anatomy**. No caps or inferred tissue are generated. Chamber-space cuts remain space representations, lung groups still lack tissue/fissures, and hepatic segment conflicts remain unresolved. Clinical reviewers must assess orientation, component meaning and whether open edges are misleading; visual/device acceptance is still pending.
