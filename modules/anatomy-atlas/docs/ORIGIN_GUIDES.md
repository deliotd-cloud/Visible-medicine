# Internal-dissection original-position guides

Open **Separate components / structures / spaces**, switch on **Show original position**, select a part and increase separation. The optional teal wireframe marks its original source position; one thin line joins its source anchor to its displaced anchor. Only the selected part is annotated. Camera framing includes both the source and moved bounds, including Focus selected.

Applies to nine parent views across the eye, ventricles, brainstem, cerebral, cardiac, pulmonary and hepatic studies (53 source-bound selectable representations). Eyes support lift; the other studies support lift and 3D spread. Existing region/whole-body original-wireframe behaviour and the dedicated shoulder renderer are preserved.

The preference starts off for each newly mounted study. Undo/Redo and Reassemble keep that preference; Reassemble returns separation to zero, so the annotation disappears. The annotation is suppressed at zero displacement, in flat-plate layout, during any cutaway, in exam mode, without a visible selected part, for context-only parts, and below 20% selected opacity. Neither the ghost nor line intercepts pointer events. Nothing is persisted to a server or shared URL.

This is a display annotation, **not tissue, a connection, a measured distance, a dissection route or surgical guidance**. It uses existing source geometry/anchors without adding anatomy or changing source coordinates, meshes, licences, teaching text, entitlement policy or imaging correspondences. Context cannot be reconstructed from missing source anatomy.

Validation: `npm run origin-guides:test` exercises the actual scene's camera bounds and mesh/line props with controlled hooks/asset loading across all 53 parts; `npm run nested-history:test` covers the real UI callbacks, default-off state, collapsed placement and history/reassembly behaviour across nine views. Geometry, bindings, explode-style, cutaway and teaching regressions are separate checks. These do not replace browser/GPU/mobile visual acceptance or independent anatomical/clinical review. Verify line visibility/occlusion and touch usability on real devices before public release.
