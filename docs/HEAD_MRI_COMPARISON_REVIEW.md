# MRI-only comparison review

The authorized **Workspace → Clinical Review → Head learning** page now includes
a collapsed **MRI-only comparisons · 4 draft bindings** packet above the teaching
notes form. This is read-only comparison evidence, not an approval mechanism.

## Independent identity

- Schema: `vm-head-mri-comparison-review-1`.
- Packet: `head-mri-only-comparisons`.
- Canonical JSON SHA-256: `599dcb6159ba58b16bd26d67810238155911c4d011dd03f7172faa554f6b531f`.
- Imported head manifest: `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
- Draft only; patient registration, clinical approval and publication approval are
  all false. Opening it records nothing.

Four concepts: left/right amygdala, corpus callosum and pituitary gland. Each
disclosure shows the exact native MRI ID, raw source label, laterality and mask
representation, plus the generic 3D structure ID, bundle and SHA-256. Source labels
are shown verbatim here as identity evidence, not restored as learner labels.
MRI and existing 3D targets open using the current canonical comparison links.

The MRI callosal mask is **partial**, not a whole corpus callosum segmentation.
No exact CT target is mapped for these four whole concepts. CT callosal subpart
points and the pituitary fossa cannot replace them. Different subjects and extents
must not be described as validated patient-space synchronization or scan-derived
3D geometry.

## Fail-closed loading

`verifiedHeadMriComparisonPacket` runs only after the page's existing clinical
review authorization and teaching-context checks. It requires the exact imported
head revision, exact native ID/label/laterality/representation, the full standalone
3D source tuple, canonical MRI route, absence of any CT binding and an independent
canonical packet digest. Any mismatch withholds all four comparison links and
shows an unavailable notice; it does not substitute a target or upgrade a decision.

The existing teaching packet remains 25 concepts at
`2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a`;
the five guided sequences remain at
`47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052`.
The teaching form cannot record a decision about these four comparisons. Any
future persistence/approval contract needs its own exact comparison revision,
authorized reviewer evidence and explicit scope. No clinical approval is inferred
from software verification or the owner's previous cosmetic acceptance.

## Boundaries and remaining validation

No native pixels, geometry, coordinates, private file references, new meshes,
illustrations, fonts, dependencies, database migrations or fees are introduced.
Existing commercial-compatible assets/notices are unchanged. No specialist masks,
accepted boundaries, desktop clinical PACS or access rules are edited.

The radiologist still needs to inspect native MRI extent/orientation/laterality,
generic target anatomy, partial-mask limits and comparison scope against these
exact revisions. Actual signed-in review and native-image clinical acceptance
remain distinct from synthetic desktop UI checks. Public deployment and any
spatial registration require separate approval and evidence.
