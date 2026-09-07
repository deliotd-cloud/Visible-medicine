# Spatial anatomy architecture

## Current implementation and contract gaps

Use the [requirement audit](REQUIREMENT_AUDIT.md) for current source counts and acceptance. Pipeline examples and earlier milestone counts below retain their historical scope. The [v2 content contract](CONTENT_CONTRACT.md) now supports multi-part mesh bindings, scope-specific representations and explicit topic readiness, with a schema-conforming shoulder export and all-body checks. `bodyLesson` exposes metadata while the existing `bodyContent` API preserves displayed text. Private clinical reviews are not part of this draft export; a production curriculum store/editor remains future work.

## Offline source connectivity diagnostics

`scripts/source-topology.mjs` supplies non-mutating exact-coordinate connectivity and all-vertex/triangle-centroid distance analysis. `supporting-topology-report.mjs` binds the selected raw source files to prior/current hashes; no diagnostic is loaded into the runtime viewer or treated as an admission. Portable fixtures and optional raw reproduction have separate commands. Bounded web-observed IS-A rows are explicitly not complete graph, attachment or source-component proof. See [findings and next gates](SUPPORTING_TOPOLOGY.md).

## Shared explosion-style selection

`app/explode-style-select.tsx` composes the installed Select primitive inside both existing slider toolbars. Explorer-owned `BodyLayout` is `spatial | extract | tray`, retained by validated local study snapshots. `lib/body-arrangement.ts` supplies source-bounds-only tray packing and selected-only extraction; `lib/shoulder-arrangement.ts` adapts the existing cropped shoulder manifest without changing source coordinates or mesh IDs. Both scenes share one offset map between model parents, clipping and fitted camera bounds; live-camera labels inherit those transforms. Exam guards restore source positions. See [behaviour, numerical/component evidence and pending acceptance](EXPLODE_STYLES.md).

## Task-based atlas navigation

`app/atlas-workspace.tsx` owns presentation-only mode, focus and mutually exclusive sheet state below `BodyExplorer`'s anatomy/practice state. Mode panels stay mounted and are hidden when inactive. A constrained direction selector calls the unchanged view/reset action. The new stylesheet is explicitly imported after `body-explorer.css`; it narrows the system rail and groups related controls without changing scene materials. `lib/atlas-navigation.ts` builds a source-derived search index using the existing side/scope, source-hashed link resolver and study-library recipes. Search applies the same guarded selection/window/focus handlers and requires a clean-view confirmation. Existing acquired-imaging and clinical gates remain. See [behaviour and test limits](ATLAS_NAVIGATION.md).

## Model-first regional workspace

`AnatomyControlRail` and `AnatomyInfoPanel` in `app/anatomy-control-rail.tsx` present the existing regional/whole-body controls beside the model, with responsive Base UI sheets below 1,100/700 CSS pixels respectively. Viewport flex/grid sizing leaves header wrapping to normal layout; independent panel overflow replaces the old mobile document stack. Dissection/selection/practice state and camera refs remain owned by `BodyExplorer`, above the responsive panels. Closing a sheet retains mounted children; changing between inline and sheet layouts remounts nested local UI drafts, not the domain state. Collapsed native details expose advanced functions without crowding the default workspace. See [implementation, tests and limits](MODEL_FIRST_WORKSPACE.md). No scene, catalogue, review, imaging or licence schema changes are introduced.

## Forearm vascular extension

Four exact IS-A source identities enter one additive bundle through `forearm-vascular-selections.mjs`; `lib/forearm-vascular-anatomy.ts` feeds three explicit target/context windows and draft notes into the existing dissection, practice, links and imaging registry. The audit screens every preceding catalogue bound in inverse common coordinates, then checks raw nearby surfaces. It never imports larger PART-OF aggregates as duplicate vessels. Baseline reconstruction keeps both complete prior catalogue/inventory hashes, including the supporting-queue history. The all-vessel diagnostic now covers 227 identities and 19 bundles without changing geometry. See [evidence and integration](FOREARM_VASCULAR_DETAIL.md).

## Shared graphics recovery

`app/scene-recovery.tsx` wraps both canvases with page-level recovery UI and a generation-bound restart boundary. Its monitor uses `lib/renderer-health.ts` to observe only the live canvas's loss/restoration events. Inert hidden viewports prevent stale picks/labels. Explorer-level renderer state independently gates practice; shoulder model readiness is also explicit. Camera recovery uses the existing capture/restore refs, preserving queued saved-view intent. Anatomy, learner responses and all other view state remain above the remounted graphics subtree. These new display files are included in review fingerprints. See [state semantics and runtime limits](SCENE_RECOVERY.md).

