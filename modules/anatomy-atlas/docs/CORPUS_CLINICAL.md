# Corpus spongiosum Clinical / Pathology drafts

## Scope

The existing FMA19617 corpus-spongiosum bulb/shaft selection now has concise Clinical and Pathology drafts in the existing note panel. The Clinical draft relates the ventral erectile column to the separately selectable urethra and flags post-trauma symptoms that warrant clinical assessment. The Pathology draft introduces bulbar/anterior urethral injury, adjacent spongiosal involvement and possible later scar-related narrowing while distinguishing posterior pelvic-fracture injury.

This change adds no geometry, scan, diagnosis, injury grade, procedure, catheter instruction or treatment recommendation. The supplied surface does not independently represent the glans, paired corpora cavernosa, urethral lumen, tunical layers or neurovascular supply and cannot establish injury, calibre, patency or function. CT, MRI, X-ray and Ultrasound remain pending; their fallback wording now refers only to imaging rather than incorrectly saying that the new Clinical and Pathology teaching is also pending.

## Sources and reuse boundary

- [NCI SEER Training Modules: Penis](https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html) supports the short anatomical distinction between the urethra-associated ventral column, paired cavernous bodies and distal glans. No NCI diagram or logo is imported.
- Patel AB et al., *Urethral Injuries: Diagnostic and Management Strategies for Critical Care and Trauma Clinicians*, J Clin Med 2023;12:1495, [DOI](https://doi.org/10.3390/jcm12041495), supports the limited anterior-trauma and later-narrowing context. The draft is an original adapted summary under the article's [CC BY 4.0 licence](https://creativecommons.org/licenses/by/4.0/); no figure, table, patient image or treatment algorithm is imported.

These article-specific decisions do not establish project-wide clinical or commercial clearance.

## Immutable transition and checks

The pre-edit pin binds the complete canonical FMA19617 identity, source component, bundle, six prior topic payloads and the full body/shoulder/recipe snapshot at source `c1fa092997ba87e71f082af393aa8944e4e9afdb`. A separate transition records two pending-to-draft changes and four pending imaging-copy corrections. Accepted earlier pins and transitions are unchanged.

Focused validation verifies the exact before/after hashes, all-before/all-after/mixed/drift history states, canonical identity/source/topic rejection, 1,102 current body-schema records, two actual React note renders, six changed placements and 9,912 unchanged placements. The machine-readable report is `docs/corpus-clinical-validation.json`.

These are source, contract and server-render checks. They are not radiologist sign-off, physical-device acceptance or publication evidence. Review remains revision-bound; Atlas, case and paid-lecture access remain independent. Authenticated corpus-spongiosum model staging is still required before a generated website module can be activated.
