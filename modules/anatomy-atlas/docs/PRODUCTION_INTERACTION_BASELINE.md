# Production picking and selected-label baseline

17 September 2026; source `bf55a602`. All 641 input hashes of the existing
compiled regional module matched current source before serving it on loopback.
The existing development preview was left unchanged. No patient files were served.
The local module uses approved model/companion paths from the prepared manifest;
this is not hosted protected-delivery or entitlement acceptance.

## Evidence

[Raw measurements](production-interaction-baseline-20260917.json) retain the
returned observations and limitations. Chrome 152 used the AMD RX 7900 XTX,
1440×949 viewport, whole-body all-systems view, no throttling.

| Synthetic hover path | Median synchronous handler time | p95 |
| --- | ---: | ---: |
| 108-point broad canvas grid | 0.7ms | 6.4ms |
| Six dense centreline points, six repeats, all systems | 26.7ms | 49.3ms |
| Same points with muscles hidden | 12.1ms | 18.0ms |
| Same points after restoring muscles | 26.0ms | 49.6ms |

The broad grid mostly misses anatomy: only 11 events produced the pointer cursor.
Do not use that median to claim the dense anatomy is fast. The repeated centreline
series identifies a worthwhile picking investigation; changing system visibility
also changes occluders and intersections, so it does not isolate an exact muscle cost.
These measurements time `dispatchEvent(pointermove)` synchronously, spaced 25ms
(centreline) or 32ms (grid). They are not trusted-input INP or full frame latency.
Coordinates use the canvas bounding rectangle. Grid x = 0.15 + column × 0.0875
(nine columns), y = 0.08 + row × 0.076 (twelve rows); centreline x = 0.5,
y = 0.08 + (event index modulo six) × 0.076. Events have bubbles enabled,
pointerId 1 and pointerType mouse. Each system transition settles for 700ms.
Quantiles use sorted observations at floor((count − 1) × percentile).

The same saved draw probe performed 24 alternating zoom actions with Body of
sternum selected. With labels off/on, respectively: 24/93 drawn frames, median
first-submission latency 24.3/21.3ms and zero frames in each final 700ms idle window.
Only one selected label was active, including its Behind tissue state. The label
depth probe has trailing demand frames; these counts do not prove an unnecessary
render loop or a label optimization. No persistent idle loop was observed.
The helper's legacy raw notes say development; this experiment ran the verified
production module. Preserve that provenance correction when interpreting the JSON.

The interaction trace reported CLS 0.00 but exposed no call-stack attribution or
INP insight. Its returned summary is saved; no raw trace file is claimed.

## Source review and next implementation

`app/body-scene.tsx` attaches pointer handlers to individual tissues and opaque
batches. `lib/inspection-geometry.ts:clippedMeshRaycast` calls native triangle
raycasting before rejecting shader-clipped hits. `lib/body-batching.ts` calls
native BatchedMesh raycasting before filtering interactive identities. Muscle
surfaces intentionally remain individual meshes to preserve their illustration.
The timing correlation and source path support evaluating accelerated geometric
picking, but are not a sampled CPU profile proving individual function costs.

Next evaluate bounded triangle acceleration using original vertex/index data,
without changing displayed geometry or anatomical IDs. The installed transitive
`three-mesh-bvh` is a candidate, not yet admitted as a new direct runtime contract.
Audit its exact licence/API and measure build cost and memory before adoption.
Preserve source-index ordering, clipping (including a deeper retained hit), opacity
thresholds, front/back material sides, instance transforms, hidden/noninteractive
context, all returned identities, cache ownership and disposal. Compare accelerated
hits against native Three on actual source meshes, then repeat these production
paths with all systems visible. Do not use first-hit-only selection where clipped
front surfaces could hide valid deeper hits. Leave a safe fallback for unsupported
geometry and allocation failures. Phone and lower-powered-device acceptance remain
separate, as does the radiologist's revision-bound review.
