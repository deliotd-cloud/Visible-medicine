# Dental and orbital detail — 6 September 2026

The atlas now contains **924 selectable body entries in 73 body bundles**, plus the unchanged nine-structure shoulder pilot. Five additional windows/focuses bring the dissection library to **102 stages and 84 focused views** across eleven regions and whole body.

## Added source anatomy

| Source subset | Entries | Classification | Study window |
| --- | ---: | --- | --- |
| Secondary incisors | 8 | Dental organs, not bones | Teeth & jaws; upper/lower tooth surfaces |
| Secondary canines | 4 | Dental organs | Same dental windows |
| First/second secondary premolars | 8 | Dental organs | Same dental windows |
| First/second secondary molars | 8 | Dental organs | Same dental windows; no third molars |
| Common tendinous rings | 2 | Connective system / tendon | Orbital rings & rectus muscles |
| Superior-oblique trochleae | 2 | Connective system / cartilage | Superior oblique & trochlea |

All 32 definitions correspond to one source component each. The two separate `*-head-detail.glb` files total **791,696 bytes**. All 892 previous catalogue records retain every field; all 71 previous body bundles retain their exact bytes. No existing anatomy was reshaped, relabelled, rescaled separately or re-registered. Dedicated shoulder geometry is unchanged.

## How to study

Open **Head & neck → Guided dissection**, then choose one of the five named windows or focuses. Teeth & jaws retains only the 28 teeth, mandible and maxillae. The upper and lower tooth-only views remove bones and the opposite arch, with inferior/superior presets respectively. Teeth use an ivory display material; this is not a segmented enamel layer. Full source names remain in selection/search rather than unverified clinical tooth numbers.

Orbital windows keep only the relevant muscles and eyeballs with the new connective targets. Choose a side, then hide or fade an obstructing muscle/eyeball, frame a selection, rotate or use orthographic illustration. These are source relationships to inspect, not verified attachments or operative approaches. Explode is presentation separation, not movement through an anatomical joint, orthodontic simulation or deformation of a tendon.

Focus-only practice targets the added structures and excludes contextual anatomy from both targets and answer choices. A unilateral ring/trochlea focus has only one target, so naming is disabled; use Find on model, both sides, or All visible for that exercise. Existing cutaway, labels, remove/undo, saved views, retries and imaging-selection hooks work through the unchanged shared interfaces. Conservative source-scope fingerprints disable older saved views when their scope changes; no silent bookmark migration occurs.

## Evidence and limits

`scripts/head-detail-selections.mjs` pins all names, FMA cross-references and component files. `content/head-detail-source-audit.json` records archive-verified SHA-256, exact geometry fingerprints, source/scene bounds, exact aliases, gross envelopes and dental-centre diagnostics. `content/head-detail-baseline.json` pins the preceding source commit, catalogue digest and every previous record/bundle fingerprint.

The checks reject reused component files, exact duplicate geometry, held aliases, non-finite bounds, wrong-sided centres and grossly misplaced surfaces. Source coordinates remain millimetres with X left / Y posterior / Z superior, using the existing common display transform. Bounding-box centres support only gross checks. The lower central/lateral incisor centres differ by about 0.02 mm in the anterior/posterior coordinate and can reverse order; this is recorded, not corrected. Root-containing bounding boxes are not crown landmarks. Exact hashing is not a tolerant overlap or attachment test.

**Clinical validation remains absent.** A dentist/oral anatomist must verify tooth identity, crown/root form, arch position, occlusion, contacts and bone interfaces before teaching approval. No Universal, FDI or Palmer numbering is assigned. No third molars, primary dentition, separately segmented enamel/dentine/pulp, root canals, periodontal ligament or gingiva are added. An orbital specialist must verify ring/trochlea identity, thickness, tendon continuity, attachments, pulley relationship and adjacent nerve passages. The complete optic/abducens nerves and a certified orbital-apex corridor are not supplied. No scan, tissue-interior reconstruction, diagnostic claim, patient registration or clinical sign-off is implied.

## Commercial rights and references

Meshes and their source labels come only from the official BodyParts3D version-4 IS-A archive. The [official licence statement](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 27 February 2025 and rechecked 6 September 2026, specifies CC BY 4.0. Preserve the existing DBCLS credit, licence and modification notices in commercial distribution. See `LICENSES/BODYPARTS3D_FULL_BODY.md` and the visible credits page. No new dependency, font, texture, paid API, generated mesh or copied anatomical diagram was introduced. Asset licence rights do not guarantee indefinitely free hosting.

Short original draft function notes were checked against [Dentalcare's authored dental-anatomy course](https://www.dentalcare.com/en-us/ce-courses/ce500/types-of-teeth-and-their-functions) and [TTUHSC's eye anatomy table](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html). These links support factual teaching summaries only; their images, table datasets and protected prose are not bundled. They do not validate the BodyParts3D shapes.

## Reproduce and validate

1. `node scripts/audit-head-detail.mjs` checks the official cached source entries against the explicitly pinned pre-admission source commit. It needs that original Git history and refuses to overwrite a different baseline.
2. `node scripts/ingest-full-body.mjs` imports with the existing common transform and separate new bundles.
3. `npm run inventory:audit` regenerates full source reconciliation. Current classifications: 1,312 admitted definitions, 51 admitted under another definition, 1,771 represented but not separately selectable, 189 partly represented, 929 unused available and 21 held. These include aliases/aggregates, not counts of distinct missing anatomy.
4. `npm run head-detail:test` runs **4,301 assertions** against source evidence, all previous record/bundle hashes, new identities/coordinates, draft content, target/context recipes and focused practice. It works without old Git history after dependencies are installed.
5. Run full-body, recovery, gap, inventory, neuro, axial, dissection, explode, inspection, study, practice, imaging and review regressions, type checks, focused lint, licence audit and the production build before publication.

The historical abdominal-wall audit stays pinned to its original 892-entry catalogue; those six v3-only candidates remain unimported. No prior source hold is released. Browser/device interaction, visual readability and specialist acceptance are not established by numerical tests.

Current regression results: 4,791,476 body triangles / 2,401,794 vertices, 432 full-body framing checks; 2,904 recovery checks; 8,900 inventory assertions; 202,370 neuro/label assertions; 2,725 axial assertions; 3,006 dissection checks / 7,344 camera checks; 502,496 explode pair checks / 7,280 framing checks; 1,115,959 inspection assertions; 17,156 saved-view assertions; 54,502 practice assertions; 43,574 imaging-link assertions; 189 review checks. The 808-package licence audit has no unclassified entries, with existing notice obligations retained. These counts describe the current source/software tests, not clinical or browser acceptance.

Next executable work: inspect remaining same-version mesenteric/organ and regional muscle candidates; then strengthen source-linked relationships and keyboard/view controls. Missing meshes, clinical approvals and actual user-supplied imaging integration remain separately gated.
