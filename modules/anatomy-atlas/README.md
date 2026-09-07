# Visible Medicine — Whole-Body & Regional 3D Anatomy

## Current scope and remaining work

The [requirement and acceptance audit](docs/REQUIREMENT_AUDIT.md) is the current checklist, separating implemented controls from anatomical, teaching, device, imaging and delivery gaps. It records 1,022 body representations, not complete anatomy: 619 Function sections remain pending and most specialist topics are unauthored. Run `npm run requirements:audit -- --check` to detect a stale source/content inventory. Earlier milestone receipts below describe their own revisions, not current visual or clinical acceptance.

The [versioned content contract](docs/CONTENT_CONTRACT.md) now preserves multi-part mesh bindings and explicit topic readiness, with a real shoulder export and whole-body validation. Draft content is kept separate from clinical approval; no database or private review is migrated. `npm run content:export -- --check` verifies the shoulder fixture.

## Anatomy source-quality review

The latest [supporting-source quality audit](docs/SUPPORTING_TOPOLOGY.md) records tendon/thumb connectivity and full-point contact findings. Uncertain candidates remain withheld; no anatomy is silently repaired or added.

## Choose how structures separate

Beside the separation slider, choose **Spread**, **Extract selected**, or **Tray**. This works in each body region, whole body and the dedicated shoulder 3D viewer. Extraction moves only the chosen structure; the tray separates entries at the same scale. Set the slider to **0%** to restore source positions. Saved views remember the choice; exam mode stays assembled. These are teaching arrangements, not surgical paths. See [behaviour, evidence and limits](docs/EXPLODE_STYLES.md).

## Simpler navigation and slimmer system controls

If a selected structure becomes hidden or too transparent, the conditional **Reveal selection** notice restores it without resetting the whole study view. It can keep only the selection solid and uncut while surrounding anatomy remains dissected; **Reapply cutaway** reverses the cutaway exception. See [behaviour, saved-state support and limits](docs/SELECTION_VISIBILITY.md).

Use **Explore · Dissect · Practice** to show the relevant tools without resetting the model. The system rail is now 216px wide (previously 264px), with compact labelled switches. **View** replaces six camera-direction buttons. Selected-structure actions live together, with less common actions under **More**. Notes are grouped into **Anatomy · Clinical · Imaging**; quiz notes and setup live in Practice. **Search atlas** finds body regions, source structures and the current region's study views; a view preview requires confirmation before resetting custom dissection settings. **Focus view** collapses both desktop/tablet panels; phones already use this layout. See [controls, evidence and limitations](docs/ATLAS_NAVIGATION.md). The dedicated shoulder now shares these workspace modes, grouped notes and side panels, with its own structure search and compact camera/layer menus. See [shoulder controls and remaining acceptance](docs/SHOULDER_WORKSPACE.md).

## Model-first, less scrolling

The six **Anatomical systems** switches sit beside the model on desktop, with region selection and advanced tools folded into the same sidebar. The centre contains the heading and atlas, not a stack of settings. The notes panel starts with search and selected-structure information; the study guide and full structure browser open on demand. On narrower screens, **Systems & tools** opens a side panel; phones also offer **Structure info** (or **Practice**) without a long page below the model. Close either panel with **Return to model**. Side panels scroll independently; very short or zoomed windows retain an internal scroll escape for access. See [layout, verification and remaining hands-on checks](docs/MODEL_FIRST_WORKSPACE.md).

## Forearm arterial dissection

The atlas now has **1,022 source entries, 138 dissection stages and 120 focuses**. In **Elbow & forearm → Study windows & focuses**, open **Common interosseous origins**, **Recurrent arteries & supinator** or **Forearm arterial comparison**. Four exact original source arteries add detail while preserving all previous anatomy. The shared select/frame, remove/restore/Undo, isolate/fade, separation and focused-practice controls apply. These are unvalidated source subsets, not complete vascular trees. See [source evidence, reproduction and clinical gates](docs/FOREARM_VASCULAR_DETAIL.md).

## Recover an interrupted 3D view

The shoulder, all regions and whole body offer **Restart 3D view** if graphics are interrupted. Dissection settings, answers and the last captured camera are retained; practice pauses until the viewer is available. Structure information stays outside the graphics surface. See [behaviour, tests and device-acceptance limits](docs/SCENE_RECOVERY.md). The recovery feature itself does not change anatomy.

