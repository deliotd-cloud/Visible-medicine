# Hilar vessel X-ray orientation drafts

Six X-ray-only lessons cover the retained right/left pulmonary arteries and
right/left superior/inferior pulmonary veins: FMA50872, FMA50873, FMA49914,
FMA49916, FMA49911 and FMA49913. Admission compares the complete canonical
identity in `central-vessel-imaging-pins.json`, including laterality, bundle,
coordinates and source provenance. Returned bullet/citation arrays are detached.

The arteries use the bronchial relationships and qualified hilar-height teaching
from [Radiology Masterclass](https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page2).
Shared vascular projection and vein-course teaching uses the Hili section of
[Radiology Assistant](https://radiologyassistant.nl/chest/chest-x-ray/basic-interpretation).
These are factual references for original short prose; no images, tables or
quotes are reproduced. Vein teaching intentionally overlaps. The selected title
and source side/name provide orientation without promising radiographic
separability, drainage territories or complete branch continuity.

Reassemble to 0% before comparison. The model is not a radiograph and supplies
no patient registration, measurement or diagnostic interpretation. Review is
pending; radiologist sign-off must identify its revision and scope. Case,
Atlas and lecture access remain independent. No geometry, assets, dependencies
or modality entitlements change.

Run `node --import tsx scripts/test-hilar-vessel-xray.mjs` for the bounded
identity, mutation-rejection, non-X-ray, detached-array and per-source word-cap
checks. The coordinator also checks the right/left artery wording, vein-course
limits and all non-X-ray modes: six drafts,210 altered identities rejected and77
unaffected checks. Source-derived unique prose remains69/63words respectively.
These are functional/content-contract checks, not clinical acceptance.

## Integrated scope and immutable history

Parent source: `d8ac584897df09fa0001d51c0d3830acf3904f22`. The existing dispatcher
now serves these six X-ray notes; all9,930 other root-topic placements and recipes
are preserved. `validate-hilar-vessel-xray.mjs` executes the actual viewer note
callback, checks all six rendered/exported drafts, rejects204 identity mutations,
and verifies the catalog, original source pins and physical bundle bytes.

Before hash: `483e52caf562c361d6bc6606b81aeaf6c48ca32e9b7738c0d24daaa73362c5d4`.
Transition hash: `3294d9d33357b3580ad5f926bcb16e70db17bda9f59dc7e8f03a7f67ede68a53`.
The history adapter rejects mixed or unrecorded revisions and preserves the old
cardiac/earlier snapshots rather than rewriting their expectations. See
`hilar-vessel-xray-validation.json` for scoped evidence. Browser acceptance,
clinical sign-off and publication must be recorded separately, never inferred.

The new/cardiac/mediastinal checks pass in
`.local/test-logs/2026-09-26T11-33-10.690Z-20624-b98993ca.log`. That log also retains
an older pulmonary-vein-ultrasound harness failure: the extracted current viewer
callback required `SourceDisplayNotes`, which the harness had not supplied.
The harness now bundles and renders the actual component, without replacing it
with a stub or changing any original teaching/history assertion. Its rerun passes
in `.local/test-logs/2026-09-26T11-37-03.602Z-41040-de301c15.log`.

Content-contract and body-review/decision checks pass in
`.local/test-logs/2026-09-26T11-38-10.453Z-34348-43922b35.log`. TypeScript and
focused lint pass. The complete production module builds:3,376modules,8.44seconds,
with existing large-chunk warnings retained. Renderer/review metadata is refreshed
without sign-offs; the eleven-entry pilot retains all imaging blockers. This
source verification does not establish browser acceptance or hosted publication.
