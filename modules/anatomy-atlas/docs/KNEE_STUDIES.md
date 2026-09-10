# Knee dissection studies

Three compact studies under Knee & leg → Study views use ten existing source representations: paired femora, tibiae, fibulae, patellae and popliteus muscles. Choose Left/Right to inspect one knee. The original anatomical IDs, source meshes, teaching and imaging hooks are unchanged.

- **Knee: bony relationships** shows the four bones on each side without soft tissues.
- **Knee: set the patella aside** hides the patella as an independent visibility study, not a surgical approach or dislocation. Undo returns to the previous dissection.
- **Knee: posterior popliteus** exposes popliteus with the femur/tibia/fibula as context; longer posterior muscles and vessels are excluded. This is not a complete popliteal fossa.

## Close-up and controls

An automatic camera region of interest is derived from the original patellar bounds on the enabled side(s). It includes viewing margins around the distal femur and proximal leg. The camera target does not jump away when a patella is removed. No new segmented bone part, local coordinate transform, clip surface or anatomical landmark is created. Whole bones can extend beyond the viewport; users can pan or zoom out. The caption explicitly identifies the close-up.

Normal whole-structure framing returns for exploded/arranged/extracted displays, origin guides, ghosted removed anatomy, cutaways, selected-structure framing, isolation, practice, or manual restoration outside the current recipe. Removing all anatomy clears the close-up. Stored study cameras, ordinary side filters, model rotation, selection, hide/restore and Undo/Redo retain their existing behavior. This adds no permanent panels or separate camera preference.

Whole-bone label anchors can lie outside a joint close-up. When needed, the leader moves to an actual source vertex inside the viewing bounds, nearest the viewing centre; it is never clamped into empty space. This display point is not an independently named anatomical landmark. Normal views keep their original anchors, and a surface with no in-frame vertex gets no invented leader.

## Sources and limits

Source geometry remains the existing credited BodyParts3D reference. Original short study descriptions are checked against [TTUHSC El Paso's lower-limb joint reference](https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html); no reference diagrams, text tables or meshes were copied. This reference is not a licence to redistribute its content. No additional dependency, texture, font or model was introduced.

Cartilage, menisci, cruciate/collateral ligaments, the capsule and complete neurovascular relationships remain absent. Bone regions are not independently segmented or clinically approved. Empty space does not show normal tissue absence. Explode does not simulate knee movement; the camera close-up is not scan registration, CT/MRI data or a calibrated joint measurement. Clinical and browser/device acceptance remain outstanding.

## Verification

`npm run knee-studies:test` covers exact representation sets in both/left/right scopes, single-card search/navigation, source-bound deep links, removal/Undo/Redo, stable camera targeting with a hidden patella, narrower view bounds, missing/invalid-anchor fallback and no catalogue mutation. Historical recipe reconstruction checks the exact added content and preserves all previous recipes. Shared renderer/orientation, TypeScript and production checks supplement these focused tests; no GPU/browser validation is implied.
