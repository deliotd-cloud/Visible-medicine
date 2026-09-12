# Original-source subscapular arteries

In **Shoulder & arm**, **Thorax** or **Whole body**, search **subscapular artery** and choose a side. Both source selections now use the existing selection, labels, search, removal/Undo/Redo, clipping, separation and vessel-type controls. No extra panel or toolbar was added. The dedicated nine-structure shoulder pilot is unchanged; this extension belongs to the regional/whole-body atlas.

The existing **Arterial connections** panel now routes the selected subscapular reference to its same-side axillary parent and circumflex scapular/thoracodorsal branches. **Show available connections & bones** provides one reversible local view. It replaces the old “via unmodelled subscapular” shortcuts without claiming physical connections between source meshes. Introductory Anatomy/Function/self-check drafts use the [UAMS upper-limb artery reference](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/); no table, figure or article text is redistributed. Clinical/pathology/imaging sections remain pending.

## Identity and source geometry

| Source definition | Original | Triangles | SHA256 |
| --- | --- | ---: | --- |
| FMA22678 · right subscapular artery | FJ2298 | 786 | 41050856a7c2cbb79984a78346a0e3dc13e271758a04012f2283fee2182a2f29 |
| FMA22679 · left subscapular artery | FJ2246 | 790 | 4dc93c063b9d87ab85699bfeb9f856cb39faf12d2859b0e4184ba64de6c9ef87 |

Original archive: `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip`. The official archive reader verified directory entries, CRC and sizes. Originals remain in `content/sources/subscapular-arteries`. Complete IS-A definitions each contain one source file; PART-OF definitions contain three files and include separately represented branches. Those broader aggregates are deliberately not admitted as duplicate tissue.

The [source audit](subscapular-artery-source-audit.json) screens all 1,078 prior root envelopes and 42 bounded nearby/shape comparisons. Both candidates have one closed-oriented combinatorial component, expected source laterality, zero duplicate/degenerate faces, no prior exact source owner and no detected shared source triangles or translated-duplicate signature against screened references. Very close branch surfaces are retained, not snapped together. These checks do not establish self-intersection freedom, a continuous lumen, donor junctions, perfusion or clinical validity.

The 31,116-byte GLB SHA256 is `6e7ccebe78f6a8c89b556e5e1256d755801725590c4625bebd3fecd6d93f04b3`. Export retains all ordered source face corners and winding with the established transform, exact-coordinate indexing for normals and Float32 storage. No fitting, smoothing, mirroring, bridging or face deletion. Atomic whole-record admission binds the six existing parent/branch context identities and their bundles. Previous meshes, source IDs and 52 original upper-artery pins remain unchanged. The expanded upper-limb/neck graph contains 56 source artery selections, 28 concepts and 60 same-side relationships; other regions remain independently guarded.

## Checks, rights and remaining review

`npm run subscapular-arteries:test` checks replayable source evidence, known-hold rejection, deterministic export, exact ordered geometry, source-vertex anchors, laterality, 12 side-valid study links, 73 changed-source rejection cases, typical parent/branches, reversible removal, and absence of patient-frame claims. `npm run arterial-connections:test` exercises both regional graph families, reciprocal links, actual component rendering, actual parent callbacks, source rejection and exact existing-topic preservation.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. [Official terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) were rechecked 12 September 2026; attribution and adaptations are recorded in the notices. No competitor model, new dependency, font, texture, paid service or acquired image is included. The separate HRA/UM/legacy specimen terms are unchanged.

Radiologist review must assess identity/course/extent, the close parent/branch surfaces, anatomical variants, dissection usefulness and draft teaching. This is not a complete scapular collateral network or registered CT/angiography. Device/GPU/browser acceptance and source/teaching clinical sign-off remain distinct from automated checks; no review approval is created or carried forward by admission. Runtime publication remains a separate delivery gate.
