# Thigh-to-knee attachment relationships

Twenty existing sided muscle/head selections (ten concepts) now use the shoulder's collapsed **Muscle attachment relationships** control in Hip & thigh and Whole body. There is no new default sidebar. Source meshes, current teaching tabs, selected-muscle imaging identity and the independent lower-limb specimen remain unchanged.

## Study flow

1. Select rectus femoris, a vastus, either biceps femoris head, semimembranosus, semitendinosus, sartorius or gracilis.
2. Expand attachment relationships. The rows identify ordinary proximal/distal bony sites. Quadriceps also has a separately labelled extensor-chain continuation to the tibia, through the patellar ligament; it is not presented as direct muscle insertion.
3. Show retains the selected muscle and available attachment bones, with both homologues so Left/Right keeps working. Regional limits are respected: patella/tibia/fibula are not silently added to the thigh region.
4. For the complete set, follow the whole-body link and choose Show there. The link preserves muscle, side and source hash; it does not automatically execute isolation.
5. Clicking an available bone uses ordinary selection/restoration. Show is one dissection-history step; Undo/Redo restores removals/layers, not camera/system switches. Show resets cutaway, separation and camera for a coherent spatial view. Exam mode denies the panel and parent action.

## Scope

Five sided bone concepts: hip bone, femur, patella, tibia and fibula (ten existing selections). Five original model bundles and all thirty exact source records are pinned to their current licence/frame/identity metadata. Missing, duplicated, renamed, moved or otherwise stale records/bundles reject the relationship rather than relinking by approximate name or proximity.

These are concise bony relationship notes, not exhaustive origins/insertions or donor attachment footprints. Retinacula, secondary biceps slips, aponeurotic/capsular attachments and individual variation are not reconstructed. The quadriceps tendon, patellar ligament and pes anserinus are textual relationships here, not new meshes. No nerve, ligament, cartilage, fascial plane, motion simulation, measurements, diagnostic image or CT/MRI registration was generated. Specialist validation remains pending.

Original concise factual labels reference [UAMS lower-limb anatomy](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/); no source table, diagram or media is copied. Eighty unique words of site/limitation text are shared across sided selections. Existing BodyParts3D CC BY 4.0 attribution and all dependencies are unchanged.

## Verification

- `node scripts/pin-thigh-attachments.mjs --check`: thirty exact records, five original bundle hashes, sided identity/system checks and preserved base catalogue hash.
- `node scripts/validate-thigh-attachments.mjs`: independently specified bone mappings; eighty region/side plans; exact visible sets, both homologues, reducer Undo/Redo/idempotence; forty source-bound whole-body links; 156 altered-catalogue rejection cases; forty real component SSR renders and forty executions of the actual parent callback, including exam denial.
- `node scripts/validate-arm-attachments.mjs`: existing shoulder/arm regression checks remain unchanged and pass.
- TypeScript and production build are separate checks; see the dated external checkpoint for actual results and saved/published state.

The new test initially used the wrong shape for the existing link parser; it was corrected to check `request.structureId`, side and the production link resolver. No production behaviour or rejection assertion was relaxed. Browser, visual, touch-device and clinical acceptance have not been performed in this background continuation.
