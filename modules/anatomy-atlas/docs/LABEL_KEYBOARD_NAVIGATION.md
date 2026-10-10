# Screen-position label navigation

The shared 3D label layer supports keyboard exploration without additional visible controls:

- Tab reaches the existing visible label buttons.
- Up/Down move to the previous/next visible label on that screen side.
- Left/Right move to the nearest-height visible label on the other screen side.
- Home/End reach the first/last label on the current side.
- Enter/Space retain native selection. Moving focus alone never selects anatomy.

Navigation reads the current rendered positions, not source-array order or anatomical
laterality. Orbit, extraction and resize therefore do not leave a stale keyboard order.
At an edge focus stays put, without scrolling or passing the navigation key to camera
controls. Hidden, disabled, disconnected, inert and foreign-document labels are excluded.
Modified keys, composition and ordinary Tab/activation are left alone. The group exposes
screen-reader instructions and each label exposes its keyboard shortcuts.

Verification: `npm run scene-label-navigation:test`, the existing screen-label,
selection-visibility, overflow, renderer and review-binding checks, fresh TypeScript
and an isolated regional build. Unit/component checks use synthetic DOM positions;
they are not a substitute for native browser/screen-reader acceptance.

No source geometry, anatomical names, teaching, imaging or approval changed. Renderer
fingerprints are regenerated so prior display sign-off is not silently reused. The
generated website module must be imported through the normal pipeline before this
source change is available in the website. No public deployment is implied.
