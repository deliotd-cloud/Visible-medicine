# Lossless model delivery

Production builds compress every runtime GLB with `EXT_meshopt_compression`, using **no quantization, vertex/index reordering, simplification, geometry filters or anatomy removal**. The original files under `public/models` and all ingestion originals remain unchanged. Only generated `dist/client/models` files are replaced, after verification. Unsupported future asset layouts fail the build explicitly instead of dropping data.

## Measured outcome

The separate abdominal-wall milestone raises runtime delivery to **108 GLBs / 1,204 mesh primitives / 3,612 buffer views**. Canonical files total 177,729,660 bytes; transport files total 119,816,632 bytes. The new specimen itself is 15,335,852 canonical bytes / 10,159,084 transport bytes, with unchanged decoded triangles and normals. The optional original-source ZIP is separate from GLB totals and loads only when downloaded. Measurements below preserve the earlier 107-file baseline.

The 11 September 2026 source set contains 1,175 mesh primitives and 3,525 buffer views. Raw GLB delivery falls from 162,393,808 to 109,657,548 bytes (32.5% smaller). Independently gzip-compressed file totals fall from 129,280,234 to 95,073,460 bytes (26.5% smaller). These are file measurements, not measured network latency, GPU memory, frame rate or a guarantee that publication succeeds. HTTP content encoding and whole-archive compression can produce different totals.

The complete atlas is retained: this is not a lighter anatomical subset or a lower-resolution model. Source defects, disconnected fragments and grouped structures remain; compression does not confer clinical approval.

## Build and verification contract

`npm run build` runs the existing application build, then `scripts/compress-model-delivery.mjs`. `npm run models:delivery-check` checks current build output. `node scripts/compress-model-delivery.mjs --measure-only` performs a read-only experiment without modifying any model file.

For every model, the script:

1. Encodes version-0 attribute buffers and ordered index sequences; all filters are `NONE`.
2. Decodes every buffer through the exact MeshoptDecoder installed behind the application's Drei loader and requires byte equality with the canonical buffer.
3. Loads original and encoded GLBs with that installed GLTFLoader; compares names, hierarchy, transforms, user metadata, attribute/index arrays, primitive groups and material properties.
4. Confirms the source file hash is unchanged. The smaller encoded result is written only inside the validated build-output directory; symbolic links and foreign paths are rejected.

`dist/client/models/transport-manifest.json` records canonical and transport SHA256 hashes, sizes and verification counts. Encoded GLBs also identify their canonical SHA256 in `asset.extras.visibleMedicineTransport`. Catalogue `bundle.sha256`/`bytes`, canonical ingestion records and teaching/navigation bindings continue to describe the **canonical** GLBs, not compressed network bytes. Do not compare them to the encoded file hash or repin anatomy to a transport artifact. The transport manifest is a build receipt, not runtime cryptographic verification or a signed authenticity guarantee.

Shoulder geometry-review fingerprints deliberately advance because their display contract includes the viewer and now the compression scripts. Previous display approvals therefore need reconfirmation despite identical canonical anatomy. Teaching fingerprints are unchanged, and existing private review records are not edited or deleted.

The decoder is bundled locally; both viewer entry points explicitly enable meshopt and disable unused Draco support. No decoder CDN request or paid runtime service is needed. Encoded GLBs require a loader supporting `EXT_meshopt_compression` and WebAssembly. Uncompressed source GLBs remain available from the source checkout for other tooling. A developer server may serve those canonical files; a production build serves encoded delivery files.

## Rights and remaining checks

The [Khronos extension specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md) permits placeholder fallback buffers with the extension required. The [encoder documentation](https://github.com/zeux/meshoptimizer/tree/master/js) distinguishes version 0 for EXT from version 1 for KHR. The implementation uses the former, with ordered index sequences and no precision-changing filters. These are technical references, not new anatomy licences.

Meshoptimizer 1.1.1 is MIT and was already in the installed dependency graph; declaring the existing version as a direct build dependency makes the build reproducible. Existing local decoder and anatomical asset licences remain applicable. Full encoder notice is retained in `LICENSES/meshoptimizer-MIT.txt`.

Automated byte/loader comparisons are not browser, CSP, mobile, accessibility, memory, clinical or real-network acceptance. Device/browser checks remain required before release certification. Changing to a newer encoder format, interleaved/sparse accessors, texture-bearing models or a different runtime decoder requires deliberate compatibility review and new equality checks.
