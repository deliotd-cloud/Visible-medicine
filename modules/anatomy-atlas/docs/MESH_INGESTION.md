# Validated anatomy mesh ingestion

## Admission gate

For a validated clinical/educational release, require all of the following. Rights-cleared but clinically unreviewed meshes may be included only in an explicitly draft educational preview such as this one:

1. Source, author, download date and immutable source/version reference.
2. Exact licence text confirming commercial modification and redistribution rights.
3. All attribution/notice requirements and confirmation they are compatible with the product surface.
4. Written confirmation that no patient-identifying data or restricted derivative data is present.
5. Anatomical review by named qualified reviewers, including laterality and segmentation boundaries.

Prefer CC0, MIT, BSD or Apache-2.0 assets. CC-BY may be usable when attribution can be displayed and preserved. Reject non-commercial, no-derivatives, research-only, educational-only, field-of-use-limited, revocable or paywalled-after-trial terms.

## Technical pipeline

For the existing full-body importer, first run `node scripts/ingest-full-body.mjs --preflight-only`. The [source-component hold screen](SOURCE_HOLD_SAFEGUARDS.md) rejects known held identities and same-tree components, including broader parent aliases, before archive access or geometry output. This is not the clinical/rights admission gate and does not establish cross-archive geometry equivalence.

- Keep source meshes outside `public/` during review.
- Repair topology and normals in a reproducible toolchain; preserve a transformation log.
- Use millimetres as source units and record the conversion to Three.js metres/scene units.
- Place the anatomical origin and orientation in a documented patient-coordinate convention.
- Create separate named glTF nodes for every selectable structure; do not encode identity only by material colour.
- Optimise a derived delivery mesh while retaining the reviewed source mesh and checksum.
- Export GLB with mesh compression only after validating decoder licence and browser support.
- Add a manifest binding each glTF node to one canonical `vm:anatomy:…` ID.
- Validate bounds, vertex count, manifold status, normals, laterality, visual alignment and selectable hit targets in CI.
- Produce desktop and mobile levels of detail; never substitute a lower-detail mesh for the reviewed anatomical source of truth.

## Expected manifest shape

```json
{
  "assetId": "vm:asset:shoulder:right:v1",
  "sourceSha256": "…",
  "units": "millimetres",
  "coordinateSystem": "LPS",
  "nodes": [
    {
      "nodeName": "Scapula_R",
      "structureId": "vm:anatomy:upper-limb:shoulder:right:bone:scapula"
    }
  ]
}
```

## Included BodyParts3D draft subset

The procedural component has been replaced with eleven authentic source meshes, not handmade primitives. Run `node scripts/ingest-bodyparts3d.mjs` to reproduce the GLB and manifest from the official version 4.0 archive under its updated CC BY 4.0 grant. The script reads ZIP byte ranges, verifies uncompressed length and CRC32, records source hashes, and applies one positive-determinant transform. Downloaded OBJ files are cached outside the public site. No texture or paid decoder is needed.

The manifest includes exact node names and one-to-many product bindings. Source biceps geometry is a muscle-and-tendon complex, not a tendon-only segmentation. Runtime upper-arm cropping and exploded separation are display operations. The independent clinical admission gate remains open; licence clearance must not be confused with anatomy validation.
