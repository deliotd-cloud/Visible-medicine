# Spatial anatomy architecture

## Renal venous relationships

`lib/renal-relationships.ts` resolves two exact-side presets per kidney from existing source groups and context. The shared Study view menu changes focus and visibility atomically through a validated optional `selectedId` preset action. One Undo restores previous layers/selection. A relationship can retain several selectable parts, supporting both left adrenal and renal veins. Separation suppresses context; normal defaults and geometry remain unchanged. See [behaviour, references and acceptance gates](RENAL_VENOUS_RELATIONSHIPS.md).

## Chiasm–pituitary relationship and MRI teaching

`lib/visual-pathway-context.ts` resolves one exact-parent relationship and reuses the existing pituitary record/bundle pinned in `public/models/bodyparts3d/visual-pathway/sellar-context.json`. The existing Study view menu and generic relationship state provide a right-sided view, chiasm selection, landmark visibility, colour key and separation suppression. Default posterior landmarks, cutaway bounds and selectable identities stay unchanged. No source mesh is transformed, exported or repinned. Two explicit MRI sections extend the existing visual-pathway concepts; a complete v117 teaching projection preserves all previous content. See [source, verification and remaining gates](VISUAL_PATHWAY_RELATIONSHIPS.md).

## Eye imaging teaching

`content/eye-imaging-teaching.ts` supplies ten explicit draft modality sections to eight existing concepts/fifteen exact eye selections. The source-bound resolver, collapsed panel and unsupported-modality behaviour are unchanged. A full v116 content hash is checked after projecting out only these eight new fields; all earlier preservation guards and 63 exact source pins remain. No geometry, clinical-review state, paid-resource eligibility or viewer correspondence changes. See [source evidence and acceptance gates](EYE_IMAGING_TEACHING.md).

## Internal brain imaging teaching

`content/brain-imaging-teaching.ts` adds explicit CT/MRI fields to seven existing ventricular/brainstem concepts, displayed for eight exact selections through the unchanged nested resolver and collapsed panel. Five primary-reference links support introductory notes; no new topic, UI state, geometry, source binding, resource configuration or entitlement is added. The complete v115 teaching graph is hash-checked after removing only those seven new imaging fields, preserving every previous lesson, question and identity. All 63 source pins stay unchanged. See [evidence, scope and clinical gates](BRAIN_IMAGING_TEACHING.md).

Nonpublic anatomy prototypes may be retained under `content/prototypes/` with source IDs, rights notices, hashes, geometry checks and a non-admission sidecar. They must not be imported into application code or copied into `public/` implicitly. The optic-chiasm/tract prototype remains an immutable source artifact; its explicitly exported runtime derivative is separately recorded in [the visual-pathway study](VISUAL_PATHWAY_DISSECTION.md).

## Visual-pathway workbench

`lib/visual-pathway.ts` requires the exact brain parent, suppresses its solid aggregate and serves three neural surfaces with four optional existing landmarks. `app/ventricles.tsx` adds one brain-study choice, an inferior initial camera and five presets; existing selection, cutaway, history, labels and three separation layouts are reused. Context starts off and is absent while separated. The chiasm stays one selectable identity despite two closed source halves; no fibre or geniculate connection is generated.

`scripts/export-visual-pathway.mjs --check` verifies a metadata-only derivative against the pinned prototype, source audit and raw files. `content/visual-pathway-teaching.ts` supplies two shared concepts with eight short Anatomy/Function/Clinical/Pathology drafts and two recall questions; CT/MRI/US remain pending. Three exact bindings are appended without changing the prior 60 or any parent. Search, study links and optional learning transport admit the new study; production resources remain empty and independently entitled. Source/controlled-component tests are not clinical or device acceptance.

## Renal vascular workbench

Renal Pathology and modality drafts are authored in `content/renal-teaching.ts`, using the existing `NestedConcept`/`NestedSection` resolver and collapsed `NestedTeaching` panel. No schema, component, source binding, review state, resource manifest or geometry changes accompany this editorial extension. The validator pins the complete non-renal content and retained renal core to v112, exercises every authored topic in rendered markup, and keeps missing modalities pending. See [evidence and remaining review](RENAL_TEACHING.md).

`lib/renal.ts` binds seven source groups to exact right/left kidney records. This is a navigation association, not tissue part-of semantics. `app/ventricles.tsx` remains the shared compact organ workbench; the root kidney launcher and source-bound search enter it with `study: renal`. Only same-side selectable groups and optional same-side/midline context are rendered. Context uses original root bundles, cannot become a child selection and disappears during separation. Internal tissue is not reconstructed.

