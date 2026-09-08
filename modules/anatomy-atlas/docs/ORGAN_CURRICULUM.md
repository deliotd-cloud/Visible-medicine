# Organ teaching extension

8 September 2026: 46 original Anatomy/Function drafts for 23 existing body representations, organised as 15 lessons with shared bilateral basics. No added geometry or UI controls. All remain **draft**, not clinically approved. Function text for every existing organ-system entry does not mean all organs, internal layers or specialist topics are complete.

## Source bindings and distinctions

Exact FMA/ISA/PART-OF memberships are pinned in `scripts/validate-organ-curriculum.mjs`. Coverage: prostate; paired testes, seminal vesicles, epididymides and ureters; male urethra; thymus; pituitary; paired globes, lacrimal, submandibular and sublingual glands; tongue, rectum and appendix. Source labels, laterality, coordinates, coverage warnings and mesh bindings are unchanged.

- Eye compounds are unequal: eight right components, nine left. Additional left component FJ1282 is labelled anterior chamber of left eyeball, FMA58082, in the official ISA index. Neither chosen set independently identifies a retinal component. This is source-index evidence, not proof of correct physical boundaries or complete eye layers. No mirror, replacement surface or inferred retinal dissection was introduced.
- Thymus FMA9607 combines FJ3150 (left lobe) and FJ3151 (right lobe), not an age-adaptive model or cellular dissection.
- Urethral/reproductive representations use the selected adult-male source. The pelvis navigation group includes scrotal structures; it does not place the testis inside the pelvic cavity.
- Whole-organ surfaces do not establish patent ducts, gland lobules, wall layers, taste territories or complete neural/vascular relationships. Pituitary synthesis is distinguished from posterior storage/release; reproductive production, maturation and secretion are distinguished.

## Evidence and rights

References were checked on 8 September 2026; each runtime lesson links its factual sources:

- NCI SEER: [testes](https://training.seer.cancer.gov/anatomy/reproductive/male/testes.html), [accessory glands](https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html), [ducts and male urethra](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html), [ureters](https://training.seer.cancer.gov/anatomy/urinary/components/ureters.html), [urinary route](https://training.seer.cancer.gov/anatomy/urinary/components/), [thymus](https://training.seer.cancer.gov/anatomy/lymphatic/components/thymus.html).
- Society for Endocrinology: [pituitary](https://www.yourhormones.info/glands/pituitary-gland/).
- NEI: [eye function](https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work), [tears](https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work/how-tears-work).
- StatPearls: [submandibular](https://www.ncbi.nlm.nih.gov/books/NBK542272/), [sublingual](https://www.ncbi.nlm.nih.gov/books/NBK535426/), [tongue](https://www.ncbi.nlm.nih.gov/books/NBK507782/).
- NIDDK: [digestive system](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works).
- Histology Guide: [human appendix](https://histologyguide.com/slideview/MH-122-appendix/14-slide-1.html), [lymphoid system](https://histologyguide.com/slidebox/10-lymphoid-system.html).

Only brief original factual writing is included, not publication prose, tables, illustrations, microscopy, scans or datasets. Publisher copyright and StatPearls NC-ND terms are not treated as commercial asset grants. The Michigan Histology landing page was inspected during discovery; its non-commercial manual/material was not used or included. References do not endorse or validate this atlas. Original application code/text retain MIT terms; source-index evidence retains separate DBCLS BodyParts3D CC BY 4.0 credit/change obligations. No dependency, font, texture, mesh, paid API or private information was added.

## Verification and next gates

`npm run organ-curriculum:test` checks exact scope, readiness, export parity, retained warnings/citations, detached arrays and eight negative mutations. Add `-- --source` for 23 cached official memberships and three compound-component checks. Fifteen offline transitions pin 764 explicit topic edits to the original immutable baseline without altering current runtime/exported lessons. Central-neuro report totals are now labelled historical.

Current body totals: Anatomy 575 draft / 447 identity-only; Function 631 draft / 146 identity-only / 245 pending. Remaining Function gaps: 200 skeletal, 43 connective and two explicit holds (muscle FMA19728 and fornical commissure FMA61970). Most CT/MRI/US/Pathology/Clinical and specialist Quiz notes still require authoring and review; see the generated requirement audit.

Independent anatomical/clinical review must verify source boundaries and relationships, ocular membership and missing retinal-layer coverage, sex/age/variant scope, epithelial/duct/wall detail and teaching statements. No physiology simulation, tissue interior, patient registration, diagnosis, clinical approval or actual imaging is added. Existing clinical/device-acceptance and real-imaging-adapter gates remain. Next: source-specific connective and skeletal basics, then specialist curriculum with explicit review status; do not force unresolved identities/functions to complete.
