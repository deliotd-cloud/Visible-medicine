# First-release viewer acceptance evidence

## 24 September: abdomen and nested liver branch sample

The owner-only private site was sampled in a temporary in-app browser tab at
1280 × 720 using pointer controls, an inspected screenshot and the browser
accessibility tree. Publication records identify the current site as private
version 110, but this browser sample did **not** independently attest loaded
asset bytes to that version. The tab was closed after the check.

- Abdomen loaded 106 source selections (5 bones, 6 muscles, 17 organs, 69
  vessels and 9 connective; nervous structures were explicitly unavailable).
  The single desktop screenshot showed a compact control rail and no evident
  horizontal overflow; detailed geometry and touch readability were not judged.
- In-page Dissect exposed three stages: 106 assembled, 104 with the available
  wall removed, and 5 in the skeletal framework. Only the second stage was
  applied. Its screenshot revealed the liver, stomach and large intestine;
  the interface stated that missing skin and fascia were not simulated.
- Selecting Liver (FMA7197) retained the second stage and displayed draft
  source identity, a segment-boundary limitation and the nested liver-branch
  entry point. The liver branch study opened within the same page, exposing
  seven labelled arterial, portal, biliary and venous branch groups with an
  explicit incomplete-tree/segment-map warning.
- Hiding the left hepatic arterial branch removed its visible label and changed
  the study preset to Custom selection. Undo restored the branch label and
  All internal branches preset. Back to atlas retained stage 2 and the Liver
  selection. This is one switch/undo/return path, not a complete nested-study
  or GLB-geometry acceptance sweep.

The liver Anatomy panel repeats the same source-coordinate caveat separately
for three excluded vessel surfaces. This is a presentation-clutter finding,
not an anatomical defect; a concise combined note would be easier to scan.
Real touch, keyboard-only navigation, 200% zoom, screen reader, all abdominal
camera angles, CT/MRI registration and clinical validation remain open. The
viewer release gate is unchanged.

## 24 September: ankle-and-foot in-page dissection sample

The owner-only private Atlas was inspected in a temporary in-app browser tab on
Windows at a 1280 × 720 desktop viewport, using pointer controls and the browser
accessibility tree. The tab was closed after inspection. The site was reported
as private version 109 in the saved publication checkpoint, but this browser
sample did **not** independently attest its loaded asset bytes to that version.
No real touch device, screen reader, 200% text zoom or clinical review was used.

- Whole body opened with 1,104 structures. Ankle & foot then loaded 122 source
  selections and the plantar camera. The desktop screenshot showed the compact
  system rail, model canvas and study panel without evident horizontal overflow
  at this single viewport.
- Dissect exposed a five-step layer sequence. Removing plantar layer 1 reduced
  enabled selections from 122 to 116 and exposed four first-layer labels.
  Undo restored the assembled stage and 122 enabled selections. This checks
  one step and one undo, not the full five-step sequence or redo correctness.
- Tray selected arranged separation at 100% and displayed the warning that
  separated positions are not anatomical. An inspected screenshot showed
  distinct rows of separated structures. Reset returned to Spread at 0% and
  the assembled plantar view. Intermediate Tray spacing and exact reassembly
  coordinates were not measured.
- Searching `calcaneus` returned exact left FMA24498 and right FMA24497
  selections. Selecting the left calcaneus populated a draft-marked panel with
  its identity, laterality and BodyParts3D source. Its label appeared on the
  screen-right side of the plantar image, attached by a leader to the projected
  left calcaneus, with a “Behind tissue” warning. This is consistent with
  screen-position labelling; it does not validate the bone shape or all camera
  angles. The model occupied a relatively small portion of the canvas at this
  viewport, so detailed visual-readability acceptance remains open.

The in-app browser's Ctrl-plus shortcut did not produce a verifiable zoom-state
change, so **no 200% reflow result is claimed**. The foot sample narrows the
regional matrix only; the viewer gate remains pending.

A subsequent source-only fix makes a stale or opposite-side foot selection
restore full-source camera framing. Its focused and renderer/visibility/search
checks pass, but this browser sample preceded that fix. The corrected behavior
has not yet been retested in the hosted viewer.

## 24 September: phone-width layout sample (desktop Chrome override)

The authenticated private custom-domain whole-body page was inspected in Chrome
with a temporary 390 × 844 CSS-pixel viewport override, then restored to its
original desktop viewport and Explore state. This is responsive-layout evidence,
**not** a physical phone, real touch, 200% text zoom or clinical acceptance.
At the narrow viewport, the outer page reported 390 px `innerWidth` and 390 px
document `scrollWidth`; there was no measured horizontal page overflow. An
inspected screenshot showed a compact region selector, Explore/Dissect/Practice,
search, model canvas, zoom controls and separate Systems & tools/Structure info
buttons. The model and document still require vertical scrolling.

Opening Systems & tools focused its Close control. The screenshot and accessibility
tree showed six compact system switches, collapsed display/depth/imaging/coverage
sections and a Return to model control in a scrollable sheet. Closing it restored
the viewer, and the temporary viewport override was reset. This samples one
whole-body state only; it does not establish every regional sheet, keyboard path,
screen-reader behavior, touch interaction or 200% reflow.

## 24 September: current private-site whole-body separation sample

