# Orthographic resize / reassembly correction

## Observed defect and narrow fix

Local hand viewer, 390 x 844 viewport, Dissect stage 2: switching from Spread
to Tray (100%), then returning separation to 0%, shrank the hand almost to a
point. Reset recovered the normal view; repeating the sequence reproduced it.
Installed React Three Fiber replaces an automatic orthographic frustum with
canvas-pixel dimensions on resize/DPR updates. FittedCamera then interpreted
that replacement as a user zoom while preserving the study camera.

FittedCamera now marks only its orthographic camera as manually fitted. Its
existing viewport effect still fits the world-space frustum; perspective cameras
retain automatic aspect updates. No meshes, offsets, teaching, access rules or
saved-camera schema change. Renderer revision regenerated; clinical sign-off is
not conferred by these checks.

## Evidence

- `npm run camera-resize:test`: 27 new checks plus 414 existing camera checks.
  The new test invokes the installed Fiber resize function before the actual
  bundled FittedCamera effect (not a duplicate implementation).
- `node scripts/test-camera-resize.mjs --baseline` intentionally fails on
  immutable Atlas `0cd2125`: expected scale 0.51, actual 48.518957345971565.
- Portrait/landscape, caption height, zoom gesture, reset, saved restore,
  simultaneous resize/slider change and perspective aspect covered without GPU.
- Arrangement, renderer recovery, selection visibility and body-review pass.
  Log: `.local/test-logs/2026-09-25T14-56-12.078Z-35936-7ef0c6e8.log`.
- TypeScript, targeted lint and shared regional production build pass.
  One combined command and an earlier camera-test attempt had native process
  failures; direct reruns succeeded. No unrelated processes were terminated.

## Browser acceptance and remaining work

Before the fix, forearm anterior/posterior label side placement, compact controls,
search and deep-layer selection passed sampled desktop/mobile checks. Hand layer
selection, Tray, selection framing and Remove/Undo passed before the reproduced
reassembly defect. These are samples, not whole-device acceptance.

After HMR the local browser tab crashed. Reload and a fresh tab timed out; the
crash page was blocked by browser URL policy. That policy was not bypassed.
**Post-fix visual acceptance remains pending**. Reopen local hand viewer, repeat
Tray 100% -> 0% at 390 x 844, resize/orbit/reset, then test foot and whole-body.
Reset the browser viewport override when browser access recovers. Website
integration/publication should follow this verification; it has not occurred
in this source checkpoint. Full anatomy and clinical roadmap remains open.