`app/anatomy-canvas.tsx` now owns each physical canvas and uses the installed R3F public `createRoot/configure/render/unmount` API. `lib/anatomy-root-session.ts` awaits configuration and drives `frameloop: never` through a demand-only, per-root RAF queue and `advance(seconds, false)`. This catches initialization and subscriber errors outside React/render guards without global exception listeners. It retains the actual R3F scene, event manager, camera and subscriber ordering. The DOM host is measured on resize/scroll, and live children/DPR changes are forwarded. A fresh physical canvas separates retired asynchronous cleanup from a restart. This is an atlas-specific adapter, not a general replacement for Canvas: scene inputs arrive through explicit props, not arbitrary inherited DOM React contexts; global R3F effects, WebXR and unrelated postprocessing are not enabled. Existing scene materials, controls, clipping, labels and source geometry are unchanged. Upgrade R3F only with the pinned startup/disposal tests, including its early-failed-configuration empty-scene disposal contract.

## Laryngeal source and historical-policy extension

`scripts/laryngeal-selections.mjs` explicitly admits two of eight audited candidates into one additive bundle; six remain in the source hold policy. `lib/laryngeal-anatomy.ts` feeds four draft content groups and typed target/context windows into the existing dissection, practice, navigation and imaging registry. No new control architecture or coordinate convention is introduced. See [evidence and limits](LARYNGEAL_DETAIL.md).

`reconcileInventory` accepts an explicit historical hold policy while defaulting to current policy for current inventories. Both ocular and laryngeal baselines retain pinned ID-wide holds. Conditional single-file disc rules stay conditional: a PARTOF boundary must not impose a hold on a differently grouped ISA definition. `ocularHistory` removes post-baseline assets' cached hashes, reconstructs prior records and requires the complete historical catalogue and inventory hashes. Negative fixtures reject altered policy or evidence. Default checks remain portable to the GitHub module without Site Git history; raw audit regeneration still requires the pinned source history.

## Eye-region source extension

`scripts/ocular-selections.mjs` binds ten exact current-version ISA definitions to two additive bundles. `lib/ocular-anatomy.ts` supplies short draft notes and three typed target/context windows/focuses using the common dissection controls. A generic `connective-tissue` category correctly accommodates fibrous eyelid tarsal plates without calling them cartilage. Stable IDs, unchanged source coordinates and imaging-reference hooks are inherited. `source-surface-audit.mjs` supplies offline sampled source-coordinate diagnostics; `ocular-history.mjs` reconstructs and hash-checks complete pre-admission catalogue/inventory evidence without Git history. Raw audit regeneration still requires pinned Site history. See [source geometry, tests and limits](OCULAR_DETAIL.md).

## Current-view dissection guidance

`lib/dissection-guidance.ts` derives exact region/side recipe membership, omitted/added entries, source-backed landmark identities, target/context roles, availability and valid next-layer actions. `app/dissection-orientation.tsx` presents these inside the existing study guide. Guarded explorer handlers reuse clean-stage/focus transitions; reorientation changes camera state only. Scene labels retain their existing visible-only selection policy. See [controls and testing boundaries](DISSECTION_GUIDANCE.md). The historical [ocular source preparation](OCULAR_CANDIDATES.md) is separate from the subsequent explicit admission.

## Loading state and bounded source diagnostics

`lib/anatomy-load-state.ts` supplies atomic mutually exclusive loaded/failed states, a defensive required-group partition and the rendered-scope predicate shared by the body explorer and scene. Practice eligibility uses ready groups only and the session factory's distinct-name predicate; actual question render scope controls pause/retry/exit behaviour. See [state semantics, evidence and limitations](ANATOMY_LOADING.md).

`scripts/vessel-shape-math.mjs` is an offline, translation-only source-mm diagnostic, not part of rendering or registration. The refreshed audit records all 227 vascular identities and source hashes, bounded extent-pruned artery/vein comparisons and previously held positive controls. The validator recomputes current product geometry and independent numerical fixtures. It never changes admissions or geometry. See [method, filters and rights](VESSEL_SHAPE_AUDIT.md).

## Foot vascular extension

