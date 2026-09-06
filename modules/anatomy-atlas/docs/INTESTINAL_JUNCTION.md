# Intestinal source-ownership correction

## What to use

Open **Abdomen → Guided dissection → Study windows → Bowel junction window**, or choose **Ileocecal junction & bowel context** under Focus. The small intestine, large intestine and junction are independently selectable. Hide either bowel aggregate while retaining the junction, isolate/frame it, restore removed structures with Undo, or use the existing spatial/arranged views and local study controls.

The current atlas contains **925 source representations in 74 body bundles**, plus the unchanged nine-structure shoulder model. There are **103 recipes and 85 focuses** across eleven regions and whole body. This milestone adds one selectable identity, **not new anatomical tissue**.

## The defect and exact correction

Both inherited bowel aggregates contained `FJ2599`. The official v4 IS-A and PART-OF tables identify it as `FMA11338`, **ileocecal junction**. PART-OF also aliases it to cecal and distal ileal-wall concepts. The old rendering therefore drew the same source component twice and allowed it to move with either bowel aggregate during dissection/explode.

The importer now separates that component from both parents and gives it the original narrow source identity:

`vm:anatomy:body:abdomen:unpaired:organ:ileocecal-junction`

Both existing bowel IDs survive. Their component lists and coverage notes change explicitly; the large-intestine label anchor is recomputed on its remaining surface. Neither parent's spatial bounds, centre, coordinate frame, source naming or system membership changes. No reflection, remodelling, fabricated tissue, cecum relabelling or valve segmentation is performed.

The cached raw files were independently matched against the previously archived SHA-256 and canonical-geometry evidence. Ingestion then re-read the official archive directories and verified extracted source bytes against CRC/size. The complete inventory was regenerated with freshly checked official source tables and both archives; cross-tree raw hashes differ, but the canonical FJ2599 geometry is identical.

## Preservation evidence

- Baseline source: `0b1c27632fb4fc7d7cd21b8c500c6f883bd6c645`.
- Baseline, raw hashes, aliases and transition: `content/junction-baseline.json`, `junction-source-audit.json`, `junction-transition.json`.
- **922 earlier records and 72 earlier body bundles remain exact.** Exactly two parent records and one old bundle change, plus one new junction bundle.
- The validator compares **291,248 oriented triangles**, including exact positions and normals: for each parent, the old mesh equals its remaining mesh plus the separately rendered component. All other nodes in the changed bundle remain exact.
- **288 duplicate triangles** are removed from the combined rendering. All **1,559 source filenames** have one catalogue owner; all **1,555 represented canonical geometry fingerprints** have one owner across both source trees.
- Historical baseline files are not rewritten. Their validators apply only a pinned two-record/one-bundle transition and reject different prior revisions or additional changes. Negative tests cover changed anchors, missing source components and changed bundle evidence.
- The new bundle is 6,484 bytes; total body assets are **93,700,676 bytes**, slightly smaller than before correction.

Run `node scripts/audit-junction.mjs` to recheck pinned cached evidence, then `npm run junction:test` for geometry preservation and study/ownership/migration tests. The production importer remains `node scripts/ingest-full-body.mjs`; regenerate inventory with `npm run inventory:audit` after ingestion. Historical validators require the documented baseline Git objects, available in the Site source history; a standalone snapshot can run current geometry/study checks but cannot recreate historical Git evidence without that history.

## Licence and teaching boundaries

This is a derivative of BodyParts3D 4.0 under the existing **CC BY 4.0** grant, not MIT anatomy. Retain DBCLS attribution, licence and indication of changes. [Official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) rechecked 6 September 2026. No new package, paid service, font, texture, third-party diagram or anatomy dataset is introduced. A brief original teaching note cites [TTUHSC's gastrointestinal reference](https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html) for the junction's anatomical relationship; no figures or table dataset are copied.

## Remaining validation and next anatomy

An anatomist must adjudicate the conflicting aliases and actual extent of the surface. It does **not** establish a complete cecum, ileocecal valve, mucosal/submucosal/muscle layers, a lumen, a surgical plane, peristalsis or normal clinical dimensions. The teaching/window names, tiny-surface selection, label legibility, actual touch/keyboard operation and interaction with translucent structures need hands-on educator/device review. Automated geometry/helper checks are not that review.

Existing imaging hooks now expose the separate source identity and revised parent component evidence. Old source-version-dependent views/links must not be represented as unchanged anatomy. There are still no patient scans, US probe geometry, slice synchronisation or validated patient/model registration.

Next inspect the unused v4 small-intestinal mesentery (`FMA14643`), transverse mesocolon (`FMA14647`), mesoappendix (`FMA16549`) and selected mesenteric vessels. Retrieve and audit every candidate before admission, including aliases, extent, connectivity and exact/near overlap with existing vessels. Broad peritoneal aliases are not a complete peritoneum. The current correction admits none of those candidates and does not clear any existing source hold.
