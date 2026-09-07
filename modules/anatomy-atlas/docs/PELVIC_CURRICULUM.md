# Pelvic teaching and source-category clarification

## Scope

Three existing entries receive six explicit topic edits: four basic Anatomy/Function drafts for left/right coccygeus, one Anatomy source-category explanation for FMA19728, and one **still-pending** Function clarification. Five new drafts, not six completed topics. No UI growth, mesh, dependency, scan, patient data or approval is added.

Body totals at this milestone: Anatomy 410 draft / 612 identity-only; Function 465 draft / 146 identity-only / 411 pending. FMA19728 remains the pending Function entry among represented pelvic muscles. This is not complete pelvic musculature or clinical knowledge.

## Source evidence

Official BodyParts3D v4 `isa_element_parts.txt` maps FMA46444 to FJ1449M/FJ2542 and FMA46443 to FJ2547. Two files do not prove two muscle heads or distinct layers; topology/duplicate adjudication is not claimed.

FMA19728 (superficial perineal muscle) maps to FJ1450/FJ1450M/FJ2543/FJ2548. Those same four files map to FMA21930 (external anal sphincter) in both IS-A and PART-OF indexes. The panel explains this narrower mapping without substituting superficial-transverse-perineal attachments/actions, declaring a complete superficial pouch, identifying sphincter layers, or admitting a duplicate FMA21930 mesh. Actual component identity and any overlapping alternatives require adjudication before specific function is assigned.

The stable FMA19728 atlas ID still contains `thigh`; its corrected regional membership remains `pelvis`. Meshes, source labels, transforms, fingerprints and all pre-existing pelvic source holds remain unchanged.

## References and rights

Factual pages checked 7 September 2026: [pelvis anatomy](https://www.ncbi.nlm.nih.gov/books/NBK482258/), [coccygeus](https://www.kenhub.com/en/library/anatomy/coccygeus-muscle), and [Texas Tech pelvic wall table](https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html). Brief original notes cover typical attachments, support and anterior coccygeal movement, not measured footprints. Cited motor-root descriptions differ (S4–S5 versus S3–S4); the lesson states lower sacral anterior rami and flags precise segments for review, not exam use.

No reference prose, tables or illustrations are redistributed. StatPearls NC-ND terms are not used as a commercial asset licence; Kenhub/Texas Tech retain copyrights. Original teaching/code retain existing MIT terms. [BodyParts3D / DBCLS](https://lifesciencedb.jp/bp3d/?lng=en) meshes and index-derived evidence retain existing CC BY 4.0 attribution/change obligations; see [notices](../LICENSES/THIRD_PARTY_NOTICES.md).

## Checks and next work

`npm run pelvic-curriculum:test` checks actual routing/export, pending status, component identities, guards, detached arrays and unrelated-copy preservation. Add `-- --source` with the official work cache to reproduce five index-membership checks; no download occurs. Seven pinned transitions preserve the original copy/recipe baseline. Earlier reports retain historical readiness counts.

Specialist gates: coccygeus attachment/innervation wording, actual component surfaces, and FMA19728 identity before Function authoring. Continue bounded head/neck and trunk basic teaching, then clinical/pathology and modality-specific material with citations and separate acceptance. Existing source, clinical, imaging and device gates remain open.
