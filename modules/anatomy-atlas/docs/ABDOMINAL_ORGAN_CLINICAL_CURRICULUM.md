# Abdominal organ clinical teaching

Historical milestone: the subsequent [pelvic extension](PELVIC_ORGAN_CLINICAL_CURRICULUM.md) brings current Clinical/Pathology to 657 draft / 365 pending. Counts and next steps below describe the abdominal delivery; its validator keeps those historical counts separate from current runtime/export checks.

## Scope — 9 September 2026

Thirty-four original Clinical/Pathology drafts cover 17 existing abdominal-primary selections in 14 teaching groups. They use the existing notes panels without adding controls or changing navigation, geometry, registration, dependencies or the database. Draft status and source warnings remain visible.

| Selection | Exact FMA / tree | Rendered components |
| --- | --- | ---: |
| Liver | FMA7197 / PARTOF | 57 |
| Pancreas | FMA7198 / PARTOF | 4 |
| Stomach | FMA7148 / PARTOF | 1 |
| Small intestine | FMA7200 / PARTOF | 55 |
| Large intestine | FMA7201 / PARTOF | 6 |
| Gallbladder | FMA7202 / PARTOF | 1 |
| Right kidney | FMA7204 / PARTOF | 1 |
| Left kidney | FMA7205 / PARTOF | 1 |
| Spleen | FMA7196 / ISA | 1 |
| Right adrenal gland | FMA15629 / ISA | 1 |
| Left adrenal gland | FMA15630 / ISA | 1 |
| Right ureter | FMA15571 / PARTOF | 1 |
| Left ureter | FMA15572 / PARTOF | 1 |
| Cystic duct | FMA14539 / ISA | 1 |
| Common hepatic duct | FMA14668 / ISA | 1 |
| Appendix | FMA14542 / ISA | 1 |
| Ileocecal junction | FMA11338 / ISA | 1 |

These 135 components are not 135 validated clinical subdivisions. Six excluded aggregate memberships have five unique owners: liver exclusions FJ2415/FMA14339, FJ2416/FMA14338 and FJ3081/FMA14772; small-intestine exclusion FJ2599/FMA11338; large-intestine exclusions FJ2571/FMA14544 and FJ2599/FMA11338. The separately selectable junction is not duplicated in either bowel aggregate.

Both ureters and the appendix retain abdomen/pelvis membership. Gallbladder keeps its legacy pelvis-coded stable ID while browsing under abdomen. Kidney/adrenal pairs keep independently indexed sides. No source file, identity, mesh transform or category is changed.

## Evidence and commercial-use boundaries

Each group links its factual references in both displayed and exported lessons. Sources were consulted on 9 September 2026:

- **liver**: [Reference 1](https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/definition-facts), [Reference 2](https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/diagnosis).
- **pancreas**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/symptoms-causes).
- **stomach**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers), [Reference 2](https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/symptoms-causes).
- **small-intestine**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/abdominal-adhesions).
- **large-intestine**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis/definition-facts).
- **gallbladder**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/symptoms-causes).
- **kidneys**: [Reference 1](https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis).
- **spleen**: [Reference 1](https://www.nhs.uk/tests-and-treatments/spleen-problems-and-spleen-removal/).
- **adrenals**: [Reference 1](https://www.niddk.nih.gov/health-information/endocrine-diseases/adrenal-insufficiency-addisons-disease/definition-facts).
- **ureters**: [Reference 1](https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/symptoms-causes).
- **cystic-duct**: [Reference 1](https://www.nhs.uk/conditions/acute-cholecystitis/), [Reference 2](https://my.clevelandclinic.org/health/body/24523-bile-duct).
- **common-hepatic-duct**: [Reference 1](https://my.clevelandclinic.org/health/diseases/15796-biliary-stricture), [Reference 2](https://my.clevelandclinic.org/health/body/24523-bile-duct).
- **appendix**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/symptoms-causes), [Reference 2](https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/definition-facts).
- **ileocecal-junction**: [Reference 1](https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease/definition-facts), [Reference 2](https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease/diagnosis).

Only brief original factual synthesis and links are shipped. No publisher prose, diagram, clinical flowchart, scan, article file, procedure, treatment regimen or question bank is imported. Public access and citation are not asset licences. Existing original MIT code/text and BodyParts3D CC BY 4.0 credit/change obligations remain unchanged. No new dependency, model, texture, font, paid API or service is introduced. This is not systematic evidence review, legal clearance or clinical acceptance.

## Integrity and verification

The resolver accepts only the exact system/category/FMA/laterality/source-tree/ordered-source-files/primary-and-ordered-regions tuple and the Clinical/Pathology tabs. All coverage warnings survive. Returned arrays are detached. Runtime and export use the same current lesson.

The before capture is pinned to clean source `8a289acdb4b9e0818f0fcd6072be4d8779582367`. Its offline historical projection precedes thoracic organ history: 47 projections / 2,874 pinned section edits. The original baseline and all older captures remain fixed. Thoracic historical comparisons use the pre-abdominal milestone while current direct/export tests remain intact.

Run:

- `npm run abdominal-organ-clinical-curriculum:test -- --source`: 17,567 assertions, 135 official rendered-component checks and 33 negative copy/readiness cases, plus exact aggregate exclusions/ownership, paired sides, multi-region ordering and legacy-ID checks.
- Thoracic clinical, original organ and organ-anatomy curriculum tests; bowel-junction study checks; shared content-contract checks; requirements/export freshness.
- TypeScript, focused lint/format and production build before publication.

Source-index checks require the separately retained official index files in `work/bodyparts3d`. Reports under `docs/*validation.json` distinguish source/software checks from medical or browser acceptance.

Clinical and Pathology each now have **647 draft / 375 pending** body entries. Anatomy remains 1,020 draft / two identity-only; Function 1,018 draft / four pending; CT/MRI/US each 11 draft / 1,011 pending; Quiz 11 draft / 1,011 generated-identification. No foot-sesamoid, perineal-category or forniceal-commissure hold changes.

## Independent acceptance still required

Review the clinical wording, evidence applicability, warning language and true source extents with appropriate specialists. In particular:

- Cirrhosis/portal-pressure/functional distinctions; pancreatic disease mechanisms and non-specific symptom patterns.
- Gastric versus duodenal disease; partial/complete obstruction; diverticulosis versus diverticulitis.
- Gallbladder, cystic duct and common hepatic duct distinctions, variants and continuity.
- Renal filtration versus anatomy; adrenal versus kidney disease; urinary drainage and paired side identity.
- Splenic trauma urgency, variable appendicitis presentations and Crohn's context at an explicitly unvalidated ileocecal surface.
- Appendix selection scope versus the separately represented mesoappendix. The junction's cecal/ileal-wall aliases do not establish a complete cecum, functioning valve, histology or operative plane.

No lumen, internal tissue, bowel viability, stone, inflammation, disease stage, patient diagnosis, procedural route, physiological simulation or scan registration is validated by this change. Original imaging tabs remain pending where no scan teaching exists. Browser/device acceptance and clinical approval are not claimed.

Next: 55 remaining organ-system Clinical/Pathology entries (ten pelvic and 45 head/neck), then 89 connective and 227 vessel entries; richer reviewed quizzes, full-body editorial persistence and the user's future imaging module. GitHub upload remains deferred; private Sites publishing and a matching local backup are separate. The whole-atlas goal remains active.
