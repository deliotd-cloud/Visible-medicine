# Independent lower-limb clinical teaching

## Delivered scope

Twenty-two exact source selections now have 96 introductory topic drafts and 22 clinical self-checks. They use the existing Learn panel with three compact groups: Anatomy (Overview/Function), Clinical (Context/Pathology) and Imaging (CT/MRI/X-ray/Ultrasound). All 67 baseline anatomy/function lessons remain. Absent content is explicitly pending, not a generic completed lesson. No additional controls or expanded-by-default panel were added.

### Hip/thigh extension — 11 September 2026

Twelve existing selections gain 50 topics and twelve original self-checks. They distinguish proximal femoral fracture from an intact reference bone, cartilage loss from exploded spacing, gluteal tendon disorders from isolated bursitis, iliopsoas snapping from other mechanical symptoms, and the two biceps femoris heads. These are short orientation drafts, not complete imaging lectures, simulated injuries or treatment protocols.

| Selections | Clinical + Pathology | MRI | X-ray | CT | Ultrasound |
| --- | ---: | ---: | ---: | ---: | ---: |
| Femur | 2 | 1 | 1 | 1 | — |
| Femoral-head cartilage | 2 | — | 1 | — | — |
| Gluteus medius, gluteus minimus | 4 | 2 | — | — | 2 |
| Iliacus, psoas major | 4 | — | 2 | — | 2 |
| Adductor longus, rectus femoris | 4 | 2 | 2 | — | 2 |
| Semimembranosus | 2 | 1 | 1 | — | 1 |
| Semitendinosus, biceps long head | 4 | 2 | 2 | — | — |
| Biceps short head | 2 | 1 | — | — | — |
| New draft topics | 24 | 9 | 9 | 1 | 7 |

All twelve exist in Hip & thigh and whole-limb views. Available-topic links automatically include the new drafts. The femur keeps its whole-bone identity even when teaching discusses its proximal region. No opposing acetabular cartilage, labrum, separate tendon/bursa or measured joint space is added. Short-head biceps teaching explicitly excludes an ischial origin.

### Preserved knee/hindfoot baseline

| Selections | Clinical + Pathology | MRI | X-ray | CT | Ultrasound |
| --- | ---: | ---: | ---: | ---: | ---: |
| ACL, PCL | 4 | 2 | 2 | — | — |
| MCL, LCL | 4 | 2 | 2 | — | 2 |
| Grouped menisci | 2 | 1 | 1 | 1 | — |
| Quadriceps and patellar tendons | 4 | 2 | 2 | — | 2 |
| Achilles tendon | 2 | 1 | 1 | — | 1 |
| Talus and calcaneus | 4 | — | 2 | 2 | — |
| Total draft topics | 20 | 8 | 10 | 3 | 5 |

The material distinguishes partial/complete disruption, accompanying injuries and modality limitations. It does not provide treatment protocols, diagnostic accuracy estimates, calibrated measurements or clinical approval. The clinical self-checks are original revealable questions, separate from model-identification practice, and are not scored/accredited exams. Selected tissues remain the original source surfaces, not generated pathology examples.

## Exact identity and navigation

`content/um-limb-clinical.ts` incorporates the explicit hip/thigh concepts from `content/um-hip-thigh-clinical.ts`; `content/um-limb-teaching.ts` attaches them only to existing named concepts. The teaching-pin script binds complete source entries, bundle hashes and lessons. The hip/thigh extension changes twelve lessons; the other 55 (including the previous ten clinical sets), source meshes, null FMA mappings and source/recipe navigation pins remain unchanged. Runtime resolution returns detached exact-bound content and rejects foreign or altered source entries. Grouped menisci stay grouped; source defects cannot be interpreted as disease.

`availableSpecimenTopics` uses the actual bound lesson, not a global promise of availability. Copy/open links offer only available drafts; manually supplied unsupported topic requests fail closed with `topic-unavailable`. The dedicated route opens the appropriate outer group and topic. Existing Anatomy/Function links remain compatible. Opening Imaging normally chooses an available modality, preferring MRI where authored. No pending topic silently becomes an alternative.

