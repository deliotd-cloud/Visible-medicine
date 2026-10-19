# Native head 3D recovery

The existing CT/MRI head viewer loads its native 3D renderer on demand. A React error boundary now wraps only that loaded renderer, not the study, slices, toolbar, structure index, Guided learning or practice state.

If a descendant rendering error reaches the boundary, the 3D pane shows **3D view unavailable** and **Retry 3D view**. It does not display raw diagnostics or send error reports. Focus moves to the failure heading. Retry clears only the boundary's failed state and remounts the current renderer with the latest selection and callbacks. On successful restoration, focus moves to the persistent 3D group. Ordinary selection updates do not steal focus. Repeated failures remain contained; users can instead choose a slice layout. Selecting another structure alone does not repeatedly restart a failed renderer.

The full-width/full-height wrapper preserves the existing Canvas sizing. Original geometry, RAS coordinates, camera, damped controls, picking, disposal, loader import guards and source/quiz gates are unchanged. Layout unmount disposes the existing renderer through its normal lifecycle; no study reimport, score reset, source substitution or generic-Atlas registration is added.

## Verification and limits

Focused loader/class lifecycle tests cover import failure/retry, late imports, cleanup/setup replay, latest props, local fallback, hidden raw diagnostics, failure/restored focus and repeated failure. Existing viewer tests cover layout and practice mount conditions. An E-only real React DOM fixture deliberately throws a synthetic descendant error while sibling controls remain usable; it contains no scan pixels or anatomy geometry. Native local CT smoke checks confirm normal rendering and Canvas sizing, not hardware-fault injection or clinical accuracy. MRI shares the same boundary; no separate native MRI GPU acceptance is inferred.

A React boundary catches errors delivered through descendant rendering/lifecycle. It does not catch arbitrary event-handler exceptions, asynchronous callbacks, errors within the boundary itself or every GPU context-loss event. Retry cannot guarantee recovery from faulty hardware/drivers, lost contexts or a browser-cached module failure. No GPU support diagnosis, automatic retry loop or replacement anatomy is offered. Framework console diagnostics may still be present; no custom telemetry is added.

Implementation follows the official [React error-boundary guidance](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) and [React Three Fiber Canvas error guidance](https://r3f.docs.pmnd.rs/api/canvas#errors-and-fallbacks). No dependency, model, dataset, font, image or license changes.
