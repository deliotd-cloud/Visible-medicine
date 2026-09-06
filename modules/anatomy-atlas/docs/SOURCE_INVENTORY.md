# Full source inventory and third recovery milestone

This document records the 859-entry inventory milestone. The current 881-entry catalogue and its additional deep-brain admission evidence are described in [Deep brain](DEEP_BRAIN.md); `content/source-inventory.json` is regenerated against the current catalogue. Historical counts below describe this milestone, not the latest whole-body total.

## What changed

The atlas now contains **859 selectable source representations** in 66 body bundles, plus the separate unchanged nine-structure shoulder pilot. This milestone adds **36 entries in five new bundles (1,308,184 bytes)**. All 823 previously included entries retain every recorded field and all 61 prior body bundles retain their exact hashes. No source registration, shape, laterality or earlier public identity was changed. The additions use the same official BodyParts3D 4.0 archives and common coordinate transform.

| New anatomy | Entries | Where to study it |
| --- | ---: | --- |
| Selected axillary, scapular, thoraco-acromial and cervical-root vessel segments | 20 | Shoulder & arm → **Shoulder vascular detail** or **Scapular & axillary vessels**; thoracic context is also available |
| Selected internal-thoracic, musculophrenic and superior-epigastric arterial/chest-wall venous segments | 9 | Thorax → **Anterior chest-wall vessels**; selected abdominal context |
| Ciliary ganglia | 2 | Head & neck → **Ciliary ganglia** |
| Source-labelled main bronchial segments | 2 | Thorax → **Central airway window** or **Central airway source segments** |
| Cystic duct, source-labelled common hepatic duct and appendix | 3 | Abdomen → **Gallbladder & selected ducts** or **Appendix & large intestine** |

The dissection deck now has **88 stages and 66 focused views**. The arterial filter includes the newly admitted thyrocervical and costocervical trunks. Search, laterality/system filters, isolate/fade, cutaway, explode, saved views, practice and the future-imaging selection framework use the new entries through the existing shared catalogue. Saved views from a changed source scope remain disabled by the existing conservative version check; they are not silently migrated.

These additions are **unvalidated source anatomy**, not a clinical sign-off. The central-airway window is not bronchoscopy, the ducts do not establish a complete biliary tree, and ganglion surfaces do not add the connecting nerve routes. The dedicated shoulder pilot still has nine selectable structures; use the expanded shoulder/arm region for these extra vessels.

## Exhaustive reconciliation

`content/source-inventory.json` reconciles **every definition in both official v4 source indexes**: 4,273 tree-specific definitions, 3,432 distinct concept IDs and 3,492 archive entries. All archive entries have a source concept. Counts refer to source records, not distinct human anatomy or anatomical completeness.

The four exact official index tables are retained under `LICENSES/bodyparts3d-v4-index/`, with individual hashes, byte counts and URLs in the inventory. Their bytes were compared against the official endpoints on 6 September 2026. Both archive directories are enumerated with entry sizes/CRC values and a directory fingerprint. Candidate source retrieval verifies archive CRC/size; included sources also have SHA-256, exact geometry fingerprints and their catalogue ownership.

| Classification after this milestone | Tree-specific definitions | Meaning |
| --- | ---: | --- |
| Admitted | 1,243 | The source definition's geometry matches a selectable identity; the same identity may appear in both indexes |
| Admitted, other definition | 51 | That identity is present, but this source-tree definition differs from its displayed components or adapted aggregate |
| Represented, not separately selectable | 1,677 | All source geometry is already present, possibly inside an aggregate or under a different source label |
| Partly represented | 200 | Some component geometry is displayed and some is not |
| Unused, available | 1,084 | Archive entries exist but their geometry is not established as displayed; this is a candidate pool, not approval to import |
| Held for source review | 18 | Previously identified ambiguity or a new source-position concern |

Two easily confused forms of duplication are recorded separately: multiple concept labels can share one source definition, and matching geometry can occur in files with different byte hashes. We found the latter across the official IS-A/PART-OF archives. The geometry fingerprint ignores non-geometric OBJ headers, grouping names and the normals/UVs that the importer regenerates/discards, while preserving vertex coordinates, ordering, topology and face winding. It does not round coordinates to force a match. It is an **exact-match check, not a tolerant surface-overlap solver**; re-ordered or near-coincident alternatives still need investigation.

Unused entries not retrieved by this audit have `sha256: null` and `geometrySha256: null`; their availability is supported by archive metadata, not a claimed geometric inspection. Files that could match rendered geometry by source filename were retrieved and hashed across both archives before classifying coverage. An identical surface does not prove that every alias label is clinically correct.

