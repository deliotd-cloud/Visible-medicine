# Elbow collateral and recurrent arteries

The **Elbow & forearm**, **Shoulder & arm** and **Whole body** workspaces now
include 14 additional selections: both sides of the inferior/superior ulnar
collateral, radial/middle collateral, radial recurrent and anterior/posterior
ulnar recurrent arteries. Search, labels, isolation/fading, removal with Undo/Redo,
separation, source-bound study links and the existing arterial panel are reused.
There is no new permanent toolbar or control panel.

**Arterial connections** links the supplied same-side parent and typical
communications. **Show available connections & bones** creates a reversible
local study. A parent outside the current region is explicitly linked to the
whole body, not silently inserted into the region or presented as absent.
The existing recurrent interosseous selection participates in the middle
collateral comparison; its missing posterior interosseous trunk remains missing.

## Source evidence

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution
4.0 International. [Official terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
were checked on 12 September 2026. The original IS-A v4 archive supplied all
14 complete one-file definitions; directory entry sizes/CRC values match the
pinned official inventory. Original OBJ copies remain in
`content/sources/elbow-arteries`. No competing atlas mesh or private scan was used.

The [replayable audit](elbow-artery-source-audit.json) records source hashes,
definition memberships in both trees, topology and spatial comparisons. It
screens the 1,087 prior root envelopes and proposed pairs, with 276 bounded
comparisons. Each candidate has one closed-oriented combinatorial component,
consistent source laterality, no direct owner or known source hold, and no
detected exact shared triangles or translated-duplicate signature in the screen.
These tests do **not** prove self-intersection freedom, donor identity/course,
anastomosis, continuous lumen, flow or anatomical correctness.

The 353,176-byte GLB retains all **18,606 triangles**, their order and winding,
using the established source-to-scene matrix, exact-coordinate indexing for
normals and Float32 storage. No smoothing, mirroring, bridging, fitting, face
deletion or invented nerve path. SHA256:
`f8c7361dd6d9f089937df2d879c9851cc2346353bafe2600da871a04f8a0060d`.

## Teaching and verification

Seven concise original concept drafts supply Anatomy, Function and self-checks
for the 14 selections; [UAMS](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/)
is a factual reading reference, not redistributed artwork, tables or article
text. Imaging, pathology and clinical sections explicitly remain pending.
The graph adds seven paired parent relations and four paired communications,
without assigning flow direction to an anastomosis. Clinical approval is false.

`npm run elbow-arteries:test` replays source evidence and export, compares every
ordered GLB face corner with the original OBJ, verifies source-vertex anchors,
42 study links, removal/Undo/Redo, same-side reciprocal navigation, exam
suppression and changed-source rejection. A pinned pre-admission comparison
preserves all 1,087 existing display records and 9,783 teaching slots exactly.
The broader arterial suite covers the expanded graph and actual panel callbacks.
Its historical teaching checksum was already stale before this change; the
`--baseline` check reproduces the same current digest with the prior source
branches before accepting the corrected expectation.

All 1,101 current body exports separately pass the content schema and identity
registry checks; current source-hold regressions also pass. The broad legacy
`validate-content-contract.mjs` suite still stops at its older deferent-duct
review-document checksum. The same failure was reproduced against source
`e2b3ff0e5c9d310455c7caf7ba5726a5af5b2f3f`, with all six review/history inputs
unchanged. That historical reconstruction needs a separate evidence-preserving
repair; this change does not refresh its expected checksum or migrate approvals.
The full legacy suite is **not** reported as passing.

Actual browser sampling on `/regions/forearm`: selected radial recurrent and
radial collateral sources; followed their communication; checked the parent
outside-region link; displayed local connections/bones; changed side; exercised
35% separation and reset; searched for inferior ulnar collateral; isolated and
framed the right-sided source with faded context. At 390×844 the model, projected
label, camera/separation controls and compact drawers remained visible. This
is not physical-touch, all-device, all-structure or clinical acceptance.

The regenerated reference ledger records **1,101 root selections**, 104 nested
selections and 366 source pieces needing source/anatomical review. Three older
right-MCA PART-OF files (FJ1662, FJ1663, FJ1692) still lack IS-A equivalence proof
in this comparison; they are not counted as proven equivalents. No source hold
was released. These counts are not anatomical completeness.

## Remaining review

The radiologist must review each new identity/course/extent, side, parent and
communication, source gaps/variants, usefulness of separation and draft teaching
at its actual revision. Finite generic surfaces are not patient registration,
CTA/MRA, a collateral-flow assessment or intervention guidance. The main website's
three contained pilots are unchanged by this regional addition. Source backup,
standalone publication and clinical sign-off remain separate outcomes, recorded
in the coordinating task's dated checkpoint.
