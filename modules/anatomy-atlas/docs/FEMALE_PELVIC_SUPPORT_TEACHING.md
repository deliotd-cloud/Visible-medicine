# Female pelvic support teaching

12 September 2026. Open `/specimens/female-pelvis` and choose **Supporting surfaces**, then select a structure. The existing Learn panel, topic tabs, dissection and identification practice are reused; no permanent controls are added.

## Added source-bound teaching

| Concept | Existing selections | Key distinction |
| --- | --- | --- |
| Uterosacral ligament | Left/right | Posterior cervical support; imaging morphology needs corroboration, not a mesh thickness threshold. |
| Cardinal ligament | Left/right source regions | Lateral cervical support is not the entire broad-ligament sheet. |
| Suspensory ovarian ligament | Left/right | Lateral ovarian neurovascular route, not an ovarian duct. |
| Proper ovarian ligament | Left/right | Uterine attachment, distinct from the suspensory ligament. |
| Broad ligament | One compound source | Peritoneal fold with named regions, not a single solid cord. |
| Mesosalpinx | Left/right | Tubal peritoneal relationship, not a luminal tubal segment. |
| Mesovarium | Left/right | Ovarian attachment, not a complete ovarian envelope. |
| Vesicouterine pouch | One source surface | Anterior peritoneal recess, not a ligament or the posterior pouch of Douglas. |

Fourteen previously untaught selections gain Anatomy, Function, Clinical, Pathology, MRI, Ultrasound and a self-check. Eight original core concepts/questions and 20 distinct extended texts supply 56 added draft placements. Existing 17 selections/12 concepts/69 placements remain semantically identical, checked against commit `776df013c1553e1d42a0e9ea8db0cd835f1ce89e`.

Current totals are **31 taught selections, 20 concepts and 125 extended draft placements** (Clinical 31, Pathology 31, MRI 31, Ultrasound 30, CT 2, X-ray 0). These are not 125 distinct lessons. Ten surfaces still return teaching unavailable: cervicovaginal junction, rectum, three bladder selections, four uterine vessels and sacrum. Untaught modalities remain pending. Identification stays limited to ten eligible visible selections per round, with model-ready gating and dissection preserved.

## Source and commercial boundary

Original factual synthesis and citations only. No diagrams, papers, tables, question banks, patient images or third-party text passages are incorporated. Reference websites remain separately copyrighted and are not runtime dependencies. No new paid service, font, texture, model, dataset or package. Existing original-text/code terms and the separate HRA CC BY 4.0 model attribution remain unchanged.

References checked 12 September 2026:

- [Texas Tech pelvic anatomy tables](https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_tables.html): folds, attachments and recesses.
- [Texas Tech pelvic dissection relationships](https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_ans.html): cervical support, ovarian attachments and peritoneal reflections. Only the relevant factual anatomy is used; no procedure guidance or illustrations are copied.
- [ESHRE endometriosis guideline](https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Endometriosis-Guideline): imaging limitations; no management protocol is implemented.
- [ESUR 2025 MRI compartment consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC12559084/): multi-plane uterosacral interpretation, parametrial orientation and bladder/vesico-uterine relationships. No diagnostic cut-off or scoring tool is created.
- Previously cited ESUR [adnexal recommendations](https://link.springer.com/article/10.1007/s00330-024-10817-1) and [cystic lesions](https://link.springer.com/article/10.1186/s13244-025-02174-4) support brief organ-of-origin cautions; their media/text are not redistributed.

## Verification and remaining review

`node scripts/validate-hra-pelvic-teaching.mjs` checks all bindings, preservation of old lessons, 248 actual React topic renderings, pending states, copied lesson isolation and rejection of foreign/stale source identity. `node scripts/validate-hra-pelvis.mjs` checks the unchanged 41 decoded meshes/205,463 triangles, eight studies, practice and source holds. Technical checks cannot approve anatomy or imaging.

All six held source groups stay held, including both disputed round ligaments. No geometry, labels, source tissue classification or donor coordinates change. In particular, the source's support grouping must not be mistaken for an anatomical claim that a pouch is a ligament. No missing pelvic floor, nerves, ureters or lumens are manufactured.

Radiologist review remains required for each concept, relation, modality statement and question at its new teaching revision. Existing source-specific review materials derive teaching hashes from actual lessons; prior approval cannot silently cover the changed content. Browser/mobile/GPU evidence, clinical acceptance and any real imaging/release clearance remain open. The main body and independent specimen retain distinct coordinate/identity spaces and independent imaging/lecture entitlements.
