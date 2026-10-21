# Anatomy coverage and remaining work

## Current coordinated inventory — 21 October 2026

Atlas source: `190a63238eadcf906abe89dcbb6a67c88afe70b9`. All four exact inventory artifacts,
the learner exports and the protected Review import use this source revision.
The index binds 168 named source dependencies: 142 imported Review paths and
26 source-only metadata paths. They remain separate verification scopes.
Passing checks does not turn inventory counts into unique lessons, accepted
anatomy, clinical approval, patient registration or public deployment.

The factual inventory, seven documented gap groups, source frames and holds
are unchanged. In particular, missing peripheral nerves/plexuses are not filled
with inferred geometry, and spinal cord tissue remains held. The current
coverage view and production preflight reject mixed revisions or altered
evidence; the source-only checker below verifies the additional metadata.

The following coordination record is preserved verbatim. Its older source
revisions and 141/25/166 counts describe historical checkpoints, not the
current inventory. The intermediate candidate README is retained separately
with its exact preimage in the recoverable cutover preparation.

## Historical coordination record (preserved)

Current coordinated candidate: `70260f13b1878272c6b0797dd72395ed10bc4f29`.
All four producers were rerun from clean source. Factual counts, source frames,
target groups, holds and all 168 dependency identities remain unchanged; 142
imported and 26 source-only rows still require exact byte checks. This inventories
anatomical representations, not lesson completeness or clinical decisions.
The historical notes below retain their dated scope. Deployment is separate.

This is a source-bound inventory for Atlas revision
`9fba9a1e24b6669aafd48e945d55fc0939d50ab2`, not a complete curriculum,
clinical approval, patient-space registration or a percentage-complete score.
Use the [completion checklist](../completion-checklist.md) for ownership and
priority. Clinical decisions remain in the private Clinical Review workflow;
these files do not read or create those decisions.

Authorized reviewers can now open **Other review workflows → Anatomy coverage
and gaps** in the Clinical Review inbox, or use `/workspace/atlas-review/anatomy-coverage`.
This read-only summary filters documented targets by region while keeping the
four inventory units separate. It checks the exact snapshot and 141 imported
dependency identities; the 25 source-only metadata inputs retain the separate
checker below. It neither records nor implies an approval.

## Separate scopes

| Inventory | What it counts | Current scope |
| --- | --- | --- |
| `root.json` | Displayed root-body representations and overlapping regional memberships | 1,104 representations; 1,370 memberships; seven documented target groups |
| `nested.json` | Reachable substructures and their parent/source bindings | 108 selections; 76 source-bound teaching concepts; five FMA overlaps with root anatomy |
| `independent.json` | Source-frame-qualified specimen selections and the dedicated shoulder | Nine views, 356 memberships, 267 frame-qualified selections; shoulder nine selections/11 part bindings |
| `reference.json` | Reference-file metadata partition and review backlog | 2,234 files; 441 current-root differences, **not 441 missing structures** |

Do not add these counts. A view membership is not a unique structure; a source
file is not an anatomical concept. `index.json` binds all four exact artifacts,
their 166 committed dependencies and cross-scope consistency.

## Highest-priority anatomical gaps

The saved coverage source explicitly lacks limb peripheral nerves and the
brachial/lumbosacral plexuses. Spinal cord tissue remains held: a space/source
label is not a validated cord segmentation. Nervous-system coverage is partial;
the expected lymphatic curriculum is not yet inventoried. Those seven target
groups are a documented starting point, not an exhaustive missing-anatomy list.
Expected anatomy still needs a region/system curriculum and source/geometry
adjudication. Missing assets must not be filled with unsupported AI geometry.

The reference backlog separates 24 reachable nested source files, one reviewed
display correction, 57 source-condition/identity holds and 359 files with no
current coverage evidence. Original OBJ bytes were not revalidated and the
remote reference manifest was not fetched again. Metadata reconciliation does
not release those assets or resolve anatomical boundaries.

## Verify without modifying evidence

From the website checkout:

```powershell
node scripts/check-anatomy-coverage.mjs --source-root F:/VisibleMedicine/atlas --check
```

Alternatively set `VM_ATLAS_SOURCE_REPO` to the exact Atlas checkout. The checker
requires the pinned clean source commit, immutable artifact hashes, and matching
committed **and working** bytes for every named source dependency. Unknown flags,
mixed epochs, altered classifications and a stale saved index are errors.
It reads text/metadata only, not model payloads, scans or private review records.

`--write` creates a missing index only; it cannot overwrite an existing file.
The four snapshots are immutable inputs, not self-refreshing resolver outputs.
For a new source revision, rerun and review the root, nested, independent and
reference producers, retain their evidence, and replace the registry and index
as one reviewed change. Do not merely change a revision or hash to pass a check.
Changes to the actual Atlas require normal learner export and protected Review
import/rebinding; this documentation snapshot does not perform those operations.

The [portable producer workflow](PRODUCERS.md) now prepares fresh candidates from
the actual source instead of depending on dated staging scripts. It deliberately
does not install them. The verified ac714061 candidate preserves the factual
inventories and adds the source package metadata to provenance; canonical website
snapshots remain at9f until the coordinated runtime/Review/coverage import.
