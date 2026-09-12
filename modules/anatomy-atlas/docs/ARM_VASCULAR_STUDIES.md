# Arm vascular dissection

Open **Shoulder & arm** or **Whole body → Study**, search **brachial**, and choose a view. Choose Left or Right to reduce overlap. These two focus-only recipes reuse **22 existing selections**, not new anatomy or new permanent controls.

| Study | Targets | Context per side | Both sides / one side |
| --- | --- | --- | --- |
| Arm: brachial vessels & flexors | Brachial artery; source-labelled medial brachial vein | Humerus, coracobrachialis, brachialis, short and long biceps heads | 14 / 7 |
| Arm: deep brachial artery & triceps | Deep brachial artery | Humerus, brachial artery, three triceps heads | 12 / 6 |

The rows share the humeri and brachial arteries; counts are not additive. Both side scopes use actual independent source records, not reflected anatomy. All original catalogue memberships, source meshes, teaching and separately entitled resources remain unchanged. The dedicated nine-selection shoulder renderer is untouched.

## Dissection interaction

Select and hide a biceps or triceps head to expose deeper source surfaces. Undo/Redo preserves the chosen study. Extract selected sets one chosen structure aside while retaining the others at their source positions. At 0% separation all source positions are restored. At 100%, conservative bounds clear the remaining anatomy in each of the six standard projections; arbitrary orbit angles and intermediate separation can still overlap. Other established separation modes remain available.

The anterior view is not a complete cubital fossa or neurovascular bundle. The posterior view is not a radial-nerve dissection. Nerves, fascia/septa, complete companion veins, validated vascular junctions and lumens are not supplied. A source-labelled medial vein does not establish a complete pair. Triceps heads remain whole surfaces; hiding them does not simulate cutting or an operative plane. Source contact with the humeral groove requires clinical review. No vessel flow, joint motion, patient scan or imaging registration is inferred.

## Source and interaction safeguards

`content/arm-vascular-study-pins.json` binds 22 complete source records and five bundles to the original source version, licence and coordinate frame. `armVascularStudyReady` rejects missing, duplicate or changed records/bundles and wrong regions/frames. Existing parent study-opening and deep-link handlers share that admission through the established family guard; exam mode cannot open the studies. If targets are unavailable, the existing Study card cannot launch them. No new loader or toolbar is added.

`arm-vascular-study-transition.json` records only the four focus placements and their reference additions. Exact offline history reconstructs the prior profiles without changing runtime data or clinical approval records. Existing arm, whole-body and every other regional recipe is preserved; unrelated changes cannot pass as this migration.

## Evidence and reproduction

Run:

```sh
node scripts/pin-arm-vascular-studies.mjs --check
node scripts/record-arm-vascular-studies.mjs --check
node scripts/validate-arm-vascular-studies.mjs
```

The validator checks 12 region/side scopes, exact memberships, one existing-menu card per view, muscle removal/Undo/Redo, 104 source-bound links, 624 selected-extraction cases, 94 rejected source mutations, 12 actual parent-handler cases and 12 real React Study-menu renders. It checks all five unchanged bundle hashes and exact prior recipe preservation. These are technical tests, not browser screenshots, GPU/device benchmarks or clinical acceptance.

## Rights and references

BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. Preserve the existing model attribution and modification notices. Original code and concise prompts use MIT. No model, texture, font, illustration, package or fee-bearing service is imported.

Factual reading only: [Texas Tech upper-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html) and [upper-limb muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html), checked 12 September 2026. Their copyrighted tables and illustrations are not redistributed. The anatomy references support typical relationships; they do not validate this donor model. Clinical approval remains pending at the exact source/content/renderer revision. Actual CT/MRI/X-ray/US linkage still needs licensed acquired resources and validated correspondence, and does not grant access to separate paid lectures.
