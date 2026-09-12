# Female pelvis Atlas pilot

The catalogue now includes `/atlas/female-pelvis-3d`, beside the shoulder pilot. It is a same-origin, first-party browser module compiled from Atlas commit `3e1c297abae999015f18c286847dd070d2fe86f6`; `public/atlas-runtime/female-pelvis/manifest.json` binds its exact files to that source. The newer [responsive-label update](responsive-atlas-labels.md) reduces mobile clutter and documents actual browser checks.

41 source surfaces, eight studies, tissue toggles/search, selection, fade/frame/set-aside, undo/redo/reset, selectable separation mechanisms, labels and identification practice reuse the actual HRA pelvic workbench. Draft teaching covers 31 selections; ten remain pending. All six withheld source groups stay withheld. No pelvic floor, nerve network, complete female anatomy, patient scan, registered image or clinical acceptance is claimed.

The page shares the shoulder's model-first frame and collapsed coverage note, keeping the canvas prominent. The module has independently scrollable controls and a stacked small-screen layout. It does not add a second website navigation system. Study/camera selectors now display readable names rather than internal IDs; long study names wrap. The embedded panel explicitly retains vertical-only scrolling.

On 12 September 2026 a local browser pass reproduced a real loading failure in the initial export: the delivery resolver rejected the catalogue's versioned model URL. Atlas `190f62bbf9706789452b8af1a6ad2a13a812a300` fixes this and tests actual catalogue URLs, while continuing to reject external addresses, traversal and unrelated query parameters. Actual WebGL geometry subsequently loaded. This supersedes the earlier SSR-only loading evidence; stubbing the scene could not establish browser loading.

The same pass preserved a verified orphaned local preview lock as a separate recovery file after checking that its recorded PID did not exist and port 3000 had no listener. No process was killed. The owned preview then served the route successfully.

Real-browser checks covered all eight study views; set-aside, undo, redo and reset; fade/frame; all three separation styles to 100% and return to source positions; filtered search and selection; practice reveal/next/back with selection, visibility and search preserved; and free camera rotation. At 390×844 the document width equals the viewport width, the model remains above the independent controls, and there is no horizontal page/panel scrollbar. Mobile labels can still obscure a small model: the existing Labels control exposes an unobstructed view. This is a single browser/viewport sample, not physical touch-device, assistive-technology, 200% text, cross-browser or anatomical acceptance.

Remaining console findings: the rendered Three.js bundle emits a non-blocking Clock deprecation warning; a MutationObserver error without an attributable application URL also appears during reload. Its origin is unresolved, so a completely clean console is not claimed.

## Delivery and source of truth

Do not hand-edit the generated module. Rebuild from Atlas `integration/female-pelvis` and its documented export script, preserving the old version before a replacement. The manifest records file sizes/hashes and explicitly declares no patient data, clinical approval, review connection or imaging connection. Exactly one canonical 3,796,080-byte HRA display GLB is included, unchanged SHA-256 `f18f1f0e3c6e8c0562b6b66864a8d786ffdb9e6a688da9288550fad6e491b866`.

The iframe is trusted code with CSS isolation, **not** a security sandbox or paywall. Preserve the owner-private audience. Independent Atlas/case/lecture server-side authorization is still required for launch. No private Atlas review API or patient study is connected; the shoulder selection adapter is not a valid adapter for these different pelvic IDs. Didanix Education linking waits for cleared mappings and actual adapter acceptance.

The module includes original HRA/HuBMAP CC BY 4.0 attribution, modifications, model download and legal text, plus licence text for the dependencies actually bundled. No new dependency, paid service, font, texture or AI-generated anatomy was added. Source/reference rights remain separate from original MIT code/teaching.

## Verification and release

Atlas: TypeScript, full build, 41-mesh source/delivery verification, real React workbench/practice SSR, valid/invalid delivery-prefix checks, existing 31-selection teaching checks and 354-context private review regressions pass. Website: TypeScript, full build and all 62 tests pass, including both exported module inventories and hashes. None reads private production review records or grants clinical approval.

Initial GitHub/D recovery and terminal private publication evidence are recorded in the main coordinating task's `work/PELVIC-MODULE-CHECKPOINT-20260912.md`; the newer browser fixes are recorded in `work/PELVIC-BROWSER-CHECKPOINT-20260912.md` after verification. The standalone Atlas's earlier version 171 is a separate release and is not updated by this smaller website delivery.
