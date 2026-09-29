# Selectable hippocampi

29 September 2026. Draft anatomy; not clinical approval.

The cerebral dissection now exposes the existing left and right hippocampal
surfaces (FMA72714/FJ1759 and FMA72713/FJ1807) individually. The original brain
aggregate and all previous cerebral/ventricular GLBs are unchanged. A separate
38,548-byte bundle contains 980 left and 1,020 right source triangles.

## Interaction

In Brain → Cerebral regions, use the Hippocampus L/R controls to select or hide
each side. The Hippocampi preset isolates both. Medial temporal context retains
the existing partial temporal source compounds; optional lateral ventricles
remain available. Rotation, explode, reset, selection labels, hide/show and undo
use the existing dissection controls. This adds no new page or pop-out.
Head-neck and whole-body delivery both include the same new bundle.

## Identity and source safety

- Exact original PART-OF definitions, parent file membership and SHA-256 hashes.
- Current source-hold policy applied; hippocampal formation aliases are not
  admitted again. Existing parahippocampal gyri are not duplicated.
- Same source frame; no fitting, scaling to patient data or position guessing.
- Both surfaces are closed oriented source meshes, without duplicate, collapsed
  or degenerate faces, boundary/nonmanifold defects or winding inconsistencies.
- Independent verification retains every oriented source triangle and checks
  zero identical faces against existing selectable cerebral geometry. This is
  not a claim of complete biological fidelity or absence of geometric proximity.
- All 106 previous nested review source tokens remain unchanged. The two new
  structures have their own review contexts and no inherited approvals.
- Source teaching for these new children is pending, not copied from Brain.
  The visible geometry-scope note is not comprehensive clinical teaching.

The runtime only appends the bundle when the parent, source frame, original
structures, original bundles, original selection IDs, version and licence match
the saved base. A stale base falls back to the prior cerebral catalogue.

## Clinical review required

Review shape, bilateral orientation and relationships to temporal cortex and
ventricular spaces. These coarse source surfaces do not resolve CA subfields,
dentate gyrus, subiculum, hippocampal head/body/tail labels or microscopic layers.
They cannot establish disease, atrophy, sclerosis or quantitative normal ranges.
Author and sign off structure-specific anatomy/function and clinical/imaging
lessons separately. CT/MRI registration and scan access remain unavailable until
the independent imaging and privacy gates are met. No CT-head masks were touched.

## Checks and delivery

`npm run hippocampi:test` checks source/GLB fidelity, original-asset preservation,
fail-closed guards, pending teaching, nested delivery and original source tokens;
the cerebral regression also exercises the rendered L/R controls, presets, undo,
context visibility and labels. Run normal nested-teaching/review and type checks.
Renderer revisions must be regenerated before module export. Website import and
browser acceptance are separate delivery steps; do not infer publication from
this source document.

See [third-party attribution](../LICENSES/THIRD_PARTY_NOTICES.md). No fonts,
textures, paid services or new software dependencies were added.