`scripts/export-renal.mjs` validates the staged source audit/raw hashes, reexports only metadata and compares every vertex/index with the prototype. The one 266,784-byte public bundle contains seven groups; opposite-side meshes are filtered from each view. `--check` verifies deterministic bytes without overwriting the artifact. Teaching extends the existing pins by seven bindings, retaining all 53 historical bindings exactly. Learning transport supports the new study identity but keeps its 2 MB JSON limit, default-deny policy and separate Atlas/resource grants. No production scan or lecture correspondence is configured. See [scope and validation](RENAL_VASCULAR_STUDY.md).

## Renal relationships

[Renal vascular source review](RENAL_VASCULAR_SOURCE_REVIEW.md) prepares seven additional groups outside `public/` with a pinned, round-trip-checked prototype. It deliberately does not alter the root catalogue, nested registry, source review identities or learning entitlements before the dedicated study integration is completed.

[Renal study recipes](RENAL_STUDIES.md) add four focus-only definitions to both abdomen and whole-body scopes. Exact FMA targets and context reuse the current library, navigation, history and deep-link contracts. Focus target-presence gating prevents context-only opposite-side entries; no additional permanent controls, runtime assets or source identities are introduced. The recipe-history guard records only this exact addition and still verifies all earlier profiles byte-for-byte.

## Cardiac vessel relationships

[Cardiac context](CARDIAC_VESSEL_RELATIONSHIPS.md) pins eight existing root vessel records and their bundle to the exact heart parent. Four relationships reuse the shared study/preset controls; only the chosen guide's context is appended, and it is absent during separation. These remain nonselectable orientation surfaces, outside nested teaching/navigation identities and paid-resource entitlements.

## Shared organ cutaway

[Nested cutaway controls](NESTED_CUTAWAY.md) reuse the eye interaction across all six other nested families. Each workbench owns inspection state; an optional source-bounds clipping frame in `BodyScene` keeps context toggles from moving the cut without changing camera framing. Existing geometry, section mathematics, source pins and entitlements are unchanged.

## Dental clinical teaching

The [dental resolver](DENTAL_CLINICAL_CURRICULUM.md) binds 28 one-component ISA teeth to six topic groups. Current UI/export share the same exact-identity guard; tooth positions and sides are not combined or renumbered. Head-organ historical comparisons explicitly project pre-dental content. No UI, geometry, dependency, schema or review-state change.

## Head/neck organ clinical teaching

The [head-organ extension](HEAD_ORGAN_CLINICAL_CURRICULUM.md) adds ten definitions for 17 exact selections / 32 components. Ordered identity guards retain seven bilateral groups, unequal eyeball sets and one canaliculus-labelled surface per side. Its offline projection precedes pelvic history: 49 projections / 2,928 pinned edits. Current runtime/export and historical checks remain separate; no UI, geometry, schema, dependency or review migration.

## Pelvic organ clinical teaching

The [pelvic extension](PELVIC_ORGAN_CLINICAL_CURRICULUM.md) adds seven definitions for ten exact single-component selections. Identity guards retain paired sides, adult-male tract scope and separately owned rectum. The offline projection precedes abdominal history: 48 projections / 2,894 pinned edits. Current runtime/export and historical comparisons stay separate; no UI, geometry, schema, dependency or review migration.

## Abdominal organ clinical teaching

The [abdominal extension](ABDOMINAL_ORGAN_CLINICAL_CURRICULUM.md) adds 14 definitions for 17 exact selections / 135 source components. Identity guards retain the liver/bowel exclusions, five separate owners, paired sides, cross-region ureters/appendix and legacy gallbladder ID. Its offline projection precedes thoracic history: 47 projections / 2,874 pinned edits. Current runtime/export and historical comparison are separate; no UI, geometry, schema, dependency or review migration.

## Thoracic organ clinical teaching

The [thoracic organ extension](THORACIC_ORGAN_CLINICAL_CURRICULUM.md) adds six definitions for eight exact organ selections / 342 rendered source components. Ordered identity guards preserve the heart/lung aggregates, two-component thymus and differing right/left main-bronchus source trees. Twenty-seven components omitted from the heart aggregate retain their five existing coronary-vessel owners. Its offline projection precedes central neural history: 46 projections / 2,840 pinned edits. Current runtime/export and historical comparisons remain separate; no UI, geometry, schema, dependency or review migration.

