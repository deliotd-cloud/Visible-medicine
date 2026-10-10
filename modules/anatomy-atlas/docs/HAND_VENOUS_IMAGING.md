# Hand venous CT/MRI teaching

Fourteen existing admitted bilateral sources gain 28 short draft CT/MRI topics:
four palmar venous arches, two dorsal networks, two grouped metacarpal veins and
six index/middle/ring proper palmar digital vein groups. No new mesh, component
identity, geometry, scan, registration, control, font or dependency is added.

The original complete source identity, ordered component hashes, bundle, frame,
licence and prior pending lessons are pinned against `dcd1e1cf`. Matching just a
name/FMA ID is insufficient. Compound identities stay compound; missing thumb
detail and withheld little-finger groups are not reconstructed or admitted.
Colour, explode position and labelled arch depth do not establish acquired
venous boundaries, drainage continuity, patency or flow. Compare relationships
at separation zero. No routine-scan visibility or diagnostic protocol is promised.

The same resolver supplies learner tabs and protected Clinical Review. Fourteen
teaching worksheets require fresh revision-bound radiologist review; imaging
approval stays absent. Atlas, imaging-case and paid-lecture rights stay separate.
All other topics, earlier reasoning/tours, anatomy, frames and source holds must
remain exact. Historical glottic assertions replay their completed milestone;
the new hand suite checks actual current teaching and the full transition.

## References and commercial-use boundary

This is original, bounded factual wording, not a copied diagram, scan, table or
literature dataset. No external media is downloaded, traced or redistributed.
Existing commercial-compatible model licences and credits remain unchanged;
new code/notes use the project's MIT terms. No new payment or mandatory fee.

- [TTUHSC upper-limb veins](https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html): factual dorsal drainage reference only. Its copyrighted table/artwork is **not** included.
- [Blum et al., 2021](https://link.springer.com/article/10.1186/s13244-020-00958-4): hand vascular acquisition context; no image, figure, scan or protocol reproduced. The article's arterial focus does not validate these venous meshes or all normal hand veins.
- [Disa et al., 1997](https://pubmed.ncbi.nlm.nih.gov/8982197/): indexed original ten-patient MR/MRA study, not proof of independently visible normal digital veins on routine MRI. Full indexed abstract available; a direct PubMed load returned a challenge. No paywalled material accessed or copied.

The 2022 Lhuaire hand-dissection paper was inspected during discovery and is
CC BY-NC-ND: **no assets, data, text or diagrammatic derivatives from it are
included, and it is not used as the geometry or teaching reference for this batch**.
Its microdissections cannot be treated as validated patient CT/MRI contours.

## Outstanding clinical validation

The owner radiologist must validate anatomical extent and relative position of
every grouped source, the appropriateness of each imaging landmark, limitations
of the actual acquisition, and any future clinical or pathological additions.
Acquired images need independent privacy/licensing clearance and registration
evidence. Signed-in desktop visual/GPU acceptance and actual camera flow are
separate from source tests and a production build. This batch does not certify
a complete venous atlas or supply an approved imaging case.

## Reproducible checks

From the Atlas source checkout, run the exact source pin check and full teaching
transition/safety test:

```sh
node scripts/pin-hand-venous-imaging.mjs --check
node scripts/test-hand-venous-imaging.mjs
node scripts/test-glottic-muscle-imaging.mjs
```

Generated renderer/review metadata must be current, with types, inventory and
production build verified before the later exact-commit website import. The
validation JSON records changed/preserved placements and negative-case results;
it is not a clinical approval or deployment record.
