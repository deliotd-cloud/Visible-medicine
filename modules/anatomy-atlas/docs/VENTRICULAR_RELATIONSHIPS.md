# Guided ventricular relationships

## Use

Open **Brain → Dissect brain → Ventricular spaces → Study view**. Three additional options—**Left ventricular landmarks**, **Right ventricular landmarks**, and **Third ventricle & thalami**—reuse the existing selector. Each selects one space, chooses the appropriate camera view, returns separation to zero, and reveals only its specified nearby source structures.

The ventricular space is translucent; context has existing neuroanatomy group colours and a small named colour key. The guide occupies the existing control rail, not a new panel. Source relationships can be compared by rotation; no tissue layer, wall surface or scan signal is synthesized. The previously available whole-body/regional deep-brain studies are preserved.

## Source-bound scope

| View | Existing selectable space | Existing orientation context |
| --- | --- | --- |
| Left landmarks | Left lateral ventricle FMA78450 | Left caudate FMA72827, left thalamus FMA258716, corpus callosum FMA86464 |
| Right landmarks | Right lateral ventricle FMA78449 | Right caudate FMA72826, right thalamus FMA258714, corpus callosum FMA86464 |
| Third landmarks | Third ventricle FMA78454 | Right/left thalami FMA258714/FMA258716 |

`lib/ventricular-relationships.ts` resolves exact FMA identities only from the guarded ventricular study and its explicit context list. Missing or duplicate required context suppresses the affected preset; a changed parent source binding suppresses all three. Context records equal their existing root-catalogue counterparts. They are additional reference surfaces not present in the original 59-file brain aggregate; do not falsely report them as newly extracted children of that aggregate.

The four selectable ventricular spaces, five available context records, 37 nested search/teaching/linking targets and original 1,022 root records are unchanged. These three comparison presets are not extra dissection stages in the regional profile inventory, nor new unique anatomy. No GLB, geometry position, source metadata, teaching draft or clinical approval is modified.

## Controls and interaction

- Clicking the current space retains its guide. Selecting another space or changing visibility exits the guide and restores ordinary appearance; context remains governed by its existing toggle.
- **Undo layers** restores the prior layer selection and exits the guide. It does not claim to undo camera/context preferences. Reassemble clears the guide, restores all four spaces and returns separation to zero.
- Any nonzero separation hides all context and the relationship explanation; spaces return to opaque shape comparison. Returning to zero restores the selected relationship. The existing separated-layout warning remains visible.
- **Fade others** remains available. If active in a relationship view, a short notice tells the learner to turn it off for comparison. No active clinical relationship is implied by a separated or hidden context.
- Context remains nonselectable and is excluded from selectable leader labels. `BodyScene.contextIds` prevents its click/hover handlers from stopping propagation or changing the cursor. Thus a faint foreground context object does not intentionally swallow an underlying selection. Default callers without `contextIds` keep existing behaviour; all three brain studies pass their own context IDs.

## Factual references and rights

The concise original guide is grounded in [UTHealth's ventricular anatomy](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html), consulted 10 September 2026. The [internal-brain reference](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html) was also consulted while checking existing deep-brain context. No university illustration, chapter, scan, table dataset or question bank is copied or redistributed. Citations do not confer a licence or endorsement. Existing BodyParts3D v4 CC BY 4.0 and authored-code/text MIT notices remain; no dependency, font, texture or paid service is added.

## Evidence and acceptance

Run `npm run ventricular-relationships:test`. The [generated report](ventricular-relationships-validation.json) covers three exact source recipes, parent/context rejection, actual viewer callback transitions, three rendered control states, separation/restoration, context-selection rejection, underlying pointer-handler propagation and current GLB digests. The test replaces only the GPU scene for UI state/render checks and separately executes the real scene pointer closures; it is not a browser/GPU test.

Independent anatomy/educator review must confirm the intended source relationships and teaching limits. Explicit browser/device acceptance still needs to assess actual depth/transparency ordering, under-context clicks, perspective changes, colour-key usefulness, enlarged text, keyboard access and rail scrolling. No complete ventricular walls, clinical measurements, fluid simulation, scan registration or separately paid lecture access are established by this milestone.
