# Foregut vessel Quiz drafts

These eight original, formative questions replace generated identification only for the pinned structures below, once routed through the shared content dispatch. The source baseline is Atlas commit `8ea22df7a81cf271eb1277342f5f6a97a393bb7b`. `content/foregut-vessel-quiz-pins.json` retains each complete display identity, previous generated lesson, catalog hash, coordinate system, and verified bundle digest. The lesson function refuses a structure whose retained identity differs, even if its name or FMA identifier matches.

| FMA | Pinned structure | Question group |
| --- | --- | --- |
| FMA14771 | Common hepatic artery | commonHepaticArtery |
| FMA14772 | Hepatic artery proper | properHepaticArtery |
| FMA14773 | Splenic artery | splenicArtery |
| FMA14768 | Left gastric artery | leftGastricArtery |
| FMA15390 | Left gastroepiploic vein | leftGastroepiploicVein |
| FMA15397 | Right gastroepiploic vein | rightGastroepiploicVein |
| FMA15399 | Left gastric vein | leftGastricVein |
| FMA15400 | Right gastric vein | rightGastricVein |

Factual references are the Texas Tech University Health Sciences Center [arteries of the abdomen](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html) and [veins of the abdomen](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html) tables. The questions and explanations use new wording; no table prose, diagram, or asset was copied. Counting each question, four choices, and explanation gives 137 derived words attributed to the arterial page and 134 to the venous page, within the 200-word-per-page limit. Gastroepiploic and gastro-omental are synonyms in the cited venous table. Questions say “normally” or “usually” and do not assert that all anatomical variants are represented.

The draft questions do not validate source surface boundaries, missing branches, venous junctions, flow, anatomy in an individual, or clinical suitability. Retained source/asset holds and unreviewed validation remain in force. Revision-bound radiologist sign-off is pending. This work does not authorize deployment or alter independent Atlas, imaging-case, and paid-lecture access.

Focused source check: `node scripts/test-foregut-vessel-quiz.mjs --source-only`. After shared dispatch and review material are regenerated, run `node scripts/test-foregut-vessel-quiz.mjs` and `node scripts/pin-foregut-vessel-quiz.mjs --check`. The full test checks changed and preserved lessons, review packet binding, identity refusals, learner interactions, exam suppression, and focus behavior. A pass is source/interaction evidence, not radiologist approval.
