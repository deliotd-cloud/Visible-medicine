# Camera resize and reassembly integration

Generated from clean Atlas `541bc971918daa421a835e0d9ee45d332a3e6da8`.
The fitted orthographic camera retains its world-space frustum across canvas
resize instead of mistaking automatic pixel dimensions for user zoom. Perspective
aspect updates remain automatic. Tray 0% correctly describes assembled anatomy;
intermediate offsets warn of non-anatomical positions and potential overlap.

Source verification: 441 camera checks, 72 actual-caption cases, explode styles,
renderer, selection visibility, review bindings, TypeScript and shared build.
Actual Chrome samples: hand stage 2 Tray 100 -> 0 at 390 x 844 and landscape resize;
foot stage 4 selected muscle extraction/reassembly and paired label sides;
whole-body bones + muscles Tray 100 -> 0 desktop and mobile resize. Full anatomy
remains visible after reassembly. Temporary viewport overrides reset. These are
samples, not all-device, physical-touch or clinical approval; low-height landscape
still requires scrolling. No geometry, assets, sources, imaging registration or
clinical assertions added. All 136 models / 143 paths and nonregional modules are
unchanged. Atlas, case and paid-lecture entitlements remain independent.

Continue named femoral-component clinical drafts and the full anatomy roadmap.
Publication/recovery evidence is recorded by the main coordination task, not
inferred from this source integration note.