`scripts/foot-vascular-selections.mjs` separates ten audited candidates from eight explicit admissions and two shape/provenance holds. The isolated `-foot-vascular` bundle preserves old source records, hashes and transforms. `lib/foot-vascular-anatomy.ts` supplies four typed target/context windows and matching focuses, opening from the sole or dorsum. Exact arterial ID/name exceptions extend the conservative vessel classifier. The audit's centre-alignment comparison operates only on temporary diagnostic geometry, never product meshes. Source evidence and external gates are in `FOOT_VASCULAR_DETAIL.md`.

## Hand venous source extension

`scripts/hand-venous-selections.mjs` separates sixteen audited candidates from fourteen explicit admissions and two source-extent holds. The new isolated `-hand-venous` bundle preserves every prior record, bundle hash and common transform. `lib/hand-venous-anatomy.ts` supplies four typed target/context study sets to the shared regional workbench, content, practice, navigation and imaging-ID registry. `lib/anatomy-vessels.ts` classifies source-labelled vessels conservatively for display; unknown/conflicting names are neutral and no oxygenation is encoded. Evidence and remaining gates are in `HAND_VENOUS_DETAIL.md`.

## Branded dissection update

`app/brand.tsx` renders the exact approved lockup; brand tokens live in `app/globals.css`, with regional control overrides in `app/body-explorer.css`. No external fonts or brand-service request is used.

`lib/explode-layout.mjs` is the pure shared displacement/bounds/fit implementation imported by runtime and tests. `app/fitted-camera.tsx` operates the external Three.js camera imperatively and preserves an existing orbit during bounding-volume changes. The source GLBs, anatomical IDs and ingestion transforms are unchanged. Body expansion origins derive from the complete current region/side, independent of selected/hidden systems; changing region or side deliberately establishes a new frame.

`app/anatomy-scene.tsx` uses the same loaded GLB for orthographic shoulder plates and rotatable perspective; no separate raster anatomical truth or duplicated segmentation is maintained. Crop planes translate with structures. The shoulder's `/review` dashboard now persists independent review tracks in D1 through authenticated `/api/reviews`. `lib/review-workspace.ts` validates the expanded records; `lib/review-store.ts` supplies prepared, user-scoped append-only SQL with optimistic concurrency. Default full-body status remains conservative. See `REVIEW_WORKSPACE.md` for revision hashes, privacy and limits.

## Whole-body and regional extension

Screen-space labels are shared across all viewers through `scene-label-layer.tsx`. They follow actual projected anchors, with independently packed left/right columns and no anatomical relabelling. See [screen-side labels](SCREEN_LABELS.md) for transform ownership, eligibility, overflow policy and remaining visual acceptance checks.

Shared deep-inspection state, material clipping and hit testing live in `lib/inspection-state.ts` and `lib/inspection-geometry.ts`; `app/inspection-controls.tsx` drives both viewer families. Plane positions stay in the assembled source frame and translate with exploded structures. `lib/anatomy-practice.ts` samples loaded, distinct landmarks for 5/10/20-question regional/whole-body sessions. See [deep inspection](DEEP_INSPECTION.md) for reset semantics, orthographic controls, review fingerprinting, verification and non-radiological limits.

The root route now renders `body-explorer.tsx`; `/regions/[region]` instantiates the same explorer for a bounded region. The existing shoulder interface lives at `/shoulder`, in `shoulder-explorer.tsx`, preserving its mesh and study/exam behaviour.

`scripts/bodyparts-archive.mjs` provides concurrency-limited, CRC-verified HTTP-range retrieval. `scripts/ingest-full-body.mjs` composes 823 selected source identities into 61 independently loaded region/system bundles. The public catalogue stores data binding, source/provenance, laterality, region membership, bounds, surface anchor, source hashes and exclusions. All expanded meshes share the same transform; it differs from the dedicated shoulder frame, so interoperability requires converting through source coordinates.

`body-scene.tsx` keeps source geometry immutable and applies display separation only. Camera framing is computed from visible-scope metadata plus exploded bounds rather than hard-coded to shoulder size. Six directions include superior/inferior and the foot's plantar view. Selected labels and up to eight stage landmarks are shown, not hundreds of labels. Source bundles are cached by the GLB loader. The standard content tabs use existing shoulder notes where source identifiers match; otherwise `body-content.ts` explicitly distinguishes short authored notes from pending specialist content.

`dissection-data.ts` defines 86 guided visibility stages and 60 focused views with a pure resolver and undo reducer. `dissection-controls.tsx` renders the stage deck and original study guide. `anatomy-tissue.tsx` supplies shared-program illustrated materials; ghosts do not raycast. `scripts/validate-dissection.mjs` checks every stage, side and landmark, undo/restore transitions and six-direction camera framing at assembled/exploded endpoints, then exports an explicit-ID review manifest. See `docs/DISSECTION.md` and `content/schema/dissection-manifest.schema.json`.

