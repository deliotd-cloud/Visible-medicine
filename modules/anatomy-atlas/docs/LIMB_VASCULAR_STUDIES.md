# Limb vascular dissection studies

11 September 2026. Three independent Study choices combine **42 existing source selections**. This improves regional dissection context; it does not add anatomical meshes or certify the source anatomy.

| Region / Study | Targets | Retained context | Both sides / one side |
| --- | --- | --- | --- |
| Knee & leg / Calf: anterior vessels & muscles | Anterior tibial artery and supplied vein groups | Tibia, fibula, tibialis anterior, long toe extensors, fibularis tertius | 16 / 8 |
| Knee & leg / Calf: posterior vessels & muscles | Posterior tibial artery and supplied vein groups | Tibia, fibula, tibialis posterior, long toe flexors | 14 / 7 |
| Hip & thigh / Thigh: deep femoral vessels | Femoral and deep femoral arteries/veins | Femur, pectineus, adductor longus/magnus | 16 / 8 |

The rows overlap in skeletal context, so their counts are not additive. Choose a side for a less crowded view. Use the existing Study search, expand the view preview and open it. Select a covering muscle and hide it; Undo restores it. **Extract selected** can set a vessel aside. At **0%** structures return to their original source positions. Other standard projections remain available. There is no new toolbar, automatic anatomical cutting or claim that these three choices are successive tissue layers.

## Source and interaction contracts

- `content/limb-vascular-studies.ts` defines explicit FMA target/context sets, not broad name patterns or whole-skeleton fallbacks. Only tibia/fibula are retained in calf views, avoiding irrelevant full-femur framing.
- `content/limb-vascular-study-pins.json` binds all 42 complete source records, seven bundles, source version, licence and coordinate frame. `limbVascularStudyReady` checks the relevant full records before opening a new focus or resolving its link. Changed sources, duplicate/missing records, wrong regions and altered bundles are rejected. Other study families retain their existing admissions.
- Existing selection, anatomical ID, surface labels, hide/restore history, loading and clinical-review workflows are reused. Anatomy/Function/Imaging/Clinical content and independent paid-lecture entitlements are unchanged.
- An intentional stage/focus change clears a pending saved-camera restoration before fitting the new view. Exam-mode and rejected actions preserve state. A rejected related-study action cannot publish a false success notice.
- Three focus-only recipes are added; no new stage track or menu category. All earlier profiles are retained exactly after reversing the documented `limb-vascular-recipe-transition.json`. Historical test reconstruction is offline only, not a migration of clinical approvals. Existing elbow validation now explicitly reconstructs its pre-tentorium profile before checking the old fixed snapshot; no old snapshot or runtime recipe was substituted.

## Evidence

`npm run limb-vascular-studies:test` verifies source/bundle hashes, exact prior recipe preservation, nine side scopes, 92 source-bound links, muscle hide/Undo and 552 selected-extraction cases in six projections. It rejects 144 source/frame mutations and executes 16 actual parent-handler cases and 12 real Study-library renders, including exam guards. At the extraction endpoint the selected conservative projected bounds clear the remaining context; nonselected items remain fixed and zero separation restores source positions. Arbitrary orbit angles and intermediate separation may still overlap.

The source catalogue remains 1,031 displayed / 1,022 archived selections. Meshes, textures, fonts and licensing inputs are unchanged. No browser, real-device/GPU, assistive-technology, pixel/occlusion or clinical acceptance is claimed by these tests.

## Anatomical and imaging limits

The source has no complete peripheral nerves, fascia/septa or companion-vein system for these views. Fibular-vein aggregates remain withheld for source review. Anterior tibial selections retain their two original source parts. Source surfaces do not establish exact vascular confluences, valves, lumens, tissue attachments, dissection planes or patient findings. The thigh study is not a complete femoral triangle/adductor canal; the posterior calf study is not a tarsal tunnel. Clinicians must verify source courses and relationships before clinical release.

Future CT/MRI/X-ray/US synchronization still needs separately licensed/de-identified images and validated correspondence. A source-coordinate link is not patient registration or permission to open a separately purchased lecture.

## Rights and references

Existing source anatomy remains BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International; preserve all attribution and modification notices. New original code/prompts use MIT. No package, font, texture, model, paid service or third-party illustration is imported.

Factual reading references: [TTUHSC lower-limb muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html), [TTUHSC lower-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html), [lower-extremity venous anatomy review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/). Their articles, tables and diagrams are not redistributed; a citation does not grant asset reuse rights.
