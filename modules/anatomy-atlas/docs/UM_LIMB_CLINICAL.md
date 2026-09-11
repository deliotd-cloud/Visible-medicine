# Independent lower-limb clinical teaching

## Delivered scope

Fifty-four exact source selections now have 180 introductory topic drafts and 54 clinical self-checks. All 42 supplied muscle selections have Clinical/Pathology drafts; this is introductory coverage, not complete muscle radiology or clinical validation. They use the existing Learn panel with three compact groups: Anatomy (Overview/Function), Clinical (Context/Pathology) and Imaging (CT/MRI/X-ray/Ultrasound). All 67 baseline anatomy/function lessons remain. Absent content is explicitly pending, not a generic completed lesson. No additional controls or expanded-by-default panel were added.

### Remaining hip muscles — 11 September 2026

Sixteen existing hip/thigh muscle selections gain 43 topics and sixteen original self-checks. These finish introductory Clinical/Pathology coverage for the independent specimen's 42 muscles, without importing another subject's identities or changing geometry. This does not close the remaining thirteen bone/cartilage teaching gaps or the many unauthored modality topics.

| Selections | Clinical + Pathology | Added imaging |
| --- | ---: | --- |
| Adductor brevis, adductor magnus | 4 | MRI for each |
| Gracilis, sartorius | 4 | US for each |
| Pectineus, gluteus maximus | 4 | Pending |
| Superior/inferior gemelli, obturator internus | 6 | Pending |
| Obturator externus, piriformis, quadratus femoris | 6 | MRI for each |
| Tensor fasciae latae | 2 | US anatomical context |
| Vastus intermedius/lateralis/medialis | 6 | US for each |

Teaching preserves magnus's distinct functional portions, conventional gemellar nerve differences, variable pectineus supply, sartorius's non-hamstring identity and whole-vastus boundaries. A separately validated VMO, iliotibial tract, retinaculum or sciatic nerve is not invented. Deep-gluteal and ischiofemoral notes distinguish anatomical context from proven symptomatic entrapment. Externus case-series findings are not universal prevalence, diagnostic accuracy or recovery claims. Shared quadriceps-tendon pathology is not an assertion that each vastus is torn.

Only sixteen previously absent extended sets change. All 67 baseline lessons/source bindings, the other 51 complete lessons, previous topic text, source/recipe pins and all meshes remain unchanged from the calf/foot checkpoint. New reference metadata provides readable links; no UI controls are added.

### Calf/foot extension — 11 September 2026

All sixteen supplied calf/foot muscle selections gain Clinical and Pathology context and an original self-check. Nine selected imaging notes bring this extension to 41 topics. It reuses appropriate original factual prose from the main atlas, but never its FMA/node IDs, laterality bindings or source-scope notes. Exact independent specimen bindings remain the only access path. This is introductory teaching, not completion of lower-limb radiology.

| Selections | Clinical + Pathology | Additional imaging |
| --- | ---: | --- |
| EDL, EHL, tibialis anterior, FDL, FHL | 10 | Pending |
| Fibularis longus (source: peroneus longus) | 2 | MRI, dynamic-US context |
| Popliteus | 2 | MRI context |
| Soleus | 2 | MRI, US limitations |
| Tibialis posterior | 2 | MRI, standing-radiograph context |
| Medial / lateral gastrocnemius | 4 | Medial-head US context only |
| Abductor hallucis, FDB, quadratus plantae, EDB | 8 | Pending |
| Foot abductor digiti minimi | 2 | MRI evidence limitation |

The material distinguishes muscle strain from Achilles rupture, FDL from FDB attachments, a dorsal extensor from plantar intrinsic innervation, and a muscle selection from a nerve-localising examination. A normal US cannot reliably exclude deep soleus injury. ADM fatty infiltration is not presented as a stand-alone diagnosis of Baxter neuropathy. Medial-head tennis-leg context is not silently applied to a lateral-head diagnosis. No separate EHB, missing intrinsic muscle, nerve path, tendon slip, retinaculum or patient scan is invented.

The extension changes sixteen extended lessons only: all 67 baseline lessons/source bindings and the other 51 complete lessons are unchanged from the preceding hip/thigh checkpoint. Existing source/recipe navigation pins and every mesh remain unchanged.

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

`content/um-limb-clinical.ts` incorporates explicit concepts from `content/um-hip-thigh-clinical.ts`, `content/um-calf-foot-clinical.ts` and `content/um-hip-muscle-clinical.ts`; `content/um-limb-teaching.ts` attaches them only to existing named concepts. The teaching-pin script binds complete source entries, bundle hashes and lessons. Runtime resolution returns detached exact-bound content and rejects foreign or altered source entries. Grouped menisci stay grouped; source defects cannot be interpreted as disease. Reusing authored prose is not registration to another subject.

`availableSpecimenTopics` uses the actual bound lesson, not a global promise of availability. Copy/open links offer only available drafts; manually supplied unsupported topic requests fail closed with `topic-unavailable`. The dedicated route opens the appropriate outer group and topic. Existing Anatomy/Function links remain compatible. Opening Imaging normally chooses an available modality, preferring MRI where authored. No pending topic silently becomes an alternative.

No FMA/name matching to another subject, patient identifiers, scan transforms, credentials, entitlement tokens or quiz answers are added to links. Lecture access and the owner's separate imaging-atlas projects remain independent. These references are educational reading, not access to separately paid Visible Medicine lectures.

## Reference and rights record

