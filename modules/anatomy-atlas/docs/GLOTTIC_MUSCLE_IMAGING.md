# Source-bound glottic muscle CT/MRI orientation

Eight short original drafts fill the existing CT/MRI tabs for four retained
BodyParts3D v4 surfaces: right/left thyroarytenoid FMA46589/46590 and right/left
vocalis FMA46592/46593. This adds no anatomy, source geometry, camera action,
control, scan, registration or external asset. Existing source labels do not
establish clinically accepted partitions between a muscle and its medial fibres.

Use Head & neck, select one of these structures, then CT or MRI. The text compares
the muscular true-fold region with thyroid/arytenoid landmarks and distinguishes
that anatomical orientation from an individually resolved patient boundary.
Airway, mucosal layers and a complete true/false vocal fold are not constructed;
no tumour staging, denervation or mobility determination follows from a mesh.

`content/glottic-muscle-imaging-pins.json` captures complete source records,
ordered original-file hashes, source bundle, common frame and the actual pending
lessons at source4b6f0629. Its whole-teaching/recipe snapshot detects unrelated
edits. The resolver requires whole-record equality, not a name or FMA-only match.
Any changed source, side, bounds, component or additional metadata fails closed.
Only CT/MRI is authored; other lessons, reasoning questions and tours stay exact.

## Factual references and rights

- [TTUHSC laryngeal anatomy](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html):
  the thyroid/arytenoid route and the medial thyroarytenoid/vocalis relationship.
- [Hermans et al., 2007](https://pubmed.ncbi.nlm.nih.gov/17535777/):
  CT true-fold-level landmarks and paraglottic context. Available indexed text
  supported these limited orientation facts; direct PMC access failed its browser
  check. No unavailable full text or figure was assumed to have been read.
- [1990 laryngeal MR anatomy study](https://pubmed.ncbi.nlm.nih.gov/2298998/):
  historical high-resolution/surface-coil anatomical observations, not a promise
  that routine MRI separates individual vocalis fibres or matches this specimen.

Checked3 October2026. These are factual references, not imported anatomy datasets,
scans, diagrams, tables or licensed illustration assets. Prose is original and
brief; no protected media is copied or traced. Original code/teaching keep MIT;
existing geometry/metadata keep BodyParts3D CC BY4.0, DBCLS credit and change notices.
No dependency, font, texture, licence classification or fee-bearing service changes.

## Verification and remaining acceptance

Run `node scripts/pin-glottic-muscle-imaging.mjs --check` and
`node scripts/test-glottic-muscle-imaging.mjs`. The focused suite uses the real
learner resolver and shared Review, compares all9,936 topics, checks detached
outputs and mutated source records, and refuses stale teaching before storage.
Historical lower-venous teaching replays exact4b6f0629 bytes without altering
earlier assertions; this new suite covers actual current teaching independently.

Radiologist review must judge the wording, source contours/part relationships and
modality-specific visibility separately. Software/source tests do not approve
anatomy, imaging or device presentation. Renderer-bound approvals invalidate
conservatively; no prior approval transfers. Atlas/case/paid-lecture entitlements
remain independent. Acquired imaging requires separately cleared resources and
validated mappings through Didanix Education/light. Private masks, scans, decisions
and the clinical desktop application are outside this change.