Startup rejections and errors in animation callbacks now reach the same restart control. Each viewer has an on-demand drawing queue; a failed or retired viewer cannot keep drawing or revive practice. Restart creates a fresh canvas, and invalid/zero-size layouts wait for a usable size. This adds no permanent controls or new assets. The installed React/Three integration is exercised with simulated graphics; hardware, touch and clinical acceptance remain outstanding.

The [supporting-tissue source classification](docs/SUPPORTING_CANDIDATES.md) and subsequent [raw tendon/thumb geometry audit](docs/SUPPORTING_GEOMETRY.md) distinguish candidates from admissible anatomy; existing holds remain. The latter audits six sources without importing them. Graphics recovery additionally catches synchronous renderer and shader errors, and practice waits for a successful render call before resuming; actual device acceptance remains pending.

## Throat dissection and regional coverage

The preceding laryngeal milestone reached **1,018 source entries, 135 dissection stages and 117 focuses** across all eleven regions and the whole body. Open **Head & neck → Study windows & focuses** for **Thyrohyoid membranes & suspension**, **Vocal ligaments & vocalis**, **Posterior laryngeal muscle subset** or **Pharyngeal muscles exposed**. Two original membrane sources add detail; all previous anatomy remains unchanged. Use the shared remove/restore/Undo, isolate/fade, framing, separation and practice controls. Six uncertain candidates remain withheld. See [source evidence, use and release gates](docs/LARYNGEAL_DETAIL.md).

All eleven regions have shoulder-style layer tracks and independent study windows. These are reversible visibility controls on available source surfaces, not a complete surgical dissection simulator. Earlier milestone counts below are historical.

## Eye-region dissection

The ocular milestone reached **1,016 source entries, 131 dissection stages and 113 focuses** across all eleven regions and the whole body. Open **Head & neck → Study windows & focuses** for **Eyelid tarsal plates**, **Tear-drainage source structures** or **Nasolacrimal duct & nasal context**. Ten original source-labelled structures use the existing select/frame, isolate/fade, remove/restore/Undo, separation, side filtering and focused practice controls. All earlier anatomy remains unchanged. See [source evidence, controls and clinical limits](docs/OCULAR_DETAIL.md). These are unvalidated teaching surfaces, not a complete eyelid, tear-flow model or surgical dissection simulator.

## Clearer regional study guidance

Open the **Study guide → Orient this dissection** to return to the recipe's viewing direction without changing tissue visibility. **What is in this view?** shows availability, omitted/extra recipe entries and searchable source members with target/context roles. Open the next authored layer or reopen a clean recipe with explicit reset warnings. See [controls and acceptance limits](docs/DISSECTION_GUIDANCE.md). The [ocular preparation report](docs/OCULAR_CANDIDATES.md) is preserved as historical evidence preceding the current admission.

## Regional dissection reliability

Every regional explorer and whole-body practice now distinguishes ready, waiting and failed anatomy groups. A failed required group pauses answers and progression without losing existing answers; retry or exit stays available. Ready counts exclude failures, and naming practice requires distinct choices. See [controls, tests and remaining device acceptance](docs/ANATOMY_LOADING.md).

A [bounded source-shape screen](docs/VESSEL_SHAPE_AUDIT.md) checked all 223 rendered vascular identities and found no additional flagged artery–vein pair under its stated filters. Existing foot holds remain; this does not confer clinical validation or add anatomical coverage.

## Foot and hand vascular dissection

The foot milestone reached **1,006 source entries, 128 dissection stages and 110 focuses**. Open **Ankle & foot → Study windows & focuses** for the plantar arterial arch, medial plantar branch, dorsal venous arches and exposed local vessels. Eight source-labelled entries added detail without changing previous anatomy. Two uncertain plantar venous arches remain withheld for shape/provenance review. See [source evidence, controls and clinical gates](docs/FOOT_VASCULAR_DETAIL.md).

The hand arterial milestone is summarised below. The hand venous milestone reached **998 source entries, 124 dissection stages and 106 focuses**. Open **Wrist & hand → Study windows & focuses** for palmar venous/arterial arches, dorsal venous networks, palmar/finger veins or the exposed artery–vein comparison. Fourteen venous source entries add detail while all earlier anatomy remains exact. Red/blue identify arteries/veins, not oxygenation; uncertain vessel types are neutral grey. Two little-finger groups remain withheld for source-extent review. See [source evidence, controls and clinical gates](docs/HAND_VENOUS_DETAIL.md).

