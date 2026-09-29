# Dense labels and whole-body separation acceptance

29 September 2026; local website `0c608b3`, Atlas source baseline `05633d3`.
The website's delivered runtime is unchanged from the review-navigation checkpoint.
This is acceptance evidence only, not a new deployment, clinical approval or
new anatomical asset. All existing source and release gates remain in force.

## Multi-label journeys

Actual integrated `/atlas/3d` routes were exercised in Chromium with a desktop
1440×1000 viewport and a 375×812 viewport at ordinary/doubled iframe root text.
The test uses the real learner controls and model bundles, not synthetic anchors.

| View | Visible desktop landmark labels | States |
| --- | ---: | ---: |
| Head/neck: Expose deeper neck muscles | 6 | 14 |
| Thorax: Expose deeper chest wall | 2 | 14 |
| Whole body: Organ window | 4 | 14 |

Each view covers Spread and Tray at 100%, all six standard directions, then two
phone/text-size states. Visible labels remain inside the canvas, non-overlapping
and on their actual projected screen side. Desktop cases retain all their stage
labels. Narrow-view density intentionally decreases; omitting a label does not
remove its tissue. Representative neck Tray and whole-body screenshots inspected.
No page errors were reported in the successful runs.

## Separation and return

Whole-body Organ window, Heart selected: Spread, Tray and Extract selected each
exercise 0%, 50%, 100% and Reset. All three produce a visibly different separated
render; Reset retains the organ recipe and restores the four projected landmark
anchors to their baseline positions. Reassemble then restores the Assembled
anatomy recipe and 0% separation, with all required groups loaded.

An initial byte-identical screenshot assertion failed after the orthographic
Canvas remount: only 1–6 pixels of468,342 differed (maximum channel difference27).
The original failure evidence is retained. Visually inspecting both renders and
comparing decoded pixels showed no macroscopic movement. The follow-up separately
checks each named landmark within0.000001 CSS pixels and permits at most0.01%
changed raster pixels with maximum channel difference32. This is an explicit
anti-aliasing tolerance, not a byte-identical rendering or all-vertex proof.

## Evidence and limits

Main coordination workspace `work/`:

- `dense-stage-browser-20260929.json`:28 regional states.
- `dense-stage-browser-whole-body-20260929.json`:14 whole-body states.
- `whole-reassembly-20260929.json` and matching log: original strict-hash probe.
- `whole-reassembly-raster-20260929.json`: follow-up anchor/raster measurements.
- Matching browser scripts, logs and PNGs, including `whole-reassembled-20260929.png`.

No production implementation was changed to satisfy these checks. They do not
establish clinical correctness, every structure's visibility, arbitrary-orbit
non-overlap, registration to acquired images, physical touch behaviour or a
screen-reader journey. The overall viewer/release gates remain pending.
