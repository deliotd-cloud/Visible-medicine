# First-release viewer acceptance evidence

## 19 September: private 96 head/neck keyboard sample

Website `5e8ff425b5386c9531f44566695c4a3862849b04`, Atlas source
`cd2d9027a4022bf174a0679e1910edd8c72d3ab8`; external Chrome on Windows,
desktop keyboard and an inspected 1230-by-1456 screenshot. No zoom/device
emulation or screen reader was used.

- Opened Search with Enter: focus entered its search field. Tab reached the
  search-scope selector. Selecting Brain (FMA50801) via Enter closed Search,
  updated the study panel and, after closing transition, returned focus to Search.
- ArrowRight on the information tablist moved focus to Clinical; Enter selected
  it. In Focus view, Details opened the info sheet with focus on Close. Shift+Tab
  wrapped to Return to model; Escape returned to the actual Details launcher.
- Systems & tools opened by Enter. Space toggled Bones off, and Return to model
  closed the sheet. The selected Brain remained available. The model canvas
  accepted arrow-key input, and Tab moved to the Brain label without a trap.
  A later rotation screenshot timed out; do not infer a verified numerical
  camera angle or complete keyboard-camera visual acceptance from this sample.
- Study-preview defect reproduced: Enter on the Deep-brain overview study-window
  search result hid the results and moved focus to the dialog root, not either
  confirmation action. The confirmation was present, but keyboard users lost
  their position. Cancel did not apply the study. A source fix must explicitly
  focus confirmation and restore the originating result on cancellation, while
  preserving existing query/filter and new-sheet handoff behavior.

This sample does not complete any release gate. Real touch, text zoom, screen
reader, all regional journeys and independent access-denial checks remain due.

### Corrected study-preview focus: generated candidate

Atlas `ff5e396557bcf669d53ea608a38730873cfa3d66` was built and exported locally.
All 198 exported files were checked against manifest byte counts and SHA256
before loopback-only serving. Manifest SHA256:
`9f8bd47e1a5b64993b0350175ab689b0a2c335ecc6a74ca925019b4cbd110e6b`.
This is source/browser acceptance, **not a website deployment**.

Actual Chrome keyboard checks passed:

- Both Deep-brain overview window and compartment previews focus Open study
  view. Cancelling the window returns to its exact search result.
- In related results for “brain”, Choroid plexus & fornix focuses confirmation;
  cancellation restores its exact result and the enclosing native disclosure
  remains open. Search query/filter state is retained.
- Editing the query dismisses preview without stealing input focus. Changing
  Search within by ArrowDown dismisses preview and retains the select's focus.
- Confirming a window in Focus view closes Search, opens the correct deep-brain
  dissection (22 enabled) and gives focus to Close systems & tools, not Search.
- Inspected desktop confirmation screenshot: primary action has a clear focus
  ring. At a requested 390-by-844 viewport override, explanatory text and both
  actions fit; keyboard cancel still restores the exact result. Override reset.

The local test tab/server were closed and port 57673 had no listener afterwards.
No source geometry, teaching content, saved views, permissions or patient data
were changed. Renderer/review fingerprints were refreshed without approvals.

Regression coverage includes actual component callback/effect execution with a
controlled focus boundary, plus the existing navigation/renderer/visibility/review
suites. The navigation harness needed an explicit effect boundary after adding
the new effect; its callback and SSR assertions were preserved and rerun. Browser
checks above, not synthetic focus nodes, establish actual DOM focus behavior.

## 19 September 2026: private version 95, desktop samples

Tested website `a43c9c2e2d67245ef3a7b91edcfa1c96f1fa43b5`, generated from
Atlas `924e0dd79eb1d96ab89a61f35d6e34ddb6475026`. This file and subsequent
test-only commits do not imply that a newer viewer has been deployed.

Environment: authenticated external Chrome on Windows; mouse and keyboard;
observed screenshot canvas 1230 by 1456 pixels. No viewport override or physical
touch device was used. Browser screenshots were inspected in the task; this
record describes observed behaviour, not stored image attachments.

