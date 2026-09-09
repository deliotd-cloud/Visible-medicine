# Thoracic organ clinical teaching

Historical milestone: subsequent [abdominal teaching](ABDOMINAL_ORGAN_CLINICAL_CURRICULUM.md) brings current Clinical/Pathology to 647 draft / 375 pending. Totals and next steps below describe the thoracic delivery; its validator retains this historical readiness separately from current runtime/export checks.

## Scope — 9 September 2026

Sixteen original Clinical/Pathology drafts cover eight already represented organs in six teaching groups. They appear in the existing notes panels without additional controls, geometry or navigation changes. Draft status and source warnings remain visible.

| Group | Source identity | Rendered components |
| --- | --- | ---: |
| Heart | FMA7088, PART-OF | 56 |
| Right lung | FMA7309, PART-OF | 156 |
| Left lung | FMA7310, PART-OF | 124 |
| Oesophagus | FMA7131, PART-OF | 1 |
| Trachea | FMA7394, PART-OF | 1 |
| Thymus | FMA9607, PART-OF | 2 |
| Right main bronchus | FMA7395, PART-OF | 1 |
| Left main bronchus | FMA7396, ISA | 1 |

The 342 components are not 342 validated clinical subdivisions. Twenty-seven additional files in the official heart PART-OF index remain outside its display aggregate: 18 belong to FMA3862, six to FMA3895, and one each to FMA4707, FMA3802 and FMA3855. The suite checks each file's exact existing owner; no coronary surface is duplicated or omitted from the product by this teaching change.

The heart and lungs remain aggregate selections; the thymus remains a two-component group. Main bronchi are proximal source segments, not full trees or validated lumens. Thorax browsing membership does not truncate the cervical/abdominal extent of the trachea or oesophagus. No dimensions, device routes, physiological motions or microscopic tissues are invented.

## Clinical evidence and rights

Group-specific references are included in the displayed and exported lessons:

- [NHLBI infarction mechanisms](https://www.nhlbi.nih.gov/health/heart-attack/causes), [heart failure](https://www.nhlbi.nih.gov/health/heart-failure) and [NHS heart-attack guidance](https://www.nhs.uk/conditions/heart-attack/) support the distinctions between myocardial injury, pumping/filling failure and cardiac arrest.
- [NHLBI pneumonia](https://www.nhlbi.nih.gov/health/pneumonia) and [diagnosis](https://www.nhlbi.nih.gov/health/pneumonia/diagnosis) support infection, alveolar/pleural distinctions and the need for actual clinical evidence.
- NIDDK [GERD definitions/complications](https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/definition-facts) and [symptoms](https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/symptoms-causes) support reflux, stricture, lining-change and swallowing-warning context.
- [Penn Medicine airway stenosis](https://www.pennmedicine.org/conditions/airway-stenosis) supports central-airway narrowing and potential asthma-like presentations.
- [NCI thymic tumours](https://www.cancer.gov/types/thymus-cancer/thymoma-thymic-carcinoma) supports tumour distinctions, autoimmune associations and nonspecific presentations.
- [Royal Children's Hospital inhaled foreign bodies](https://www.rch.org.au/clinicalguide/guideline_index/Foreign_bodies_inhaled/) supports the explicitly paediatric caution that normal examination/radiography does not exclude an inhaled object. It does not validate this adult mesh for children or provide a universal side-of-impaction rule.
- [NHS breathlessness guidance](https://www.nhs.uk/symptoms/shortness-of-breath/) supports UK emergency wording. Review local services before use elsewhere.

Sources were consulted on 9 September 2026. Only brief original factual synthesis and reference links are shipped. No publisher prose, clinical algorithm, flowchart, article file, figure, scan, video, question bank or procedural instruction is reproduced. Public/NIH hosting does not grant reuse rights to separately copyrighted media; none is imported. Existing original MIT text/code and BodyParts3D CC BY 4.0 credit/change obligations are unchanged. No additional dependency, font, asset, paid API or mandatory service is introduced. This is not a systematic review, legal clearance or specialist acceptance.

## Contract and verification

The resolver accepts only the exact organ-system/category/FMA/side/source-tree/ordered-files/primary-and-ordered-regions tuple and the Clinical/Pathology tabs. Returned arrays are independent; all source warnings remain. Current runtime/export are tested directly.

Before capture: clean source `cca440fc1db64e17f39af51338bc46cc28307163`. The hash-pinned offline projection precedes central neural history, giving 46 projections / 2,840 explicit section changes. Earlier captures and original baseline remain fixed. Central neural and original organ-anatomy comparisons use their explicit historical milestones while keeping current direct/export assertions.

Run `npm run thoracic-organ-clinical-curriculum:test -- --source`: 17,324 assertions, 342 official rendered-component checks and 23 corrupted-section/readiness cases. The suite verifies all 27 separately owned coronary components and rejects wrong sides, trees, categories, regions and missing/reordered/extra source files. Source checks require the separately retained official indexes in `work/bodyparts3d`. Run affected central/orbital clinical, original organ/organ-anatomy, shared content-contract, requirements/export freshness, TypeScript, focused lint/format and production-build checks too.

Clinical and Pathology each now have 630 draft / 392 pending body entries. Anatomy remains 1,020 draft / two identity-only; Function 1,018 draft / four pending; CT/MRI/US each 11 draft / 1,011 pending; Quiz 11 draft / 1,011 generated-identification. No unresolved foot-sesamoid, perineal-category or forniceal-commissure hold changes.

## Remaining acceptance

Anatomical and specialty review must verify the source extents, clinical wording, evidence strength, age applicability and warning language. A reference heart is not an ECG/echo, lung transparency is not ventilation, airway clipping is not a patent lumen, and hiding a thymus is not a tumour operation. These lessons do not diagnose a patient, select a treatment or establish an imaging registration. No browser/device acceptance or clinical approval is claimed.

Next: 72 remaining organ-system entries (17 abdominal, ten pelvic, 45 head/neck), followed by 89 connective and 227 vessel entries, richer questions, full-body editorial persistence and the user's future imaging function. The whole-atlas improvement goal remains active; source, licensing, clinical and device gates remain separate.
