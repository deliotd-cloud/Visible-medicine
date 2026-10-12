# Orbital-apex CT orientation drafts

Twelve exact existing root-body selections receive CT-tab orientation drafts:
left/right superior and inferior oculomotor divisions, trochlear, frontal,
lacrimal and nasociliary nerves. These are anatomical landmark comparisons, not
acquired CT annotations, diagnostic visibility evidence or patient registration.
Both ciliary ganglia retain their existing pending lessons.

`lib/orbital-apex-ct.ts` uses the complete immutable identities and group labels
from `content/orbital-nerve-mri-pins.json`. The pin file's MRI topics, readiness
and review state confer no CT capability. Only exact matching records and the
CT tab can receive a draft; grouped/source identities, geometry and all other
topics remain unchanged. Pending research candidates are not dispatched.

## Primary evidence and limits

- [Daniels et al., Orbital apex: correlative anatomic and CT study (1985)](https://pubmed.ncbi.nlm.nih.gov/3877415/): inspected abstract reports matched cadaver coronal CT/cryosections and illustrated clinical CT. It does not supply a branch-specific sensitivity, routine detectability or protocol for these selections. The full journal PDF was inaccessible; no full-text findings are inferred.
- [Martins et al., Microsurgical Anatomy of the Orbit: The Rule of Seven (2011)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3335518/): original anatomical dissections support annular versus extra-annular routes and optic-strut/canal/fissure relationships. Applying those relationships as CT orientation is explicitly an educational comparison, not measured clinical branch visibility.

The additional 1995 osseous paper was located bibliographically but its full
content was not inspected; it is not used to support these drafts. No surgical
instructions, performance claims, pathology assessment, MRI visibility transfer,
image registration or model continuity validation is added. Use assembled
anatomy when comparing relationships; explosion is not a CT plane.

Only original factual summaries and reading links are included. No source media,
publication prose, data, scans, meshes, fonts, textures or dependencies are reused.
BodyParts3D credits and all clinical/source holds remain. Atlas, imaging cases
and paid lectures retain independent access.

## Verification and review

After the normal regional-teaching and review-display-pin generators, run:

```sh
node scripts/test-orbital-apex-ct.mjs
```

The test binds the actual committed ab8f5594 baseline, every complete source
identity and source mesh. It checks exactly 12 changed CT placements among
9,936 and 12 changed Review packets among 1,104, with all other topics/packets
preserved. Changed or incomplete identities, stale revisions, altered packets
and forged decisions must be refused before storage. Clinical validation remains
separate from automated content and security verification.

Radiologist sign-off must review the exact draft revision, source laterality,
branch/division wording, landmark relationships and modality limitations.
Accepted CT-head masks and boundaries remain with the specialist task. Any later
acquired-image teaching needs its own privacy/rights, visibility and correspondence
review; this batch supplies neither scan annotations nor spatial synchronization.