The hand arterial milestone reached **984 source entries, 120 dissection stages and 102 focuses**. Open **Wrist & hand → Study windows & focuses** for palmar arches, common/proper finger branches, thumb/index arterial detail or the fully exposed hand arterial subset. Twenty-six source-labelled entries add finer dissection with all previous anatomy preserved. Unequal supplied sides, grouped components and source numbering remain explicit; these are unvalidated reference surfaces. See [source evidence, controls and release gates](docs/HAND_VASCULAR_DETAIL.md).

## Thoracic small-vessel dissection

The thoracic milestone reached **958 source entries, 116 dissection stages and 98 focused views**. Open **Thorax → Study windows & focuses** for **Bronchial arteries & airway**, **Oesophagus & arterial branches**, or **Thoracic small arteries exposed**. Four original source vessel surfaces add detail with all previous anatomy preserved. The variant-labelled bronchial artery stays explicitly a variant; grouped branches stay grouped. See [source evidence, controls and clinical gates](docs/THORACIC_DETAIL.md).

## Find a regional study view

Open **Study windows & focuses** to search the full regional library by view name, included structure or FMA ID. Filter by system/type and order from broad views to small groups. Expand a card to preview exactly what will hide, restore or stay before choosing **Open study window** or **Open compartment focus**. Browsing leaves the model untouched. Equivalent choices share a card without losing either action; the numbered layer track stays separate. See [controls, safeguards and validation](docs/STUDY_LIBRARY.md).

## Pancreatic vessels and epiglottic dissection

The pancreatic/epiglottic milestone reached **954 source representations, 113 dissection recipes and 95 focused views**. Open **Abdomen → Guided dissection** for four new pancreatic-vessel windows, or **Head & neck → Epiglottis & laryngeal framework**. Twelve source-labelled entries add detail without changing any previous mesh or identity. Use remove/restore/Undo, isolate/fade, explode, arrangement and related-study links as in the other regions. The ambiguous pharyngeal raphe remains withheld. See [source evidence, controls and clinical limits](docs/PANCREATIC_DETAIL.md).

## Continue a regional dissection

Select a whole-body structure and open **Continue this dissection** to carry the same identity and side into its available regions or focused study views. Regional views offer a whole-body return link. **Copy this study link** retains the selection and supported focus without changing private access; outdated model references are rejected rather than substituted. Custom camera/cutaway/removal settings still belong in Saved study views. See [link controls, safety and validation](docs/STUDY_LINKS.md).

## Study navigation

**Browse structures** now filters by name, stable source ID, system and current dissection state, with arrow-key browsing and explicit selection/restoration. Expand **Study together** on a selected structure to inspect its authored target/context groups and open a focused view while keeping it selected. Grouping is not a claim of verified attachments or innervation; unavailable groups and loading states remain explicit. See [controls, scope and acceptance requirements](docs/STUDY_NAVIGATION.md).

## Mesenteric and bowel-vessel dissection

The mesenteric milestone reached **942 source representations**. Its five abdominal study windows remain available: **Mesenteric surfaces & bowel**, **Mesenteric vessels exposed**, separate arterial/venous views, and **Appendix, mesoappendix & artery**. Three membranes and fourteen vessel segments are independently selectable. All previous anatomy remains exact; three near-overlapping arterial candidates are withheld. See [source evidence, controls and clinical limits](docs/MESENTERIC_DETAIL.md). These are draft reference surfaces, not a complete peritoneum, vascular tree or clinical dissection guide.

## Corrected intestinal dissection

Open **Abdomen → Guided dissection → Bowel junction window** to select, hide or isolate the ileocecal junction separately from both bowel aggregates. One previously duplicated component now has one rendered owner, with its original source shape and position preserved. That correction reached 925 source entries; the current mesenteric extension is described above. See [exact preservation evidence and clinical limits](docs/INTESTINAL_JUNCTION.md).

## Whole-body and regional arranged study

