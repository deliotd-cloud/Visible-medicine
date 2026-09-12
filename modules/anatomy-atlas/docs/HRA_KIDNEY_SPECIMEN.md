# Separate kidney dissection

Implementation checkpoint: 2026-09-12. This follows the [original renal source audit](HRA_RENAL_SOURCE_REVIEW.md); the retained original manifest remains unchanged as historical audit evidence. Availability in a built application is distinct from successful live deployment.

## Access and navigation

Abdomen or whole body, in Explore/Dissect: **Kidney layers · separate reference**. Direct route: `/specimens/kidneys`. The independent specimen opens only on request, preserves the main atlas state, is disabled in atlas exam mode and restores launcher focus on return. No additional permanent control panel is added.

The existing compact specimen workbench provides selection, searchable structures, hide/restore with Undo/Redo, isolate, camera presets, zoom, labels, diagrammatic colours, collapsed tissue controls, source notices and teaching. Separation modes remain spatial expansion, selected-structure extraction and an organised tray. Zero separation restores original display positions; intermediate motion is not dissection along an operative plane. Whole ureters are excluded from close-up collecting/internal studies so they do not shrink the kidney framing.

Nine studies: right/left internal kidney, right/left collecting system, right/left supplied layers, hila/pelves/vessels, pelves/ureters, and all supplied renal surfaces. The initial right-internal view reveals 34 supplied selections; the left counterpart has 37. Their counts are source representations, not a universal anatomical template.

## Geometry, identity and limitations

82 selections / 189794 original triangles are delivered in a 3557552-byte GLB. Display SHA256: `bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc`.

The left outer cortex, right renal-column group and left renal vein are excluded in their entirety for audited defects. No replacement, mirroring, welding, hole filling, pruning or geometric repair is performed. Other source open ends and separate shells remain. The absence of held structures must not be taught as normal anatomy.

Each selection has a stable `vm:reference:hra-united-female-v1-10:kidneys:` identity, exact original node name/index, preserved UBERON metadata, source checksum, surface anchor and bounds. UBERON is not relabelled FMA. Structured `vm:` searches use exact identities, avoiding left/right matches caused by tokenising IDs. Concept IDs may repeat across source parts; source-part letters are not validated papilla-to-calyx drainage links (the left source contains 11 papilla parts but 10 minor-calyx parts).

Source metres use x-left, y-superior, z-anterior. Display coordinates are source coordinates multiplied by positive 10; normals, other attributes and index order are unchanged. The catalogue records the separate HRA LPS-mm frame and transform. No alignment to the main-body donor or patient CT/MRI is claimed. Later integration requires reviewed structure mappings, source/target frames and an explicit registration; a shared ontology label alone is insufficient.

## Teaching, licensing and sign-off

12 concise original Anatomy/Function concepts are source-bound to all 82 selections. References: [NCI SEER kidneys](https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html) and [ureters](https://training.seer.cancer.gov/anatomy/urinary/components/ureters.html), reviewed 2026-09-12. No referenced images, tables or long passages are imported. [Clinical/imaging teaching](HRA_RENAL_TEACHING.md) now supplies 44 topic texts across 398 placements and 12 source-aware self-checks. Unsupported topics keep explicit pending states. Identification practice accepts only 13 meaningful non-lettered source selections, excludes lettered parts from both targets and choices, and retains dissection state. It is not a validated examination.

The original HRA geometry is CC BY 4.0: credit, licence links and modifications appear in the viewer, [public reuse notice](../public/models/hra-renal/NOTICE.md) and third-party notices. Existing dependencies/styles are reused; no new package, font, texture or paid service is added. Separate paid lectures remain separately entitled. Product/legal review must preserve recipients' CC BY rights to this asset.

Radiologist sign-off remains required for identities, laterality, capsule/cortex/column relationships, hilar surfaces, papilla/calyx relationships, retained open shells and correspondence to teaching. Missing fascia/fat, nerves, microscopic nephron detail, complete arterial/venous trees and held structures remain gaps. Mobile/GPU/browser appearance, picking under orbit, labels and controls require explicit device review; automated tests are not that evidence.

## Reproduce and verify

`npm run hra-renal:export` deterministically derives the display from the retained original subset and pinned audit. `npm run hra-renal:test` verifies retention, regeneration, every admitted attribute/index, bounds/anchors, source guards, studies, removal/Undo/Redo, all separation modes/directions, search, quiz restrictions and ten server-rendered component states. The WebGL boundary alone is stubbed for component checks. `npx tsc --noEmit` and the production build remain additional gates. Original recovery sources are not served; the new display GLB participates in the existing lossless delivery compression check.

Completed checks at this checkpoint: renal suite (1151136 accessor/index values, 82 decoded meshes, 10 component renders); existing specimen search (1375 checks); existing HRA pelvis suite; TypeScript; requirement inventory consistency; model-first navigation (3656 checks, 105 markup cases). The original handler baseline remains pinned; only the two new kidney launcher/close bindings are explicitly admitted and independently executed. Production build passed, with all 125 GLBs / 1433 meshes / 4299 buffer views losslessly verified. Existing large-chunk warnings remain. These results do not replace browser/device or radiologist acceptance.
