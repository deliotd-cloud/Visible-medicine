# Bounded exact-triangle muscle picking

The production hover baseline identified dense central anatomy as a real picking
bottleneck. `AnatomyTissue` now retains an idle-built BVH for eligible, non-ghost
muscle geometry. Other tissues, batching, displayed triangles and UI are unchanged.
No mesh simplification, vertex movement, decimation or anatomical ID change.

## Ownership and safety

- `three-mesh-bvh` 0.8.3 is pinned directly, reusing the installed MIT dependency.
  Its exact upstream licence matches the installed notice; module bundled notices
  include Garrett Johnson's copyright and full permission terms. No paid service.
- Only complete indexed Float32 position/normal surfaces without groups, morphs,
  interleaving or extra attributes qualify: 512–250,000 triangles. Unsupported,
  pending, budget-excluded and failed allocations retain native Three picking.
- Trees use indirect mode on a renderer-owned geometry facade. Source attribute
  arrays and ordered indices are shared read-only, never reordered or disposed.
  Attributes' identity/version, draw range and supported shape are rechecked before
  accelerated queries. Changed inputs immediately use native picking.
- Builds run as individual idle callbacks (timer fallback). Retained tree/indirect
  buffers are capped at 24 MiB. One tree is built at a time; its temporary buffers,
  construction scratch and JS objects are **additional** to this retained-buffer
  cap. This is not a whole-process memory cap or a cold-start latency guarantee.
- Larger eligible muscles can evict smaller indexes when the budget fills. Evicted
  meshes remain pickable natively. The first candidate incorrectly let unrelated
  tissues fill the budget before torso muscles loaded; real-browser diagnostics
  exposed this and the final integration reserves the cache for muscles.
- Reference-counted cleanup cancels queued builds and releases owned facades/tree
  references. Source disposal also clears its entry. No Three prototype patch.
- All intersections are retained before shader-plane rejection, regardless of a
  caller's firstHitOnly flag. A clipped front hit must not hide a valid deeper hit.
  Results refer to the original mesh. Material sides, world transforms, near/far,
  low-opacity rejection and nonselectable parent behaviour remain in force.

## Verification and observed benefit

`node scripts/validate-tissue-picking.mjs` verifies 2,251 comparisons, including
369 actual source muscle meshes (347 admitted), original index/vertex/normal
hashes, hit counts, original face identity, point/distance/normal, mirrored and
non-uniform transforms, material sides, near/far, clipped front/rear hits,
low opacity, refcounts, cancellation, source disposal, version changes, unsupported
geometry, bounded admission and small-index eviction with native fallback.
The generated CPU evidence is `.local/tissue-picking-validation.json`.

The [production browser measurements](tissue-picking-browser-20260917.json) repeat
the saved centreline experiment with all 1,103 structures enabled. Warm repeated
hover handler median fell from 26.0ms to 12.5ms; p95 from 49.6ms to 17.6ms on the
same desktop GPU. The first accelerated sweep was 13.3ms / 24.7ms. This is measured
synthetic synchronous handler work, **not FPS, INP or a general speed multiplier**.
No diagnostic export was present in the final measured module. The temporary
local diagnostic variant was removed after identifying budget contention.

Inspection, renderer recovery, screen labels, label depth and selection visibility
regressions pass. TypeScript, full production build and contained-module build
pass; source renderer/review fingerprints are regenerated. Prior clinical approvals
are not carried forward to this renderer revision. Browser viewport tests and
their screenshots are saved in the coordinating checkpoint, not treated as a
physical-phone acceptance test.

Remaining: broader device/cold-start/memory profiling, actual finger interaction,
many-label scenes and independent radiologist review. Batches still use native
picking. Website activation remains behind the existing two-model authenticated
upload/full-byte-verification gate; this source improvement does not bypass it.
