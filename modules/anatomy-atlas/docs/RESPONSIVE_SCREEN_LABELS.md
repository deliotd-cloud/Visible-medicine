# Responsive, screen-side anatomy labels

The shared `SceneLabelLayer` serves the shoulder and body/regional/specimen viewers. It projects the actual tissue anchor after orbit, pan and explode transforms, then lays out measured HTML buttons. Anatomical names/IDs never change with screen side.

## Density without another toolbar

- Canvas width below 560 CSS pixels: each label column is at most 30% of the canvas (capped at 160 pixels), preserving a clear central corridor. A canvas shorter than 320 pixels shows at most one label per occupied side; taller narrow canvases allow two.
- Wider canvases retain up to the existing eight labels on either side when space permits. Only very short canvases (below 240 pixels) reduce this to two per side.
- The selected structure has first priority on its own projected side, then the established landmark order. A full column never pushes a label onto the opposite side. More labels return automatically when the canvas grows.
- This only changes label density, not tissue visibility, meshes, camera registration, selection/search or learning content. All structures remain available through their 3D surface and existing structure controls. Hidden label buttons and their leaders are disabled/hidden together.
- Existing font size and coarse-pointer target rules are retained. Width caps are integral to match `offsetWidth`, preventing a fractional-pixel cap from incorrectly rejecting a correctly measured label. Measured height still controls fit; an oversized/offscreen label cannot be promised visible.
- Label buttons expose their selected state via `aria-pressed`; the overlay is a named group. Exam/fade/cut guards still control whether labels register at all.

## Verification

`node scripts/validate-screen-labels.mjs` tests the real Three.js camera projection, full-body catalogue anchor samples, side preservation, transform application, ordering, selected priority, measured-size collision avoidance, invalid dimensions, narrow/short/tall budgets, desktop one-sided density, odd pixel widths and exact component frame/DOM wiring with injected hooks. It writes `docs/screen-label-validation.json`; that report explicitly does not claim browser, font-metric, physical touch-device or clinical acceptance.

For each source-derived website export, check the actual small-canvas and resized desktop result; selection of a previously omitted name; anterior/posterior/free-orbit side changes; explode/restore; and identification mode with no premature labels. Preserve source and clinical review fingerprints. Real browser screenshots/checkpoints and remaining limitations belong in the main task's dated delivery record. Regenerate both website modules from clean Atlas source; never patch compiled copies.
