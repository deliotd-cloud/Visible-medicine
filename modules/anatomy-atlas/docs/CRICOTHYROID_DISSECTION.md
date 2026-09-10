# Cricothyroid muscle-part dissection

## Use the study

In Head & neck or Whole body, select **thyroid cartilage → Explore cricothyroid muscles**, or search for “cricothyroid” and select a part. This opens the existing compact source-component workbench, not another page or permanent toolbar.

Four selectable parts: right/left straight and right/left oblique. Study view offers all four, straight, oblique, right or left. The normal controls provide rotation, camera presets, screen-position labels, selection, fade others, framing, hide/Undo/Redo, cutaway and the existing Lift selected / Spread on flat plate / Spread in 3D separation choices. Optional selected-source outline/position guides retain their existing conditions. Reassemble resets separation and cutaway. Layer history is not full camera/session history.

Faint thyroid and cricoid cartilages provide orientation by default. They are nonselectable landmarks, use the existing root assets, can be switched off and are omitted during separation. Thyroid cartilage is the navigation landmark, **not the muscle's tissue parent**. Context does not alter the source bounds used for the cutaway. No anatomical attachment line or functional joint movement is inferred.

## Source admission and exact identity

This is an **unvalidated educational source subset**, not clinical approval. Engineering admission uses the prior [source audit and retained prototype](CRICOTHYROID_PROTOTYPE.md); it does not waive specialist anatomical review or previous source holds.

| Part | FMA | IS-A source | Triangles |
| --- | --- | --- | ---: |
| Right straight | FMA46611 | FJ2801 | 3,222 |
| Left straight | FMA46612 | FJ2783 | 3,268 |
| Right oblique | FMA46613 | FJ2799 | 5,566 |
| Left oblique | FMA46614 | FJ2781 | 5,580 |

The single public GLB has 17,636 triangles, four independently selectable nodes and 323,604 bytes. Its SHA256 is `7a6695ee3fc8feeba3b187e3d9a800aa205b57486208f84a8ef8e170097452a4`. Position/normal arrays, triangle indices/winding and transforms are identical to the retained prototype. The runtime export changes metadata only, replacing the historical prototype flag with source/derivative metadata and retaining `anatomicalReview: false`.

The display derivatives omit 12 exact, audited faces forming six detached opposite-winding duplicate-face islands in the two straight-part originals. Every other face and coordinate remains unchanged. No smoothing, tolerance repair, inferred tissue, new segmentation or attachment relocation is performed. Raw originals remain byte-identical outside public delivery, protected against Windows line-ending conversion. The interface discloses the modification; it must not display the other studies' “no triangles removed” notice for this study.

The raw index tables, audit hashes, source bytes, hold screen and context-bundle hashes are checked by `scripts/export-cricothyroid.mjs`. Root catalogue and prior GLBs are unchanged. The thyroid-cartilage parent requires a complete exact record match; unrelated IDs reject before serialization. Modified parent data, foreign part IDs, side mismatch and changed bundle/source hashes reject navigation or teaching. Context is never promoted to a selectable child or a learning-resource correspondence.

## Teaching and imaging boundaries

One short shared cricothyroid concept is explicitly bound to all four source parts; selected-part source notes distinguish the supplied geometry and cleanup. Anatomy, Function, Clinical, Pathology and Quiz are introductory **drafts**, with the teaching panel collapsed by default. No paragraph is presented as part-specific innervation or biomechanical validation. CT, MRI and Ultrasound remain pending for these four parts; the existing imaging navigation correctly offers no fabricated draft or scan destination for them.

Primary references read on 10 September 2026:

- [TTUHSC El Paso laryngeal table](https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html): attachment/action/innervation context.
- [Mu & Sanders, J Voice 2009; PMID18191374](https://pubmed.ncbi.nlm.nih.gov/18191374/): research abstract describes rectus, oblique and horizontal bellies in human material. Full text and figures were not reviewed. The model's two supplied part types must not be called complete or the only possible bellies.
- [Koufman et al., Laryngoscope 1995; PMID7715379](https://pubmed.ncbi.nlm.nih.gov/7715379/): research abstract on electromyographic muscle status and vocal-fold position. Its small clinical study is contextual teaching, not a universal diagnostic rule or advice to assess a patient with this atlas.

No articles, diagrams, scans, cases, tables or figures are copied into the application. An additional search result about temporary nerve block was not used to author teaching. The quiz is an unscored recall question, not a validated clinical examination.

The registry now contains 69 nested representations / 41 teaching concepts / 81 reference URLs / 11 navigation parents. All 65 previous bindings and ten previous parents reconstruct their exact preceding hash; all earlier teaching and references retain their historical checks. The root still contains 1,022 representations in 86 bundles. Source-matched learning locators include the four parts but create no image registration, resource approval, subscriber entitlement, paid lecture access or change to the host's authorization rules. Production external resources/correspondences remain empty.

## Verification and remaining work

Run from the atlas checkout:

```sh
node scripts/export-cricothyroid.mjs --check
node scripts/validate-cricothyroid.mjs
node scripts/validate-cricothyroid-prototype.mjs
node scripts/pin-nested-teaching.mjs --check
node scripts/validate-nested-teaching.mjs
node scripts/validate-nested-navigation.mjs
node scripts/validate-nested-learning.mjs
node scripts/validate-nested-history.mjs
node scripts/validate-nested-cutaway.mjs
node scripts/validate-origin-guides.mjs
node scripts/validate-component-imaging-navigation.mjs
```

Checks cover exact geometry/metadata, source-dependent rejection, right/left part presets, nonselectable context, opacity, loading/failure/retry, hide/Undo/Redo, separation/context exclusion, cutaway, origin guides, direct/search/deep-link navigation, draft teaching and pending imaging. The old-registry data is preserved rather than repinned under a new identity. The prototype Git checkout-filter check now uses the repository-relative prefix for nested checkouts.

Controlled component callbacks and static rendering are not GPU, browser, mobile or keyboard/focus acceptance. Those checks and specialist review of laterality, attachments, intersections, material appearance, absent structures and terminology remain outstanding. There is no horizontal-belly surface, intramuscular nerve tree, thyroid gland, mucosal airway, phonation, patient-specific pathology or certified operative plane. The shoulder review database does not confer approval on this new study.

## Commercial distribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Retain attribution, licence and the explicit derivative modifications in redistribution. The [official licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked. No new font, texture, dependency, paid API or mandatory service is introduced. This source addition does not guarantee future hosting terms or confer ownership of third-party anatomy or the Visible Medicine brand. Research reference links imply neither asset reuse permission nor endorsement. See the retained third-party notices and asset register.
