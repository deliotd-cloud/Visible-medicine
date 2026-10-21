# Source-bound joint metadata check

`verify-inventory.mjs` independently joins the worker's 22 exact IDs, labels, filenames and available FMA IDs to three byte-pinned catalogues at clean Atlas `485df97c2530e8e81a8d39a5ee61073ce76d93db`. It verifies the named files against Git, preserves source credit/licences and unvalidated state, and keeps the common BodyParts3D frame and two UM catalogue scopes distinct. The shared UM archive does not establish registration to the whole-body atlas or patient imaging.

Run the command with the exact existing source checkout and worker inventory:

`node main/verify-inventory.mjs SOURCE_ROOT worker/inventory.json`

The metadata-only native tests require `ATLAS_SOURCE_ROOT` or `VM_ATLAS_SOURCE_REPO` pointing to that source checkout:

`node --test main/verify-inventory.test.mjs`

No dependency install, mesh decoding, network access or application import is required. Future revisions are deliberately refused until the input pins and inventory have been explicitly reviewed. This check does not authenticate arbitrary external datasets or perform clinical review.

The bounded evidence is 10 regional-context BodyParts3D records, 10 independent knee records and 2 independent lower-limb records. It is not a unique-structure count, a new source admission, a count of missing body anatomy or a completion percentage. The dedicated nine-entry shoulder index separately contains bones and muscles, not a separately indexed soft-tissue joint set. Grouped menisci and tibial cartilage remain grouped; raw filename spaces and source spelling remain unchanged.

Next useful work is to review the existing independent knee/hip tissue studies and their clearly disclosed limits, then pursue accepted sources for the most useful upper-joint labrum/capsule/cartilage/collateral gaps. Do not infer a missing named surface from a prose synonym, duplicate a prior broad asset search, rename a grouped surface into medial/lateral anatomy, or fabricate a CT/MRI mapping. The per-joint findings are provisional analyst notes scoped to these inspected metadata files, not exhaustive biological absence or a clinically approved curriculum. Any future source needs separate rights/provenance, geometry, laterality/grouping, frame, performance and radiologist review gates before admission.

The worker inventory is preserved unmodified. The deterministic report and mutation tests are separate main-owned evidence. No canonical source, model, mask, private review record, live Website or entitlement has changed.