The anatomy expansion itself added no dependencies or database. The subsequent review workspace adds D1 persistence and development-only Drizzle migration tooling; it requires no paid AI API or anatomy subscription. `docs/FULL_BODY_COVERAGE.md` documents missing nerves, organ scope, quarantined entries and non-clinical status. These data checks do not substitute for clinical validation or target-device/browser testing.

## Current pipeline

Official BodyParts3D ZIP → selected verified OBJ entries → one common coordinate transform → eleven named GLB meshes → nine stable product IDs → content panel / quiz / imaging event bridge.

`scripts/ingest-bodyparts3d.mjs` owns source selection, integrity checks, normals and export. `public/models/bodyparts3d/manifest.json` records the source file, FMA reference, canonical structure ID, GLB node name, bounds, hashes and full matrix. No per-mesh reassembly is performed: at zero explosion, source registration is retained.

`app/anatomy-scene.tsx` loads the GLB, styles surfaces, controls layer visibility, selection and labelled leader lines. The three deltoid component nodes share a parent product identity but retain source identifiers. The long-head biceps mesh is not mislabelled as a tendon-only segmentation. The viewer clips the lower arm at scene Y=-3.15. Explosion is a display transformation, never saved as source anatomy. Illustrative hatching is a shading effect, not fibre tractography.

`app/shoulder-explorer.tsx` and `app/body-explorer.tsx` own their respective interaction state. Anatomy/Function/CT/MRI/Ultrasound/Pathology/Clinical/Quiz tabs stay synchronised with structure selection. Exam mode removes labels and selection highlighting, records one answer per question and resets score on restart. Keyboard-operable structure lists provide an alternative to canvas hit testing. Mobile includes zoom buttons and the same layer/structure controls.

## Coordinate and radiology contract

Source: millimetres, positive X left, Y posterior, Z superior. Scene: X left, Y superior, Z anterior. Common source centre and scale (0.026 scene units/mm) are stored with a column-major matrix. The matrix has positive determinant; no laterality reflection occurs. The inverse recovers reference-model millimetres.

The former `visible-medicine:imaging-sync` demonstrator has been replaced by an opt-in, runtime-validated same-document adapter in `lib/imaging-sync.ts`, shared by both viewers through `app/imaging-link.tsx`. It supports two-way ID selection, explicit compound/component choices, region/side boundaries, practice gating and loop/disposal safeguards. `lib/anatomy-link-registry.ts` attaches hash-backed source identities and assembled surface-bounds centres; `lib/anatomy-coordinates.ts` converts the distinct shoulder/body scene frames through reference millimetres. It never sends a guessed slice or assigns a patient frame to source anatomy. The full API, exact supported mappings and external spatial-registration gate are in [IMAGING_LINK.md](IMAGING_LINK.md). No acquired study or patient registration is included.

## Scaling to full body

`lib/study-links.ts` defines versioned, source-bundle-bound links between whole-body and regional dissection. Server route parameters are parsed into a bounded request; catalogue loading resolves exact region/side/focus membership before committing initial viewer state. Generated links contain no custom display state or personal data, and URL initialization emits no imaging event. Route keys distinguish explicit study requests without continuously overriding manual work. See [contract and validation](STUDY_LINKS.md).

The regional/whole-body explorer uses `lib/study-navigation.ts` to derive related study membership from existing focused target/context rules, never from geometric proximity. `StructureNavigator` provides shared ID/name/system filtering and native-button keyboard focus; `RelatedStudy` opens an existing recipe while retaining the selection. Scope, laterality, restoration and exam gates stay in the explorer. No imaging, bookmark, geometry or database schema changes are required. See [study-navigation details](STUDY_NAVIGATION.md).

- Split delivery by region and level of detail while retaining one source coordinate frame.
- Keep ID, laterality, meshes, terminology, content and review provenance separate.
- Allow one-to-many node bindings (deltoid is already an example); do not depend on mesh colour for identity.
- Serve validated content from a database using `content/schema/anatomy-structure.schema.json`; the present UI records are a smaller authoring format, not falsely claimed to be schema-complete database records.
- Keep licence evidence and derivative notices with every regional bundle.
- Require anatomical and educational sign-off before changing draft status. Licensor provenance does not confer clinical approval.

Legacy 2D components and their public-domain assets are retained but not imported by the primary route. They are not substitutes for the spatial model.
