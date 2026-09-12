# Audited-source implementation — 11 September 2026

Latest evidence follow-up, 12 September: original IS-A and PART-OF files FJ1662,
FJ1663 and FJ1692 have matching ordered vertex coordinates and face indices.
Their byte hashes differ, so file identity, normals/materials, anatomical naming
and clinical validity are not inferred. The source-binding audit now verifies
all 1,788 currently referenced root file IDs; no unresolved root equivalence
entries remain. All 54 source holds and 366 review-queue pieces remain unchanged.
No geometry was added, repaired or clinically approved. See [review/source
evidence](REVIEW_EVIDENCE_HISTORY.md) and the replayable cross-tree audit.

Preceding checkpoint, 12 September: [elbow collateral/recurrent arteries](ELBOW_ARTERIES.md)
add 14 original selections. Regeneration also incorporates preceding cranial
work that the prior ledger had not captured: 1,101 root selections, 104 nested
selections, 1,788 referenced source IDs, 446 root-only differences and 366 pieces
needing review. Three older right-MCA PART-OF files initially had unverified
cross-tree equivalence; the evidence follow-up above resolves that question. All 54 source
holds remain. These are source-file counts, not anatomical completeness.

Current checkpoint, 12 September: [descending lateral circumflex branches](CIRCUMFLEX_FEMORAL.md) add original FJ2057/FJ2063. The ledger now has 1,082 root selections and 1,743 reference source IDs; 491 root-only differences remain (24 nested, 54 holds, one display correction, one cross-tree hold and 411 needing review). Two parent surfaces are already contained in existing aggregates and are not duplicated. Older counts below are historical; these source-file counts do not measure anatomical completeness.

Current checkpoint, 12 September: [subscapular arteries](SUBSCAPULAR_ARTERIES.md) add original FJ2298/FJ2246. The regenerated ledger now has 1,080 root selections representing 1,741 reference source IDs; 493 root-only differences remain (24 reachable nested, 54 source holds, one display correction, one cross-tree hold and 413 needing review). These are source-file counts, not missing-structure or completion percentages. Earlier milestone counts below are historical; the machine-readable ledger is authoritative.

Update 12 September: [original-source HRA female pelvis](HRA_FEMALE_PELVIS.md) now implements the first independent female regional module (41 selections; six held groups). This does not affect the male source-ID ledger below, nor establish a complete female body. Original official metadata and per-asset notices are retained; no mixed-donor competitor assembly is imported.

This ledger began with the repository comparison and label-computation improvement. The [cubital-vein addition](CUBITAL_VEINS.md) adds four original superficial vessel selections with compact same-side navigation. The preceding [inferior-brachia addition](COLLICULAR_BRACHIA.md) adds two source references and withholds two superior candidates for contradictory laterality. It does not bulk-admit external models or claim anatomical completeness. The broader improvement goal remains active.

## Coverage result

The latest [genicular addition and current source gate](GENICULAR_ARTERIES.md) add ten original knee artery groups and consolidate the five calf-vein files previously held only in their separate audit. Passing the gate is not admission or clinical approval; the original inventory policy and historical reports stay unchanged.

The [inferior thyroid addition](INFERIOR_THYROID_ARTERIES.md) adds two further source files. Four separately inspected muscle-part files remain in the review queue; no cleanup, admission or new formal hold has been inferred from their fragment/duplicate-face findings.

The [deferent-duct addition](DEFERENT_DUCTS.md) adds two original files and a source-bound male-pelvis study without generated connections.

The [inferior epigastric addition](INFERIOR_EPIGASTRIC_VESSELS.md) supplies four original vessel definitions and one focused abdominal-wall study. The pinned male reference supplies 2,234 IS-A source file IDs. The current 1,064 root selections represent 1,724 of those IDs. The other **510 source pieces** resolve as follows:

| Disposition | Source pieces |
| --- | ---: |
| Already represented by reachable nested selections | 24 |
| Deliberate IS-A source holds | 50 |
| Excluded by the existing pancreatic display correction | 1 |
| Related unresolved PART-OF disc hold | 1 |
| Need source and anatomical review | 434 |

The 434-piece queue contains 265 arterial and 127 venous pieces according to the reference's display groups. These groups are not an authoritative anatomy taxonomy: for example, its cardiac group includes an interventricular-foramen entry. No external grouping changes our learner-facing systems.

This is source-file coverage, not a count of missing anatomical structures. It cannot establish whether a whole named structure, alternative envelope, branch, side or layer is complete. Independent CC0 limb and older abdominal-wall specimens remain distinct donors/releases; their conceptual equivalents are not counted as identical v4 files.

## Evidence and reproducibility

