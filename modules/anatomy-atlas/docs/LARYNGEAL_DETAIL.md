# Laryngeal and pharyngeal dissection — 6 September 2026

The atlas has **1,018 selectable source representations / 85 body bundles / 96,578,816 body-model bytes**, across eleven regions and the whole body. There are 135 stages (47 layer steps and 88 independent windows) and 117 focuses. The library combines 205 window/focus choices into 159 cards, with 46 equivalent pairs. The dedicated shoulder remains unchanged. These are source/display counts, not anatomical completeness.

## Open and study

Open **Head & neck → Study windows & focuses**, then search for a view:

| View | Targets | Context | Both sides / one side |
| --- | --- | --- | --- |
| Thyrohyoid membranes & suspension | Two membrane sources | Hyoid, thyroid cartilage and three thyrohyoid ligaments | 7 / 5 |
| Vocal ligaments & vocalis | Four ligament/muscle sources | Arytenoid, cricoid and thyroid cartilages | 8 / 5 |
| Posterior laryngeal muscle subset | Seven selected intrinsic muscle sources | Cricoid and arytenoid cartilages | 10 / 6 |
| Pharyngeal muscles exposed | Ten superior/inferior constrictor and longitudinal muscle sources | Hyoid and thyroid cartilage | 12 / 7 |

Use the common shoulder-style controls: select/frame, isolate/fade, remove/restore/Undo, change side, separate and return to assembled anatomy. The guide identifies expected, omitted and extra entries and unavailable source groups. Target-only practice excludes context; naming still requires enough distinct eligible targets. Study links and local saved views remain supported. These are independent visibility recipes, not operative sequences or physical tissue cutting.

## Admission and preservation

Only **FMA55133 / FJ2804 (right thyrohyoid membrane)** and **FMA55134 / FJ2786 (left)** are admitted from eight audited candidates. Each retains its exact BodyParts3D 4.0 ISA definition, original coordinates, source hash, stable identity and unvalidated status. They belong to Connective tissue, category membrane.

The additive `head-neck-connective-laryngeal-detail.glb` is 178,112 bytes, SHA-256 `a4788313cc86677900a528208e8ac7045f07bee300ea17073386bf0c12c83de4`, with 9,768 triangles and 4,884 exported vertices. All preceding **1,016 full records and 84 bundle hashes** remain exact. No old geometry, transform, exclusion or dedicated-shoulder source changes. The complete body model has 4,946,320 triangles and 2,478,722 exported vertices.

## Six source holds, not automatic repairs

| Candidate pair | Evidence and decision |
| --- | --- |
| Conus elasticus, FMA55251/55252 | Right: two degenerate faces. Left: 52 opposite-side vertices in 18 tiny faces, approximately 0.007293 mm² combined area. Paired topology, extent and vocal-layer boundary treatment need adjudication. |
| Aryepiglotticus, FMA46604/46605 | Right: three degenerate faces and 108 opposite-side vertices in 36 tiny faces, approximately 0.003457 mm² combined area. Left: local sampled proximity to cuneiform cartilage. Muscle-versus-fold extent and paired source defects require review. |
| Pterygomandibular raphe, FMA55619/55620 | Aliases also classify these as anatomical lines/boundaries and immaterial entities. Approximately 35% / 31% of sampled right/left raphe vertices lie within 0.25 mm of superior constrictor. Tissue mass versus boundary-marker representation is unresolved. |

The conus elasticus is anatomically related to the vocal ligament; near-contact alone is not evidence of incorrect anatomy. Cartilage may normally lie in an aryepiglottic fold. These flags do **not** prove all six surfaces wrong. They justify retaining original files outside the product until source defects and intended representation are adjudicated. No trimming, mirroring, resculpting, thickening or aggregate bypass is performed. Earlier pharyngeal-raphe, middle-constrictor and other holds remain.

## Audit and reproducibility

Eight candidates and all 273 preceding head/neck entries produce 2,212 candidate-involving pairs, 2,013 bounds exclusions and **199 near-surface comparisons**, seven flagged. No compared pair shares exact triangles; no pair qualifies for the separate extent-filtered translation comparison.

Bounds use a 1 mm margin. Surface diagnostics sample at most 128 deterministic raw vertices per direction against all opposing triangles. A flag means shared exact triangles or at least 25% of samples within 0.25 mm in either direction. Sampling, filtering and zero flags cannot prove complete topology, no intersection, correct attachments or clinical accuracy.

- `content/laryngeal-source-audit.json`: names, aliases, ZIP CRC/size, raw/canonical hashes, bounds, fragment and pair evidence. SHA-256 `6595ce03a7392c482e5f965f2693ab84dc14221fd4a5fa2176d588f00ca7cae8`.
- `content/laryngeal-baseline.json`: preceding full-record hashes, bundle evidence and historical hold policy.
- `npm run laryngeal:test`: **10,673 checks**, including identities, preservation, holds, side scopes, exact membership, removal/restoration/Undo, links, practice and imaging references.
- `npm run laryngeal:test -- --raw-source`: **40,067 checks**, recomputing all eight raw sources and every exported corner of all 9,768 admitted triangles within 0.0003 source millimetres. Requires the verified raw cache outside the repository.
- Default historical tests need no Site Git history. Both complete reconstructed catalogue/inventory hashes must agree. Historical holds are explicit; conditional single-file disc holds are not promoted across source-tree definitions. Negative policy, catalogue and inventory mutations fail.
- `npm run laryngeal:audit` requires pinned Site commit `67d08d64cc681552d284512745a158aa458a50da` and the verified raw cache. It must not substitute current anatomy for its historical baseline.

Current catalogue SHA-256: `8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7`. Dissection-profile JSON SHA-256: `8b41daa021ce295d7758e085910e5b8a2e2c2f4955c7106a1c03b82a4f4dbcc7`.

All current source/geometry, loading/guidance, dissection/workbench, practice/study/library, imaging/navigation/link, inspection/arrangement/explode and review suites pass. The licence audit classifies 808 installed packages with notice obligations and none unclassified. Numerical and server-rendered checks are not device or clinical acceptance.

## Rights and release gates

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) remains CC BY 4.0, including **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and adaptation notices. Source meshes, indexes and derived audit evidence are not relicensed by the application's MIT terms.

Short original draft notes use [Texas Tech larynx and neck teaching facts](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html); no diagrams, tables or textbook prose are redistributed. No dependency, font, texture, paid API, patient data, private review or clinical approval is added. No perpetual free-hosting promise is made.

Specialists must verify identity, shape, laterality, scale, attachment footprints, membrane-versus-boundary representation, grouped extent and fine relationships. Test picking, labels, opacity, view directions, reversible removal and separation on actual devices. Missing mucosal layers, continuous airway lumen, complete pharyngeal wall, laryngeal nerves and operative planes are not generated. No swallowing, phonation, airflow, acquired US/CT/MRI or patient registration is simulated. Imaging IDs/transforms are preparation only.

Next: audit remaining bounded regional supporting-tissue candidates against exact owners/aliases/holds, and improve region-by-region usability where current sources support it. Maintain clinical/device/imaging gates; the overall goal remains active.
