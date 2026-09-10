# Optic chiasm and tract dissection

Open **Head & neck / Whole body → Brain → Dissect brain → Optic chiasm and tracts**, or search for an optic tract/chiasm directly. This is a partial surface study, not a complete visual pathway.

## Compact interaction

- Inferior initial view; free rotation, named camera views and Frame all remain available.
- Select the chiasm, right tract or left tract. Five Study view presets show all, chiasm alone, both tracts or either chiasm–tract pair.
- Reuse labels, hide/show, fade/isolate, Undo/Redo layers, stable cutaway and the three existing separation styles. Optional original-position guides explain displacement, not nerve connections.
- Four existing landmarks (paired thalami and lateral geniculate bodies) are optional, nonselectable and off initially. They disappear during separation; the enclosing solid brain is never rendered here.
- Anatomy, Function, Clinical, Pathology and recall teaching remain in the collapsed Learn more panel. CT/MRI/US notes remain pending for these three selections.

## Source and licensing

The [source audit](VISUAL_PATHWAY_SOURCE_REVIEW.md) supplies FMA62045 (FJ1771 + FJ1818), FMA62382 (FJ1820) and FMA67936 (FJ1773). It retains 6,456 triangles in three labelled groups. The source-to-scene transform, source memberships and parent records are unchanged; no inferred fibre or lesion geometry is added.

`public/models/bodyparts3d/visual-pathway/visual-pathway.glb` is 120,068 bytes, SHA-256 `c9698e52e4678c06a5ed5df8212e3ecb1ce89d9a25d4e1859f0ec5be7d4864bc`. Metadata differs from the retained 120,020-byte prototype, but every vertex/index is identical. The source audit SHA-256 remains `5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6`.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Preserve attribution, [licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and modification notices in commercial distribution. No new dependency, font, texture, paid API or outside illustration is included. Source licensing does not establish medical accuracy or guarantee future hosting costs.

Teaching contains eight brief original section drafts and two recall questions shared across two concepts. Factual sources, read 10 September 2026: [UTHealth central visual pathway anatomy](https://nba.uth.tmc.edu/neuroanatomy/L8/Lab08p07_index.html) and [UTHealth visual-field organisation and clinical patterns](https://nba.uth.tmc.edu/neuroscience/s2/chapter15.html). No figures, patient cases or chapter text are reproduced. The conservative validator counts all paraphrased teaching per unique reference, including previously authored concepts, against a 200-word ceiling. Citation does not relicense source assets.

## Identity and integration

Three new bindings are appended to the previous 60 nested bindings; historical parents/records remain byte-equivalent. The registry now exposes 63 nested selections and 1,094 scope-specific body/shoulder/nested representations, which overlap and must not be treated as unique anatomy. FMA/source IDs, side, parent and bundle digests identify future destinations; a shared identity is not spatial registration.

The production learning document still contains zero external resources or correspondences. Atlas access does not grant a paid lecture, and a lecture subscription does not grant Atlas access. Existing default-deny authorization/review gates and the 2 MB transport limit are unchanged; synthetic transport tests are not live viewer connections.

## Validation and remaining acceptance

Run from the project directory:

```sh
npm run visual-pathway:export -- --check
npm run visual-pathway:test
node scripts/validate-nested-teaching.mjs
node scripts/validate-nested-navigation.mjs
node scripts/validate-nested-learning.mjs
node scripts/validate-nested-history.mjs
node scripts/validate-nested-cutaway.mjs
node scripts/validate-origin-guides.mjs
npx --no-install tsc --noEmit
npm run build
```

Export reproduction additionally needs the verified source cache described in the source audit. The exporter refuses an existing destination by default; `--check` compares in memory. Automated geometry, controlled React callbacks and server-rendered checks are not GPU/browser/mobile acceptance. No browser acceptance run was made during this background continuation.

Independent reviewers must assess chiasmal shape/seam, tract boundaries and laterality, relation to both geniculate surfaces, possible overlap/self-intersection, visibility and source-to-screen labels. Two closed chiasm halves do not depict crossing axons. Tracts lie near both medial and lateral geniculate surfaces: proximity is not a validated termination. No optic radiations, continuous nerve course, retinotopic map, patient registration, pathology mesh or diagnostic measurement is supplied. Anatomy, neurology/neuro-ophthalmology teaching and imaging correspondence need separate specialist approval before clinical use.
