# Orbital sensory MRI orientation — 10 October 2026

Eight original lessons fill sixteen bilateral MRI topic slots: ophthalmic V1,
anterior/posterior ethmoidal, infratrochlear, long ciliary, supraorbital,
supratrochlear and the nasociliary connection to the ciliary ganglion.
These teach anatomical orientation and limits of identification, not new scan
annotations. The existing fourteen orbital MRI lessons remain unchanged.
The unspecified short-ciliary source group is outside this change.

## Sources and interpretation

- [Texas Tech El Paso eye anatomy tables](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html)
  support branch parentage and regional landmarks, not MRI visibility.
- [Arizono et al., 2026](https://pubmed.ncbi.nlm.nih.gov/42034568/),
  DOI 10.3174/ajnr.A9376, evaluates selected orbital nerves on fat-suppressed
  3D FLAIR in subjects without orbital disease. The distal branches added here
  were not separately assessed. Parent-nerve results cannot be assigned to them.
- [Casselman et al., 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10017653/),
  DOI 10.1007/s00330-022-09269-2, supplies sequence-specific V1 evidence from
  eleven patients; it does not validate all distal branches or routine sequences.

The lessons explicitly distinguish source-model relationships from expected
landmarks and directly resolved image structures. Nonvisualization is not a
normality assessment. Contrast-study results are not prescribing guidance.
No publisher prose, images, tables, scans or other assets were imported.
References are reading links, not new licences for project assets. Existing
mesh licensing is unchanged; no new dependency, service or fee is introduced.

## Binding and review

`content/orbital-nerve-quiz-pins.json` is reused without modification. Each target
must match its entire canonical source identity, including side, source bytes,
bundle, bounds and validation fields. New names or altered identities refuse the
lesson instead of inheriting teaching by substring or assumed laterality.

`npm run orbital-sensory-mri:test` compares against exact source commit
`d77054e28f42b4fe99e6ad9519defde7603c7485`: only sixteen MRI topics may change,
with all other root topics and geometry unchanged. Review teaching fingerprints
change with the actual wording; older/forged responses must fail validation.
Tests do not confer clinical approval. Radiologist review must confirm source
identity, terminology, evidence scope and teaching text at the generated revision.

No changes to native CT/MRI packages, accepted masks, quiz answers, guided tours,
registration, independent access entitlements or the desktop clinical PACS.
Website delivery requires a separate generated-module import; this source-only
checkpoint does not claim deployment or new annotations on the head scans.

The focused validator passes sixteen intended changes, 9,920 unchanged topics,
624 altered-identity refusals and sixteen exact Review bindings. Its first run
rejected stale generated display pins; the normal generation step corrected the
pins and the unchanged validator then passed. The initial failure is retained in
local evidence, not hidden by relaxing review checks.
