# Independent CT facial-bone comparisons

Three draft semantic links extend the existing integrated Atlas:

| Concept | Exact native CT identity | Existing generic 3D target |
| --- | --- | --- |
| Left zygomatic bone | `cth.fac.zygomatic_bone.left` · limited region · partial-mask | `left:bone:left-zygomatic-bone` |
| Right zygomatic bone | `cth.fac.zygomatic_bone.right` · limited region · partial-mask | `right:bone:right-zygomatic-bone` |
| Mandible | `cth.fac.mandible` · regional mask · mask | `midline:bone:mandible` |

The 3D IDs use prefix `vm:anatomy:body:head-neck:`. All three targets belong to the
existing `head-neck-skeleton` bundle, SHA-256
`c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4`.
Native ID, exact raw label, side and representation were checked against the
pinned head manifest
`0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
No scan or mask bytes were modified or read for this metadata comparison.

These are **different-subject semantic comparisons**, not patient-space
synchronization. Limited zygomatic regions are not complete bones; a mandible
`mask` representation does not prove complete anatomical coverage. No MRI target,
fracture assessment, new teaching or guided sequence is inferred. Divided frontal
and temporal regions remain unmapped rather than substituted with a whole bone.

## Review

Open `/workspace/clinical-review-inbox` or
`/workspace/atlas-review/head-learning#ct-facial-bone-comparisons` while signed in
with the existing authorized review account. The independent draft packet has
revision `63984aa3eadf24ca1ca012b8cc08e6b227507b9db0411aed0ceae31636ccbaf7`.
The inbox adds one packet-inspection row and three personal decision rows. The
prior 55 additional rows remain; there are now 59. Evidence stays collapsed and
forms/history load only after an explicit review action.

Inspect each actual native CT extent with overlays hidden/shown, independently
inspect the generic mesh and laterality, then judge whether the comparison is
educationally useful. Record limitations and corrections. Personal semantic
acceptance does not approve either geometry, diagnostic use, registration,
teaching, publication, or access to a paid resource. Existing account/institution
authorization and append-only, version-bound saves are unchanged. No actual
review decisions were written during development.

The original six-bone packet, six decision contexts, teaching and two tours retain
their exact original revisions. New comparisons have a separate packet family;
cross-family submissions are rejected. Duplicate native targets now resolve to
unavailable instead of selecting the first match. The native package importer
also retains its existing duplicate-ID refusal.

## Verification and licensing

Focused source, navigation, packet, decision API, actual component and inbox
tests use synthetic requests/in-memory storage. Tests are not clinical or browser
acceptance. Actual head metadata is checked locally against its recorded hash;
the public packet contains anatomy identities only, not pixels, private scan
metadata, coordinates or mask derivatives.

No dependencies, fonts, textures, meshes, images, source prose or reference assets
were added. Existing commercial-use notices and model credits remain unchanged.
No paid service, new fees, desktop clinical PACS edit or public deployment.
The Sites workflow is local-only. Evidence is under
`F:/VisibleMedicine/staging/20261015-ct-facial-links`.
