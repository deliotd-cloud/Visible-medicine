# Deep-brain anatomy and view-aligned labels

This is the historical 881-entry milestone. The current catalogue and subsequent source-admission evidence are in [connective/deep-spinal detail](AXIAL_DETAIL.md).

## What is available

The atlas now has **881 selectable body entries in 67 bundles**, with **91 dissection stages and 71 focused views** across 11 regions and whole-body scope. The separate nine-structure shoulder pilot is unchanged. This milestone adds **22 deep-brain source concepts / 24 components**, in `head-neck-nerves-deep-brain.glb` (1,866,940 bytes; 102,398 triangles). Every field of all earlier 859 catalogue records and all 66 earlier model bundle hashes is preserved. The common source-to-scene transform and original brain aggregate are unchanged.

The new concepts are paired caudate nuclei, putamina, globi pallidi, thalami, amygdalae, lateral and medial geniculate bodies, and fornix surfaces; anterior, posterior and fornical commissures; corpus callosum; and source-grouped cerebral choroid plexus and mammillary bodies. The latter two retain paired components under one source identity. A left/right filter does **not** turn either group into a separately segmented unilateral structure.

All entries are **unvalidated source representations**, not an assertion of complete brain anatomy. Shapes, extents, source labels and relative positions still need neuroanatomical review. Being inside the existing brain's bounding box is not proof of tissue containment, correct segmentation or anatomical accuracy. Individual thalamic/pallidal nuclei, complete tracts, connectivity, diffusion imaging and MRI signal are not established. No superficial brain component was invented or cut out to make these additions.

## Study controls

Open **Head & neck**, then choose a stage or **Compartment views**:

| View | What it exposes |
| --- | --- |
| Deep-brain overview | All 22 added records without obscuring skull or the existing brain aggregate |
| Basal nuclei & thalami | Caudate, putamen, pallidal and thalamic source surfaces |
| Limbic & commissural detail | Selected amygdala, fornix, mammillary and commissural surfaces |
| Geniculate bodies & thalami | The paired geniculate bodies with thalamic context |
| Choroid plexus & fornix | The grouped plexus with selected nearby surfaces |

The first three are also named dissection stages. Focuses now support exact source-ID membership, optional omission of the skeleton, specific study descriptions and clickable landmarks. Existing compartment views keep their skeletal context by default. Removing/restoring individual structures, undo, side filters, isolate/frame, cutaways, explode, local saved views and identification practice use the same shared catalogue and controls. Changed source scope disables old saved views conservatively; there is no silent migration.

Enable **Ghost removed tissues** for outer-brain context when useful; it can obscure small structures and enlarge camera framing. Disable it to inspect the deep-brain subset alone. Use **Reassemble** to return to the available region. Explode is a display transformation, not white-matter disconnection or a simulated operative approach.

Fourteen distinct group colours improve diagrammatic differentiation. They are **study colours**, not histology, MRI signal, activation, vascular territories or pathology. Text labels and source IDs remain the identity evidence; do not rely on colour alone. Original short anatomy/function summaries cite factual sources and remain draft. Function content for the posterior and fornical commissures remains explicitly pending rather than being filled with an unreviewed pathway claim. Imaging, pathology and clinical tabs do not imply completed specialist content.

## Source and licence gates

`scripts/neuro-selections.mjs` pins all 22 exact official names, FMA IDs and component-file lists from the BodyParts3D 4.0 IS-A archive. `scripts/audit-neuro-candidates.mjs` retrieves candidate files through the existing official archive reader, checking ZIP CRC/size, SHA-256, exact geometry fingerprints, duplicate source-file use, source-side centroid and common-frame bounds. It requires the original source history for the pinned pre-admission baseline capture. Re-running never overwrites a different baseline.

`content/neuro-baseline.json` records the pre-admission identities/bundle fingerprints from source commit `b49c9172fbc443bcd2ee1faf58c171aa76424e20`. `content/neuro-source-audit.json` records the retrieved component hashes and numerical bounds. The standard importer adds a separate bundle; it does not reflect, reposition, rescale or relabel individual components. Normals/welding/GLB conversion follow the existing documented pipeline.

`content/source-inventory.json` has been reconciled again against all four exact official v4 tables and both archive directories. Current tree-specific counts are 1,265 admitted, 51 admitted under another definition, 1,700 represented but not separately selectable, 199 partly represented, 1,040 unused/available and 18 held definitions. These are **source-index classifications**, not counts of unique missing anatomy. Unretrieved sources still have null geometry hashes; no clinical review of all remaining candidates is claimed. Previous optic-nerve, pelvic-floor, cord/canal, disc-level, laterality and superior-epigastric vein holds remain intact.

The [official database grant](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked: CC BY 4.0 with DBCLS attribution and change notices retained. See [official source definition](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) and `LICENSES/BODYPARTS3D_FULL_BODY.md`. No new library, font, texture, paid API, scan collection or independently sourced anatomy dataset was added. No textbook figures or prose passages are redistributed.

Factual references for original notes include [OpenStax CNS overview](https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system), [OpenStax CSF circulation](https://openstax.org/books/anatomy-and-physiology-2e/pages/13-3-circulation-and-the-central-nervous-system), and UTHealth's [commissural/fornix laboratory](https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html), [geniculate laboratory](https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p12_index.html), [hippocampal connections](https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html) and [amygdala laboratory](https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p07_index.html). These are citations for facts, not asset imports or endorsements.

## Regional label changes

`lib/scene-labels.ts` provides bounded, de-duplicated labels in six preset-aligned columns. Positions follow the **visible fitted bounds**, not a hidden full-body/head frame. Left/right camera views use depth-axis columns instead of collapsing every label onto the same horizontal screen position. The selected structure gets one slot, and selected-structure framing omits unrelated landmark labels. Exploded offsets are subtracted from local endpoints so translation is not applied twice. Regional contours depend on the rendered structure count, allowing detail in small exposed subsets without outlining every structure of the full body.

This is not pixel-based text collision detection or a screen-occlusion solver. Free-orbit text overlap, very small structures, labels near viewport edges, long names, device text enlargement and touch/assistive-technology behaviour require hands-on acceptance. Label geometry checks do not measure rendered text boxes.

## Verification and next actions

- `npm run neuro:test`: 193,082 assertions for source/field/mesh preservation, all new identities and component hashes, transformed bounds, draft content/absent imaging, exact focus membership, side-safe landmarks, remove/undo, old skeletal context, six label directions, unique label slots and explode-coordinate correction. It uses committed evidence and installed project dependencies; it does not require the source Git history or network.
- `npm run inventory:test`: current full-source reconciliation plus the preserved earlier 36-entry inventory admission gates.
- Full-body validation: 881 entries, 67 GLBs, 4,688,700 triangles, 2,350,128 vertices; all asset hashes, finite geometry, source identities and 432 framing checks pass.
- Dissection: 2,670 checks and 6,552 numerical camera checks. Explode: 453,471 pair checks. Inspection: 1,063,579 assertions. Saved views: 16,991 assertions. Imaging-link: 41,596 assertions across 881 body/nine shoulder identities. Review safeguards: 189 checks.
- Type checks, focused lint, the production build and the existing 808-package licence audit pass. Publication remains a separate gate; no helper test is a clinician sign-off or hands-on browser/device test.

Further work remains: curated same-version coverage in other regions; safely separable anatomy currently embedded in aggregates; richer source-linked spatial study and practice; whole-atlas clinical/editorial review; accessible visual/device acceptance; and the user's actual imaging adapter plus rights-cleared, de-identified studies and validated registration. The ongoing goal is active. No patient data, scan simulation or clinical approval was created.
