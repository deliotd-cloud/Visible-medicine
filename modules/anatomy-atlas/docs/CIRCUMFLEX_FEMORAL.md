# Descending lateral circumflex femoral branches

In **Thigh**, **Leg** or **Whole body**, search **descending branch** and select a side. The two original source surfaces use the existing labels, selection, fade/isolation, removal, Undo/Redo, separation, clipping, study links and vessel controls. No new toolbar or permanent panel.

## Grouped parent, separate branch

The source audit found that all 1,110 right and 1,102 left lateral circumflex femoral parent triangles are already contained in the respective deep-femoral source aggregates. They are not missing tissue and must not be duplicated as overlapping root meshes. These parents are not yet individually selectable. Their two descending branches are distinct source surfaces without detected shared triangles or translated-duplicate signatures against the screened root references.

The existing **Arterial connections** panel uses **Via grouped parent**, distinct from both **Branch** and **Via unmodelled segment**. The link points to the same-side deep-femoral aggregate through its contained lateral circumflex component; it does not imply that the descending branch arises directly from the deep femoral artery. The existing context action is reversible in one step. Typical anatomy and source grouping remain separate from verified donor junctions.

All 1,080 previous root records, the 1,022-record archive, original artery pins and previous model files remain unchanged. There are now 1,082 root selections. The lower arterial graph has 41 artery selections, 21 concepts and 42 same-side relationships; upper arterial navigation remains unchanged.

## Source identity and reproducibility

| Definition | Original IS-A file | Triangles | SHA256 |
| --- | --- | ---: | --- |
| FMA21422 · right descending branch | FJ2057 | 5234 | b9a4618409103711ee922dac578f542734951f4bc65fa1368b12bdec331bc930 |
| FMA21423 · left descending branch | FJ2063 | 5230 | 095e3e9d4ef41d5b56b165998622bf54ca7998dc123ca09cf1c14a0a48b414fb |

Original archive: `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip`. Directory, size and CRC were checked during retrieval. Export retains each ordered face corner and winding, using the existing source-to-scene transform, exact-coordinate indexing for normals and Float32 storage. No smoothing, fitting, mirroring, bridging or face deletion. Originals are retained under `content/sources/circumflex-femoral`; their trailing whitespace is intentionally unchanged.

GLB: 191,180 bytes, SHA256 `265bddde64b37086b7f953515b1fd0a24543b0c9b210adc6e3837b22dc9bae69`. Atomic source admission binds six existing context records and their bundles. The [four-definition audit](circumflex-femoral-source-audit.json) contains 1,080 root-envelope screens and 104 bounded comparisons, with source hashes and the exact existing-parent overlap findings. A complete source definition is not a complete anatomical artery or clinical validation.

`npm run circumflex-femoral:test` replays audit/export and checks all original face corners, 76 changed-source rejection cases, all prior root-record hashes, 12 side-valid study links, grouped-parent semantics, draft/pending content, reversible removal and absence of patient-frame claims. Audit replay requires the original BP3D table/OBJ cache populated through `scripts/bodyparts-archive.mjs`; do not substitute another release. `npm run arterial-connections:test` exercises both graph families, actual rendered labels, reciprocity, context plans, source rejection and parent callbacks. The preceding subscapular audit retains its original scope; this new audit screens the added branches against that earlier addition as well.

## Rights and review

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. [Official licence terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) were rechecked 12 September 2026. Credit and adaptations are in the notices. Short original teaching drafts cite the [UAMS lower-limb artery reference](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/); no table, illustration or article text is redistributed. No new dependency, font, texture, competitor model, paid API or acquired scan.

The owner radiologist must review identities, course/extent, the grouped-parent presentation, variants and draft teaching. Clinical, pathology and acquired-imaging sections remain pending. This is not complete runoff, a continuous lumen, a registered image overlay or a validated collateral network. The retained BP3D tables did not supply separate fibular-artery/tibioperoneal-trunk definitions in this check; other sources may differ.

Further work: source-preserving partition of both deep-femoral aggregates to make the lateral circumflex parents independently selectable, with explicit review/teaching/coordinate migrations and no overlapping tissue. Do not relabel the aggregate as a standalone parent or bypass its current identity checks. Browser/GPU/device acceptance and runtime publication remain separate gates.
