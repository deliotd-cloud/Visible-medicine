# Live model-view direction

The regional, whole-body and nested BodyScene viewers now show a compact **View from** readout that follows the actual camera. It distinguishes front/back, model-left/model-right and above/below. This is separate from the selected camera preset: rotating freely no longer requires interpreting the preset as the current viewpoint.

The line occupies reserved space inside the existing scene height, above the canvas. It does not overlay structure labels, add a toolbar or expand the page. Text can wrap with enlarged fonts or narrow screens. It is read-only, has no pointer interception and is not a live region that announces every rotation. Exam mode removes the line. The existing renderer-recovery boundary hides it when the renderer is unavailable. The dedicated nine-structure shoulder viewer is unchanged; this addition covers the shared body/organ renderer.

## Coordinate and rendering contract

- Axes derive from the catalogue's validated, rigid, uniformly scaled LPS-reference-to-scene transform. Reflected, singular, malformed or inconsistent transforms produce `unavailable`, not guessed direction labels.
- Use the negative of the live camera's world look direction. Camera position alone would mislabel a panned view. The [Three.js camera contract](https://threejs.org/docs/pages/Camera.html) defines its negative-Z forward axis; world direction also accounts for camera parents.
- Broad sectors include an axis above a 0.3 normalized component and retain it down to 0.2 to reduce boundary flicker. Text order is front/back, side, above/below. The output is approximate orientation, not a measured angle, acquisition plane or diagnostic projection.
- Pan, zoom and camera roll do not change the side from which the camera looks. The line does not describe screen-up after roll. Separation changes display positions, not anatomical axes; the existing warning about non-anatomical separated positions remains.
- The observer participates in the existing demand frame loop, without changing the camera, starting a new loop or scheduling React updates per frame. Unchanged text does not trigger DOM writes. A changed frame clears the old readout before the next render.

This is the reference model's anatomical frame, not patient DICOM orientation, image registration or a CT/MRI/X-ray/US connection. No tissue coordinates, anatomy content, quiz data, source identities, access gates, dependencies or licence obligations change. Existing commercial-use notices remain in force; no external images or datasets were imported.

## Checks and remaining acceptance

`npm run camera-orientation:test` checks real perspective/orthographic camera directions, obliques, roll, pan, zoom, camera parents, transformed source frames, sector hysteresis and invalid-frame fallbacks. It executes the actual frame observer with controlled hooks and checks the shared scene's readout/ref/exam/recovery wiring across all three separation styles. The existing origin-guide regression covers 14 nested parent views/69 representations. These are engineering checks, not live-browser, GPU, mobile, enlarged-text or assistive-technology acceptance. Independent anatomy and device review remain outstanding.

Verified on 10 September 2026: 137 orientation checks, 3,926 existing origin-guide checks, 704 scene-recovery checks, TypeScript and production build. The build retains its existing large-chunk and static-route-classification warnings. The source catalogue hash and shoulder review fingerprints are unchanged.
