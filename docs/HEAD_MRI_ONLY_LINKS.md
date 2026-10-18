# MRI-only comparisons with the existing 3D Atlas

8 October 2026. Local draft navigation, not clinical sign-off or registration.

The linked picker contains 29 concepts: the existing 25 CT/MRI comparisons,
plus left and right amygdala, corpus callosum and pituitary gland on MRI only.
The new options say **MRI only**. Opening a mapped 3D focus offers MRI, with
an explicit notice that no exact CT comparison is mapped. The MRI structure
panel and completed practice review offer the existing generic 3D target,
without an empty or invented CT link. No masks or geometry were changed.

## Exact identities

Each entry must match the saved raw label (name below plus ` — regional mask`),
ID, representation and laterality. Head manifest SHA-256 remains
`0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.

| Concept | MRI ID | Raw name | Representation | Side |
| --- | --- | --- | --- | --- |
| `limbic-left-amygdala` | `mrb.dgm.amygdala.left` | Left amygdala | mask | left |
| `limbic-right-amygdala` | `mrb.dgm.amygdala.right` | Right amygdala | mask | right |
| `commissure-corpus-callosum` | `mrb.wmt.corpus_callosum` | Corpus callosum | partial-mask | midline_or_unpaired |
| `endocrine-pituitary-gland` | `mrb.orb.pituitary_gland` | Pituitary gland | mask | midline_or_unpaired |

All use standalone generic Atlas study `1`, not a new or reconstructed model.
The amygdalae and corpus callosum bind to `head-neck-nerves-deep-brain`, hash
`6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c`.
Their IDs end in `{side}:organ:{side}-amygdala` and
`midline:organ:corpus-callosum` under `vm:anatomy:body:head-neck:`.
Pituitary binds to `unpaired:organ:pituitary-gland` under that same prefix,
`head-neck-organs-recovery`, hash
`7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915`.
Generic midline and unpaired targets both use transport side `both`.
Full study, structure, side and bundle hash are required for named return links;
stale, duplicate, substituted or unsupported nested fields are rejected.

## Deliberately not equivalent

CT genu/body/splenium point locators are not the whole corpus callosum.
The pituitary fossa is not the pituitary gland. No CT amygdala entry is mapped.
The regional MRI callosal mask is not a certified whole-structure boundary.
Neither these labels nor the generic meshes delineate internal nuclei, fibre
connections, gland subdivisions or function. Whole cerebellum remains withheld
from hemisphere-only entries. A matching name never establishes equal extent,
patient-space correspondence, normal tissue or clinical approval.

## Review and recovery

The original 25 bindings, teaching packet and five ordered guided sequences
remain unchanged. These four new comparisons do not inherit teaching approval
or acquire an unsourced note/tour. Radiologist review must check each exact
MRI identity, regional extent and generic target before release. Future teaching
for these concepts needs its own factual sources and revision-bound review.

Local evidence: `E:/VisibleMedicine-LocalStaging/20261008-mri-only-head-links`.
The metadata audit reads the private manifest in memory, records only allowlisted
anatomical identities/counts/hash, and never copies it or scan derivatives.
Source-only E recovery is on the same computer, not GitHub/off-device backup.
Existing licensed generic assets/notices remain unchanged; no new data, model,
font, texture, dependency, licence obligation or mandatory fee was introduced.
