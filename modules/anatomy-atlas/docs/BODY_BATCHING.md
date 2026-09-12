# Original-resolution opaque-surface batching

The body/region renderer now uses the installed Three.js `BatchedMesh` for compatible opaque, unselected, non-muscle surfaces in views containing at least 150 rendered structures. No additional control is added. Individual anatomy identities, source geometry, colours, coordinate frames, labels and existing dissection controls remain in place. The shoulder-specific renderer is unchanged.

This implements the batching recommendation from the source comparison using original project code and the existing MIT-licensed Three.js dependency, not competitor shaders, geometry or conversion code. No package, lockfile, font, texture, anatomical asset, licence obligation or paid service is added. [Official BatchedMesh documentation](https://threejs.org/docs/pages/BatchedMesh.html) describes its supported per-instance geometry, transforms, colours and visibility.

## Admission and fallback

- Require the renderer's `WEBGL_multi_draw` capability. Unsupported devices keep `AnatomyTissue` and allocate no batch.
- Each loaded source bundle needs eight compatible surfaces; copied geometry is bounded to 16 MiB per bundle. Complete indexed Float32 position/normal geometry only; unsupported attributes, partial draw ranges, groups and morph targets retain the individual renderer.
- Muscle hatching, selected highlights/outlines, ghosted removals and transparent surfaces always retain `AnatomyTissue`. Any active cut also uses the existing individual clipped rendering/raycast path. Detailed views below 150 structures keep their original contours.
- Selection, isolation, hide/Undo, opacity and separation update stable instance matrices/visibility/colours without reallocating copied geometry. A changed source bundle, device capability or transition into a small detailed view releases the owned batch. Allocation failure leaves individual surfaces available.
- Cached GLTF originals are neither edited nor disposed. Batched copies preserve every source vertex, normal and ordered index, with no simplification, new LOD, smoothing or fitting.
- Batch hits retain the anatomical ID. The Three `batchId` is also supplied as `instanceId` for R3F's event deduplication. Nonselectable context cannot intercept a pick; removed/selected fallback instances cannot return stale batch hits.
- Aggregate frustum culling is disabled because its bounds would become stale during separation; native per-instance culling remains active with current transforms. Labels and selected origin guides remain separate. Unlabelled batched surfaces do not retain empty individual scene groups.

## Reproducible CPU baseline

The [baseline report](body-batching-baseline.json) inspects the current source geometries and a hypothetical all-systems-visible, opaque, unselected view. It does **not** measure a browser, GPU draw calls, frame rate, startup latency or mobile memory. Actual system toggles, loading, filtering, selection and device capabilities change the result.

| Scope | Original surface submissions | Planned surface/batch submissions | Batched surfaces |
| --- | ---: | ---: | ---: |
| Whole body | 1064 | 543 | 550 in 29 batches |
| Head & neck | 281 | 125 | 167 in 11 batches |
| Thorax | 155 | 39 | 125 in 9 batches |

The full-body path copies 47,583,840 geometry-buffer bytes, plus small instance textures and driver allocations; this is an explicit memory tradeoff, not memory reduction. Regional bundles can contain out-of-scope sources, so allocation is reported for the complete eligible loaded bundles. Smaller regional views remain unbatched. These figures exclude contour/label/guide submissions and do not justify a speed multiplier.

## Verification and acceptance

`node scripts/validate-body-batching.mjs --check-report` verifies 550 actual surfaces: all 992,437 vertex positions/normals and 5,941,338 indices (1,980,446 triangles) are retained exactly in batch storage. Original hashes remain unchanged after update/disposal. Real Three raycasts match individual meshes for displaced test surfaces, stable identities, hidden selections and context pass-through. Regenerate the report with `--write-report` only after reviewing a changed catalogue/implementation.

`node scripts/validate-body-batch-component.mjs` executes the actual Bundle and batching hook with a controlled React lifecycle: selection/hover, labels, all separation layouts, cut/opacity/ghost fallback, context, exam answer picking, unsupported devices, detailed-view transitions and resource disposal. It checks allocation stability, not simulated GPU output. Existing inspection, screen-side labels, selection visibility, anatomy loading, explode styles, orientation, origin guides and knee study tests also pass.

Remaining acceptance: explicitly requested browser/GPU testing on desktop/tablet/phone, both multi-draw and fallback devices; compare rendered colours, normals, contours and picking; exercise filtering, fast separation, cuts, hover events, loading/retry/context loss and memory disposal. Measure actual render submissions/FPS/frame time and peak memory. Medical sign-off must reference this changed renderer revision; prior approvals are not migrated. No new anatomical completeness, clinical correctness or CT/MRI registration is claimed.
