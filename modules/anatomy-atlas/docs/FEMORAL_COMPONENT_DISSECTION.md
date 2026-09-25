# Deep-femoral source component dissection

25 September update: [named component clinical drafts](FEMORAL-COMPONENT-CLINICAL-20260925.md)
add limited Clinical/Pathology context for the lateral circumflex components.
The unnamed remainder and acquired-imaging sections remain pending. Older
implementation counts and pending-status descriptions below are historical.

From **Thigh**, **Pelvis**, **Leg** or **Whole body**, select a deep femoral artery and choose **Explore artery components**. Each side opens its own lateral circumflex source and a clearly labelled source remainder. Search also finds the components and opens source-bound study links. There are four nested selections across two parent views, not four new whole arteries.

## Controls and representation

The compact workbench reuses the atlas renderer, labels, camera views, show/hide switches, Undo/Redo, fade, framing and source-space cutaways. Separation offers **Lift selected**, **Spread in 3D** and **Flat teaching plate** behind one disclosure. Reassemble restores zero separation, both components and the uncut view. The source-position guide is optional; a guide line is not a vascular connection. Cutaway bounds remain fixed while components are hidden. An unavailable source, failed model load or stale study target does not fall back to unrelated brain anatomy.

The two component surfaces exactly partition each current deep-femoral rendered aggregate. The root aggregate remains unchanged and is not rendered alongside its children in this view. The separate descending branches introduced in the previous milestone remain accessible in the root atlas; this view does not imply a complete circumflex tree or measured lumen continuity. The source remainder retains the parent FMA reference for provenance but has its own partial-representation ID. It must not be called a complete deep femoral artery or an independently named perforator.

## Source evidence

BodyParts3D v4 PART-OF originals are retained under `content/sources/femoral-components`. Parent FMA20796 contains FJ2137 and FJ2158 (lateral circumflex FMA20801); FMA20797 contains FJ2069 and FJ2078 (FMA20802). The audit verifies exact source hashes, source definitions, hold exclusions, closed oriented topology and source-side coordinates. All 15,278 triangles reproduce the current parent face multisets, including winding and multiplicity, without shared triangles between each component pair. No fitting, bridging, mirroring or face deletion is performed. Source Float32 conversion precedes the established scene transform to reproduce the original ingestion rounding. Normals are recomputed and verified on export round-trip, not claimed byte-identical to the old aggregate normals.

The derivative GLB contains four meshes, 283,964 bytes, SHA-256 `a35dfffc15ed011570781c6c194ecbfeda08bc70926a39b8cbf0cffa8b88dca0`. See [machine-readable source proof](femoral-component-source-audit.json). Original DBCLS CC BY 4.0 credit, licence and adaptation notice remain in the viewer and third-party notices. No new package, font, texture, external service or scan is introduced.

## Integration and validation

- `lib/femoral-components.ts` requires the exact pinned parent record; nested navigation also verifies the parent bundle. The view exposes only its same-side parts.
- The new `femoral-components` study is supported by search, v2 study URLs and nested learning representations. Existing parent/child source hashes and independent imaging/lecture access gates remain mandatory. The production resource registry is still empty.
- Two original draft teaching concepts use four separate supplemental source bindings. Historical teaching pins are unchanged. The remainder's function, all clinical/pathology sections and acquired-imaging teaching remain pending. The recall questions test model scope, not clinical diagnosis or exam competency.
- `npm run femoral-components:test` verifies export replay, supplemental pins, fail-closed identities, source-bound lessons and real view callbacks/markup with only GPU rendering replaced. `nested-navigation:test` and `nested-learning:test` cover all 75 nested targets. Historical nested history/cutaway/teaching suites retain their previous scope; this new workbench has its own interaction checks.

These automated checks are not browser, GPU, physical-device or clinical acceptance. Radiologist review must address extent, laterality, junctions, teaching and practical usability. No prior aggregate approval is silently inherited. The 1,082 root selections remain unchanged; source-file coverage is not an anatomical completeness percentage. Publication and backups are recorded separately from implementation.

Next priority: inventory the owner's approved anonymized imaging dataset once its folder path is supplied, then build one actual linked CT/segmentation pilot using the existing comparison/reslicer foundations. Do not delay that pilot until every whole-body anatomical gap is filled.
