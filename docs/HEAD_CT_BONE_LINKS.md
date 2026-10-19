# CT-only skull-bone comparisons

9 October 2026. Local draft navigation; not clinical sign-off or registration.

Six CT partial-mask entries now link to existing generic 3D bones. The compact
linked-anatomy chooser labels them **CT only** and explicitly withholds MRI.
Native CT selection, completed practice review and exact generic-model selection
reuse the existing links. Active practice/guided/model-loading states still hide
comparison controls. No geometry, scans, masks, camera paths or teaching changed.

| Concept | Native CT ID | Generic suffix under `vm:anatomy:body:head-neck:` |
| --- | --- | --- |
| bone-left-parietal | cth.skl.parietal_bone.left | left:bone:left-parietal-bone |
| bone-right-parietal | cth.skl.parietal_bone.right | right:bone:right-parietal-bone |
| bone-left-nasal | cth.fac.nasal_bone.left | left:bone:left-nasal-bone |
| bone-right-nasal | cth.fac.nasal_bone.right | right:bone:right-nasal-bone |
| bone-occipital | cth.skl.occipital_bone | midline:bone:occipital-bone |
| bone-ethmoid | cth.skl.ethmoid_bone | midline:bone:ethmoid |

Each native tuple requires its full saved label (bone name plus ` — regional
mask`), ID, side and `partial-mask` representation. The head manifest SHA-256
remains `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
All six generic targets use study `1`, `head-neck-skeleton`, with verified bytes
`c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4`.
Midline bones use transport side `both`; paired targets require their own side.
Stale/duplicate/substituted generic query fields refuse named return navigation.
CT-only concepts are rejected on the MRI route, not silently redirected.

## Review boundaries

The CT regions are **not whole-bone masks**. Generic meshes may have different
extents and remain anatomically unvalidated. This is semantic comparison between
separate subjects, never patient-space synchronization or scan-derived anatomy.
Divided frontal and temporal masks are not mapped to whole generic bones.
Cerebellar hemispheres are not mapped to whole cerebellum.

The original 33 concepts and their teaching/review packets retain their identities.
These six links inherit no teaching, tours or approvals. The exact source/test
diff and metadata audit are review-ready evidence; this milestone does not add a
new persisted decision form to Clinical Review. Next: expose the six comparison
bindings as their own revision-bound review packet there, preserving existing
review scope and independent access checks. Before release the radiologist must
inspect each saved CT region and generic target for side, extent and educational
usefulness; signed-in real-scan/model acceptance remains separate from tests.

## Evidence and recovery

`E:/VisibleMedicine-LocalStaging/20261009-ct-bone-links` contains the exact
metadata-only audit, focused regression/type/build evidence and scoped source
checkpoint. The private manifest was not copied; no scan/mask pixels or private
geometry were read for this change. Tests use synthetic anatomy tuples and verify
the existing licensed public generic bundle bytes. No new dependencies, fonts,
models, images, licence obligations or fees. Local-only Sites workflow; no public
deployment or verified GitHub/off-device backup.
