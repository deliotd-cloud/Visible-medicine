# Right forearm arterial orientation

Four optional Guided learning stops compare the right radial and ulnar arteries,
common interosseous artery and anterior interosseous artery. Radius and ulna are
faded context. This is a teaching sequence within the existing forearm viewer;
the previous regional default and navigation controls remain available.

## Source and spatial scope

Six complete catalog identities and three existing bundle byte/hash records are
pinned to Atlas parent `f0d4f3622f967bb394a16e178339d6a30c02a5e0`. Each source
record already belongs to the forearm region. No geometry is mirrored, relabelled
or moved. Each camera frame includes its selected whole surface. The radial and
ulnar meshes extend into the hand, so those frames exceed a local forearm view.
The two short interosseous selections are framed separately. Radius and ulna
remain faded context; fading does not model a dissection plane. The player keeps
its existing eased 1.8-second transitions, reduced-motion behavior and manual
navigation. Optional playback allocates 14 seconds per stop.

The usual branching description is radial and ulnar from brachial, common
interosseous from ulnar, then anterior and posterior interosseous from common.
The posterior interosseous source, brachial bifurcation and nerve geometry are
absent from this sequence. Stop order does not verify a continuous lumen,
patency, flow, vascular variants or a safe procedural route. There is no
acquired scan, registration or clinical simulation.

Captions use original, concise wording based on primary university teaching
references:

- [TTUHSC forearm and wrist anatomy table](https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html)
- [TTUHSC upper limb artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html)

No university prose, tables or media are imported. Existing BodyParts3D CC BY
4.0 attribution and source holds remain; no new asset, dependency or fee is
introduced.

## Review and evidence

All six source surfaces remain anatomically unvalidated. Radiologist sign-off
must name the actual revision and review labels, orientation, branch statements,
framing, omissions and captions. Every participating selection binds the full
tour into its Clinical Review record. Changed source identities, bundles, tour
content and stale or tampered Review packets must be refused.

Run `node scripts/pin-forearm-arterial-tour.mjs --check` and
`node scripts/test-forearm-arterial-tour.mjs --source-only` for source-only
checks. After registry integration and exact-source Review generation, run the
full test script. It compares all 37 historical tours and 9,936 topic placements
with the pinned baseline and requires only six Review records to change. That
source result does not establish website delivery, browser/GPU acceptance or
clinical approval. Local recovery and verification logs belong under
`E:/VisibleMedicine-LocalStaging/20261009-forearm-arterial-tour/`.