Use the new **quick anatomy views** for all anatomy, bones with muscles, individual systems or available nerves with vessels. **Arrange structures** opens a same-scale, system-grouped tray with separated catalogue entries at 100%; pan/zoom, select/frame, change direction and return to **Spatial anatomy** for free rotation. The two-phase slider shows spatial separation followed by tray arrangement. Shapes, source positions and imaging IDs are never rewritten. Old saved views remain compatible; new views can remember the tray. See [controls, numerical validation and limits](docs/BODY_ARRANGEMENT.md). This is a non-anatomical display arrangement, not additional segmentation or physical dissection.

## Regional dissection workspaces

Every individual regional explorer separates **Layer by layer** from independent **Study windows**. Follow named removal steps, preview the exact structures a step will hide or restore, then use the searchable, system-filtered removed-tissue tray to restore one structure or a group with one-step undo. The current 138 stages comprise 47 regional layer steps and 91 independent windows (including whole-body comparisons), with 120 focused views. These are visibility recipes, not a claim of missing-tissue completion. See [dissection workbench](docs/DISSECTION_WORKBENCH.md) and the [latest source addition](docs/FOREARM_VASCULAR_DETAIL.md).

## Dental and orbital close-ups

The dental/orbital milestone reached **924 body entries**. Open **Head & neck → Guided dissection** for **Teeth & jaws**, separate upper/lower tooth surfaces, **Orbital rings & rectus muscles**, or **Superior oblique & trochlea**. These five windows add 28 individually selectable source teeth and four orbital connective structures, with ivory tooth materials, draft notes and existing study/practice controls. All previous anatomy was preserved at that milestone; the later junction correction is documented above. No clinical tooth numbering, internal tooth layers, third molars or validated orbital attachments are supplied. See [source evidence and validation gates](docs/HEAD_DETAIL.md).

## Targeted practice

Open **Practice options** in a regional or whole-body explorer to choose **Find on model** or keyboard-friendly **Name isolated structure**. Sample major landmarks, all visible anatomy (including fine structures), or the current focus targets without added context. Skip/reveal, results and retry-missed actions support deliberate study. Both viewers now reject duplicate/stale answers; the dedicated shoulder retains its three authored prompts. See [practice controls and limits](docs/PRACTICE.md).

## Connective tissue & deep-spinal study

The preceding connective/deep-spinal milestone reached **892 selectable body entries**. Eleven new entries add wrist flexor retinacula, iliotibial tracts, linea alba and deep cervical/lumbar and rib-elevator muscle sets. Six new windows and eight focused views use chosen neighbouring structures instead of automatically restoring every bone. All previous anatomy is unchanged. See [source evidence, study views and review gates](docs/AXIAL_DETAIL.md).

## Deep-brain study milestone

The preceding **881-entry milestone** added 22 additional deep-brain entries: paired caudate, putamen, pallidal, thalamic, amygdala, geniculate and fornix surfaces; selected commissures; corpus callosum; and grouped cerebral choroid plexus and mammillary bodies. Open **Head & neck → Deep-brain overview**, **Basal nuclei & thalami** or **Limbic & commissural detail**. Five focused views remove obscuring skull/brain context, expose labelled landmarks and use distinct study colours. These are licensed source surfaces, not AI-invented tissue, MRI signal or tractography. All earlier geometry is unchanged. See [deep-brain evidence, controls and limitations](docs/DEEP_BRAIN.md).

## Source inventory and added regional detail

The preceding inventory milestone reached **859 selectable source representations**. An exhaustive comparison of both official BodyParts3D v4 indexes supported 36 further additions: 29 vessel segments, two ciliary ganglia and five selected organ/duct/airway representations. Use **Shoulder vascular detail**, **Central airway window**, and focused chest-wall, orbital, biliary and appendix views. All prior identities and mesh bundles were unchanged. See [source inventory, admission evidence and holds](docs/SOURCE_INVENTORY.md). These are unvalidated source surfaces, not complete nerve, vascular, airway or biliary trees.

## Imaging connection framework

**Imaging link** provides opt-in two-way structure selection for a future CT/MRI/ultrasound viewer, explicit grouped-structure choices, region/side checks and practice-mode safeguards. Exact source-space transforms and source hashes travel separately from presentation geometry. It starts **Not connected**; no study or patient registration is included. See [adapter contract and integration gate](docs/IMAGING_LINK.md).

## Saved study views and recovery

