# Source-component hold safeguards

This is an import-safety improvement, not a new anatomical admission or clinical approval. All 1,022 displayed body representations, 86 body mesh bundles, the dedicated shoulder model, anatomical IDs, teaching and interface remain unchanged.

## What changed

The original inventory assigns holds to particular concepts. A broader parent can contain one of their disputed files while still being classified as `unused-available`. That availability status describes the archive, not permission to render the anatomy.

The new screen propagates each hold to every definition containing the same component **in the same source tree**. It blocks explicit held identities, parent aliases and partial selections containing a held component. Relabelling, an unknown concept, a file outside its pinned definition, duplicate files and empty selections are rejected. It never trims a source group to make an import pass.

The [reproducible audit](source-hold-audit.json) screens 4,273 definitions: 38 have direct holds and 87 additional definitions contain held components (125 blocked in total). Nineteen of these remain correctly recorded as `unused-available` in the historical availability inventory. Examples include whole flexor pollicis brevis, optic-nerve parents and anatomical-line/tendon aggregates. None of the current 1,022 displayed source selections collide with these same-tree holds.

## Reproducible workflow

1. Run `npm run source-holds:audit` to regenerate the separate report from committed evidence. No network requests or mesh writes occur.
2. Run `npm run source-holds:test` for rejection cases, parent/subset propagation, source-tree separation, preserved exclusions and the actual importer selection path.
3. Run `node scripts/ingest-full-body.mjs --preflight-only` to check all proposed full-body selections without downloading, transforming or exporting geometry.
4. Only after the other rights, geometry and anatomical review gates are satisfied, run the full importer. The same preflight runs before archive access, geometry transformation or output creation. An unexpected hold stops the whole import instead of silently omitting a component.

The importer now builds selections from the retained official v4 tables, verified against their recorded byte counts and SHA-256 hashes. The inventory is also checked against the current catalogue and reconciled against the active hold definitions. A stale inventory fails closed; update it deliberately with the existing inventory audit and review any changed evidence before proceeding. Restore the committed catalogue/inventory when reproducing this release; the safety check does not bootstrap from an empty output directory.

The four pre-existing excluded records remain exclusions. Their IDs, source trees, names and component lists must match the retained evidence. They are not eligible render targets and cannot serve as a general bypass for newly held candidates.

## Limits and next admission requirements

- `no-known-source-hold` deliberately does **not** mean approved, accurate or anatomically complete.
- File identities are tree-specific. Matching `isa`/`partof` filenames alone are not geometry equivalence. The existing central-canal surface remains a canal representation, never a complete spinal cord.
- Only one of the 48 held tree-specific files has an existing geometry fingerprint in the historical inventory; 47 are unknown at that level. This original screen neither downloads nor fingerprints them. The subsequent [source geometry screen](SOURCE_GEOMETRY_SCREEN.md) records verified fingerprints for all 48 in a separate report, including cross-tree exact matches. Neither pass detects reordered, translated or near-overlapping alternatives, and the importer policy is unchanged.
- Before adding a candidate, verify its exact bytes against source/archive evidence, compare its geometry with held and displayed surfaces across both trees, review source-version drift and confirm anatomical extent, boundaries and laterality. Any disputed component or alias needs explicit expert adjudication; do not mirror, relabel, truncate or infer absent tissue.
- Preserve licence/credit requirements, source hashes, transformation logs and draft review status. Browser/device acceptance and qualified clinical review remain separate requirements.

No application dependency, model, font, texture or dataset was added. No CT/MRI/X-ray/US data, paid lecture content, access grants or private review records were imported or changed.