No FMA/name matching to another subject, patient identifiers, scan transforms, credentials, entitlement tokens or quiz answers are added to links. Lecture access and the owner's separate imaging-atlas projects remain independent. These references are educational reading, not access to separately paid Visible Medicine lectures.

## Reference and rights record

Checked 11 September 2026: AAOS OrthoInfo pages for [ACL](https://www.orthoinfo.org/diseases--conditions/anterior-cruciate-ligament-acl-injuries/), [PCL](https://www.orthoinfo.org/diseases--conditions/posterior-cruciate-ligament-injuries/), [collateral ligaments](https://www.orthoinfo.org/diseases--conditions/collateral-ligament-injuries/), [menisci](https://www.orthoinfo.org/diseases--conditions/meniscus-tears/), [quadriceps tendon](https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear/), [patellar tendon](https://www.orthoinfo.org/diseases--conditions/patellar-tendon-tear/), [Achilles rupture](https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/), [talus](https://www.orthoinfo.org/diseases--conditions/talus-fractures/) and [calcaneus](https://www.orthoinfo.org/diseases--conditions/calcaneus-heel-bone-fractures/); [ESSR knee ultrasound technical guidelines](https://essr.org/content-essr/uploads/2016/10/knee.pdf).

These are reference-only sources for brief original factual synthesis. No articles, images, diagrams, protocols, tables, cases, scans or question banks are bundled or relicensed. Original self-checks are not copied from their assessments. No endorsement or commercial image-reuse permission is inferred. The existing CC0 UM mesh licence remains separate; no dependency, font, texture, new mesh, paid service or source anatomy was added. Rights notices are retained in `LICENSES/THIRD_PARTY_NOTICES.md`.

## Verification and outstanding review

`npm run um-limb-clinical:test` checks all 22 exact source/lesson bindings, the 96-topic matrix and exact hip/thigh per-structure coverage, detachment/foreign-source rejection, available/pending link behavior in all five scopes and installed React markup for all 132 topic states. There are 216 source-bound extended-topic links across overlapping scopes. It verifies the requested group opens, references and cautions render, and pending states remain explicit. Baseline learning/navigation and knee suites are regression checks, not specialist or browser acceptance.

Required before clinical release: clinician/radiologist review of claims, nuance, local practice and references; orthopedic review of attachment/ligament grouping and source defects; real modality-specific image examples with de-identification and rights; scan-to-model registration validation before synchronized highlighting; browser/GPU/mobile, screen-reader, touch, keyboard and clipboard acceptance. Further content is still needed for 45 other independent selections and the unauthored modality topics above. The broader atlas remains incomplete, including major peripheral nerves and many joint/fascial structures. Routine oral detail remains deferred.

Hip/thigh references checked 11 September 2026: AAOS [hip fractures](https://www.orthoinfo.org/diseases--conditions/hip-fractures/), [hip osteoarthritis summary](https://orthoinfo.aaos.org/globalassets/pdfs/hip-osteoarthritis-cpg_pls.pdf), [snapping hip](https://www.orthoinfo.org/diseases--conditions/snapping-hip/), [hip strains](https://www.orthoinfo.org/diseases--conditions/hip-strains/), [thigh strains](https://www.orthoinfo.org/diseases--conditions/muscle-strains-in-the-thigh) and [hamstring injuries](https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries); Cambridge University Hospitals [gluteal tendinopathy](https://www.cuh.nhs.uk/patient-information/gluteal-tendinopathy/); Texas Tech [posterior-thigh teaching](https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_ans.html); ESSR [hip ultrasound guidance](https://essr.org/content-essr/uploads/2016/10/hip.pdf). Older educational references inform stable introductory facts, not a current local treatment pathway. New cited lesson/self-check synthesis stays below 200 words per reference (59–163 words). No PDF, diagram, table or external question was copied into the atlas; source-specific model cautions describe local specimen limitations.
