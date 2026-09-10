# Renal and adrenal venous relationships

## Compact navigation

Select a kidney in Abdomen or Whole body, choose **Explore renal vessels**, then choose the side-labelled **renal vein & cava** or **adrenal venous drainage** in **Study view**. Rotate to inspect depth. **Show drainage landmarks** toggles faint, nonselectable context; separation suppresses it until separation returns to zero. Existing cutaway, labels, fade/isolate and original-position guides remain available.

| View | Selectable groups | Nonselectable landmarks |
| --- | --- | --- |
| Right renal vein | Right renal vein | Right kidney, inferior vena cava |
| Left renal vein | Left renal vein | Left kidney, aorta, inferior vena cava |
| Right adrenal drainage | Right adrenal vein | Right adrenal gland, inferior vena cava |
| Left adrenal drainage | Left adrenal and renal veins | Left adrenal gland, inferior vena cava |

Both displayed left veins remain selectable without leaving the relationship. Renal views start anteriorly; adrenal views start posteriorly. **Undo layers** restores the preceding layer/selection state in one step, not camera, cutaway or separation. Reassemble, ordinary presets, manual visibility changes and selection outside the relationship leave the guide. Four side-specific views represent two preset kinds, not additional anatomy or a new toolbar.

## Architecture and source integrity

`lib/renal-relationships.ts` resolves exact same-side groups and existing context records. Missing or ambiguous required records withhold the affected guide. The seven-group renal GLB and root-body bundles are reused without changes to geometry, coordinates, identities or teaching pins. Default renal context still includes six landmarks. Parent association remains navigation, not a claim that adrenal vessels are kidney tissue.

The shared reducer accepts an optional preset focus, validated against both the current layers and the preset's visible IDs. Visibility and focus change atomically with one history entry. Other studies retain their existing selection behaviour. Context cannot become a child selection.

## Evidence and rights

Original brief factual prompts use these primary references, consulted on 10 September 2026:

- [Bouali et al., renal-vein multidetector CT study](https://pubmed.ncbi.nlm.nih.gov/25260644/): public English abstract, not the full French paper; supports renal venous variation. Two fragments of a source group do not establish duplicated anatomical veins.
- [Right adrenal-vein MDCT study](https://pubmed.ncbi.nlm.nih.gov/18647909/): indexed primary abstract; supports usual caval drainage and variation in entry/neighbouring channels.
- [Saadi et al., left adrenal-vein cadaveric study](https://pubmed.ncbi.nlm.nih.gov/35362770/): indexed primary abstract; supports usual renal-vein drainage and variable additional/phrenic channels. Cohort findings are not universal anatomy.
- [Texas Tech abdominal vein table](https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html): factual corroboration only, not copied or added as guide text.

No article, figure, table, scan, patient case or lecture is imported or relicensed. Public references confer no asset-reuse permission or endorsement. Existing BodyParts3D CC BY 4.0 credit, licence and modification notices remain required. No dependency, font, texture, new mesh, paid service or new mandatory fee is added. Future hosting and independently sourced assets require separate cost/licence assessment.

## Verification and remaining acceptance

`node scripts/validate-renal-relationships.mjs` passes 346 source, reducer and controlled-component assertions: exact-side membership, unchanged hashes, missing context, one-step Undo/Redo, either left-vein selection, context toggle/retry, framing, all three separation styles, stable cutaway bounds and guide exits. Shared history, cutaway, original-position, ventricular/cardiac relationship and renal/teaching checks provide regression coverage. Mocked browser/GPU tests are not visual, mobile or clinical acceptance.

An anatomist/radiologist must review vessel continuity, adjacency, junctions, source variants and teaching accuracy. Actual-device review must verify rendering, labels, pointer pass-through and controls. Surface proximity is not a patent lumen, measured ostium, proven compression, procedural route or complete circulation. No flow arrows or missing connections are invented. The defective left inferior adrenal artery remains held; kidney tissue and collecting-system gaps remain explicit.

No patient scans, registration, diagnostic rules or live viewer links are added. CT/MRI/X-ray/US resources and separately paid lectures require independently approved manifests, reviewed correspondences and server-enforced entitlements; Atlas subscription does not grant those rights.
