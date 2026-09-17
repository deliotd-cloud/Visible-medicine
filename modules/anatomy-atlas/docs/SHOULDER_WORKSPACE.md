# Shoulder model-first workspace

## 17 September 2026 — reflow and embedded keyboard correction

The model pane now has separate intrinsic metadata and scene rows, with a
160px scene floor and a bounded column. Enlarged text no longer overlaps the
model. In narrow toolbars the existing explode selector moves above the slider;
short hosts can scroll the model pane without horizontal overflow. No new
controls or source geometry are introduced.

The three shoulder toolbar toggles expose their pressed state. The controlled
structure search preserves anatomical selection when cleared, but now permits
Escape to reach the surrounding tools sheet once the search popup is closed.
Browser testing reproduced the previous swallowed-Escape failure; a source
callback test exercises selection, clear and Escape separately.

Current source verification: shoulder workspace 1,412 checks (108 markup cases,
288 camera/layer callbacks, search callback and scoped PostCSS contracts);
labels, renderer recovery, selection visibility, explosion styles and review
bindings pass. The explosion validator's stale import map now uses the real
model-delivery helper; no geometry, baseline or controller expectation was
weakened. It covers 1,102 body entries and nine shoulder entries. TypeScript,
production and both generated-module builds pass. Delivery verification reports
134 unchanged source GLBs/decoded scenes. Teaching and imaging revisions are
unchanged; display fingerprints refresh without transferring approval.

All seven embedded journeys pass: shoulder at 1160x800, 600x650, 390x650 and
320x600 with root-rem enlargement; head/neck at 1160x800 and 390x650; foot at
600x650. Checks cover keyboard selection where applicable, all three separation
styles at 100/0, reset, pane bounds, metadata/scene separation, and sheet
Escape/focus return. Wide shoulder and head/neck also pass four real canvas
orbit drags with projected-anchor/label-side/leader-endpoint checks. Seven
shoulder structures and the selected C3 label cross sides correctly. Shoulder
camera presets, fade-toggle state and labels on/off pass. No page errors.

Local browser evidence is in the coordinating
work/embedded-viewer-validation-20260917.json and screenshots. This uses actual compiled modules in a synthetic
same-origin iframe host, not a deployed website. The matrix and its explicit
limitations in that report are authoritative; do not infer a pass from a plan.
Root-rem enlargement is not full browser zoom. Physical touch, screen-reader,
low-GPU and clinical acceptance remain separate requirements. No private data,
new dependency, asset, licence, access entitlement or hosted migration changed.

The historical sections below describe earlier milestones; their deployment,
backup and pending-test statements are not current status. Use WORKSPACE_MAP.md
and its latest source checkpoint for current recovery and remaining work.

## Navigation

The dedicated nine-structure shoulder now shares Explore / Dissect / Practice, Focus view and the responsive side panels used by the regional atlas. This is a layout change, not a replacement for the source-based 3D model or its orthographic plates.

- Explore: compact systems, structure search, a folded structure list and grouped Anatomy / Clinical / Imaging notes. Function, Pathology, CT, MRI and Ultrasound remain reachable within those groups.
- Dissect: also shows original-position references, skeleton anchoring, orthographic view, cutaway/transparency controls and four folded source-based illustration presets. The camera and dissection-layer menus remain beside the model in every workspace; the layer menu is locked during an exam.
- Practice: structure-check notes and the existing guarded identification exam. Starting waits for the renderer and model; choosing the workspace alone does not start or reset an exam. An answered question opens the existing information panel when it is collapsed. Exit exam remains available during renderer failure.
- Spread / Extract selected / Tray and their separation slider remain immediately accessible below the model. The toolbar, hint and attribution no longer overlap the rendered anatomy. Zero separation restores source positions; nonzero arrangements are not surgical paths.
- Desktop uses the existing 216px tools rail. At 1100px or below tools open in a side panel; at 700px or below information does too. Focus view gives this arrangement on larger screens. Panels close with Escape, close button or Return to model through the installed focus-managed Sheet primitive. Actual browser acceptance is still pending.
- Very short/zoomed windows may scroll the model pane to keep essential controls reachable. Normal layout does not require scrolling past a stack of controls to reach the atlas. Systems with no included surface explicitly say “Not in this model” and have a disabled switch.

Saved views and the imaging link remain under a folded group. Their underlying state and exact guarded restoration/selection handlers are preserved. Mode panels stay mounted while hidden. The parent explorer still owns anatomy, camera, selection, inspection, practice and imaging state; changing workspace mode/focus does not reset it. Crossing the responsive breakpoint can remount panel-local drafts; this is not a cross-device preference store.

## Evidence and release limits

`npm run shoulder-workspace:test` passes 1,238 checks: 94 server-rendered entry cases across all nine structures, all workspace modes, all seven note sections, practice readiness and Focus view; plus 288 executions of the actual camera/layer menu closures. Invalid values are ignored and exam layer changes are blocked. Installed UI primitives are real; initial workspace/readiness/tab values and the GPU scene are fixtures. Stylesheet assertions check the compact/short/coarse-pointer rules, not pixels or measured scrolling.

The existing regional navigation suite passes 169,702 checks. Model-first validation passes 2,502 checks including 72 region/whole-body markup cases and responsive panel hook tests. Its old callback baseline now explicitly records the preceding `f3b561f` explosion migration (one changed named handler, two buttons replaced by one selector); all other baseline identities remain pinned. A checkout-confined component test builder avoids ancestor configuration discovery, while installed packages remain real external dependencies.

Recovery (704), explosion styles (375,454), saved views (17,696), imaging link (48,082), review (189), type checks, focused lint and production build pass. The 808-package licence audit retains existing notice obligations. No dependency, font, texture, model, anatomical content, clinical sign-off or licence obligation is added. All nine display-review revisions expire because the layout and its shared dependencies changed; teaching revisions remain exact and imaging stays absent.

Pending: real browser/GPU layout, keyboard focus/return, Escape, touch, narrow landscape and 200% zoom checks; clinical review of source anatomy/content; actual rights-cleared CT/MRI/US studies and the user's imaging adapter. Do not interpret source counts, tests or diagrammatic shading as medical validation.

## Saved versus published

At 19:48:33 UTC on 7 September 2026 the Site is still owner-only (custom, one account, no external visitors or groups), version 38. Its source Git host cannot be reached on port 443, before authentication. No source push, version save or deployment was performed for this change. The previous GitHub authorization/connectivity blocker also remains unresolved. Local checkpoints are not evidence of remote backup or publication. This background milestone does not start a browser-only preview.

Next: review hidden-selected-structure feedback across systems, dissection layers, cutaways and all explosion styles; improve targeted recovery where a selected structure is no longer visible without resetting the entire study view. Preserve source-space imaging contracts and all candidate holds. The larger improvement goal remains active.