## Central neural clinical teaching

The [central neural extension](CENTRAL_NEURAL_CLINICAL_CURRICULUM.md) adds fifteen definitions for 23 exact nervous-system selections / 83 indexed source components, including one space-category central canal and 22 organ-category entries. It preserves the 59-component PART-OF brain and two-component choroid-plexus/mammillary groups without inventing subdivisions. Category, FMA, side, source tree, ordered files and primary/ordered regions are guarded. Its offline projection precedes orbital-neural history, giving 45 projections / 2,824 pinned edits. Runtime/export remain current; older captures and baseline remain fixed. No geometry, interface, schema, dependency or review migration.

## Orbital neural clinical teaching

The [orbital neural extension](ORBITAL_NEURAL_CLINICAL_CURRICULUM.md) adds 15 definitions for 30 exact ISA selections: 28 nerves and two organ-category ciliary ganglia. Category, FMA, side, ordered files and primary/ordered regions are guarded. Its offline projection precedes the [acral-bone extension](ACRAL_BONE_CLINICAL_CURRICULUM.md), giving 44 projections / 2,778 pinned edits. Runtime/export stay current; prior captures and baseline remain fixed. No geometry, interface, schema, dependency or review migration.

## Skull, facial-bone and hyoid clinical teaching

The [cranial-bone extension](CRANIAL_BONE_CLINICAL_CURRICULUM.md) uses fifteen lesson definitions for 23 exact identities / 24 source components. Ordered identity guards preserve both hyoid files and side/region specificity. Its offline projection precedes axial-bone history (42 projections / 2,506 pinned edits); runtime/export stay current and older captures/baseline stay fixed. No geometry, interface, schema, dependency or review migration.

## Spine and chest-bone clinical teaching

The [axial-bone extension](AXIAL_BONE_CLINICAL_CURRICULUM.md) adds fifteen definitions for 52 exact skeleton/bone identities with ordered source and region guards. Its offline projection precedes limb-bone history (41 projections / 2,460 pinned sections). Runtime/export remain current; earlier captures and baseline stay fixed. No UI, geometry, dependency, schema or review migration. Older milestone totals below are historical.

## Major limb and hip bone clinical teaching

The [bone extension](LIMB_BONE_CLINICAL_CURRICULUM.md) adds ten definitions for 17 exact skeleton/bone identities. Runtime guards source, side and ordered region/file membership; existing right-shoulder lessons remain untouched. Its offline projection precedes neck history (40 projections / 2,356 pinned edits). Runtime/export stay current; no UI, geometry, dependency, schema or review migration. Older milestone totals below are historical.

## Neck clinical teaching

The [neck/axial extension](NECK_CLINICAL_CURRICULUM.md) adds twenty-six definitions for 48 exact identities and 52 ordered components. The new offline projection precedes head history (39 projections / 2,322 pinned edits). Runtime/export stay current, with no UI, geometry, dependency, schema or review migration.

## Head clinical teaching

The [head extension](HEAD_CLINICAL_CURRICULUM.md) guards sixty exact identities and 65 ordered components through twenty-nine definitions. A new offline projection precedes trunk history (38 projections / 2,226 pinned edits). Runtime/export stay current; no UI, geometry, dependency, schema or review change.

## Trunk and coccygeus clinical teaching

The [trunk extension](TRUNK_CLINICAL_CURRICULUM.md) uses seventeen definitions across forty exact identities and 52 ordered source components. Runtime guards tree, side, category/system and primary/ordered regions; PART-OF pectoralis and bilateral groups are preserved. The offline projection precedes foot history (37 projections / 2,106 pinned edits); runtime/export remain current. No UI, geometry, schema, review or dependency change.

## Foot clinical teaching

The [foot extension](FOOT_CLINICAL_CURRICULUM.md) uses twelve shared definitions with 36 exact single-file ISA identities, side/category/system and sole-foot guards. Source-labelled heads and uncertain slips retain individual identities without invented lesions. The new offline projection precedes lower-leg history, protecting 2,026 edits across 36 projections; runtime/export stay current. No UI, geometry, schema, review or dependency changes.

## Lower-leg clinical teaching

The [lower-leg extension](LEG_CLINICAL_CURRICULUM.md) uses thirteen definitions with 28 exact FMA/side/single-file ISA identities and sole-leg membership guards. Gastrocnemius heads retain shared Achilles context, not separate pathological subtendons. Thirty-five offline projections preserve 1,954 pinned edits; prior thigh totals are historical. Runtime/export remain current. No UI, geometry, schema or dependency changes.

