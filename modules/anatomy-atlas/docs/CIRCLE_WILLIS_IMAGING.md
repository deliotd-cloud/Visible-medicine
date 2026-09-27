# Circle of Willis: CT/MRI orientation drafts

This batch fills CT and MRI teaching for seven existing source selections:
anterior communicating artery, paired anterior cerebral arteries, paired posterior
cerebral arteries and paired posterior communicating arteries. It complements
existing internal-carotid/basilar teaching; it does not establish complete or
patient-specific Circle of Willis geometry.

Four original teaching groups provide modality context and a named anatomical
relationship. CTA is distinguished from unenhanced CT; MRA is distinguished from
routine structural MRI. Usual connections and recognised variation are not
assertions that this donor surface demonstrates a patent junction or an individual
patient's anatomy. A missing or faint artery in a study cannot be adjudicated by
the presence of a coloured Atlas mesh. No TOF-specific physics, prevalence,
stenosis thresholds, contrast dosing or treatment advice is added.

## Reference and reuse boundary

Primary institutional factual references inspected on 27 September 2026:

- [UTHealth Neuroanatomy Online: internal carotid system](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html): ACA origin, ACom linkage, PCom connection and usual/variant PCA origin.
- [UTHealth Neuroanatomy Online: vertebral–basilar system](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html): basilar bifurcation and PCA course/territory context.
- [ACR/RSNA RadiologyInfo: CTA](https://www.radiologyinfo.org/en/info/angioct): contrast-enhanced vascular CT; page reviewed 15 June 2026.
- [ACR/RSNA RadiologyInfo: MRA](https://www.radiologyinfo.org/en/info/angiomr): dedicated MR vessel imaging, with/without contrast and small-vessel/image-quality limitations; page reviewed 15 June 2026.

These are copyrighted factual references, not asset licences. Only short original
teaching is authored, with source links. No article prose, diagram, table, scan,
photograph, annotation dataset or acquisition protocol is imported. Model licences
and third-party notices remain in force. No paid service, new package or font.
Other searched papers that could not be independently read were not used to add
unsupported TOF/variant claims.

## Review requirements

The radiologist must check each of the 14 exact-source draft placements for:

1. Correct source identity/laterality and the boundaries of the retained surface.
2. Correct distinction of communicating versus cerebral arteries and usual versus
   variant connections, without invented segment labels or perforators.
3. CTA/MRA relevance, appropriate limits and suitability for the intended learners.
4. No inferred lumen continuity, patency, flow, collateral adequacy or patient
   diagnosis from surface geometry; explode offsets are not scan coordinates.

Previously held structures remain held. No clinical decisions are migrated or
recorded. Actual CT-head masks and original scans remain with the specialist
task. Future cleared imaging is separately authorised through Didanix Education;
Atlas, case and paid-lecture access remain independent. This batch adds no viewer
control and does not connect or upload an imaging study.

## Verification

- `node scripts/test-circle-willis-imaging.mjs`: 14 changed placements, 9,922
  unchanged topics, 554 rejected source/identity mutations, 14 actual study-panel
  callback renders, exact review topic packets and source bundle bytes/hash.
  Historical replay rejects unrecorded and mixed states; reference-derived copy
  budgets are checked. The baseline is the actual parent Git tree `0770fd3`.
- `npm run content:test`: 33,460 checks, including contract rejection cases,
  recorded editorial transitions and model verification.
- `npm run body-review:test`: 1,104 source-bound selections, 9,936 unchanged
  topic snapshots through review export and 15 rendered review states.
- TypeScript and the regional production build pass. Body-renderer and shoulder
  review fingerprints verify; the build still reports large JavaScript chunks.
- Existing foot-quiz and foot-history checks preserve their original 8/9,928
  transition counts and hashes after exact replay of this newer batch. They
  reject 284 source mutations, 33 historical corruptions and two additional
  unknown/mixed later-state cases rather than accepting altered baselines.
- The older Achilles CT check also passes through the history chain: its two
  original placements, 9,934 unchanged topics, 72 negative cases and two actual
  panel renders retain the frozen transition hash.

These checks establish source binding, software behaviour and preservation, not
clinical correctness or an independently reviewed complete arterial model. The
new content has not yet been imported into the website or publicly deployed.
