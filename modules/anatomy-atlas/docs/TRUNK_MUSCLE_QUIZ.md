# Trunk muscle Quiz drafts

Six original formative questions replace generated identification only for the pinned bilateral structures below through the shared lesson dispatcher. The source baseline is Atlas commit `a2012adfb99d5cc76e30a392586c9c65a3cbb4be`. `content/trunk-muscle-quiz-pins.json` retains each complete display identity, previous generated lesson, catalog hash, coordinate system, and verified bundle digest. The lesson function refuses an altered identity, including one with an unchanged name or FMA identifier. Website delivery requires the separate matching learner/Clinical Review import.

| FMA | Pinned structure | Question group |
| --- | --- | --- |
| FMA13373 | Right pectoralis major | rightPectoralisMajor |
| FMA13374 | Left pectoralis major | leftPectoralisMajor |
| FMA13375 | Right pectoralis minor | rightPectoralisMinor |
| FMA13376 | Left pectoralis minor | leftPectoralisMinor |
| FMA13336 | Right external oblique | rightExternalOblique |
| FMA13337 | Left external oblique | leftExternalOblique |

Factual references are the Texas Tech University Health Sciences Center [pectoral region table](https://anatomy.ttuhscep.edu/musculoskeletal_system/pectoral_tables.html) and [abdominal wall and inguinal region table](https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_tables.html). The questions and explanations use new wording; no table prose, diagram, or asset was copied. Counting each question, its four choices and explanation gives 123 derived words attributed to the pectoral page and 66 to the abdominal page, within 200 words per page. These are questions about usual anatomy; they do not claim the surface displays every attachment, fibre, or movement.

The drafts do not validate source muscle boundaries, fibre direction, attachment completeness, static-mesh movement, anatomy in an individual, or clinical suitability. Retained source and asset holds and unreviewed validation remain in force. Revision-bound radiologist sign-off is pending. This work does not authorize deployment or alter independent Atlas, imaging-case, and paid-lecture access.

Focused source check: `node scripts/test-trunk-muscle-quiz.mjs --source-only`. After shared dispatch and review material are regenerated, run `node scripts/test-trunk-muscle-quiz.mjs` and `node scripts/pin-trunk-muscle-quiz.mjs --check`. The full test checks changed and preserved lessons, Review binding, identity refusals, learner interactions, exam suppression, and focus behavior. A pass is source and interaction evidence, not radiologist approval.
