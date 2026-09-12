# Original-source renal anatomy audit — 12 September 2026

The audited-reference plan called for evaluating kidney anatomy at its original source, without importing a fitted multi-source competitor model. The official HRA v1.10 female reference supplies genuinely separate source-labelled internal renal surfaces. This milestone retains and verifies them; it does **not** yet add a kidney workbench or any new visible anatomy.

## Evidence and rights

The already-cached original 374505632-byte GLB matches its pinned SHA-256. A fresh direct HTTPS request to the official metadata returned HTTP 200 and the exact cached metadata hash. Both the metadata and its raw-model description identify CC BY 4.0; model creators, release DOI, original crosswalk and full node metadata are retained. See [asset notice](../content/sources/hra-renal/NOTICE.md).

Selected only the original kidney/collecting-system groups and four renal vessels, not the brain or other separately sourced parts of the assembly. No competitor geometry or teaching content is copied. The [licence](https://creativecommons.org/licenses/by/4.0/) permits commercial reuse under its attribution and no-additional-restriction conditions. This is not clearance of unrelated privacy, trademark or other rights.

## What the source actually supplies

85 surface representations / 230104 original triangles:

- Paired capsules, hilum regions, outer cortices and renal-column groups.
- 21 source pyramids and 21 papillae (11 left, 10 right).
- 20 minor-calyx pieces (10 per side), seven major-calyx pieces (four left, three right), two renal pelves and two ureters.
- Two renal arterial and two renal venous groups.

These are source representations, not 85 unique anatomical concepts. All 85 embedded ontology IDs agree with their unique original crosswalk rows. Source-local letters are identifiers only: matching letters or nearest surfaces do not prove papilla–calyx correspondence. The left papilla/minor-calyx counts differ; no missing calyx is inferred or generated.

## Source-condition holds

| Source | Evidence | Handling |
| --- | --- | --- |
| Left outer cortex | Two duplicate/collapsed/degenerate faces, six nonmanifold edges, eight nonmanifold vertices, one inconsistent-winding edge, two components | Retain unchanged; no automatic repair/admission |
| Right renal columns | Three duplicate faces, two collapsed/degenerate faces, four nonmanifold edges/vertices and winding edges, four components | Retain all fragments; no replacement |
| Left renal vein | One nonmanifold vertex, four components including two tiny fragments | No joining, pruning or continuity claim |

The remaining **82 surfaces / 189794 triangles are candidates**, not an approved complete renal model. Left outer cortex, right renal columns and left venous coverage therefore cannot be declared complete. All source-condition holds stay separate from clinical judgements.

79 of the 85 sources have open boundary edges. Some collecting-system groups and the right vein have separate inner/outer shells. Across all candidate pairs, no exact shared source triangle was found. Sampled capsule/cortex and cortex/column distances distinguish the supplied surfaces but do not prove absence of self-intersection, complete tissue boundaries or anatomical accuracy. Diagnostic algebraic volumes are not clinical tissue volumes.

All source ancestry matrices are identity. Kidney capsules and internal source labels agree with the source's left/right X half-spaces. The right renal artery and left renal vein cross X=0; this is disclosed, not a reason to mirror or relabel them. The source frame remains separate from the existing body and patient imaging.

## Reproduction and preservation

- [Full audit](hra-renal-source-audit.json): original node indices, geometry attributes, topology, bounds and sampled surface comparisons.
- [Retained source manifest](../content/sources/hra-renal/retention.json): exact hashes, 85 node keys and three holds.
- 4286876-byte lossless source subset: all 230104 triangles and **1394004 accessor values** verified against the full original audit, including indices and every attribute. No source geometry is modified.

Offline retained-subset verification:

    node scripts/retain-hra-renal-source.mjs --check

Full original-source audit, using the original release cache or an explicitly supplied original-source directory:

    node scripts/audit-hra-renal-original.mjs --check

The bootstrap flag --retain-source creates new files exclusively; do not use it to overwrite the retained evidence. Source fidelity checks are not render/device or clinical acceptance.

## Next implementation

Build a separate, source-bound renal dissection from the accepted subset after reviewing the remaining representation/extent questions. Reuse the current compact specimen workbench: side-specific studies, tissue-group hiding, isolate/fade, separation, cutaway, Undo/Redo, search and labels. Keep renal capsule, cortical regions, pyramids/papillae and collecting groups distinct; exclude the three held originals and make asymmetric coverage explicit.

Use source-local keys plus the supplied UBERON identifiers; do not invent FMA mappings or equate a shared ontology ID to a registered CT/MRI structure. Source-set identification practice must not infer drainage correspondences. The owner/radiologist retains clinical sign-off; actual-device review and authorized acquired-imaging integration remain separate gates.
