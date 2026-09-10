# Undo and Redo in internal dissection

The shared suite now includes the optic-pathway and pancreatic studies: ten study families / thirteen parent views / 65 selections. Pancreatic context remains nonselectable and hides on separation. The original milestone counts below are historical.

**Redo layers** sits beside **Undo layers** in the existing organ controls. It covers both eyes, ventricular spaces, brainstem/cerebellar components, cerebral parts, heart chambers, both lungs, liver branches and both renal vascular studies: eight study families / eleven parent views / 60 selections. The history control adds no panel or toolbar; the renal study has its own documented asset addition.

## Behaviour

- Undo/Redo restores layer visibility and selected structure; eye study-preset labels are restored too. Other organ preset labels continue to derive from the visible layer set.
- Up to 30 layer changes are retained in memory for the current dissection. An undone change can be reapplied; making a different layer/selection/preset change discards the old redo branch. Repeated Undo/Redo cannot grow nested histories indefinitely.
- Invalid IDs, invalid presets and true no-op selections leave history untouched. Context landmarks cannot enter the selectable history through a layer action.
- Redo is disabled until something is undone. It uses the existing native button component and compact wrapping action row, including keyboard activation and focus styling. There is no global keyboard interception.
- Like Undo, Redo clears selection framing and fading so the restored layers can be inspected. It does not rewind the camera, separation amount/style, cutaway, labels or context preference. Cardiac/ventricular relationship-guide selection is cleared, as with Undo; this is layer history, not full-view history.
- All-hidden states remain reversible. **Reassemble** remains available and resets the existing view controls; its layer change participates in history when it actually changes layers or selection.
- Closing or changing the keyed parent/study starts a fresh session. No local storage, server persistence, saved-view schema change or cross-parent replay is added.

## Implementation and evidence

`lib/eye-layer-state.ts` and `lib/ventricles.ts` add bounded `future` stacks with nonrecursive snapshots. New layer changes clear future only after the existing no-change/invalid-action guards. Hidden arrays are copied when recording or restoring snapshots. `app/eye-layers.tsx` and `app/ventricles.tsx` expose the button within the existing action row; source geometry, appearance, cutaway maths, teaching and source bindings are unchanged.

Run `npm run nested-history:test`. It exercises the actual reducers and controlled view callbacks for all eleven parent views, including source-ID rejection, input immutability, every part's hide/undo/redo, every available view preset, bounded history, exhausted-stack no-ops, divergent edits, side/session initialization, all-hidden recovery and unchanged cut/separation settings. Renal cases additionally check same-side nonselectable context, colour/opacity, load retry and context removal during separation. Only GPU rendering is replaced in the fixture. Native disabled-button markup is checked. Historical study assertions remain in place.

The test report is [nested-history-validation.json](nested-history-validation.json). These are software/controlled-callback checks, **not** browser, GPU, mobile-device, keyboard/screen-reader user testing or clinical acceptance. Those acceptance checks remain required before release. No new anatomy or teaching approval is implied.

No dependency, font, mesh, texture, diagram, dataset or paid service is added. Existing BodyParts3D and third-party obligations remain unchanged. Atlas/lecture access and provisional CT/MRI data boundaries are untouched. Private publishing/recovery evidence is recorded separately in the dated checkpoint.
