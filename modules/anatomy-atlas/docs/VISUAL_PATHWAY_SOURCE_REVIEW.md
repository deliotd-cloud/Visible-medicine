# Optic chiasm and tract source review

Integration update: these three source surfaces now have an explicitly exported runtime derivative in [Optic chiasm and tracts](VISUAL_PATHWAY_DISSECTION.md). The prototype and its non-admission sidecar remain unchanged under `content/prototypes/visual-pathway/`, outside `public/`. The source-stage checks and counts below describe the earlier preparation milestone, not current displayed coverage; anatomical/device review remains open.

## Exact source scope

| Concept | Source files (IS-A, BodyParts3D 4.0) | Triangles |
| --- | --- | ---: |
| Optic chiasm, FMA62045 | FJ1771 + FJ1818 | 1,788 |
| Right optic tract, FMA62382 | FJ1820 | 2,332 |
| Left optic tract, FMA67936 | FJ1773 | 2,336 |

The source defines one chiasm using two closed halves. Their seam is preserved, not fused or filled; the halves are not separately labelled as crossing fibres. The small near-midline extent of the left tract is retained. No optic nerve, optic radiation, retinotopic subdivision, lesion territory or tractography streamline is generated. Existing optic-nerve source holds are unchanged.

## Provenance and rights

The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and [v4 description](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) were checked on 10 September 2026. The archive specifies CC BY 4.0 and the existing required credit: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Commercial distribution must retain the licence, credit and modification notices. This does not guarantee anatomical accuracy or imply institutional endorsement.

All four official index tables were downloaded read-only and matched the committed size/hash evidence. Four OBJ files were retrieved from the official IS-A archive with entry size/CRC verification. Exact raw-file hashes, names, aliases, table hashes and archive URLs are recorded in `visual-pathway-source-audit.json`. No diagram, scan, texture, font, dependency or paid API was added. This is source-mesh processing, not AI-inferred anatomy.

## Geometry checks and limits

The audit screens all 1,022 root bounds and 424 distinct nested source files across eight study families. It records 64 root comparisons, 38 nearby nested-source comparisons and all three candidate pairs, using source-coordinate triangle comparisons and bounded bidirectional surface samples. Four extent-compatible neural references receive translated diagnostic comparisons; all fail the similar-shape criterion. None of those translations is applied to the prototype.

All four source files have closed, consistently oriented combinatorial topology with no duplicate, collapsed or degenerate faces. There is no direct root/nested ownership or exact represented inventory match. No exact shared triangle was found in the compared root, nested or candidate surfaces. These checks do not prove absence of self-intersections, continuous overlap or anatomical segmentation errors.

Important findings remain explicit:

- About 28% of sampled chiasm vertices lie within 0.25 mm of the supplied brain aggregate. Do not render the solid aggregate over the new study and call that a new layer boundary.
- The tracts lie close to both lateral and medial geniculate surfaces. Proximity does not prove termination, functional connectivity or correct subdivision. Do not draw connections or silently replace geniculate geometry.
- The chiasm consists of two separately closed components. The exporter preserves that construction; it does not establish axonal crossing.
- Centre-side checks agree with the source names, but are not independent laterality or clinical validation.

All 6,456 triangles are retained in source order, welding only identical coordinates for display normals. No tolerance welding, smoothing, face deletion, scaling change, mirror generation or repositioning is performed. The existing source-to-scene transform is used. A GLB reload verifies every position and index; maximum round-trip error is 0.000023942 mm, a numerical serialization result, not a medical accuracy estimate.

Prototype: `visual-pathway-prototype.glb`, 120,020 bytes, SHA-256 `c85eb132948e1b9ad8d6b618c95f04f6772a36268a9583f892d91b1f3df1598b`. Its sidecar retains source IDs, colours, bounds, exact hashes, CC BY credit and `prototypeOnly: true` / `admitted: false`. Audit SHA-256: `5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6`.

## Reproduction

1. `node scripts/audit-visual-pathway-source.mjs --download` retrieves the four candidates through the verified archive reader. Root/nested reference OBJ files must already be available from the documented atlas ingestion cache. Missing or hash-mismatched reference files stop the audit; none is silently skipped.
2. `node scripts/audit-visual-pathway-source.mjs --check` verifies the report against the unchanged geometry, tables and hold policy.
3. `node scripts/export-visual-pathway-prototype.mjs --check` regenerates in memory and verifies the existing prototype bytes and sidecar. The default export refuses to overwrite an existing destination.
4. `--record` checks the existing artifact before refreshing its derived validation receipt. It does not approve or publish anatomy.

## Original integration plan and remaining clinical gates

Add these three selections to the existing brain workspace using its compact study selector, with source-bound search and return navigation. Suppress the solid brain aggregate and reuse hide/restore, cutaway, separation, origin guides and history. Keep the chiasm as one compound. Do not present a complete visual pathway or infer fibres from the seam.

Pin the exact prototype/source records, extend identity/teaching/learning registries without changing historical bindings, and verify affected interaction helpers/components. Use primary references for original teaching and retain the geniculate-boundary limitations. Specialist anatomical review and actual browser/device acceptance remain separate open gates. Clinical release and patient CT/MRI correspondence require their own reviewed inputs; Atlas and paid-lecture access remain independent.

The live model, all 98 public/archive GLBs, 60 nested selections, teaching, review records and production learning manifest are unchanged. Source-controlled GLBs total 99 including this nonpublic prototype: a storage count, not newly displayed anatomy or completion.