**Saved study views** stores up to 20 named, device-local dissection/cutaway configurations with actual camera orbit, pan and framing. Restore them in the matching region; changed source anatomy disables stale views. Failed body bundles and the shoulder can be retried without refreshing or losing the current dissection. See [saved views and recovery](docs/STUDY_VIEWS.md) for privacy, limitations and tests, and the [ongoing improvement programme](docs/CONTINUOUS_IMPROVEMENT.md) for the ordered anatomy, functionality and future imaging backlog.

## Deep inspection milestone

**Inspect deeper** now provides axial/coronal/sagittal surface cutaways, adjustable tissue opacity, click-through faint tissues and a selected-structure visibility override in the shoulder, whole body and every region. Cuts stay attached to structures during explode. Orthographic illustration mode extends to the regional/whole-body viewers, and identification practice offers varied 5/10/20-question sessions with results and re-study links. See [deep inspection](docs/DEEP_INSPECTION.md) for controls, implementation, test evidence and remaining QA. These are exterior-surface cutaways, **not CT/MRI or reconstructed tissue interiors**. This milestone preserves all source geometry and does not increase anatomical coverage or confer clinical approval.

## Branded dissection milestone

The approved Visible Medicine palette and exact **by Elivion** lockups are applied across the shoulder, regional and whole-body explorer. See `docs/BRAND_ALIGNMENT.md` for sources and brand-asset rights. The step-by-step programme, acceptance gates and external review requirements are in `docs/DELIVERY_PLAN.md`.

Explode now increases relative spacing, uses a stable regional origin and fits translated bounds without snapping the orbit. **Keep bones assembled** and **Original positions** provide optional context. Four **Shoulder illustration plates** use orthographic projections of the same source geometry and the same structure selection; return to rotatable perspective using the **Orthographic plate** control. Review disclosures track geometry, teaching and imaging independently.

The new `/review` workspace adds centrally saved, private review records for the nine shoulder structures: checklists, evidence, issues, reviewer scope, version history and approval safeguards. See `docs/REVIEW_WORKSPACE.md` for setup, privacy and tests. It adds development-only Drizzle migration tooling and a D1 binding, but no paid AI API, font binary, anatomy dataset or texture. No acquired CT/MRI/US is loaded, and no specialist review is pre-populated. `docs/REVIEW_AND_IMAGING.md` defines the clinical release gate.

## Latest recovery stage

62 further source representations have been added after the previous 159-entry recovery: 22 whole-disc surfaces, four hand interosseous groups, paired interosseous membranes and Achilles tendons, two trochlear nerves, further head/neck glands and ligaments, and selected pelvic organs. Use **Intervertebral disc column**, **Between the metacarpals**, **Connective-tissue relationships**, gland views and membrane/tendon focuses. Everything remains explicitly unvalidated. See `docs/GAP_FILLING.md` for admitted and held candidates, licensing and reconstruction requirements. No v3 mesh or guessed nerve route was mixed into the current body.

The earlier numerical explode review is preserved in `docs/EXPLODE_REVIEW.md`, alongside the now-implemented corrections and their regression evidence.

The library now opens at `/` with a whole-body model and **11 individual regional explorers**: head/neck, thorax, abdomen, pelvis/hip, shoulder/arm, elbow/forearm, wrist/hand, hip/thigh, knee/leg, ankle/foot and spine/back. Each region has its own `/regions/{region-id}` URL. The approved visual approach of the dedicated shoulder viewer is preserved at `/shoulder`.

The expanded source library contains **1,022 selectable entries**: 203 skeletal, 369 muscular, 80 organ, 54 nervous-system, 227 vascular and 89 connective-tissue entries. These are source representations, not an assertion of complete anatomical coverage or a count of distinct human bones/muscles. Whole-body and regional views support system switches, left/right filtering, name search, rotation, pan, zoom, selective hide/restore, isolate/frame, separation and identification practice. Anatomy and clinical topics remain available; unauthored specialist material is clearly marked pending, not manufactured as finished teaching content.

**Nervous-system scope:** brain aggregate, 22 selected deep-brain entries, 28 selected cranial/orbital nerve entries, two ciliary ganglia and a central-canal representation. No complete spinal cord, limb peripheral nerves, brachial plexus or lumbosacral plexus is included. The source ambiguously maps spinal cord and central canal to the same mesh; the narrower central-canal identity is used. Four candidate muscle entries with source laterality/position discrepancies were quarantined, not automatically relabelled. See `docs/FULL_BODY_COVERAGE.md`.

