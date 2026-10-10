# Abdominal vessel formative questions

Eight original question groups cover 13 existing abdominal vessel selections:
abdominal aorta, celiac trunk, SMA, IMA, bilateral renal arteries, IVC, five
hepatic venous surfaces/tributaries and splenic vein. These are radiologist-review
drafts, not approvals or a claim of complete abdominal vascular coverage.

## Source binding

`content/abdominal-vessel-quiz-pins.json` binds the complete displayed source
identities and model byte hashes to parent
`f12348a11c0e8e0b642ec43c9285107259ca7ea5`. The resolver admits only the Quiz tab
and exact pinned identities. Renames, source changes and coordinate alterations
fail closed. Hepatic tributaries receive a question explicitly about the main
hepatic outflow system; no direct tributary-to-IVC mesh connection is inferred.

The questions concern usual anatomy. Static reference surfaces do not establish
complete branches, vascular continuity, flow, variation in a particular patient
or registration to CT/MRI. Existing tours, other teaching and geometry are not
modified. Atlas, imaging-case and paid-lecture entitlements remain independent.

## References and rights

Original questions, choices and explanations use factual references from TTUHSC:
[abdominal arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html)
and [abdominal veins](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html).
No figures, tables, screenshots, datasets or source prose were imported. These
links do not grant redistribution rights to the referenced websites. No new
models, fonts, dependencies or licence obligations are introduced.

## Verification and delivery

Run `npm run abdominal-vessel-quiz:test`. The test compares all 9,936 topic
placements against the exact parent: 13 intended Quiz changes and 9,923 preserved
placements. It checks 104 altered-identity refusals, current/stale/tampered Review
packets and all eight rendered question groups: correct/incorrect feedback,
disabled submission before selection, reset, focus and concealed exam answers.
Correct-choice positions are balanced twice in each of four positions.

Generate renderer bindings, content exports and Review display pins together;
run types, content/Review validators, requirement audit and regional build. This
source milestone is not website delivery: import the generated regional learner
and matching protected Clinical Review together. Browser/GPU acceptance and the
owner's exact-revision clinical sign-off remain separate requirements.
