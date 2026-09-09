# Eye-layer dissection

## Use

In Head & Neck (or whole-body), search for **left eyeball** or **right eyeball**, select it, open its structure details and choose **Explore eye layers**. The focused dialog starts with anterior structures. Select a named component or click its surface; switches remove/restore it. Selecting a hidden component reveals it. **Undo** restores selection, study preset and visibility, with 30 in-memory snapshots. **Reassemble** restores all available components and zero separation. It does not save a bookmark.

Choose anterior, lens/support, wall or all-components presets. Custom visibility is labelled Custom selection. **Lift selected component** retains free 3D rotation; **Spread all (flat plate)** uses the existing orthographic teaching arrangement. At nonzero separation the display explicitly states that positions are not anatomical. Labels, six camera presets, framing and fade-others controls use the existing renderer. Camera/selection/dissection state in the main atlas is retained when returning. The parent scene is unmounted while the eye view is open, avoiding concurrent parent/child canvases or duplicate aggregate geometry. The launcher is unavailable in active practice; no quiz answers or new imaging events are emitted by this nested view.

The desktop dialog keeps the model beside a narrow, internally scrollable control panel. On narrow screens controls sit below the model inside the dialog. Escape, Back to atlas and the existing accessible modal primitive provide dismissal. The main launcher is refocused on close. Device, keyboard-focus, visual-quality, small-screen/landscape, long-label, 200% text and touch acceptance still need explicit browser testing; source and server-render checks are not a substitute.

## Coverage and provenance

| Side | Selectable source components | Deliberately unavailable |
|---|---|---|
| Left | Cornea, iris, lens, suspensory ligament of lens, vitreous body, choroid, sclera, anterior chamber | Retina, microscopic layers, independent ciliary-body detail and other unsegmented tissues |
| Right | Iris, lens, vitreous body | Cornea, suspensory ligament, choroid and sclera have opposite-side source fragments; no right chamber source equivalent was invented |

This is a source-component dissection, not histology, optical simulation, a complete ophthalmic atlas, segmentation of an individual patient, or clinical approval. Zonular fibres are grouped in the source representation; the anterior chamber is a space representation, not a tissue coat. Display colours and transparency are teaching aids.

The original 1,022-entry root catalogue remains unchanged. Eleven sidecar selections subdivide two existing eyeball representations; they do **not** increase the count of unique whole-body structures by eleven. All source files belong to the already included PART-OF eyeball parents, FMA12514 and FMA12515. Definitions are explicit in `scripts/eye-layer-definitions.mjs`. The generator verifies inventory, source tables, hold policy, exact OBJ hashes and parent file ownership before export. A disjoint partition accounts for all 17 parent files: 12 rendered, five excluded. No duplicates, mirrored contralateral substitutes, repaired surfaces or AI-generated anatomical meshes are introduced.

The sidecar has stable `vm:anatomy:body:head-neck:<side>:<category>:<source-name>` IDs, FMA IDs, node names, parent IDs, bounds, anchors and the existing source-to-scene matrix. `eyeLayersFor` fails closed if the parent ID, FMA, laterality, tree or complete file/hash binding changes. These IDs are **not yet** registered as independent imaging/curriculum/bookmark targets. Future registration requires explicit mapping review and content schema integration; do not infer scan coordinates from these reference coordinates.

### New source limitation

Right cornea (FMA58239/FJ1340), right lens suspensory ligament (FMA58839/FJ1371), right choroid (FMA58299/FJ1336 + FJ1337) and right sclera (FMA58271/FJ1368) cross to positive scene X, the left side. Each entire component is excluded from this new view. Their metadata and source hashes remain in `catalog.json.excluded`. No trimming or source relabelling was done.

**The historical main right-eyeball aggregate still includes those source fragments and is unchanged by this extension.** This new exclusion is scoped to the child renderer; it is not a claim that the whole-body catalogue or global source-hold policy has been repaired. Prioritize independent review of that aggregate and its derived spatial annotations before clinical release. Do not interpret previous catalogue admission as clearance of this new finding.

## Reproducibility and licensing

Run `npm run eye-layers:export` with the retained BodyParts3D v4 raw cache at `../work/bodyparts3d/partof`. Missing raw files fail rather than being silently replaced with another release. Then run `npm run eye-layers:test`, `npm run model-first:test`, `npm run dissection-history:test`, `npm run content:test`, `npx tsc --noEmit` and `npm run build`.

The dedicated test compares all 110,670 exported triangles with the original OBJ source positions and multiplicity after the documented transform/Float32 storage, using 0.001 mm comparison precision. It also checks side exclusions, exact hashes, source/parent partition, binding rejection, bounded undo, presets, actual camera/close callbacks and server-rendered controls. The root catalogue and historical display tests remain pinned; new launcher/close callbacks are explicit additions, not a rewritten baseline. See `eye-layers-validation.json` for the latest result. These are engineering checks, not anatomical validation or a browser screenshot review.

Original application changes/short authored notes retain the repository's MIT terms. Mesh adaptations and source mappings retain BodyParts3D CC BY 4.0, with creator credit, licence link and modification notice in the UI and `LICENSES/THIRD_PARTY_NOTICES.md`. No additional dependency, model source, paid service, font, texture or external diagram is included. Existing hosting/billing constraints remain; this feature introduces no paid API.

Factual reading checked 2026-09-09: [NEI — How the eyes work](https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work), [TTUHSC — Eye anatomy table](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html), [Purves et al. — Anatomy of the Eye](https://www.ncbi.nlm.nih.gov/books/NBK11120/). Links are references, not permission to copy publisher figures/text. No reference images or publisher prose were imported.

## Next clinical/integration requirements

1. Ophthalmic anatomical review of each surface, spatial relationship, laterality, continuity, missing tissue and label anchor; specifically resolve the four right-side source discrepancies and historical aggregate.
2. Review draft anatomy/function notes and source terminology. No diagnosis, intervention, treatment protocol or patient-specific recommendation is supplied.
3. Explicit child-ID and parent/group ownership registration before adding imaging/lecture/bookmark targets or eye-specific exams; never render overlapping parent and child geometry together.
4. Separate technical mapping and clinical registration validation for any CT, MRI, X-ray or ultrasound linkage. No CT/MRI subject correspondence is assumed.
5. Preserve independent Atlas and lecture-course entitlements: a matching anatomical ID may expose permitted metadata, never grant paid lecture/scan access. No protected content is embedded by this change.