## Admission and holds

`scripts/inventory-selections.mjs` pins each admitted concept ID, exact name, source tree and single component file. The 36 candidates had no source-file overlap or exact geometry match with the previously displayed anatomy, finite bounds and side-consistent centroids. These are reproducible engineering gates; they do not verify clinical attachment points, full course, endpoint continuity or proper anatomical segmentation.

**New hold:** source-labelled right/left superior epigastric veins, FMA4771/FMA4785 (FJ3615/FJ3530), span roughly 805–933 mm superiorly in the reference frame, substantially below the supplied superior-epigastric arterial context (roughly 1008–1175 mm). Their identity/extent needs expert adjudication. They were not admitted, renamed as inferior veins or moved to fit expectations. This discrepancy is a flag, not a diagnosis of source error.

Earlier pelvic-floor alternatives, optic-nerve alternatives, the unresolved FJ3211 disc level, the cord/canal alias and four original laterality quarantines remain held. A generic disc concept or intervertebral-symphysis alias does not justify assigning a radiological level. Consult [earlier gap adjudication](GAP_FILLING.md) and the held reasons in the inventory.

Before clinical release, review particularly:

- The source-labelled main bronchial boundaries and relative lengths; no normal clinical dimensions or validated lobar/segmental labels are asserted.
- The named common-hepatic and cystic duct extents/junctions; no continuous or complete biliary tree is certified.
- Ciliary ganglion identity, position and visibility at the intended learning scale; roots/short-ciliary routes remain absent.
- Vessel branches, endpoints, calibre, side and relationship to bones/muscles; no missing connection is drawn automatically.
- New dissection recipes, labels, camera framing, touch/keyboard accessibility and practice visibility on actual devices.

## Reproduction and evidence

1. `npm run inventory:audit` compares cached tables with the official bytes, enumerates both archives and regenerates the inventory plus exact index evidence. It fails on a changed official table or included source hash. `--offline-tables` skips only the table freshness comparison; archive checks still require the official service.
2. `node scripts/audit-inventory-additions.mjs` checks the explicit addition list against the pinned pre-inventory identity set and writes detailed bounds/source hashes to the external work directory.
3. `node scripts/ingest-full-body.mjs` reproduces the source-derived geometry. The five `*-inventory.glb` bundles keep the prior bundles intact.
4. `npm run inventory:test` uses committed table evidence and catalogue/mesh files without network access. The baseline fingerprints preserve all original entry fields and bundle hashes without needing old Git history. `scripts/capture-inventory-baseline.mjs` is a one-time provenance capture from the explicitly pinned pre-admission source commit; it refuses to replace a different existing baseline.
5. Run the existing full-body, recovery, gap, dissection, explode, inspection, study, imaging and review tests, then the production build and licence audit before publication.

Current results: 8,980 inventory assertions; 2,574 dissection and 6,336 camera checks; 429,601 explode pair checks; 1,039,819 inspection assertions; 16,946 saved-view assertions; 40,584 imaging-link assertions; 189 review checks. These are helper/source/numerical checks, not clinical or hands-on browser acceptance. New geometry adds 70,466 triangles; the whole-body total is 4,586,302, delivered lazily by region/system.

## Rights and references

The official source continues to specify CC BY 4.0. Its attribution and indication-of-change obligations are retained for meshes and the copied source-index subset; this is not a redistribution of an independently obtained full FMA ontology. No new library, font, texture, paid service or generated anatomical surface is introduced. The old licence comments inside archived OBJ files have not been used to override the archive's explicit updated grant. [Official database licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [official v4 data description and index links](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html).

The brief new teaching notes are original summaries, not copied tables or diagrams. Their factual references are [TTUHSC El Paso thoracic viscera](https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html), [head/neck nerves](https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html) and [liver/gallbladder anatomy](https://anatomy.ttuhscep.edu/schemes/liver_tables.html). No source illustration or protected teaching table is redistributed. Notes remain draft.

## Next work

Use the reconciled inventory to prioritise further same-version regional anatomy and safely separable detail already inside aggregates. Do not automatically import the 1,084 unused definitions. Continue to preserve holds, source registration and original IDs. Peripheral nerves/plexuses, complete spinal cord, major missing abdominal/back muscle coverage, capsules/labra/bursae, female/lymphatic anatomy, specialist content and patient imaging still require further evidence or external review. The ongoing goal remains active.
