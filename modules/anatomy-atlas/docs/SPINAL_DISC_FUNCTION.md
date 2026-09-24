# Spinal-disc Function teaching

Update, 24 September: the old full spine-imaging history check described below
has been repaired without changing captured expected hashes. It now uses exact
Git snapshots for historical whole-curriculum claims while preserving current
scoped checks. The twelve mismatching topics were later lacrimal CT/MRI notes,
not these disc Function drafts. See [repair evidence](SPINE_IMAGING_TEACHING.md#historical-verification-repair--24-september-2026).

Twenty-two retained whole-disc selections now receive source-bound Function
drafts: six cervical, eleven thoracic and five lumbar. Three regional explanations
replace the generic fallback through the existing information panel; no new
controls, mesh, segmentation, scan or entitlement is added. All other 9,914
topics and all dissection recipes remain unchanged.

## Sources and reuse boundaries

Original short factual summaries use these reading references:

- [TTUHSC El Paso back-joint table](https://anatomy.ttuhscep.edu/anatomytables/joints_back.html): basic disc composition and cushioning role.
- [Skrzypiec et al., 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2078298/): cervical cadaveric stress depends on posture/loading; lumbar mechanics cannot simply be assumed equivalent.
- [Wilke et al., 2020](https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2020.00614/full): thoracic cadaveric pressure depends on loading direction and region. Specimens retained short rib stumps, not an intact rib cage.
- [Adams et al., 1996, abstract](https://pubmed.ncbi.nlm.nih.gov/8951017/): lumbar cadaveric internal load sharing varies with tissue condition.

No article prose, figures, tables, models, PDFs or scans are copied or distributed.
Online access is not treated as a commercial media licence. The university table
and cervical article retain their stated copyright; no reuse grant is inferred.
Existing BodyParts3D CC BY 4.0 attribution remains unchanged. No dependency, font,
texture, dataset or paid service is added.

## Identity and clinical boundaries

Runtime admission reuses the complete recorded identities in
`content/spine-imaging-pins.json`, including geometry/provenance, rather than
matching names alone. FJ3211 remains unresolved and unadmitted. Source labels do
not establish patient imaging levels or imply an absent/fused disc. The axis
selection is below C2, not a C1–C2 disc. Annulus, nucleus and endplates are not
independently segmented. No pressure, strain, motion, diagnosis or CT/MR
registration is inferred from a static mesh or its exploded position.

Radiologist review must verify source-to-mesh identity, vertebral interval and
completeness, regional prose and limitations before revision-bound sign-off.
Patient-specific measurements, registration, loading simulation and procedure
guidance remain outside these drafts. Atlas, case and lecture access stay
independent. Clinical and physical-device acceptance are not engineering tests.

## Reproduction

`node scripts/pin-spinal-disc-function.mjs --check` reconstructs immutable
pre-change lessons from exact Git source `bff0cbb95f66c333846497d48b6503df07bd1ad3`.
`npm run spinal-disc-function:test` checks the recorded transition, all 22 actual
viewer-note renders, 374 altered-identity rejections, three regional concepts,
fresh output arrays and mixed/unrecorded-history rejection. It compares all
9,914 untouched topics and recipes with the original baseline. Historical replay
is test-only and never transfers clinical approvals.

Use the main task checkpoint for completed broad checks, recovery and publication
state; this source update alone does not change the hosted website.

Completed checks: 22 actual note renders with 44 citation links (including safe
new-tab attributes), 374 identity mutations, exact prior-Git pins, proper-digital
regression, 33,445 broad content checks, body review (1,104 selections / 9,936
topics), 15 focused spine-ultrasound drafts, TypeScript and shared regional build.
The existing large-bundle warning remains. Renderer fingerprints were refreshed
without transferring approvals.

The older full `validate-spine-imaging.mjs` fails its historical whole-curriculum
digest: expected `6b94c19d2c54d5ea6ea34e8bb5e34aaa4964d71a9fd1829b7ff4dfbc352b8f4e`,
actual `43a1b381f8a3f199839e15bdbd6bde87f469bf365e401c180925046a15a6af74`.
Reconstructing the prior `bff0cbb` application exports from Git and replaying the
same historical adapters yields the identical actual hash. This is a pre-existing
historical-reconstruction issue, not a waived pass or changed expected fixture.
All current imaging topics are independently compared unchanged by the new
Function test. Repair of that historical test remains outstanding.