## Hip and thigh clinical teaching

The [hip/thigh extension](THIGH_CLINICAL_CURRICULUM.md) uses twenty definitions with exact single-file identities plus primary/ordered regional membership guards. Pelvic overlap and psoas's spine primary region are preserved. The new offline projection precedes 33 historical ones (1,898 pinned edits); runtime/export are current and the prior hand report is historical. No UI, geometry, schema, review or dependency changes.

## Hand clinical teaching

The [hand extension](HAND_CLINICAL_CURRICULUM.md) reuses the typed clinical-group shape for nine definitions/twenty exact single-file ISA identities. It preserves sides, source scope, warnings and detached output. The new offline projection precedes 32 historical ones (1,790 pinned sections); runtime/export are current and the prior forearm report is explicitly historical. No UI, geometry, review, schema or dependency change.

## Forearm clinical teaching

The [forearm extension](FOREARM_CLINICAL_CURRICULUM.md) uses sixteen typed groups/42 exact identities. Ordered multi-file guards retain ECU/FDS components. Two existing tabs gain drafts with detached arrays and source warnings. The new offline projection precedes 31 historical ones (1,750 pinned sections); old captures remain immutable and the prior report labels historical totals. No UI, model, schema, review or dependency changes.

## Scapular and arm clinical teaching

The [clinical continuation](SCAPULAR_ARM_CLINICAL_CURRICULUM.md) reuses the typed teaching-group shape for six definitions/fourteen exact-FMA muscle entries. Both existing tabs gain drafts, guarded by source file/tree, category/system, side and sole region. The new offline projection precedes thirty historical ones (1,666 pinned sections); runtime/export remain current. Prior shoulder report counts are explicitly historical. No UI, model, schema, review or dependency changes.

## Shoulder clinical teaching

The [clinical extension](SHOULDER_CLINICAL_CURRICULUM.md) uses nine definitions for eighteen exact identities, guarded by FMA, laterality, muscle system/category, sole region and source file/tree. Two existing tabs gain 36 drafts. A new offline projection precedes the 29 historical projections (1,638 pinned sections); runtime/export remain current. The dedicated shoulder, modality topics, model, schema, interface and review state are unchanged.

## Connective Anatomy and regional disc teaching

The [connective extension](CONNECTIVE_ANATOMY_CURRICULUM.md) maps 26 exact source identities to two bilateral attachment definitions and three regional disc definitions. It requires connective system, category, side, primary region, all expected regional memberships and Anatomy topic. Source disc labels are retained without deriving patient-level intervals. The new offline transition precedes the 28 older projections; all current render/export paths use current drafts. No geometry, recipes, interface, schema or review changes.

## Organ location and aggregate-aware teaching

The [organ Anatomy extension](ORGAN_ANATOMY_CURRICULUM.md) adds 21 exact-FMA, system/category, laterality and primary/secondary-region guarded Anatomy definitions. Existing Function and specialist sections are unchanged. Current region metadata, not historical tokens inside stable IDs, governs routing. The offline `authoringBeforeOrganAnatomy` projection precedes the 27 earlier projections and never enters runtime rendering. Source selection lists, aggregate exclusions and all geometry remain unchanged.

## Neural Anatomy and exact-ID teaching

The [neural extension](NEURAL_ANATOMY_CURRICULUM.md) adds eleven Anatomy sections and corrects six Function routing collisions through `lib/neural-anatomy-curriculum.ts`. Exact FMA/category/side/region/topic guards replace ambiguous name-substring fallbacks. The pinned offline transition precedes the regional-vessel and older projections; current exports never receive historical erroneous descriptions. No geometry, source or review schema migration.

## Regional vessel teaching dispatch

The [regional vessel extension](REGIONAL_VESSEL_CURRICULUM.md) uses `lib/regional-vessel-curriculum.ts`: nineteen paired definitions and two midline definitions resolve forty FMA/side-specific entries. Common-carotid origins have side-specific copy. Vessel system/category, primary region and all required memberships are guarded. Its pinned offline transition precedes upper-limb and older projections; display/export stay current. Source binding, imaging and review schemas are unchanged.

## Upper-limb vessel teaching dispatch

