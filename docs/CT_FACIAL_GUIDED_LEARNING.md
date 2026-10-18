# Facial bone guided learning

Local draft, 15 October 2026. No clinical, privacy or publication approval is
conferred by this guide or by its existing comparison decisions.

One independent sequence, `ct-facial-coverage`, adds three stable ordered slots:

1. `bone-left-zygomatic`
2. `bone-right-zygomatic`
3. `bone-mandible`

These were the three mapped 3D concepts absent from the earlier twelve linked
guides. All 42 mapped concepts now appear in a guide; this is mapped catalogue
coverage, not anatomical completeness or segmentation quality.

The sequence uses the existing native CT and generic 3D bindings without changing
their masks, boundaries, source identity or geometry. Both zygomatic masks are
limited regions. The regional mandible mask does not establish whole-bone
coverage. Native orientation markers, adjacent slices and overlay-free inspection
remain necessary. No exact MRI target is available. Order is editorial, not a
continuous anatomical pathway. There is no patient-space registration, fracture
assessment, diagnostic rule, score or completion record.

## Revision and interface

Head manifest: `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
Independent comparison: `63984aa3eadf24ca1ca012b8cc08e6b227507b9db0411aed0ceae31636ccbaf7`.
Sequence: `c3c4b999e726c585c96a989dc3c1a2cf2b5991e2160c138b2977c7e06dbaae83`.

The earlier twelve sequence IDs, slots and packet revisions remain intact. The
guide is appended to existing selectors and searchable linked learning. Missing
CT entries retain their canonical slots rather than substituting another mask.
CT/3D handoffs carry allowlisted concept/source/step metadata, not coordinates,
scan identifiers, quiz answers or scores. MRI has no fabricated fallback.

Private Clinical Review exposes a collapsed inspection-only evidence section at
`/workspace/atlas-review/head-learning#ct-facial-learning`, plus one independent
inbox row. This section records no approval and reads no decision history. The
existing authorized review route and independent entitlements remain unchanged.
The normal website review integration is rebound to the changed page and all
three new guide inputs. Old source packets are retained; no saved decisions are
modified or migrated. Renderer-bound decisions may correctly require re-review
under the new integration identity rather than being silently inherited.

## Remaining acceptance

The radiologist should inspect the exact sequence and native images, the side and
extent of both zygomatic masks, the mandible coverage and the separate-subject 3D
comparison. Approval of an individual semantic comparison does not approve this
sequence. Signed-in desktop/browser and accessibility acceptance remain separate
from automated component, source, build and anonymous HTTP checks.

No assets, fonts, models, textures, datasets, dependencies or services are added;
there are no new third-party licensing obligations or fees. Existing notices and
source restrictions continue to apply. Nothing is deployed publicly.
