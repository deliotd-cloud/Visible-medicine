# Eye-layer dissection

## Use

In Head & Neck (or whole-body), search for **left eyeball** or **right eyeball**, select it, open its structure details and choose **Explore eye layers**. The focused dialog starts with anterior structures. Select a named component or click its surface; switches remove/restore it. Selecting a hidden component reveals it. **Undo layers** restores selection, study preset and visibility, with 30 in-memory snapshots; it does not undo camera, separation or cutaway adjustments. **Reassemble** restores all available components, zero separation and an uncut view. It does not save a bookmark.

**Cutaway** is collapsed by default and starts off. Choose axial (horizontal), coronal (front–back) or sagittal (right–left), move the position slider, and reverse which anatomical side is retained. Positions use the fixed bounds of all available eye components, independent of camera, selection or hidden layers. A new plane starts at the midpoint with the superior/anterior/left side retained respectively. The selected component is also cut: opaque selection does not bypass clipping. Active cuts keep a visible **Restore whole view** button over the model even when the control is collapsed. This restores uncut surfaces without altering visibility, selection, separation or camera. Study presets clear cuts and separation; Frame and Undo layers do not clear cuts. The selected-component panel warns about partial or complete clipping using conservative source bounds, not an occlusion/visible-pixel test. Cuts follow each component in separated layouts. These are artificial, uncapped open surfaces: no CT/MRI slice, internal tissue, histology, registration or patient anatomy is generated or implied.

Choose anterior, lens/support, wall or all-components presets. Custom visibility is labelled Custom selection. **Lift selected component** retains free 3D rotation; **Spread all (flat plate)** uses the existing orthographic teaching arrangement. At nonzero separation the display explicitly states that positions are not anatomical. Labels, six camera presets, framing and fade-others controls use the existing renderer. Camera/selection/dissection state in the main atlas is retained when returning. The parent scene is unmounted while the eye view is open, avoiding concurrent parent/child canvases or duplicate aggregate geometry. The launcher is unavailable in active practice; no quiz answers or new imaging events are emitted by this nested view.

The desktop dialog keeps the model beside a narrow, internally scrollable control panel. On narrow screens controls sit below the model inside the dialog. Escape, Back to atlas and the existing accessible modal primitive provide dismissal. The main launcher is refocused on close. Device, keyboard-focus, visual-quality, small-screen/landscape, long-label, 200% text and touch acceptance still need explicit browser testing; source and server-render checks are not a substitute.

## Coverage and provenance

| Side | Selectable source components | Deliberately unavailable |
|---|---|---|
| Left | Cornea, iris, lens, suspensory ligament of lens, vitreous body, choroid, sclera, anterior chamber | Retina, microscopic layers, independent ciliary-body detail and other unsegmented tissues |
| Right | Cornea, iris, lens, suspensory ligament, vitreous body, choroid, sclera | Retina, microscopic layers and right anterior chamber; no absent source counterpart was invented |

This is a source-component dissection, not histology, optical simulation, a complete ophthalmic atlas, segmentation of an individual patient, or clinical approval. Zonular fibres are grouped in the source representation; the anterior chamber is a space representation, not a tissue coat. Display colours and transparency are teaching aids.

The archived 1,022-entry root catalogue remains unchanged. Fifteen sidecar selections subdivide two existing eyeball representations; they do **not** increase the unique whole-body count by fifteen. All source files belong to PART-OF parents FMA12514 and FMA12515. Definitions are explicit in `scripts/eye-layer-definitions.mjs`. The generator verifies inventory, source tables, hold policy, exact OBJ hashes and disjoint parent ownership of all 17 files. Thirty-six pinned opposite-side triangles are suppressed from four files; all retained source triangles are preserved. No mirrored substitutes or AI-generated surfaces are introduced. See [cleanup evidence](EYE_SOURCE_CLEANUP.md).