The full-body catalogue is split into 86 lazy-loaded regional/system GLB bundles, totalling 96,645,168 bytes before transport compression. Whole-body initially loads bones; regional pages open with their assembled available anatomy. Other bundles load on demand. An organs-only or nerves-only view automatically reframes to the visible anatomy, and a selected structure can be framed individually. Network transfer and device memory depend on the chosen regions/systems. These assets introduce no new dependencies or paid services.

## Guided regional dissection

Every regional page has a guided dissection deck, with **138 stages and 120 focused views** across the 11 regions and whole body. Follow numbered layer steps or search the study library for an independent window/focus; ghost removed tissues, remove individual structures, restore them from the removed list, undo up to 40 dissection changes, or reassemble. Six directional camera presets include a plantar view for the foot. Stage and deep-brain focus landmarks explain what is visible and which structures are missing. Labels follow their anchors' actual camera-projected screen halves, including free rotation. Selecting a removed structure through search restores it explicitly and marks the view customised.

The rendering adds original contour and tonal-hatching treatment without changing the mesh shape. Hatching describes form, not measured muscle fibres. Whole-body contour rendering is limited to selected structures when the scope is large; regional views use full contours. Ghosts do not intercept structure selection. Practice hides labels, ghosts and study content.

The source selection now includes 60 previously omitted muscle heads/parts, including deltoid, biceps/triceps, trapezius, quadriceps and gastrocnemius, under the same official CC BY 4.0 grant. Gallbladder and superficial perineal regional assignments were corrected while preserving their existing anatomical IDs and geometry. See `docs/DISSECTION.md` for the complete feature map, architecture, review workflow and limits.

## Dedicated shoulder dissection

An interactive spatial shoulder model, built with React, React Three Fiber and Three.js. **The anatomy is now real BodyParts3D surface geometry, not cones, spheres, capsules or clickable flat illustrations.** Eleven registered source meshes form nine selectable structures: scapula, clavicle, humerus, deltoid (three parts), supraspinatus, infraspinatus, subscapularis, teres minor and the long head of biceps with its proximal tendon.

The default posterior dissection exposes the rotator cuff. Anterior and lateral presets, free rotation, zoom, pan, surface/bone layers, system switches, labels, fading, exploded separation, search, educational tabs and a label-free identification exam are included. The upper arm is cropped for a shoulder-focused view. Illustrative colour, contours and fine tonal hatching describe shape; the hatching is not measured fascicle anatomy.

## Run locally

Use Node.js 22.18+ and npm (Node 24 is the tested development version). Native TypeScript loading is required by the build's review-fingerprint generator.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The checked-in GLB works without a model account, API key or runtime connection to the source archive.

```sh
npm run build
npx tsc --noEmit
npm run licenses:audit
node scripts/validate-anatomy.mjs
node scripts/validate-full-body.mjs
node scripts/validate-dissection.mjs
node scripts/validate-explode.mjs
npm run inspection:test
npm run study:test
npm run imaging:test
npm run inventory:test
npm run neuro:test
npm run axial:test
npm run practice:test
npm run loads:test
npm run guidance:test
npm run ocular-candidates:test
npm run vessel-shapes:test
npm run reviews:test
node scripts/validate-recovery.mjs
node scripts/validate-gaps.mjs
node scripts/review-explode.mjs
```

## Commercial rights and costs

Authored application code is MIT. Browser libraries are MIT/ISC; exact transitive versions and obligations are recorded in `LICENSES/dependency-license-audit.json` and `LICENSES/THIRD_PARTY_NOTICES.md`. The review workspace adds development-only Drizzle ORM (Apache-2.0) and Drizzle Kit (MIT); neither is imported by the deployed review API.

BodyParts3D is **CC BY 4.0 under the official LSDB Archive's February 2025 updated grant**, permitting commercial use and adaptation with attribution. See `LICENSES/BODYPARTS3D.md` for evidence, source hashes and modifications. Keep this credit and the visible credits link:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

The model requires no purchase, royalty, per-user fee, subscription or paid API. There are no bundled fonts, textures or patient studies. Previously included public-domain 2D plates remain documented but are not used in the viewer. No commercial anatomy illustrations or mixed-licence third-party collections were imported. A free software/asset licence does not guarantee free hosting, domains or unlimited bandwidth forever; no paid service is required by this implementation.

