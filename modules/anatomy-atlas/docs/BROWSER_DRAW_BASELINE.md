# Measured desktop rendering baseline — 17 September 2026

This pass measures the actual browser/driver submission path, extending the
earlier CPU-only batching model. It changes no application or anatomy code.
The complete observations are in [the machine-readable report](browser-draw-baseline-20260917.json).

## Method and limits

Atlas source `08ab1698`, renderer revision `e1174648`, localhost:3191 development
preview. Chrome 152 on Windows, AMD Radeon RX 7900 XTX via ANGLE/D3D11. Viewport
1440×949; canvas 882×576. No CPU/network throttling. The model requests used warm
browser caches. Each scope was measured once with native multi-draw and once
with that capability hidden for that document only, exercising the existing
fallback. This was not randomised or a physical-device comparison.

`scripts/browser-draw-probe.mjs` exports a browser-side measurement function.
Invoke its function text through an authorised local browser evaluator with a
JSON options string containing a descriptive `name`. It temporarily wraps the
active WebGL draw methods, alternates the existing Zoom in/out buttons 24 times
at 90ms intervals, records frame submission counts, then restores the methods.
A requestAnimationFrame observer groups submissions; it does not invalidate the
application's demand-rendered scene. Do not run concurrent probes or interact
with the model during measurement. The probe adds overhead.

For the fallback comparison, a next-document-only getExtension wrapper returns
null for WEBGL_multi_draw. A subsequent normal navigation restores native
capability. No source feature flag or permanent browser setting was changed.

## Observed results

| Scope | Native calls/frame | Fallback calls/frame | Logical subdraws/frame, both | Native/fallback median submission span |
| --- | ---: | ---: | ---: | --- |
| Whole-body skeleton | 28 | 203 | 203 | 0.4 / 0.6ms |
| Head & neck, all systems | 155 | 291 | 291 | 0.8 / 0.9ms |
| Whole body, all systems | 560 | 1103 | 1103 | 2.4 / 3.4ms |

Every case recorded 24 actions and 24 rendered frames. Each final 700ms idle window
recorded zero application draw frames. Counts prove that the intended native
batch path is used and reduces API submissions on this device. Matching logical
subdraw counts do not independently prove geometric or image equivalence.

Submission span is the time from first to last instrumented draw call within a
frame: it excludes earlier React work and asynchronous GPU completion. It is
**not FPS, full frame time or a speed multiplier**. Synthetic button-to-first-
submission latency is not INP. The all-system view's median was 54.5ms native and
69.4ms fallback; p95 was 249.3ms and 299.6ms. Single ordered development runs cannot
attribute those differences solely to batching or establish a regression budget.
Heap observations are included as diagnostic snapshots only, not comparable peak
memory or GPU/driver memory: GC state and duplicated batch buffers differ.

The separate DevTools navigation trace reported LCP 544ms, TTFB 85ms and CLS 0.00.
The LCP element was the brand logo, **not model readiness**. The trace offered no
estimated rendering-blocking savings. There is no field-user data. The connector
refused the requested raw-trace save path, so only its returned summary is retained.
No path-policy bypass was attempted.

## Next decisions

Preserve the existing batching and demand rendering. Do not simplify anatomy,
remove useful controls or retune device thresholds from this narrow benchmark.
Next measure production-mode interaction profiles, especially pointer picking and
label work in dense views, then actual lower-powered hardware and a physical
phone. Separate cold model loading/decoding from render readiness and measure GPU
memory with suitable tooling. Existing CPU geometry/raycast tests remain relevant;
this pass does not replace visual equivalence, source or radiologist approval.
