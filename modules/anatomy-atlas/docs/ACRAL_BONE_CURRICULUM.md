# Hand and foot bone teaching

8 September 2026: 212 cited Anatomy/Function drafts for 106 existing individual bone entries through 53 paired definitions. Helpers retain digit, segment and joint distinctions rather than supplying one generic paragraph for every bone. No new controls, geometry, assets or dependencies.

## Identity, scope and holds

The 54 hand entries cover eight carpals, five metacarpals and fourteen phalanges on each side. The 52 individual foot entries cover seven tarsals, five metatarsals and fourteen phalanges on each side. Every selected entry has one source component. Pre-edit FMA/file/name/side observations are pinned in the validator and checked against the cached official BodyParts3D v4 ISA index. No identity is calculated by incrementing an FMA number: nonconsecutive identifiers such as right trapezoid FMA23725 and the little-toe middle phalanges remain explicit.

Runtime dispatch requires exact FMA, laterality, system, bone category and primary/secondary region. The validator separately checks source names against digit and segment metadata, all 20 metacarpal/metatarsal entries, and the absence of a middle phalanx in digit 1. Thumb/great-toe IP joints are not labelled PIP/DIP. Individual carpal/tarsal connections and the principal metatarsal-base articulations are distinguished. Side/digit identity does not depend on screen position.

Two foot-sesamoid selections remain unchanged and unresolved: FMA45097 groups FJ3372/FJ3376 on the right, and FMA45098 groups FJ3266/FJ3270 on the left. The ISA index identifies each only as a side-specific foot-sesamoid group; the consulted PART-OF index contains no rows for those four files. This does not establish which component is a tibial/fibular hallux sesamoid, a developmental part or another variant. No component identity is invented from the usual first-ray arrangement. Their Anatomy remains identity-only and Function pending. Tests explicitly reject accidental readiness promotion, including changes that would not alter displayed text.

The pre-existing pelvic-muscle FMA19728 and fornical FMA61970 Function holds also remain pending. Source geometry, attachments and classifications are not changed.

## Evidence and rights

Bounded factual sections were consulted on 8 September 2026:

- [Carpal bones](https://www.ncbi.nlm.nih.gov/books/NBK535382/): row relationships and selected bony connections.
- [Hand bones](https://www.ncbi.nlm.nih.gov/books/NBK547684/): metacarpal articulations and ray numbering.
- [Arm framework](https://www.ncbi.nlm.nih.gov/books/NBK507841/): hand phalangeal organisation and interphalangeal joints.
- [Flexor carpi ulnaris](https://www.ncbi.nlm.nih.gov/books/NBK526051/): pisiform and distal ligamentous linkage.
- [Foot and ankle](https://www.ncbi.nlm.nih.gov/books/NBK546698/): tarsal relationships and midfoot organisation.
- [Metatarsals](https://www.ncbi.nlm.nih.gov/books/NBK549872/): numbered rays and principal proximal articulations.
- [Foot joints](https://www.ncbi.nlm.nih.gov/books/NBK536941/): phalangeal joints, hindfoot connections and mechanical context.
- [Talus](https://www.ncbi.nlm.nih.gov/books/NBK541086/): leg/foot load transfer and lack of direct muscular attachment.

References are not assumed error-free. Unrelated embryological, vascular and fixed-loading statements were not adopted. The ankle is not relabelled as a syndesmotic joint; arch movement is not treated as an absolute locked/unlocked switch; usual sesamoid arrangements do not certify these source components. No imaging appearance, fracture diagnosis, procedural corridor or developmental age is inferred from a surface.

Brief original factual teaching only; no publisher prose, figures, diagrams, photographs, scans, tables or datasets imported. Copyright/NC-ND reference terms are not a commercial asset grant. Original application code/text retain MIT terms; separate DBCLS BodyParts3D CC BY 4.0 attribution/change obligations remain. No new paid API, model, font, texture or private data. Citations imply neither endorsement nor clinical approval.

## Verification and next work

`npm run acral-bone-curriculum:test -- --source` checks 106 source memberships, exact dispatch, digit/segment mappings, returned-array isolation, retained coverage notes, current display/export parity and 12 rejection cases. The full content contract verifies all 87 GLBs and preservation of unrelated content/recipes. Twenty-one offline projections now preserve 1,246 pinned topic edits against the original immutable baseline. Limb and earlier report counts are historical; actual display/export remain current.

Current body totals: Anatomy 816 draft/206 identity-only; Function 872 draft/146 identity-only/four pending. Four pending records do not mean only four incomplete lessons: 146 Function entries still have generic identity-only content and most CT/MRI/Ultrasound/Pathology/Clinical and authored Quiz sections remain pending. Draft teaching, source membership and automated checks are not clinical or device acceptance.

Next: audit the remaining identity-only Anatomy/Function records, then expand source-linked vessel/nerve relationships and clinical/modality teaching in existing panels. Qualified review is still needed for facets, attachments, tissue relationships, the sesamoid component groups and all previously held anatomy. Real images and patient registration require independent data and validation. Local saves are not remote backup or publication.
