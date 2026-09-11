# Superficial elbow and forearm veins

Four original BodyParts3D v4 IS-A source selections are added, not generated tubes or competitor mesh copies:

| Selection | Official source | Original triangles |
| --- | --- | ---: |
| Right median cubital vein, FMA22964 | FJ2287 | 2,502 |
| Left median cubital vein, FMA22965 | FJ2235 | 2,502 |
| Right median antebrachial vein, FMA22968 | FJ2286 | 5,386 |
| Left median antebrachial vein, FMA22969 | FJ2234 | 5,314 |

In **Forearm**, **Shoulder & arm** or **Whole body**, search for either vein, choose a side and select **Venous drainage**. The existing panel offers adjacent source selections, reversible isolation with bones and source-bound cross-region links. Normal rotation, labels, fading, cuts, hide/Undo/Redo and separation remain available without a new permanent toolbar. At 0% separation the original spatial relationships are retained. Skin, all cutaneous nerves, valves, a patent lumen and a safe needle path are not provided.

The systemic map now contains 51 selections in 28 groups and 57 typical relationships. Eight new side-specific relationships are explicitly variable. Median antebrachial-to-basilic and median antebrachial-to-median-cubital links represent **alternative possible terminations**, not simultaneous outlets demonstrated in this donor. Cephalic-to-axillary drainage is retained. Neighbouring surface proximity is not proof of a junction or flow direction.

## Source and geometry evidence

Official archive directory, CRC and size were verified on retrieval. `scripts/cubital-vein-sources.mjs` pins names, complete concept membership, sides and SHA-256 hashes. Original bytes are retained in `content/sources/cubital-veins`; `docs/cubital-vein-source-audit.json` records checks against the 1,042 prior display records and 128 nearby/shape comparisons. No shared original triangles or suspicious translated duplicate was detected by those bounded comparisons. Each new source is one closed oriented combinatorial component without detected degenerate faces or non-manifold edges/vertices. These checks do **not** prove absence of self-intersection, anatomical fidelity or independently acquired bilateral anatomy.

All **15,704 ordered faces** and their winding survive the established source-to-scene transform, exact-coordinate indexing for normals and Float32 GLB storage. No smoothing, cropping, relabelling, mirrored counterpart, fitted bridge or artificial connection is introduced. The 287,992-byte bundle SHA-256 is `8e31545af2568c7f31a327ccbefa0a85cb054a422e1091fd06676b2b39127321`. Every decoded face corner is independently compared with its original source. The archived 1,022-record catalogue remains byte-identical; the display now contains 1,046 selections.

Anatomy, Function and a self-check are original, source-bound drafts informed by [UAMS upper-limb venous anatomy](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/). Clinical, Pathology, CT, MRI, X-ray and Ultrasound remain explicitly pending. No university table, image or text passage is redistributed.

## Verification and clinical review

Run `node scripts/audit-cubital-veins.mjs --check`, `node scripts/export-cubital-veins.mjs --check`, `node scripts/validate-cubital-veins.mjs` and `npm run systemic-venous:test`. Tests cover original face preservation, exact source/frame/bundle admission, rejected altered or missing records, surface-anchored labels, side-filtered deep links, dissection hide/Undo and reciprocal same-side relationships. Previous source records and historical venous admissions remain intact.

Radiologist review is still needed for shape, course, neighbouring structures and teaching content. Source symmetry is not evidence of population variation. Browser/GPU/mobile testing, venous physiology, procedural safety and patient registration are not established by these code checks. No CT-head export or paid teaching material was imported.

## Rights

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Original and derived anatomy remain CC BY 4.0 with attribution and documented modifications; see [official terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). New code and original brief teaching use the project's MIT licence. No dependency, font, texture, paid service or mandatory fee was added. Other independently licensed specimens retain their separate terms.
