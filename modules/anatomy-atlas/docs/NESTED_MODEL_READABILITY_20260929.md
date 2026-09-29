# Nested dissection: usable model space on short screens

An actual website iframe375×577 inside a375×812 phone viewport left the ventricular
model with only84.45px of drawing height. The190px viewport minimum included
wrapped camera tools and orientation text rather than reserving space for geometry.
The earlier root-body short-panel fix did not cover inline nested studies.

The shared inline study layout now reserves model drawing space separately from
the intrinsic heading, camera controls and orientation row. Phone/short-window
controls follow the model in one reachable scroll flow rather than a100px nested
control slot. Warnings and controls are retained; no new toolbar is introduced.
Normal desktop retains its side-by-side layout. Short screens and enlarged text
necessarily require some scrolling instead of shrinking the model to unreadability.

Scene-tool targets remain at least44px on phone. Scoped font-relative switch tracks
keep their thumbs inside the track at enlarged text sizes; no global switch or
application behavior is changed. Geometry, labels, content, source identities,
selection/history logic and entitlements remain untouched. Presentation revisions
are refreshed without transferring existing clinical approval.

## Verification boundaries

`scripts/test-nested-model-readability.mjs` is an18-case real-browser CSS fixture,
not anatomical/GPU acceptance. It covers widths320/375/700, heights320/577/812 and
100%/200% root text, orientation space, expanded control reachability, warnings,
switch bounds and horizontal overflow. Use an existing local Playwright installation
via `VM_PLAYWRIGHT_MODULE`; no new product dependency or service is required.

The coordination checkpoint records separate generated-module/iframe acceptance
for ventricles, eye and femoral components, including short phone and normal desktop.
It also records exact source/recovery and later website-import state. Root-text
emulation is not native zoom, physical-device, screen-reader or clinical approval.
No patient data, models or new third-party media were added.