| Sample | Observed outcome |
| --- | --- |
| Head/neck, FMA78454 | Search opened third ventricle study; four-space find round, skip/reveal and return preserved selection/visibility; question labels hidden. |
| Thorax, FMA9466 | Fade-others blocked launch; hiding right atrial cavity reduced pool to three. Name-isolated round accepted one correct, one skipped and one wrong answer, locked grading and reported 1/3. Retry included two missed targets. |
| Cardiac return | Hidden right atrium, left ventricular selection, Fade off and Undo survived the round. Undo/redo worked; practice summary regained focus. Extract slider End/Home reached 100%/0%; reassemble restored four spaces. |
| Thigh navigation/search | `/atlas/3d?region=thigh` opened 95 structures; left rectus femoris FMA38929 selected with draft teaching/source identity. Explore and in-page Dissect worked without a separate window. |
| Thigh extract | Selecting Extract selected applied 100%. Anterior screenshot placed extracted muscle and label on screen-right; posterior screenshot placed both screen-left. Home restored 0%; ArrowRight reached 1%. Hiding selection removed its label and prompted selection of a visible target. |
| Thigh tray | Maximum separation visibly arranged tissues into rows with non-anatomical-position warning. Home/PageUp reached 0%/10%; reset returned Spread and 0%. |
| Thigh spread | PageUp reached 10%; End reached 100% and visibly separated tissues. Reset returned assembled presentation. This is visual/control evidence, not exact numerical mesh-transform comparison. |
| Thigh layers/history | Stage 1 had 95 visible, stage 2 had 89; Undo/Redo restored these counts and stage captions. After Muscles off, Undo kept that system off and reported 41 visible, without muscle labels. Reassemble and explicit system-on restored the full set. |
| Protected delivery | Existing read-only hosted diagnostic passed all 135 registered objects / 142 paths: full bytes/SHA256, HEAD, range and conditional responses. No models were uploaded. This is authenticated success-path evidence only. |

## Semantics and remaining coverage

Dissection history restores recipe/manual removal state, not independently chosen
system filters. Undo must not silently re-enable a system. Restored-but-system-
hidden structures must remain excluded from rendered labels and selectable
visible anatomy. A focused handler/visibility regression complements the actual
thigh check; neither substitutes for the complete matrix.

Still required: whole-body and every included region's common journey; both
sides and dense multi-label overlap; full intermediate/max/reassembly combinations;
broader retry/failure cases and WebGL/context recovery in a browser; real phone/tablet
touch; 200% text zoom; screen-reader/focus navigation; independent specimen checks;
signed-out, denied and expired access. Previous narrow iframe tests are responsive
layout evidence only. No global viewer gate is passed by these samples.

Known navigation issue: static public Atlas header displays Sign in even when
authenticated workspace displays Profile. Preserve independent access enforcement
when addressing it. No diagnosis, clinical approval, shipping allowlist or new
entitlement is supplied by this evidence. See `FIRST_RELEASE_CHECKLIST.md`.

## 19 September: controlled model-download failure and retry

The same version-95 regional export was served on loopback only, without editing
its code or assets. Before serving, all 198 manifest-listed files were checked
against their exact byte lengths and SHA256. Manifest SHA256:
`0822c89521e509d79ae9542b757dd15c9929696bdb1fa38f239336b9830efe44`.

The local test server deliberately returned HTTP 503 for the first request for
`models/bodyparts3d/full-body/thigh-muscles-dissection.glb`; its second request
returned the exact verified original after a five-second delay. No live-site
request was intercepted, no source file changed, and no scans were served.

Observed in real external Chrome:

1. Missing anatomy produced a warning and Retry missing anatomy control. The
   remaining model loaded; this was not a test-double or static markup check.
2. Before retry, changed to thigh dissection stage 2, selected left femur
   FMA24475, changed camera to Posterior and Spread separation to 10%.
3. Retry showed a disabled Retrying control; local server evidence recorded
   exactly the failed first request and delayed successful second request.
4. On completion, warning/retry control disappeared and rectus-femoris labels
   returned. Screenshot inspection confirmed rendered anatomy, posterior view,
   left-femur selection, 10% separation and stage 2 retained. Undo remained
   available; Undo/Redo then returned to stages 1/2 respectively.
5. Closed the local test tab, stopped its exact process and confirmed the
   loopback port no longer listened. The live Atlas was untouched.

The temporary harness and process evidence are retained in the main coordination
workspace at `work/serve-model-retry-qa-20260919.mjs` and its recovery checkpoint.
This sample covers one asynchronous GLB fetch failure, retry and delayed success.
It does not prove hardware/WebGL-context recovery, retry during active practice,
malformed geometry handling, all bundles, touch or nonvisual acceptance.

### Confirmed presentation issue to correct

During the failed load, the dissection heading still said **89 visible** because
it counts enabled structures, including those in the failed bundle. The warning
was present, but that count's wording overstates loaded/rendered anatomy.
`app/dissection-controls.tsx` receives `visibleCount={available.length}` from
`app/body-explorer.tsx`; distinguish enabled from loaded/failed status without
changing independent visibility filters, layer recipes or history semantics.
Source correction now labels this count **enabled**, with an explanation that
models may still be loading or unavailable. Actual control markup is checked in
pending, ready and failed states. Rendering/review fingerprints and the unsigned
pilot index are refreshed; no clinical approval is inherited. Website publication
and the post-correction browser check are recorded separately in coordination
evidence, not inferred from this source change.
