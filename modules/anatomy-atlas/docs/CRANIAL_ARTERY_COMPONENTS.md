# Cranial artery source-part dissection

Head & neck / Whole body → select either posterior inferior cerebellar artery or the right middle cerebral artery → **Explore artery components**. The same source parts also appear in search and source-bound study links. No separate menu or permanently expanded panel is added. The source list scrolls locally while the atlas remains visible; advanced separation and source details start collapsed.

## Exact source scope

| Existing parent | Original file parts | Disconnected components | Triangles |
| --- | ---: | ---: | ---: |
| Right PICA, FMA50519 | 13 | 14 | 4,040 |
| Left PICA, FMA50520 | 13 | 14 | 4,040 |
| Right MCA, FMA50082 | 3 | 6 | 2,342 |

These **29 unnamed source parts are not 29 new anatomical structures**. They partition three already included root surfaces, without duplicating root tissue. The atlas retains 1,087 root selections; navigation now includes 104 nested selections, a mixture of named structures and explicitly unnamed source partitions. SCA has one source file per side, so no redundant one-item dissection was added.

Each part has a stable `vm:anatomy:body:head-neck:<side>:source-component:<parent-fma>-<source-file>` ID, parent ID/FMA, original source tree and file hash. Inherited `fmaId` identifies the **parent**, not a newly defined child FMA. Numbering follows archive membership; it is not proximal-to-distal ordering, an M1/M2 classification or a PICA segment assignment. One file can contain multiple disconnected pieces.

## Controls and safety

- Select, hide/show, fade others, frame selected and six camera directions.
- Lift selected, spread in 3D and flat teaching plate, 0–100% separation; restore source position in one action.
- Source-position guide, clipping controls and clear non-anatomical-layout notices.
- Reassemble plus bounded Undo/Redo for selection and visibility; camera/separation remain separate view state.
- Side-aware search and study links; changed parent records, parent bundles or part hashes reject stale links.
- Loading/retry and renderer-health gates reuse the existing artery workbench.
- No new child clinical/imaging lessons, lecture entitlement, scan correspondence or approval is inferred from parent FMA identity.

## Evidence and licensing

`scripts/export-cranial-artery-components.mjs` reads the previously committed original OBJ files in `content/sources/cranial-arteries`, verifies their hashes and current source holds, then partitions the exact pinned root GLB. It proves equality of every ordered triangle corner **including vertex normals**, winding and multiplicity before and after GLB round-trip. Coordinate placement, parent assets and source files are unchanged. No source fitting, smoothing, generated branches, bridging, reflection or missing-side synthesis is performed.

`docs/cranial-artery-component-audit.json` records per-file topology, the parent hash and exact partition proofs. The original cranial root audit remains unchanged. Combinatorial manifold checks do not establish self-intersection freedom, lumen patency, correct anatomy or clinical suitability.

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Derivative change: source surfaces separated for independent display, with recolouring and original rendered normals retained. Existing licence and attribution requirements remain; no package, font, texture, dataset purchase or paid inference was introduced.

AICA remains a documented gap: the pinned official definition FMA50544 combines FJ1656 and FJ1656M and does not independently identify the two sides. This change does not relabel that group as two named FMA arteries or let bilateral tissue leak into a single-side view. The absent left-MCA definition is not manufactured by mirroring the right side.

## Verification and next clinical checks

Run `npm run cranial-artery-components:test`, plus the femoral-component, nested-navigation, nested-learning, nested-history and nested-teaching suites. Automated tests cover source partition, side/link/source guards, actual component callbacks and server rendering. They do not constitute browser, GPU, touch-device or radiologist acceptance.

Radiologist review should check source positions at 0% separation, overall PICA/MCA extent, retained disconnected pieces and possible source overlap. Only explicitly reviewed additional identifiers should become named branches. Keep this generic donor anatomy separate from the private CT patient-coordinate frame.

The private CT workflow remains independent: first verify coordinate agreement against the original Slicer scene, then review the five posterior-fossa drafts starting with midbrain. Export real correction marks; apply corrections to a separate draft and compare it against the source baseline before explicit acceptance. A candidate-versus-baseline voxel-difference helper is a next engineering task, not a completed mask correction. Do not rerun or overwrite accepted masks to accommodate this atlas dissection. See [Local imaging study](LOCAL_IMAGING_STUDY.md).