The newer [upper-limb extension](UPPER_LIMB_VESSEL_CURRICULUM.md) uses `lib/upper-limb-vessel-curriculum.ts`: 23 explicit paired definitions resolve 46 FMA/side-specific lessons. Each checks vessel system/category, primary region and all recorded region memberships. Its pinned offline transition runs before pelvic and earlier projections; display/export remain current. No source binding or review schema changes.

## Pelvic vessel teaching dispatch

`lib/pelvic-vessel-curriculum.ts` supplies twelve exact definitions, guarded by FMA, side, vessel system/category, pelvis primary region and all abdomen/pelvis/thigh memberships. Compound selections are not relabelled as tributaries. Its offline transition runs before the abdominal and earlier projections; display/export remain current. See [scope and evidence](PELVIC_VESSEL_CURRICULUM.md).

## Abdominal vessel teaching dispatch

`lib/abdominal-vessel-curriculum.ts` supplies fourteen exact definitions, guarded by FMA, side, system/category and required regions. Compound sources are not inferred branch maps. Its pinned offline transition precedes the thoracic and earlier milestones, while display/export use current lessons. See [scope and evidence](ABDOMINAL_VESSEL_CURRICULUM.md).

## Thoracic vessel teaching dispatch

`lib/thoracic-vessel-curriculum.ts` provides 29 exact definitions for 34 existing vessels. FMA, laterality, system/category and all required regions gate dispatch; textbook position never overwrites source laterality. Multi-file aggregates are not assigned inferred branch identities. Its pinned offline transition precedes acral and earlier milestones; runtime and exports use current content. See [scope and limits](THORACIC_VESSEL_CURRICULUM.md).

## Connective teaching dispatch

`lib/acral-bone-curriculum.ts` supplies 53 exact right/left definitions for 106 hand/foot bones. Explicit FMA pairs and digit/segment metadata drive shared helpers; no identity is inferred from name parsing, neighbouring FMA numbers or camera position. The two broad foot-sesamoid groups are excluded. A pinned offline transition precedes limb and older milestones and guards held readiness separately from displayed copy. See [scope and limits](ACRAL_BONE_CURRICULUM.md).

`lib/limb-bone-curriculum.ts` supplies 10 definitions for 17 existing girdle/major limb-bone entries. Explicit ID/side bindings preserve the right-shoulder pilot; dispatch also guards primary and every required secondary region. An offline projection precedes cranial and older milestones without changing runtime/export semantics. See [scope and limits](LIMB_BONE_CURRICULUM.md).

`lib/cranial-bone-curriculum.ts` supplies 15 exact-FMA definitions for 23 existing skull/hyoid entries, with system/category/primary and secondary region/laterality/tab guards. It retains the hyoid's two-source compound without inventing subparts. A pinned offline projection precedes thoracic and older milestones; display/export stay current. See [scope and limits](CRANIAL_BONE_CURRICULUM.md).

`lib/thoracic-bone-curriculum.ts` supplies 15 exact-FMA definitions for 27 existing ribs/sternal components. Right/left pairs and midline entries have explicit side guards alongside system/category/region/tab checks. A parameterised helper retains rib-level articulations. The newest pinned offline transition precedes spinal and earlier projections; runtime/export stay current. See [scope and variant limits](THORACIC_BONE_CURRICULUM.md).

`lib/spinal-bone-curriculum.ts` supplies 13 exact-FMA groups for 25 existing spinal-bone representations, guarded by system/category/primary and secondary region/laterality/tab. It changes only Anatomy/Function through the shared resolver. A pinned offline transition precedes the connective and earlier projections; runtime/export remain current. See [source scope and limits](SPINAL_BONE_CURRICULUM.md).

`lib/connective-curriculum.ts` supplies 21 exact-FMA groups for 43 existing cartilage/ligament representations, including membrane complexes. The shared content resolver overrides only Anatomy/Function with system/category/region guards, retaining source warnings. An offline pinned transition precedes the earlier curriculum projections; current display/export remain current. See [scope and mechanical limits](CONNECTIVE_CURRICULUM.md).

## Organ teaching dispatch

`lib/organ-curriculum.ts` supplies 15 exact-FMA lesson groups for 23 existing body representations through the existing `bodyLesson`/`bodyContent` dispatch. Only Anatomy/Function are overridden, guarded by system, category and region. Existing warnings, source IDs, geometry and panels remain intact. The offline organ transition pins this explicit edit before older preservation projections; exported content remains current. See [scope and source limitations](ORGAN_CURRICULUM.md).

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
