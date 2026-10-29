# Independent foot source-review candidate

This local package advances ANAT-15. It does not change the normal website, add numbered interosseous muscles to the whole-body Atlas, establish registration, or record a clinical approval.

Two original BodyParts3D version-3 groups (FMA74140, FMA74141) are available beside ten source-matched metatarsals. Both official detail levels are retained independently: 99% reduction (16,092 triangles total) and 95% reduction (69,234 triangles total). The higher-detail set is the preferred review candidate because it preserves more source surface detail, subject to radiologist inspection.

Both groups contain four large edge-connected components plus smaller fragments after exact-coordinate diagnostic welding. Source names identify muscle **groups** only. Component order or size is not an anatomical label. Both groups also have duplicate-face defects; all fragments and faces remain present. Raw vertex-index topology is reported separately because duplicate positions can make an intact surface appear fragmented before diagnostic welding.

The ten v4 metatarsal originals are individually hash-matched to the current Atlas catalogue for a coordinate comparison only. Their differences confirm that no shared source placement should be assumed. No alignment has been estimated or applied.

## Review

Run `node recipes/server.mjs` from this package. The command reports a temporary loopback URL. Open that URL with `?detail=95` for the higher-detail source, or without a query for the compact source. No scans, accounts or clinical decisions are involved. The server exposes only named read-only package resources and the existing local Three.js installation. Stop that one temporary server when finished.

Use the side selector, source-axis views, mesh list, bone visibility/fading and triangle-edge view. The camera is interactive; source coordinates stay unchanged. The model deliberately contains only the interosseous groups and metatarsals, not a complete foot. Review questions and precise revisions are in each REVIEW_PACKET.json. Screenshots provide static evidence, not clinical validation.

## Reproduce and verify

- `recipes/acquire.mjs` acquires exact members from the official 99% ZIP using bounded HTTP byte ranges and verifies archive sizes and CRCs. `--detail=95` selects the separate higher-detail folder. No full ZIP download is required.
- `recipes/acquire-v4-context.mjs` acquires the ten v4 context originals and checks their hashes against the canonical catalogue; those meshes never enter the renderer.
- `recipes/prepare.mjs` preserves triangle and coordinate arrays, runs raw-index and exact-coordinate topology diagnostics, and records renderer inputs. `VM_FOOT_ROOT` selects the detail95 folder; `VM_ATLAS_ROOT` selects the existing Atlas checkout (default `F:/VisibleMedicine/atlas`).
- `node --test recipes/obj-audit.test.mjs` runs malformed-geometry and topology fixture checks.
- `recipes/verify.mjs` independently compares every displayed coordinate and triangle against its original. Set `VM_FOOT_ROOT` for the higher-detail package.

No automatic mesh repair, source-to-body fitting, mirror synthesis or clinical approval is performed. See NOTICE.md for asset attribution, share-alike requirements, separate code licensing and renderer provenance.

Before any learner-facing use: decide whether the group-level geometry is suitable; inspect source fragments and surface defects; decide whether a separate v3 specimen is educationally useful; bind that decision to the exact chosen model revision; then integrate through the normal generated-module pipeline and application checks. Individual numbered muscles, attachments and cross-body or imaging registration need additional evidence and review.