## Architecture and full-body extension

Labels follow their structure's **current screen side**, including after rotation and explosion, with compact independently spaced columns. See [screen-side labels](docs/SCREEN_LABELS.md); run `npm run labels:test` for projection and layout regressions.

See `docs/ARCHITECTURE.md`. Product-owned `vm:anatomy:{body-region}:{subregion}:{laterality}:{category}:{slug}` IDs bind content to named GLB meshes. `app/anatomy-data.ts` is the current typed authoring source; `content/schema/anatomy-structure.schema.json` defines the richer database ingestion contract. The source manifest records FMA cross-references without redistributing the FMA ontology. Future terminology releases need their own licence review.

The small shoulder bundle loads on demand. Further regions should be separately versioned bundles sharing the same source coordinate frame; individual meshes must not be independently centred or scaled. Content review and model review are separate release gates.

The old prototype tendon-only biceps ID is not reassigned to the muscle. The new `...:muscle:biceps-long-head` ID correctly represents the source long-head complex. A future independently segmented tendon must receive its own reviewed binding.

## Reproduce the model

```sh
node scripts/ingest-bodyparts3d.mjs
node scripts/ingest-full-body.mjs
```

The script retrieves only selected entries using HTTP ranges from the official version 4.0 ZIP; it checks ZIP CRC32 and length, records SHA-256, welds vertices, recomputes normals and converts to self-contained GLB. Cached raw source files live outside the public site in `../work/bodyparts3d/selected`. All structures receive the same transform. Source axis convention is millimetres, +X left, +Y posterior, +Z superior; scene convention is +X left, +Y superior, +Z anterior. The exact transform and centre are in the manifest. See `docs/MESH_INGESTION.md`.

The expanded importer uses both official IS-A (skeletal, muscular and nerve definitions) and PART-OF (compound organs and brain) archives. It caches verified source bytes in `../work/bodyparts3d/isa` and `partof`. It never modifies the original shoulder bundle. The full-body centre and scale differ from the shoulder camera frame; both exact source-to-scene matrices are recorded, so cross-view coordinates must pass through the shared source millimetres, not be copied directly. See `LICENSES/BODYPARTS3D_FULL_BODY.md`.

## Imaging and clinical limits

The [shoulder/arm muscle curriculum](docs/SHOULDER_ARM_CURRICULUM.md) adds original draft attachment, action and motor-supply notes to 32 existing regional/whole-body representations without more interface controls. It does not add nerve meshes or certify muscle attachment footprints. Run `npm run shoulder-arm-curriculum:test` for exact content/identity preservation checks.

CT, MRI and ultrasound tabs currently contain draft teaching text, not scan data. `lib/imaging-sync.ts` now provides a runtime-validated selection adapter contract; no imaging viewer is connected by default. The reference-plane illustration is independent of that connection. There is no patient registration or working DICOM spatial synchronisation. Source coordinates must never be assumed to match a patient's frame of reference. See [Imaging link](docs/IMAGING_LINK.md).

Independent clinical review remains required for source anatomy, reduced-mesh fidelity, attachments, normals, label anchors, laterality, teaching copy and quiz validity. The dedicated shoulder subset has no independently segmented labrum, capsule, bursa, nerve or vessel; the expanded library's limited neural coverage is described above. Source identity and licensing are not clinical validation. See `docs/CLINICAL_VALIDATION.md` and `docs/FULL_BODY_COVERAGE.md` before educational or medical release. No diagnostic or patient-specific use is supported.

## Deployment

`npm run build` refreshes review fingerprints and creates a Vinext/Cloudflare Workers bundle in `dist/server` and public assets in `dist/client`. This project is configured for its existing OpenAI Sites deployment through `.openai/hosting.json`; the private deployed site is the normal preview. For local production-style serving use `npm start` after the build. Run `npm run db:local` for the review tables before local testing. Reviews need the D1 binding and trusted Sites identity; the anatomy viewer itself does not. For another host, retain asset routing, implement a trusted authentication/storage adapter and adapt the Worker entrypoint; this is not a generic Node-server build. No secret, object store or paid AI API is needed. Keep the GLB, manifest, licence and credits page together in distributions.

MIT covers authored code, not the BodyParts3D meshes or the Visible Medicine trademark. Preserve third-party rights and attribution.