- [Machine-readable coverage ledger](reference-coverage-audit.json): every root-only difference, smallest official source definitions, actual owners, holds and source evidence. All rows explicitly have `admissionApproved: false`.
- [Cross-tree proof](reference-cross-tree-audit.json): FJ3481, FJ3581, FJ3582 and FJ3584 have different IS-A/PART-OF bytes but identical canonical ordered vertex/face fingerprints. Matching the retained runtime source hash allows these four already-represented renal-study pieces to count as covered. Names or filenames alone would not suffice.
- `content/prototypes/reference-cross-tree` preserves eight unchanged official originals as audit evidence only. They are not imported by the application or added to its runtime model collection. Original archive-directory and source hashes are retained.
- `content/reference-male-inventory.json` contains only the pinned reference's ID/display-group pairs. No competitor geometry, shader implementation or explanatory teaching text is copied.

Reference: [ashemag/human-atlas](https://github.com/ashemag/human-atlas/tree/1c38bf35c254a891200d3cedecfd57abebe83d8d), commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`. Raw `public/models/atlas.json` SHA-256: `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee`.

Run from the project root:

```sh
node scripts/audit-reference-cross-tree.mjs --check
node scripts/audit-reference-coverage.mjs --check
node scripts/validate-reference-coverage.mjs
node scripts/validate-label-work.mjs
```

The checks are offline. Add `--verify-reference` to the coverage audit to compare against the pinned public manifest through GitHub CLI. Omitting `--check` regenerates the relevant report; cross-tree generation obtains the official originals through the existing archive reader. Never treat a successful check as permission to admit or clinically approve geometry.

## Implemented label-work reduction

The shared body/region renderer previously resolved close-up anchors for every item, including when labels were suppressed. It now resolves only the existing selected/landmark label IDs and skips resolution entirely when labels are off or exam mode is active. The existing eight-label cap, selected priority, source-vertex anchor algorithm, screen-side layout, clipping, opacity and dissection logic remain unchanged.

The deterministic test supplies 1,042 candidates and observes eight resolver calls; focus yields one and disabled labels yield zero. These are operation counts, not FPS, GPU or browser timing results. No mesh simplification, coordinate change, UI panel or dependency is introduced. This is a small first optimization, not the proposed batched renderer.

## Authorized next implementation sequence

The [first opaque batching implementation](BODY_BATCHING.md) now preserves exact geometry and per-structure picking in large views. Its checked-in CPU submission model is not GPU/browser acceptance. Continue device measurement, memory evaluation and material parity testing before claiming a frame-rate improvement; this does not replace source/detail work below.

1. **Review and add useful source anatomy in bounded regional batches.** Prioritize vessel/neural and joint relationships rather than further oral detail. For each candidate, check original licence, complete concept membership, alias/overlap, laterality, spatial extent and mesh defects; preserve originals and disclose incomplete groups. Source pieces already represented or held are not automatically admitted. Route accepted revisions to the user's radiologist review.
2. **Measure and improve whole-body rendering.** Establish repeatable regional/full-body baselines, then batch compatible stable meshes while preserving per-structure identity, picking, cuts, opacity, labels and all separation modes. Keep original detail for regional review. Evaluate an explicitly labelled overview LOD only after evidence shows it is needed. Browser/GPU/mobile acceptance is outstanding; this background continuation did not perform browser QA.
3. **Evaluate separate female, brain and renal modules at their original sources.** The [slorksmo reference](https://github.com/slorksmo/Human-Atlas/blob/5bb5713aab18d7fe9380c3339eb09f173491ea06/public/ATTRIBUTION.md) describes mixed source subjects and fitted additions. Do not import that assembly as one coherent female body. Verify original releases, licences, donor frames and transformations before each module; do not imply registration to the current body.
4. **Connect authorized CT-head imaging.** The optional [decoded-volume renderer](VOLUME_VIEWER.md) is implemented but not installed by default. Obtain a publication-authorized export and reviewed versioned anatomical crosswalk, check orientation/windowing independently, then test true same-study spatial registration and synchronized planes. The provisional CT-head export remains not for publication and untouched. MRI needs its own clearance. Neither a shared name nor a side-by-side view establishes registration.
5. **Continue imaging/clinical teaching and compact navigation.** Use high-value regional batches, the existing inspector and collapsed subfilters rather than more permanent switches. Keep atlas, imaging and separately paid lectures independently authorized. Production authentication/billing is not supplied by the policy helpers. Translation, if later added, must not silently present unreviewed medical names as approved.

User approval is revision- and scope-specific. Source licensing, hashes, tests and this comparison do not constitute clinical sign-off. No patient images, generated substitute anatomy, paid runtime or mandatory new service is included. Existing hosting capacity/terms still apply.

## Rights

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. The eight official OBJ originals are unchanged, audit-only copies; the compact ID extraction and generated reports are documented transformations of metadata. [Official source terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md) and [ashemag MIT notice](../LICENSES/ASHEMAG_HUMAN_ATLAS_MIT.txt) are retained. Existing v3 ShareAlike and CC0 specimen terms remain separate.