The Sites connector reported private version 106 from website source
`dd11143e689051f58f8fc6a1df53a781940a46f4`, with
`https://visiblemedicine.com` as its current live custom domain. In authenticated
external Chrome on Windows, that domain opened `/atlas/3d` with the whole-body
regional viewer and 1,104 structures. This is a bounded desktop pointer/AX and
screenshot sample. A direct browser request for the viewer manifest was blocked
by Chrome, so the observed custom-domain tab was **not independently byte-bound**
to version 106; the separate Sites source/version readback supplies publication
provenance, not browser-asset attestation.

- Explore and Dissect switched in-page without opening another window. Dissect
  exposed 203 currently enabled bone structures, reassembly, guided controls
  and separate reference specimens; it did not silently turn on other systems.
- Spread accepted 0%, 50% and 100%. AX state showed the exact values and the
  non-anatomical-position warning at nonzero separation. Inspected screenshots
  showed skeletal parts separating at 50% and further at 100%; 0% reassembled
  the figure. Explore was restored before leaving the user-owned tab.
- The layout kept compact system switches alongside the model and the study
  panel alongside it at the observed desktop viewport. No structure was selected,
  and no label-side, search, camera orbit or dissection-history behavior was
  inferred from the whole-body sample.

The same authenticated Chrome tab then navigated to Head & neck (291 structures)
and completed its 30-group load. Search returned the exact left maxilla
FMA53650 and right maxilla FMA53649. Selecting each populated a draft-marked
information panel with the correct identity and laterality. Inspected anterior
screenshots placed the left-maxilla label on screen-right and the right-maxilla
label on screen-left, matching the projected structures rather than the words
"left"/"right". In posterior view the selected right-maxilla label moved to
screen-right with a dotted leader and a "Behind tissue" warning. The original
whole-body Explore page was restored after the check. This is a single paired
bone sample, not dense multi-label clearance, every camera angle or anatomical
accuracy validation.

This does not pass the viewer gate. Other regions, all explode mechanisms,
actual phone/tablet touch, 200% text, screen-reader navigation, GPU/context-loss
recovery and a direct current-runtime asset readback remain pending.

### Source-level matrix follow-up (same day)

The focused runner passed 13 common interaction aliases: inline dissection,
workbench/history, explode styles, renderer recovery, labels/depth, Atlas and
independent navigation, selection visibility, and nested practice/history/
navigation. It also passed shoulder workbench, model-first presentation, load/
retry and pelvic close-up. Run logs are local under
`.local/test-logs/2026-09-24T01-31-22.426Z-54636-92d0aa77.log` and
`.local/test-logs/2026-09-24T01-33-57.631Z-39536-9d3eeaef.log`.
Pancreatic dissection and nested cutaway first failed because their test
harnesses lacked an explicit TypeScript loader and Vinext link shim, not because
an observed viewer interaction failed. After repairing the harnesses, both
named checks passed (90 and 6,081 checks). The dedicated cranial artery
component check then exposed an outdated root-count hold; it now admits only
three exact source-catalogued post-baseline additions while retaining the
1,101-root original corpus hold and 29 cranial part checks. The final three-
alias run passed; its log is
`.local/test-logs/2026-09-24T01-42-55.589Z-53620-32c2a166.log`.
Regenerated loading/workbench validation counts were retained rather than
mistaking stale records for current coverage. These suites use scene/component
doubles and CPU geometry; none proves browser/GPU/device/clinical acceptance.

## 24 September: private version 104 separation-control sample

Website `be32dd864c549619b53a73d84d0d6a0c36257d5a`, generated from Atlas
`0aac0fc6663741effea3a48963e1b931f6f5002a`; authenticated external Chrome
on Windows, desktop pointer/AX controls. This was a temporary QA tab on the
owner-only private site. No device emulation, real touch or screen reader was used.

- Whole body loaded with 1,104 structures and a 0% Spread control. Selecting
  Tray changed the control to 100% arranged separation and a warning that the
  positions are not anatomical. Reset restored Spread at 0%. This was an AX
  state check; a GPU screenshot of the arranged canvas timed out.
- Hip & thigh loaded with 95 structures. Spread accepted 50%, 100% and 0%; an
  inspected desktop screenshot at 50% showed the model and the explicit
  non-anatomical-position warning. A search selected the exact right femur
  FMA24474 and displayed its draft identity/laterality/source in the panel.
- With that selection, Extract selected opened at 100%, accepted 50% and 0%,
  and at zero stated that anatomy was assembled. Tray opened at 100%; reset
  restored Spread and 0%, retaining the selected right femur. These are control
  and state observations, not verified pixel positions at every endpoint.
- The source `explode-styles:test` initially failed because its injected scene
  harness lacked the existing `label-depth` import. The harness now uses the
  real library; it passes 404,150 CPU/component checks for 1,104 body entries.
  `dissection-history:test` also passes 108,719 checks. Neither test is a browser,
  GPU, clinical or physical-device acceptance result.

The temporary QA tab was closed. Canvas screenshots at maximum separation
timed out, so maximum visual clearance, all orbit angles, dense labels, other
regions, context-loss recovery and physical-device/accessibility journeys remain
unverified. No viewer release gate is marked complete.

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
