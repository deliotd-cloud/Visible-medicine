# Shoulder and arm attachment relationships

Implemented 12 September 2026. A collapsed selected-muscle panel links 24 existing bilateral selections (four cuff muscles, teres major, two biceps heads, three triceps heads, brachialis and coracobrachialis) to eight existing bone selections. It adds relationships, not anatomical meshes or completeness claims.

## Using it

1. Open Shoulder & arm or Whole body and select a supported muscle.
2. Expand **Muscle attachment relationships** for proximal/distal bony teaching and source references.
3. **Show muscle with attachment bones** retains the selected muscle and its available bones. Use Left/Right and rotate normally. Dissection Undo restores the preceding visibility state.
4. Select a listed bone to inspect its existing teaching. For radius/ulna attachments outside the shoulder region, **Open this muscle in whole body** preserves the selected muscle; expand the panel there and show both attachment relationships.

No additional permanent toolbar is introduced. The panel resets collapsed on selection changes and is absent during exam mode. Camera, separation and cutaway reset when applying the relationship view; Undo covers dissection layers/removals, not camera or system switches.

## Implementation and source continuity

- `content/arm-attachments.ts`: explicitly authored sided FMA relationships; no name/proximity inference.
- `content/arm-attachment-pins.json`: immutable 32-record source snapshot, coordinate frame, version/licence and exact relevant bundles.
- `lib/arm-attachments.ts`: fail-closed source admission, region/side/exam guards and one reversible visibility plan. Both homologues stay in the mask so changing sides remains possible.
- `app/arm-attachments.tsx`: compact progressive disclosure and source-bound whole-body navigation.
- `app/body-explorer.tsx`: actual handler enables bone/muscle systems, clears conflicting display state and retains selected-muscle identity. No imaging event or entitlement change is emitted by isolation.

No source mesh, normal, triangle, root ID, model bundle or dependency changes. Existing teaching and the private CT candidate workflow are preserved. Rendering revision changes invalidate stale presentation review fingerprints; they do not fabricate a new clinical approval.

## Evidence and acceptance

Run `node scripts/pin-arm-attachments.mjs --check` and `node scripts/validate-arm-attachments.mjs`.

The executable checks cover 96 sided/regional plans, 24 whole-body continuation links, 41 corrupted-source rejections, 48 server-rendered panels and 48 executions of the actual parent handler including exam denial. It verifies exact kept FMA sets, Undo/Redo, default collapse, no unrelated selection acceptance and catalog immutability. These are CPU/SSR/callback checks, not browser, mobile/GPU or clinical acceptance.

Clinical review must adjudicate the teaching relationships, source-part identities, side consistency and gross spatial positions. Whole bones are selectable; attachment footprints, complete soft-tissue contributions and insertion topology are not segmented or verified. This is not a tendon/enthesis model, movement simulation, surgical approach, injury or patient registration. Acquired CT/MRI/US/X-ray linkage remains a separate data/registration/sign-off workflow.

Reference: [UAMS upper-limb muscle table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-upper-limb/), consulted 12 September 2026. Concise original factual labels only; no third-party diagrams or copied teaching table redistributed. Existing BodyParts3D CC-BY-4.0 credit remains required.

## Next priorities

This completes the bounded attachment navigator, not general muscle attachment mapping. Do not repeat these same 24 relationships as a new milestone. Prioritise substantive remaining non-oral regional anatomy or clinical content; preserve held nerve/soft-tissue provenance gates. For the CT pilot, the owner's next useful input is precise midbrain correction boundaries on the existing private baseline, including explicitly protected cerebellar margins; no real candidate should be accepted from verbal instructions alone.
