# Renal vascular clinical and imaging teaching

Open **Kidney → Explore renal vessels**, select a group, then expand **Learn more**. Fourteen new short sections extend the existing four concepts; no new panel, toolbar, mode or route is added. These are introductory editorial drafts, not complete disease teaching or clinical approval.

## Authored scope

| Source concept | Representations | New sections | Explicit gap |
| --- | ---: | --- | --- |
| Ureteric renal arterial groups | 2 | Pathology, CT, MRI, Ultrasound | No complete ureteric perfusion map or branch-level imaging correspondence |
| Right inferior suprarenal artery | 1 | Pathology, CT, MRI | Ultrasound pending; no left counterpart or bleeding-source localisation |
| Renal veins | 2 | Pathology, CT, MRI, Ultrasound | The compression example is left-sided, not a diagnosis in either mesh |
| Suprarenal veins | 2 | Pathology, CT, MRI | Ultrasound pending; the cited CT/MR comparison concerns the right vein only |

Fourteen shared authored sections produce 25 displayed topic instances: seven Pathology, seven CT, seven MRI and four Ultrasound. Counts are repeated source-bound teaching destinations, not 25 distinct lessons, complete examinations, seven validated vascular maps or universal visibility on scans. Core Anatomy/Function/Clinical paragraphs, source-scope limitations and recall questions are unchanged.

The paired lessons explicitly name the side of a referenced example. Reading a left-sided compression example on the right renal selection supports comparison; it does not imply right-sided nutcracker anatomy. Likewise the right-adrenal-vein study cannot establish left-vein imaging performance. The small arterial groups are distinguished from the urinary/adrenal tissue examined on actual scans.

## Evidence and retrieval boundaries

Primary references inspected on 10 September 2026:

- [EAU Urological Trauma guideline, §4.2](https://uroweb.org/guidelines/urological-trauma/chapter/urogenital-trauma-guidelines): factual basis for ureteric injury and CT notes. No operative technique, recommendations table or protocol is copied.
- [NIDDK Urinary Tract Imaging](https://www.niddk.nih.gov/health-information/diagnostic-tests/urinary-tract-imaging): MRI/ultrasound context; public page identifies its review date as April 2020. No image imported.
- [Kolber et al., Cardiovascular Diagnosis and Therapy (2021)](https://cdt.amegroups.org/article/view/49808/html): renal venous compression teaching. Publisher text inspected; numerical diagnostic thresholds, images and treatments are not reproduced.
- [Elhassan et al., Journal of Clinical Endocrinology & Metabolism (2023)](https://academic.oup.com/jcem/article/108/4/995/6834810): adrenal disease context and imaging notes. Indexed publisher text was readable; its later redirected minimal page was not consistently searchable. No dosing, intervention protocol or image imported.
- [Ota et al., European Radiology (2016; online 2015), PMID 26108640](https://pubmed.ncbi.nlm.nih.gov/26108640/): public abstract only, not full-text review. The model does not reproduce the study's scans or claim its reported accuracy.

PMC requests for the Kolber and Elhassan papers encountered a browser challenge. No challenge was bypassed: the publisher/PubMed records above supplied the cited evidence. References are not a licence to redistribute articles or figures. The existing notices record original factual paraphrase, one combined word budget per unique source, and no new asset/dependency obligations.

## Preservation and validation

`content/renal-teaching.ts` supplies the new sections and five reference records through the existing resolver. `scripts/validate-nested-teaching.mjs` checks:

- Unchanged complete non-renal content, retained renal core/quiz/IDs and the v112 teaching-binding file hash.
- Exact source/bundle/parent matching and rejection after mutation.
- The authored modality set for every representation, topic citations and rendered teaching sections.
- Explicit pending fallbacks when a modality is removed, without borrowing another topic.
- Collapsed teaching/answers, unique reference URLs and conservative per-source word limits.

Current nested totals are 60 representations, 37 concepts and 57 unique reference URLs. All 60 now have a Pathology draft. Authored imaging totals are CT: 19, MRI: 18 and US: 15; the other 41, 42 and 45 representations remain pending, respectively. These are introductory-copy counts, not medical completion.

All geometry, anatomy identities, teaching pins, access code, production learning manifest and private reviews are unchanged. Production still has zero external resources/correspondences. A teaching reference does not unlock a paid lecture, register a CT/MRI/US volume, provide a patient-specific diagnostic measurement or implement an X-ray topic.

## Required clinical/editorial review

Before clinical release, an appropriately qualified reviewer must assess accuracy, laterality, age/protocol applicability, current evidence and educational usefulness against the exact partial source groups. Confirm that disease examples cannot be mistaken for findings in the static model. Complete small-adrenal-vessel ultrasound teaching only with appropriate evidence; do not import paediatric gland-visibility claims into an adult vessel lesson. Review actual device readability and source-link usability separately. No certification or private review approval is created by these software checks.
