# Anterior cardiac vein pathology draft

26 September 2026. Bounded draft for the existing FMA76767 source group,
`vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein`, at Atlas parent
`896bb439eca407539c1e683298b91d8d78530732`. FJ2725/FJ2730 retain their source
identity and unspecified laterality. The coordinator integrated this pathology
branch before the existing anterior cardiac lesson; all other tabs remain intact.

## Evidence and limits

[Ho, Russell and Rowland (1988), PMID3190963](https://pubmed.ncbi.nlm.nih.gov/3190963/),
DOI10.1136/hrt.60.4.348, reports histology of one heart with an aneurysmal anterior
cardiac vein malformation and atypical accessory atrioventricular pathways.
The proposed relation to ventricular pre-excitation is presented as the authors'
interpretation. The coordinator inspected the indexed primary abstract.

The original concise factual summary does not generalise prevalence, sudden-death
risk or management from this case. Normal reference surfaces do not demonstrate
the reported pathology, lumen, ostium or conduction pathways. No article text,
figure, scan, patient identifier or media is imported. BodyParts3D attribution
and source licensing remain applicable.

## Verification and review

`node scripts/test-anterior-cardiac-pathology.mjs` bundles only the new helper
and its real dependencies in memory. It checks pathology-only scope, exact
whole-record identity, changed ID/FMA/bundle/laterality/source fields, exclusion
of contextual structures, detached arrays and the 150-word summary ceiling.
No shared evidence outputs are written.

The integration validator executes the actual viewer teaching callback and checks
the exported record, immutable before/after history, unchanged catalog/geometry
and all 9,935 untouched topics. One pathology topic changes; 38 altered-identity
cases are rejected. The preceding short-ciliary history replays through the new
exact transition without altering its original snapshots.

This is an educational draft pending revision-bound radiologist sign-off for
the actual wording and source revision. Tests do not grant anatomical or clinical
acceptance. No geometry, browser acceptance, deployment or clinical completion
is claimed; Atlas, imaging-case and lecture access remain independent.
