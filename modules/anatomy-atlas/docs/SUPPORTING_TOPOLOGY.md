# Supporting-source connectivity and full-point contact

This audit follows [the sampled tendon/thumb geometry screen](SUPPORTING_GEOMETRY.md). It changes no source mesh, admission, hold, anatomical coordinate or runtime control. The atlas remains at 1,022 body entries and nine dedicated shoulder entries. The outcome is a more specific source-review packet, **not clinical approval**.

## Findings and next decisions

| Source | New exact-coordinate evidence | Decision |
| --- | --- | --- |
| FMA54159 / FJ1343, right levator tendon | One connected closed, consistently oriented component under the combinatorial checks. 96.97% of all 1,384 unique vertices are within 0.25 mm of existing levator FMA49048; the triangle-centroid area-weighted estimate is 96.96%. | Keep out pending parent/component adjudication. A separately triangulated source can closely follow an already represented surface without sharing exact triangles. Do not double-import or infer a valid muscle/tendon split. |
| FMA258850 / FJ1581, right intermediate tendon | Two disconnected components: a main 466-triangle surface and an isolated opposite-facing triangle pair. | Parent muscle remains unspecified by the checked source evidence. Keep out; neither position nor the generic subtype name justifies a digastric label. Do not silently remove the extra piece. |
| FMA65198 / FJ1514 and FMA65199 / FJ1514M, superficial thumb-flexor heads | Each has 15 edge-connected components after exact-coordinate seam welding: a 606-triangle main component, an 86-triangle secondary component, two smaller closed components and 11 isolated opposite-facing triangle pairs. | Keep out pending component/extent and parent-head adjudication. The main component supplies about 98.5% of the stored triangle area, so the findings do not imply 15 equally significant anatomical parts or that the named muscle is wholly wrong. No fragment is removed, merged or mirrored. |
| Held whole-FPB alternatives FMA37389 / FJ1469 and FMA37388 / FJ1469M | Each has 12 components, including 11 opposite-facing triangle pairs, in addition to the already documented source-label/coordinate side mismatch. | Existing laterality holds remain. Alternative names or aggregate aliases do not bypass them. |

Six existing context sources were also examined to interpret contact: FMA49048, FMA59091, FMA37390/FMA37391 and FMA40120/FMA40121. The existing levator has one tiny doubled-triangle fragment beside its main component. Each existing opponens has 17 such fragments beside its main component. The tarsal plate and both retinacula have no such duplicates in these checks. These are precise existing-source quality findings for review, not an instruction to remove anatomy or a proof that an entire structure is incorrect. Their raw/runtime geometry remains unchanged.

Thumb-head contact is strongly affected by sample weighting. For each side, 36.22% of all unique head vertices lie within 0.25 mm of the opponens, versus a 19.89% triangle-centroid area-weighted estimate. The corresponding retinacular values are 22.05% and 3.27%. A vertex fraction is **not contact surface area**; an area-weighted centroid fraction is still only quadrature. Neither unsigned distance method distinguishes physiological adjacency from penetration or duplication. No automatic admission threshold is inferred from these numbers.

## Method and provenance

`scripts/source-topology.mjs` reads the existing prepared OBJ arrays and builds an analysis-only exact-coordinate remap. No approximate welding or geometry editing occurs. It counts unique/unused vertices, edges, connected face components, unoriented duplicate faces, degenerate/collapsed faces, boundary edges, over-subscribed edges, inconsistent edge winding and disconnected vertex fans. Per-component bounds, triangle area and algebraic volume are reported for diagnosis. Algebraic volume is **not enclosed/clinical volume** for open, intersecting or inconsistently oriented surfaces. Combinatorial manifold checks do not establish absence of self-intersections or anatomical correctness.

A conservative bounding-box tree accelerates exact nearest-triangle distances. Every stored unique vertex and every triangle centroid is queried in both directions for the six previously flagged pairs and two held-control comparisons. The tree changes the search cost, not the geometry or distance definition. Triangle area weights reduce vertex-density bias but do not perform continuous contact-area integration. No scan, volumetric segmentation or patient coordinate transform is introduced.

`content/supporting-topology-audit.json` pins the prior sampled audit, full catalogue and canonical algorithm hashes; twelve source records retain their exact raw SHA-256 identities. Regeneration reads the already verified local source cache only, without downloading alternatives. Candidate ownership and historical holds remain in the preceding inventory/geometry evidence.

The official [IS-A relationship table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_inclusion_relation_list.txt) was rechecked on 7 September 2026. Four observed subtype rows are preserved in `content/supporting-source-relationships.json`, explicitly as bounded web-extracted evidence with no claimed raw-document hash. Their endpoint names agree with the pinned v4 index. These rows are **not attachment or PART-OF proof**. No absence claim or full-graph completeness is inferred from a web search. Relationship-driven admission would require a version-pinned full graph and source-specific component evidence.

The official [BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) continues to specify CC BY 4.0 and DBCLS attribution. Existing commercial-distribution and adaptation notices remain. This work adds original audit code and derived evidence only: no dependency, font, texture, model, paid service, copied diagram, patient data or private review record.

## Reproduction and acceptance

- `npm run supporting-topology:test`: 3,466 portable checks on synthetic topology/distance fixtures, report invariants, source identities, pair coverage, current non-admission and bounded relationship evidence. The raw source cache is not required.
- `node scripts/validate-supporting-topology.mjs --raw-source`: 3,467 checks, including byte-pinned reproduction of every source/component and all-point contact result.
- `npm run supporting-topology:audit`: regenerate the report from the checked local raw cache.

Fixtures include a closed tetrahedron, missing face, flipped face, duplicated face, opposite-facing sheet, separated components, two closed surfaces touching at a single vertex, cracked seams, orientation/translation invariants and degenerate-distance rejection. Three thousand accelerated point queries agree with exhaustive installed-Three nearest-triangle queries. The all-point report is independently tied to the preceding source hashes and catalogue.

This closes the scheduled bounded connectivity/full-point screen. These candidates now require new source/component evidence or specialist adjudication; do not repeatedly rerun the same audit as if that constitutes further progress. The next executable product milestone is dedicated-shoulder navigation consistency, preserving the shared model-first, compact-control design. Wider source-quality review can use this method when a specific candidate or observed defect warrants it. No clinical, browser or GPU acceptance is claimed here.
