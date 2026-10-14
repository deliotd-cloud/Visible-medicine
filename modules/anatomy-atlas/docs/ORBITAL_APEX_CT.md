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

## Common tendinous-ring CT follow-up — 14 October 2026

Two further drafts cover the existing source-labelled left FMA49073/FJ1291 and
right FMA49072/FJ1342 selections, without adding meshes or acquired-image
annotations. `lib/orbital-ring-ct.ts` reuses only the complete immutable identities
of `family: ring` from `content/orbital-support-mri-pins.json`; that file's MRI
lessons, previous content and review state give no CT authority. Dispatch requires
the complete identity and CT topic, with no name, FMA or laterality fallback.

Martins supports the apical canal/fissure/strut relationships. Relating those
relationships to CT is explicitly an educational inference, not a measured
contour. The inspected Daniels abstract does describe annular anatomy in selected
CT studies; the draft therefore promises neither routine fibre-level visibility
nor categorical invisibility. No protocol or diagnostic performance is inferred.

The detailed boundary remains disputed: [Naito 2019](https://pubmed.ncbi.nlm.nih.gov/31675425/)
reports a three-rectus C-shaped origin with independent superior rectus, whereas
[Lacey 2022](https://pubmed.ncbi.nlm.nih.gov/35058545/) supports a common tendinous
origin, and [Ma 2022](https://pubmed.ncbi.nlm.nih.gov/36355368/) describes posterior
origins joining into a more anterior complete ring. These are specimen-based
anatomical studies, not validation of this source mesh or its appearance on a
patient scan. Measurements, variant frequencies and surgical instructions are
not transferred into the draft. Main-agent review inspected the indexed Martins
dissection text and the four primary abstracts on 14 October 2026; some PMC and
publisher pages were unavailable, so no additional inaccessible findings are
implied.

Only original factual summaries and source links are used. No publication prose,
figures, restricted derivatives, scans, models, textures, fonts or dependencies
are imported. Existing BodyParts3D credits, unvalidated-geometry holds,
independent access and revision-bound radiologist sign-off remain unchanged.

After the normal teaching/display generators, `npm run orbital-ring-ct:test`
compares with immutable source `a6797b2b0c850edc5f50918c9352c887209eac94`.
It must prove exactly two changed CT placements and two changed full Review
packets, preserving every other lesson/packet and refusing stale or forged
submissions before storage. Automated tests do not establish clinical acceptance.
