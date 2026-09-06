# Recover an interrupted 3D view

The shoulder, all eleven regions and whole-body explorer now share a graphics-recovery surface. If the context is interrupted, the unavailable canvas and its labels are hidden and inert. A normal page control offers **Restart 3D view**, so recovery does not depend on drawing inside the failed canvas.

Practice cannot start, accept answers, skip or advance while its 3D viewer is unavailable. Existing answers are retained; exiting practice remains available. The shoulder additionally waits for its model to load successfully. Body model-group readiness remains separate from graphics readiness: a healthy graphics context does not make a failed download ready.

## State and restoration

- Starting → ready requires a successful guarded renderer call followed by a live-context probe. It no longer announces readiness in a callback that runs before rendering. This is renderer availability, not proof of correct pixels or anatomical correctness.
- A context-lost event prevents the default loss handling to permit restoration, then pauses the viewer. A healthy probe alone cannot leave the lost state: a restoration event must arrive first.
- Restoration schedules a frame. The observer confirms the context is available before allowing practice again; Three.js manages reconstruction of its graphics resources.
- Manual restart remounts only the graphics subtree. Selection, hidden tissue, systems, separation, inspection and practice state remain in the explorer above it. The last captured camera is copied only when the last healthy viewer's camera-intent key still matches. A newer preset, zoom or reset chosen while interrupted takes precedence, as does an explicitly queued saved-view camera. A never-ready viewer cannot reuse an older viewer's capture.
- Each attempt has a generation-bound callback. Retired viewers and disposed observers cannot revive a newer attempt. Listeners are removed on cleanup.
- Caught React scene errors, synchronous `render()` exceptions and Three.js shader-error callbacks display the same page-level recovery control. The per-renderer guard installs in the monitor's layout effect, preserves the original method receiver/arguments and existing shader callback, and stops further draws after failure. A shader failure cannot be followed by a misleading ready signal. Failure stays terminal for that observer, including after later context events.
- Cleanup restores only the hooks owned by that guard, preserving any later instrumentation. A retired guard cannot announce health. No global error or unhandled-rejection listener consumes unrelated page failures. A viewer that never initializes keeps its starting notice and restart action; asynchronous initialization and unrelated frame callbacks remain separate acceptance work.
- After a user-initiated restart, keyboard focus returns to the named 3D region only if focus has not moved to another control. No whole-page reload, automatic retry loop, new storage write or network service is introduced.

The recovery notice uses Visible Medicine tokens, ordinary text and the installed button primitive. It stays outside the unavailable canvas. The source meshes, transforms, FMA/stable IDs, content, dissection recipes and imaging hooks are unchanged.

## Evidence

`npm run renderer:test` passes **703 checks**: 12 repeated loss/restoration event sequences; initial loss; duplicate events; failed probes; terminal failure; five guarded-renderer fault scenarios; cleanup and later-owner preservation; actual monitor execution with injected layout hooks; recovery-class methods, generation rejection, camera-copy/precedence and focus behaviour; 24 extracted application-handler cases; and ten server-rendered notice/wrapper states. Every body GLB hash and complete catalogue/profile hash remain pinned.

These are non-browser tests. The tests exercise the actual observer, recovery methods and extracted handlers, but injected hooks are not a mounted React/Three integration test. No hardware GPU reset, real pixels, browser initialization failures, touch or assistive-technology acceptance is claimed. Existing full source/geometry, dissection/workbench, loading/guidance, practice/study/library, imaging/navigation/link, arrangement/explode and review suites remain required.

Display-revision fingerprints now include the shared recovery component, stylesheet and health helper. Existing shoulder review approvals must expire on these display changes; no clinical approval or private review event is fabricated.

The implementation follows the local installed React Three Fiber/Three.js lifecycle, the official [renderer/shader callback contract](https://threejs.org/docs/pages/WebGLRenderer.html), and [WebGL context-loss](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event) and [restoration](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event) event documentation. Shader checks remain at Three.js's enabled default; disabling them elsewhere would bypass shader-error reporting. No third-party code, font, texture or model was imported for this feature.

## Remaining acceptance

On authorized real-device testing, inject context loss/restoration, test repeated manual restarts and deliberate creation/render/shader failure, switch camera modes and regional scopes, lose context mid-question, verify actual resource rebuilding and camera restoration, and check keyboard focus, screen-reader announcements and enlarged/mobile layouts. The new synthetic renderer/shader tests are not GPU acceptance. Async initialization failures and unrelated frame callbacks still need scoped handling and runtime tests. No source/collision/clinical claim follows from a successful restart.
