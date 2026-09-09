# Remaining-source geometry screen

This is preparatory anatomy work, not a visible mesh release. The atlas remains at 1,022 body representations, 86 body mesh bundles and the separate shoulder model. Teaching, subscriptions, UI and imaging-link permissions are unchanged.

## Evidence added

The [machine-readable screen](../content/source-geometry-screen.json) checks 52 tree-specific original BodyParts3D v4 files, totalling 11,312,418 bytes. It verifies the two archive directory digests, member sizes and CRCs against the retained inventory, records raw and canonical geometry SHA-256 digests, and checks finite triangular geometry. Four candidate files also receive exact-coordinate topology diagnostics.

All 48 currently held files now have fingerprints in this **supplemental** report, filling 47 previously unknown fingerprints. The historical availability inventory and source-hold report are intentionally unchanged. The comparison covers 2,819 known fingerprints across both source trees, including every one of the 1,674 source files used by the current displayed body catalogue. Other unindexed, unrepresented source files remain unknown.

| Candidate definition | Original source files | Result and next gate |
| --- | --- | --- |
| Short ciliary nerve, FMA7041 | ISA FJ1319 and FJ1370 | No exact held/displayed match. Two closed oriented components per file. Preserve the paired, unsided source definition; review ganglion-to-globe course, endpoints and extent before deciding how it could be represented. |
| Right anterior choroidal artery branch to posterior limb of right internal capsule, FMA50146 | ISA FJ1674 | No exact held/displayed match; one closed oriented component. Source-negative X agrees with its right-sided label. Branch identity, parent-vessel continuity and terminal extent still require review. |
| Left counterpart, FMA50147 | ISA FJ1674M | No exact held/displayed match; one closed oriented component. Source-positive X agrees with its left-sided label. Same review requirements; no synthetic mirroring or territory claim is introduced. |

These are three definitions spanning four files, **not four admitted structures**. A manifold result does not establish correct anatomy, self-intersection freedom, complete nerve branching or a validated blood-supply territory. A source side convention is not independent laterality validation.

The held part-of `FJ1737` (spinal-cord identity) exactly matches the displayed ISA `FJ1737` central-canal source fingerprint. This confirms an already documented source-identity ambiguity; it does not turn the canal into a spinal cord. Three additional exact cross-tree pairs occur entirely within the held set (`FJ2034`, `FJ3437`, `FJ3644`). No existing anatomy is deleted, reclassified or automatically approved.

## Reproduce and verify

Run from the atlas source directory:

```sh
npm run source-geometry:audit
npm run source-geometry:test
npm run source-geometry:test -- --raw
npm run source-holds:test
```

The audit uses the official HTTPS archives with range downloads, validates their pinned directory digests, checks members and caches original OBJ bytes under `../work/bodyparts3d`. It writes only the supplemental JSON report, never the catalogue or models. A changed archive, definition, catalogue binding or source-hold inventory stops the audit. The standard test is offline; `--raw` additionally requires all 52 cached source files and reproduces their digests, bounds and candidate topology, with corruption rejection tests. Run the audit first on a fresh machine.

The exact fingerprint keeps vertex/face order, coordinates and winding. Reindexed, mirrored, translated, reversed-winding and nearly overlapping alternatives can escape it. Before admission, perform bounded source-coordinate surface/endpoint comparisons against nearby displayed anatomy and held alternatives, investigate suspicious pairs, and obtain qualified anatomical review. Never split, trim, thicken, repair, infer attachments or relabel a source merely to make a check pass. The existing importer hold screen is unchanged and does not silently adopt this report as permission to import.

## Rights and remaining validation

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 9 September 2026, specifies CC BY 4.0 with required credit. Preserve: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**. The [v4 release notes](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/release_4.0_e.html) warn about errors and concept mapping and describe coordinate changes from earlier versions. Do not mix versions or assume anatomical validity from licensing.

No candidate OBJ is added to the public site or committed source, no new dataset is admitted, and no application dependency, paid service, font, texture or publisher illustration is introduced. Only audit code and attributed derived measurements are saved. Commercial use still requires the existing notices and asset-specific obligations. Clinical validation, real-device acceptance, privacy-cleared scans and approved lecture/resource manifests remain separate requirements.