The sidecar has stable `vm:anatomy:body:head-neck:<side>:<category>:<source-name>` IDs, FMA IDs, node names, parent IDs, bounds, anchors and the existing source-to-scene matrix. `eyeLayersFor` fails closed if the parent ID, FMA, laterality, tree or complete file/hash binding changes. These IDs are **not yet** registered as independent imaging/curriculum/bookmark targets. Future registration requires explicit mapping review and content schema integration; do not infer scan coordinates from these reference coordinates.

### New source limitation

Right cornea (FMA58239/FJ1340), lens suspensory ligament (FMA58839/FJ1371), choroid (FMA58299/FJ1336 + FJ1337) and sclera (FMA58271/FJ1368) contain tiny disconnected opposite-side source fragments. The first release withheld whole components. Detailed component inspection now identifies nine specks / 36 triangles in four files. Exact recorded faces are suppressed, allowing all seven right components to be displayed without mirroring or reshaping valid tissue. FJ1336 is unchanged. Source fragment evidence remains in `catalog.json.sourceCleanup`; `excluded` is now empty. Missing tissue and specialist validation remain unresolved.

**The live main atlas now uses the same cleaned right-eye surfaces.** `bodyDisplayCatalog` replaces that one source-bound record and bundle before selection, rendering, practice, camera fitting, layout or reference mapping. Corrected bounds and label anchor are computed from retained vertices. The original catalogue/GLB stay archived for provenance; they are not the live right-eye display. Future consumers must apply `display-correction.json` (or call `bodyDisplayCatalog`) before deriving spatial data; the archived root alone is not a current display manifest. No global hold policy or specialist approval is silently cleared.

## Reproducibility and licensing

Run `npm run eye-layers:export` with the retained BodyParts3D v4 raw cache at `../work/bodyparts3d/partof`. Missing raw files fail rather than being silently replaced with another release. Then run `npm run eye-layers:test`, `npm run model-first:test`, `npm run dissection-history:test`, `npm run content:test`, `npx tsc --noEmit` and `npm run build`.

The dedicated test compares all 197,726 exported child triangles with retained original OBJ positions/multiplicity after the documented transform/Float32 storage, at 0.001 mm comparison precision. All 97,338 corrected-parent triangles must equal the right-child union exactly. It independently checks fragment topology, exact source hashes, parent partition, mutation rejection, display/reference/load/practice bindings, undo/presets, real camera/close callbacks and server-rendered controls. Historical root tests remain pinned; they verify archived data, not the corrected live eye. `eye-layers-validation.json` separately covers the live correction. These are engineering checks, not anatomical or browser acceptance.

Original application changes/short authored notes retain the repository's MIT terms. Mesh adaptations and source mappings retain BodyParts3D CC BY 4.0, with creator credit, licence link and modification notice in the UI and `LICENSES/THIRD_PARTY_NOTICES.md`. No additional dependency, model source, paid service, font, texture or external diagram is included. Existing hosting/billing constraints remain; this feature introduces no paid API.

Factual reading checked 2026-09-09: [NEI — How the eyes work](https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work), [TTUHSC — Eye anatomy table](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html), [Purves et al. — Anatomy of the Eye](https://www.ncbi.nlm.nih.gov/books/NBK11120/). Links are references, not permission to copy publisher figures/text. No reference images or publisher prose were imported.

## Next clinical/integration requirements

1. Ophthalmic anatomical review of each surface, spatial relationship, laterality, continuity, missing tissue and label anchor; specifically resolve the four right-side source discrepancies and historical aggregate.
2. Review draft anatomy/function notes and source terminology. No diagnosis, intervention, treatment protocol or patient-specific recommendation is supplied.
3. Explicit child-ID and parent/group ownership registration before adding imaging/lecture/bookmark targets or eye-specific exams; never render overlapping parent and child geometry together.
4. Separate technical mapping and clinical registration validation for any CT, MRI, X-ray or ultrasound linkage. No CT/MRI subject correspondence is assumed.
5. Preserve independent Atlas and lecture-course entitlements: a matching anatomical ID may expose permitted metadata, never grant paid lecture/scan access. No protected content is embedded by this change.
