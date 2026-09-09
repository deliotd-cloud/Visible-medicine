# Pelvic organ clinical teaching

Historical milestone: the subsequent [head/neck organ extension](HEAD_ORGAN_CLINICAL_CURRICULUM.md) brings current Clinical/Pathology to 674 draft / 348 pending. Counts and next steps below describe the pelvic delivery; historical comparisons remain separate from current runtime/export tests.

## Scope — 9 September 2026

Twenty original Clinical/Pathology drafts cover ten existing pelvic-primary selections in seven groups. They use the existing notes panels: no extra controls, geometry, dependencies, review state or database changes.

| Selection | Exact FMA / tree | Source file |
| --- | --- | --- |
| Urinary bladder | FMA15900 / PARTOF | FJ3149 |
| Prostate | FMA9600 / PARTOF | FJ3139 |
| Right testis | FMA7211 / ISA | FJ3142 |
| Left testis | FMA7212 / ISA | FJ3138 |
| Right seminal vesicle | FMA19387 / ISA | FJ3143 |
| Left seminal vesicle | FMA19388 / ISA | FJ3137 |
| Rectum | FMA14544 / ISA | FJ2571 |
| Right epididymis | FMA18256 / ISA | FJ3141 |
| Left epididymis | FMA18257 / ISA | FJ3136 |
| Urethra | FMA19667 / ISA | FJ3148 |

All ten source-index memberships match exactly, with no omitted memberships. The three pairs retain independently indexed right/left identities. The rectum remains the sole owner of FJ2571, excluded from the large-intestine display aggregate. Pelvis browsing membership does not place the testis within the pelvic cavity. The represented urethra and reproductive organs are adult-male reference anatomy, not female or paediatric geometry.

## Evidence and rights

Each displayed/exported lesson has group-specific references, consulted on 9 September 2026:

- **bladder**: [Reference 1](https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults/symptoms-causes).
- **prostate**: [Reference 1](https://www.niddk.nih.gov/health-information/urologic-diseases/prostate-problems/enlarged-prostate-benign-prostatic-hyperplasia).
- **testes**: [Reference 1](https://www.nhs.uk/symptoms/testicle-pain/).
- **seminal-vesicles**: [Reference 1](https://my.clevelandclinic.org/health/body/22433-seminal-vesicle), [Reference 2](https://my.clevelandclinic.org/health/symptoms/blood-in-semen-hematospermia).
- **rectum**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/proctitis), [Reference 2](https://www.niddk.nih.gov/health-information/digestive-diseases/proctitis/symptoms-causes).
- **epididymides**: [Reference 1](https://www.nhs.uk/conditions/epididymitis/).
- **urethra**: [Reference 1](https://magazine.urologyhealth.org/summer_2021/uro-mythbusters), [Reference 2](https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-retention/symptoms-causes).

The scope is brief original factual synthesis, not copied article prose or a comprehensive treatment curriculum. No publisher diagrams, scans, flowcharts, articles, question banks, clinical protocols or other assets are imported. Access/citation does not grant commercial asset-reuse rights. Existing original MIT code/text and BodyParts3D CC BY 4.0 credit/change obligations remain unchanged; no model, texture, font, dependency, paid API or patient data is added. The existing dependency audit retains its notice/source obligations.

## Contract and verification

The resolver requires the exact organ-system/category/FMA/side/tree/ordered-files/primary-and-ordered-regions tuple, and only returns Clinical/Pathology drafts. It preserves source warnings and returns detached arrays. Current displayed content and exported records are checked directly.

Before capture: clean source `27a28be5b2b3746f5dba80c8cb32b9da35761db4`. The new offline projection precedes abdominal history: 48 projections / 2,894 pinned topic edits. Older captures and the original baseline stay fixed. Abdominal historical comparisons use the pre-pelvic milestone while current direct/export assertions remain intact.

Run `npm run pelvic-organ-clinical-curriculum:test -- --source`: 17,082 assertions, ten official source checks and 26 corrupted-copy/readiness cases. It checks paired sides, exact rectal ownership, sex/age scope, emergency wording, copy/export agreement and all unrelated sections. Source verification requires the separately retained official indexes in `work/bodyparts3d`.

Also run affected abdominal/original-organ/organ-Anatomy tests, bowel-junction study, shared content contract, requirements/export freshness, TypeScript, focused lint/format and production build. Generated reports separate software/source evidence from medical and device acceptance.

Clinical/Pathology each reach **657 draft / 365 pending** body entries. Anatomy remains 1,020 draft / two identity-only; Function 1,018 draft / four pending; CT/MRI/US each 11 draft / 1,011 pending; Quiz 11 draft / 1,011 generated-identification. FMA45097/FMA45098, FMA19728 and FMA61970 holds are unchanged.

## Clinical acceptance still required

Independent specialist review must check:

- Lower versus upper urinary infection, bladder-outlet versus weak-contraction mechanisms and urgent retention wording.
- BPH versus prostatitis/cancer, symptom/size limitations and unvalidated internal prostate zones.
- Torsion urgency versus epididymal infection; tests and clinical assessment cannot be replaced with a normal reference shape.
- Seminal-vesicle pathology versus non-localising symptoms such as blood in semen; no side, fertility or duct-patency inference.
- Rectal mucosal disease, tenesmus and the distinction between inflammatory proctitis and radiation proctopathy.
- Adult-male source limits, actual spatial relationships, unvalidated lumens/tracts and jurisdiction-specific emergency language.

The atlas supplies no patient diagnosis, measured lumen, physiological simulation, tumour stage, catheter/operative route, manual detorsion instruction, treatment regimen or imaging registration. Browser/device testing and clinical approval are not claimed. Real scans and the user's future imaging function remain separate work.

Next: the 45 pending head/neck organ entries, then 89 connective and 227 vessel entries, richer reviewed questions and full-body editorial persistence. The broader goal remains active. GitHub upload remains deferred; owner-private Sites publishing and an exact local backup remain separate.
