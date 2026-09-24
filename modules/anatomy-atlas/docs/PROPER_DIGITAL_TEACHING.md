# Proper palmar digital artery teaching

Ten existing Hand / Whole body selections now have source-specific Anatomy and
Function drafts (20 placements), replacing the broad repeated group descriptions.
The notes identify each named digit and expected anatomical border and distinguish
a common digital trunk from a proper branch. Supply includes the palmar digit
and distal dorsal/nail-bed region; a source-labelled artery does not establish
an exclusive territory, flow, nerve function or collateral adequacy.

| Source | Hand | Digit | Expected border / neighbouring digit |
| --- | --- | --- | --- |
| FMA22858 / FJ2365 | Right | Middle | Radial / index |
| FMA22860 / FJ2334 | Left | Middle | Radial / index |
| FMA23050 / FJ2364 | Right | Index | Ulnar / middle |
| FMA23051 / FJ2333 | Left | Index | Ulnar / middle |
| FMA23052 / FJ2369 | Right | Ring | Ulnar / little |
| FMA23054 / FJ2368 | Right | Little | Radial / ring |
| FMA23055 / FJ2336 | Left | Little | Radial / ring |
| FMA85112 / FJ2367 | Right | Middle | Ulnar / ring |
| FMA85115 / FJ2366 | Right | Ring | Radial / middle |
| FMA85116 / FJ2335 | Left | Ring | Radial / middle |

This is a reading of the source's lateral/medial labels in anatomical orientation,
not proof of the supplied mesh's position. Camera rotation does not rename an
artery. Six right and four left sources remain; absent counterparts, digital
nerves and connecting vessels are not created.

## Source, rights and review

Full identity signatures reuse `content/palmar-arterial-imaging-pins.json`, not
name matching or FMA-only admission. Wrong-side, changed geometry/source hashes,
altered validation and unknown records cannot receive the new specialised lesson.
All other 9,916 topics, including existing MRI, clinical/pathology and quiz content,
and all source geometry, recipes and access boundaries are preserved.

Original factual summaries cite the [TTUHSC El Paso anatomy table](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html).
No table or publisher artwork is imported. Existing BodyParts3D CC BY 4.0 notices
remain. This adds no package, font, texture, model, scan or paid service.

All notes are drafts for revision-bound radiologist review. Validate label-to-mesh
identity, digit and border, completeness, spatial relationships and prose before
sign-off; no perfusion, procedure or imaging registration is implied. The previous
Search component change also required refreshing stale renderer/review evidence;
regeneration changes technical fingerprints only and never migrates approvals.

## Reproduction and scope

`npm run proper-digital-teaching:test` checks exact transition replay, 20 actual
viewer-note renders, all untouched topics/recipes, explicit digit/border mapping,
160 source-identity mutations, detached arrays and mixed/unrecorded-history
rejection. `node scripts/pin-proper-digital-teaching.mjs --check` reconstructs the
saved prior lessons from exact Git source `facf4a4`, retaining immutable evidence.
History reconstruction is test-only, never a runtime approval override.

Use the main task checkpoint for completed broad checks, local visual inspection,
GitHub/D recovery and publication state. Source/component tests alone do not prove
hosted, physical-device, screen-reader or clinical acceptance. Existing compact
tabs are reused; no extra drawer or toolbar is added.

Completed source checks: 20 actual note renders; 160 identity mutations; all
9,916 untouched topics and recipes; exact prior-Git pin replay; current broad
content contract (33,445 checks); body review (1,104 selections / 9,936 topics);
TypeScript and shared regional build. Existing large-chunk warnings remain.

The standalone `validate-hand-vessel-clinical-curriculum.mjs` still fails its old
whole-curriculum digest. Exact prior-Git reconstruction at `facf4a4` reproduces
the mismatch without this teaching addition: expected `6dc6c26cb89bbc9db015601fe7a5b616aeffcb7cffebab3df38210540c21d9c4`,
actual `c5857e93ececc3f9ba8e3fbed2e2925967dab64265d03f5113d8df8fca4ce514`.
Its expected fixture was not changed. This remains historical-validator debt,
not a waived pass; current unaffected clinical topics are independently compared.
