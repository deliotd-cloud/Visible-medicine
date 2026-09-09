# Orbital nerve and cerebral artery spatial review

This follows the [exact-source geometry screen](SOURCE_GEOMETRY_SCREEN.md). It adds source-coordinate evidence for four candidates; it does **not** add them to the atlas or certify their anatomy. The existing 1,022 body representations, 87 total GLBs, teaching, interface and paid-resource boundaries remain unchanged.

## What was checked

The [reproducible spatial report](../content/candidate-spatial-audit.json) screens all 1,022 displayed definitions and all 48 held-file bounds. It loads 69 relevant or explicitly selected comparison structures/components, then measures 84 candidate-to-context pairs and ten extremity-band comparisons. Original source hashes are checked before geometry is read. Two source-only anterior choroidal parent arteries are included as controls, not admitted anatomy.

Every candidate's unique stored vertices and triangle centroids are queried against target triangles. Reverse comparisons sample up to 128 target vertices. Degenerate target faces retain their original edges/points in distance queries. Conservative scene-to-source bounds use a 2.01 mm margin; original source bounds use 2 mm. Explicit ganglion, globe, long-ciliary, parent-artery and carotid controls are compared regardless of distance. These are diagnostic search margins, not clinical tolerances.

No pair shared an exact triangle or met the declared broad-near-contact screen (at least 25% of either sampled vertex direction or candidate area-weighted centroids within 0.25 mm). That result is **not proof that surfaces do not intersect or that the candidates are correct**. Smaller local contacts and full enclosure can escape that screen.

## Findings that affect the next step

| Source candidate | Measured relationship | Interpretation and remaining work |
| --- | --- | --- |
| Short ciliary nerve, FMA7041: FJ1319/FJ1370 | Each file has two exact-coordinate components. Ganglion-side geometric end bands approach the same-side ganglion by roughly 0.22–0.31 mm at their nearest sampled points. | Plausible local context, not verified nerve origin, terminal fibres or completeness. Keep the original paired, unsided definition; do not invent separate sided IDs. |
| Same nerve candidates and globe | Opposite end-band nearest distances to the whole displayed eyeball surface range approximately 1.77–2.95 mm. Other points along the candidate are much closer to the globe. | Unsigned distance does not establish an empty gap. Points can lie inside a closed organ surface. Source projections overlap the globe; that is not a depth/containment proof. Review course and actual layer relationships, without extending or snapping the nerves to make contact. |
| Same nerves and held optic-nerve surfaces FJ1772/FJ1819 | All candidate vertex samples lie within approximately 1.71 mm of these held surfaces; about 20–23% are within 0.25 mm. | Proximity warrants focused source/anatomical review even though the 25% broad-contact threshold is not crossed. It is neither automatic clearance nor proof of duplication. Do not import the disputed optic-nerve sources as a shortcut. |
| Internal-capsule artery branches FJ1674/FJ1674M | Lower source-Z end bands approach their source anterior choroidal parent arteries to about 0.009 mm. | A useful connection candidate, not proof of shared lumen, wall continuity or correct territory. The parent arteries are currently absent from the atlas and need their own full admission review. |

End bands use each exact-coordinate connected component's longest source axis, with width no greater than 1 mm. They are geometric inspection samples, **not anatomically validated terminals**. Area-weighted centroid fractions are quadrature estimates, not exact areas of contact. No signed containment, continuous intersection, reindexed/translated-shape equivalence, vascular-territory or patient-registration claim is made.

The eye controls were chosen using the university account of short-ciliary connections between ciliary ganglion and eyeball: [TTUHSC eye anatomy reference](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html). Parent-artery/carotid context follows published anatomical investigation of anterior choroidal artery origins: [anatomical study, PubMed 16425152](https://pubmed.ncbi.nlm.nih.gov/16425152/). Checked 9 September 2026. These sources guide which relationships to inspect; they do not validate the BodyParts3D geometry. No reference table, figure, article prose or clinical protocol is reproduced.

## Reproduction

```sh
# Existing verified source cache:
npm run candidate-spatial:audit
npm run candidate-spatial:test
npm run candidate-spatial:test -- --raw

# Fresh/incomplete cache: verify the pinned official archive directories,
# fetch only the required original members, then reproduce the same report:
npm run candidate-spatial:audit -- --fetch
```

The standard test checks the pinned report, current source bindings and distance calculations against analytic and brute-force controls, including collapsed faces/points and disconnected components. `--raw` reproduces all comparisons from the cached source bytes. No network is used by either test. The fetch audit uses the official v4 HTTPS archives with directory-digest, member CRC/size and expected SHA-256 checks. It fails if evidence changes, never repairs a source, and writes only the supplemental report.

## Rights and next admission work

All mesh measurements derive from the existing BodyParts3D v4 source under CC BY 4.0. Required credit remains: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**. Parent-control bytes are pinned in the report generator: FJ1658 (`19a51b68f4f0f58bb86302bbf3d8eb39f26158e2f7d5cd752f85b3adf94eddaf`) and FJ1658M (`14087bbb463ac93b83165ac19c577188f0c4b07f89bed60e42a1197041ca7342`). Neither is copied into the public model directory. No paid service, dependency, font, texture, patient scan or publisher illustration is added.

Next, assess the complete anterior-choroidal source pair against existing arteries and its branches; separately adjudicate orbital nerve course, globe-layer entry and the paired source identity. The source inventory also identifies existing eyeball components (for example cornea, iris, lens and sclera) as represented-but-not-selectable; separating validated components could improve true eye dissection without inventing new surfaces. Each change needs a deliberate source-identity/overlap review, preserved historical evidence, appropriate dissection/selection behaviour and qualified clinical review before clinical use. This report grants no automatic admission or new source hold.
