# Visible Medicine — Whole-Body & Regional 3D Anatomy

## Dental and orbital close-ups

The atlas now contains **924 body entries**. Open **Head & neck → Guided dissection** for **Teeth & jaws**, separate upper/lower tooth surfaces, **Orbital rings & rectus muscles**, or **Superior oblique & trochlea**. These five windows add 28 individually selectable source teeth and four orbital connective structures, with ivory tooth materials, draft notes and existing study/practice controls. All previous anatomy is preserved. No clinical tooth numbering, internal tooth layers, third molars or validated orbital attachments are supplied. See [source evidence and validation gates](docs/HEAD_DETAIL.md).

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

The expanded source library contains **924 selectable entries**: 203 skeletal, 369 muscular, 72 organ (including 28 teeth), 54 nervous-system, 146 vascular and 80 connective-tissue entries. These are source representations, not an assertion of complete anatomical coverage or a count of distinct human bones/muscles. Whole-body and regional views support system switches, left/right filtering, name search, rotation, pan, zoom, selective hide/restore, isolate/frame, separation and identification practice. Anatomy and clinical tabs remain available; unauthored specialist material is clearly marked pending, not manufactured as finished teaching content.

**Nervous-system scope:** brain aggregate, 22 selected deep-brain entries, 28 selected cranial/orbital nerve entries, two ciliary ganglia and a central-canal representation. No complete spinal cord, limb peripheral nerves, brachial plexus or lumbosacral plexus is included. The source ambiguously maps spinal cord and central canal to the same mesh; the narrower central-canal identity is used. Four candidate muscle entries with source laterality/position discrepancies were quarantined, not automatically relabelled. See `docs/FULL_BODY_COVERAGE.md`.

The full-body catalogue is split into 71 lazy-loaded regional/system GLB bundles. Whole-body initially loads bones; regional pages open with their assembled available anatomy. Other bundles load on demand. An organs-only or nerves-only view automatically reframes to the visible anatomy, and a selected structure can be framed individually. The entire expanded body asset set is about 92.91 MB uncompressed; network transfer and device memory depend on the chosen regions/systems. These assets introduce no new dependencies or paid services.

## Guided regional dissection

Every regional page now has a guided dissection deck, with **102 stages and 84 focused views** across the 11 regions and whole body. Move forward/back, jump to a named stage, switch to a compartment, ghost removed tissues, remove individual structures, restore them from the removed list, undo up to 40 dissection changes, or reassemble. Six directional camera presets include a plantar view for the foot. Stage and deep-brain focus landmarks explain what is visible and which structures are missing. Regional label columns now follow the visible bounds and the selected view direction, including lateral views. Selecting a removed structure through search restores it explicitly and marks the view customised.

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

CT, MRI and ultrasound tabs currently contain draft teaching text, not scan data. `lib/imaging-sync.ts` now provides a runtime-validated selection adapter contract; no imaging viewer is connected by default. The reference-plane illustration is independent of that connection. There is no patient registration or working DICOM spatial synchronisation. Source coordinates must never be assumed to match a patient's frame of reference. See [Imaging link](docs/IMAGING_LINK.md).

Independent clinical review remains required for source anatomy, reduced-mesh fidelity, attachments, normals, label anchors, laterality, teaching copy and quiz validity. The dedicated shoulder subset has no independently segmented labrum, capsule, bursa, nerve or vessel; the expanded library's limited neural coverage is described above. Source identity and licensing are not clinical validation. See `docs/CLINICAL_VALIDATION.md` and `docs/FULL_BODY_COVERAGE.md` before educational or medical release. No diagnostic or patient-specific use is supported.

## Deployment

`npm run build` refreshes review fingerprints and creates a Vinext/Cloudflare Workers bundle in `dist/server` and public assets in `dist/client`. This project is configured for its existing OpenAI Sites deployment through `.openai/hosting.json`; the private deployed site is the normal preview. For local production-style serving use `npm start` after the build. Run `npm run db:local` for the review tables before local testing. Reviews need the D1 binding and trusted Sites identity; the anatomy viewer itself does not. For another host, retain asset routing, implement a trusted authentication/storage adapter and adapt the Worker entrypoint; this is not a generic Node-server build. No secret, object store or paid AI API is needed. Keep the GLB, manifest, licence and credits page together in distributions.

MIT covers authored code, not the BodyParts3D meshes or the Visible Medicine trademark. Preserve third-party rights and attribution.