Checked 11 September 2026: AAOS OrthoInfo pages for [ACL](https://www.orthoinfo.org/diseases--conditions/anterior-cruciate-ligament-acl-injuries/), [PCL](https://www.orthoinfo.org/diseases--conditions/posterior-cruciate-ligament-injuries/), [collateral ligaments](https://www.orthoinfo.org/diseases--conditions/collateral-ligament-injuries/), [menisci](https://www.orthoinfo.org/diseases--conditions/meniscus-tears/), [quadriceps tendon](https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear/), [patellar tendon](https://www.orthoinfo.org/diseases--conditions/patellar-tendon-tear/), [Achilles rupture](https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/), [talus](https://www.orthoinfo.org/diseases--conditions/talus-fractures/) and [calcaneus](https://www.orthoinfo.org/diseases--conditions/calcaneus-heel-bone-fractures/); [ESSR knee ultrasound technical guidelines](https://essr.org/content-essr/uploads/2016/10/knee.pdf).

These are reference-only sources for brief original factual synthesis. No articles, images, diagrams, protocols, tables, cases, scans or question banks are bundled or relicensed. Original self-checks are not copied from their assessments. No endorsement or commercial image-reuse permission is inferred. The existing CC0 UM mesh licence remains separate; no dependency, font, texture, new mesh, paid service or source anatomy was added. Rights notices are retained in `LICENSES/THIRD_PARTY_NOTICES.md`.

## Verification and outstanding review

`npm run um-limb-clinical:test` checks all 54 exact source/lesson bindings, the 180-topic matrix and exact regional per-structure coverage, detachment/foreign-source rejection, available/pending link behavior in all five scopes and installed React markup for all 324 topic states. There are 405 source-bound extended-topic links across overlapping scopes. It verifies the requested group opens, references and cautions render, and pending states remain explicit. All 42 supplied muscles must have Clinical/Pathology drafts; all 54 self-check questions must be distinct. Explicit guards retain soleus/ADM cautions, distinguish lateral gastrocnemius, preserve VMO/tract/case-series/impingement limits and reject another specimen's identifiers or an invented separate EHB lesson. These are regression checks, not specialist or browser acceptance.

Required before clinical release: clinician/radiologist review of claims, nuance, local practice and references; orthopedic review of attachment/ligament grouping and source defects; real modality-specific image examples with de-identification and rights; scan-to-model registration validation before synchronized highlighting; browser/GPU/mobile, screen-reader, touch, keyboard and clipboard acceptance. Further content is still needed for thirteen independent bone/cartilage selections and the unauthored modality topics above. The broader atlas remains incomplete, including major peripheral nerves and many joint/fascial structures. Routine oral detail remains deferred.

Remaining-hip reference pass, 11 September 2026: NCBI adductor strain and muscle anatomy, [AAOS pes bursitis](https://www.orthoinfo.org/diseases--conditions/pes-anserine-knee-tendon-bursitis), the existing AAOS snapping/quad-tendon and ESSR hip/knee guidance, [deep-gluteal review](https://pubmed.ncbi.nlm.nih.gov/32349600/), [externus case series](https://pubmed.ncbi.nlm.nih.gov/36143822/) and [asymptomatic ischiofemoral MRI study](https://pubmed.ncbi.nlm.nih.gov/25680726/). These support brief original orientation notes, not an exhaustive current evidence review or local treatment pathway. No publisher text, articles, tables, illustrations, scans or external questions are bundled. Aggregate cited topic/self-check synthesis across the independent lessons stays below 200 words per reference (maximum 185), including URLs shared with older lessons. Public access and NCBI hosting do not grant commercial asset rights or override NC-ND restrictions.

Calf/foot references checked 11 September 2026 include [Texas Tech anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html), NCBI anatomy/clinical references, [AAOS arch-collapse teaching](https://www.orthoinfo.org/diseases--conditions/posterior-tibial-tendon-dysfunction), [FHL injury series](https://pubmed.ncbi.nlm.nih.gov/9677077/), [popliteus review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8894959/), [soleus US study](https://pubmed.ncbi.nlm.nih.gov/24627005/), [calf US differential study](https://pubmed.ncbi.nlm.nih.gov/12091669/), [operative peroneal imaging comparison](https://pubmed.ncbi.nlm.nih.gov/38337434/) and [ADM/Baxter evidence review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12367558/). Each topic carries its specific reading link; complete reference titles/URLs are in the content module. Cohort-specific accuracy, prevalence and recovery estimates are not generalized. The 2025 evidence review is identified by date, not claimed to exhaust subsequent research. No article, table, diagram, protocol or question bank is redistributed. New cited topic/self-check text totals 19–111 words per referenced URL; model limitations are original descriptions of this application's scope.

Hip/thigh references checked 11 September 2026: AAOS [hip fractures](https://www.orthoinfo.org/diseases--conditions/hip-fractures/), [hip osteoarthritis summary](https://orthoinfo.aaos.org/globalassets/pdfs/hip-osteoarthritis-cpg_pls.pdf), [snapping hip](https://www.orthoinfo.org/diseases--conditions/snapping-hip/), [hip strains](https://www.orthoinfo.org/diseases--conditions/hip-strains/), [thigh strains](https://www.orthoinfo.org/diseases--conditions/muscle-strains-in-the-thigh) and [hamstring injuries](https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries); Cambridge University Hospitals [gluteal tendinopathy](https://www.cuh.nhs.uk/patient-information/gluteal-tendinopathy/); Texas Tech [posterior-thigh teaching](https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_ans.html); ESSR [hip ultrasound guidance](https://essr.org/content-essr/uploads/2016/10/hip.pdf). Older educational references inform stable introductory facts, not a current local treatment pathway. New cited lesson/self-check synthesis stays below 200 words per reference (59–163 words). No PDF, diagram, table or external question was copied into the atlas; source-specific model cautions describe local specimen limitations.
