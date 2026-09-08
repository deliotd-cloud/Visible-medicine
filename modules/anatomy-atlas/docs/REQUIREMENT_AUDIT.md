# Atlas requirement and acceptance audit

## Current decision — 8 September 2026

The main interactive feature set is implemented. The product is **not a completed anatomical curriculum, a complete human model, a clinically approved atlas or a connected radiology viewer**. Private Site delivery was restored at the neural milestone (version 39, source `aaaef58d65000d4a83ac1fcd9845cb43c89a4533`); subsequent publication receipts identify later deployed revisions. The remote GitHub backup remains unverified for recent work. More controls are not the next priority.

This audit supersedes older milestone counts and “next action” paragraphs for current planning. Historical receipts remain evidence of their particular revision, not acceptance of the current one. `BROWSER_QA.md`, for example, describes an earlier 823-entry atlas and a mobile layout that has since been replaced.

The reproducible [inventory](requirement-audit.json) executes the actual content resolver, shoulder content and dissection profiles. It counts explicit topic-readiness categories, regional membership, assets and review fingerprints. Run `npm run requirements:audit`, review changes, then `npm run requirements:audit -- --check`. It does not read private reviews, call external services or invent an approval. The subsequent [content-contract milestone](CONTENT_CONTRACT.md) replaces the original title-based heuristic with branch-authored readiness and multi-part exports; two false-positive Function drafts are now correctly pending without changing their displayed text.

## Requirement → implementation → remaining acceptance

| Requirement | Current evidence | Missing work or acceptance |
| --- | --- | --- |
| Shoulder, individual body parts and whole body | Nine shoulder identities/11 parts; 1,022 body representations/86 body bundles; all 11 regional routes plus whole body. `full-body-validation.json` checks actual GLBs, IDs, bounds, finite geometry and shared transforms. | Numbers count source representations, not complete anatomy. Regional membership overlaps; shoulder anatomy overlaps the body catalogue and must not be added to it as new unique anatomy. Source boundaries, shape, tissue relationships and variants remain unvalidated. |
| Detailed, diagrammatic spatial anatomy | Real licensed source surfaces, shared illustrated materials, contours and non-anatomical tonal hatching; orthographic body views and four shoulder presets. `BRAND_ALIGNMENT.md`, `anatomy-tissue.tsx`, both scenes. | Exterior surfaces have no invented internal tissue. Hatching is not fascicle direction. Latest style/layout has no current visual/device acceptance; numerical checks cannot establish anatomical drawing quality. |
| Rotation, selection, isolate/fade, search, labels | Both explorers and shared scene, navigation, inspection and screen-label helpers. Screen-half label packing follows the actual camera. Search/list selection provides a non-canvas control. | Real pointer/touch picking, long labels, dense/occluded structures, keyboard focus, screen-reader behaviour and actual rendered label collisions still need testing. Omitted labels are not missing meshes. |
| Explosion choice | Spread, Extract selected and Tray in shoulder, regions and whole body; saved-state support; 0% source reassembly and exam guards. `EXPLODE_STYLES.md`. | Translation is a teaching arrangement, not anatomical displacement or an operative path. Tray clearance applies to the tested aligned projection at 100%, not every free-orbit/intermediate view or internal component. Device acceptance remains open. |
| Regional dissection and deeper inspection | 138 stages, 120 focuses; layer tracks, independent windows, remove/restore/Undo, ghost context, clipping, tissue opacity and targeted selection recovery. `DISSECTION_WORKBENCH.md`, `SELECTION_VISIBILITY.md`. | Recipes only operate on supplied surfaces. Clipping is not a scan or a volumetric tissue reconstruction; recovery cannot guarantee freedom from visual occlusion. Fine-structure/device and clinical review remain. |
| Simple navigation and minimal scrolling | Shared Explore/Dissect/Practice modes, 216px system rail, grouped notes, folded advanced controls, focus view and responsive side sheets. Model-first and shoulder-workspace component/handler suites pass. | The latest responsive layout has not been accepted in a browser, on physical devices or at 200% text zoom. Earlier vertically stacked mobile screenshots are not evidence for it. |
| All eight content topics | Anatomy, Function, CT, MRI, Ultrasound, Pathology, Clinical and Quiz remain reachable within three note groups and Practice. Current content inventory below. | The presence of eight topics does not mean eight authored lessons per structure. Most body records have pending specialist content; even non-fallback copy is draft, sometimes shared by a group. |
| Quiz/exam | Regional find/name identification modes, loaded-target policies, skip/reveal, retry-missed, results and answer-once guards. Dedicated shoulder has three authored quiz prompts. `PRACTICE.md`. | Not a validated exam or competency assessment. Educator review of prompts, distractors, source naming and actual-device availability is required. |
| Content/database schema and review | V2 draft-content schema, explicit topic readiness, complete multi-part bindings, scope-aware representation keys and a real shoulder export; all body records tested against schema/source assets. Existing private shoulder review persistence remains separate. `CONTENT_CONTRACT.md`, `REVIEW_WORKSPACE.md`. | Production curriculum storage/editorial workflow and regional clinical review remain unimplemented. V1 requires explicit migration, not automatic approval/binding conversion. Persisted clinical review currently covers the nine shoulder IDs only. |
| Radiology-ready IDs and future synchronization | Stable product IDs and source hashes; explicit aggregate/part choices; reversible shoulder/body source transforms; opt-in, validated two-way selection bridge. `IMAGING_LINK.md`. | No modality viewer, acquired study, patient transform, validated segmentation mapping or CT/MRI/US spatial synchronization. US calibration and CT/MRI per-frame metadata are separate future requirements, not values inferred from explode or model centres. |
| Commercial reuse and zero mandatory product fee | Recorded official BodyParts3D grant and CC BY 4.0 attribution/change notices; MIT authored code; retained dependency notices; no new paid runtime API. Current lockfile audit: 808 entries, zero unclassified. | Metadata classification is not a legal audit of every binary. Preserve CC BY, MIT/ISC/BSD/Apache and applicable MPL/LGPL/Python obligations. Brand artwork is reserved, not MIT. No guarantee of perpetually free hosting, bandwidth, domains, specialist work or future assets. |
| Fonts, textures and diagrams | Public asset inventory: 87 GLBs, 4 PNGs, 2 SVGs, credits and metadata; no bundled font binaries. System fonts and procedural material treatment. Prior public-domain 2D plates remain documented, unused by the primary 3D viewer. | Keep exact asset rights and visible credit on any future exports. Online availability, an AI-generated image or a plausible surface does not establish rights or correct spatial anatomy. |
| Setup, architecture, ingestion, deployment | README, source manifests, recorded transforms, verified-source importers, code/data notices, integration guide and passing production build. | Ingestion guidance includes future gates, not proof of whole-catalogue manifold/attachment validation or desktop/mobile LOD delivery. Host authentication, subdirectory paths, review storage, integration method and release audience require deliberate integration work. |
| Save/publish and main website boundary | Current local source and exact module-only local backup are recoverable. Existing private Site and backup branch remain the intended destinations. | Last verified hosted source is older than these local changes; source-service transport and GitHub connector access were blocked. Local commits are not remote delivery. No main-website merge, audience expansion or public/clinical launch is authorized by this audit. |

## Teaching depth: actual displayed copy

The latest [connective Anatomy extension](CONNECTIVE_ANATOMY_CURRICULUM.md) adds 26 attachment/regional-disc drafts while preserving existing Function. Four Function records remain pending: two grouped foot-sesamoid selections and the muscle/fornical holds. Function identity-only count is zero; two Anatomy sections and most specialist topics remain unauthored. Shared regional disc notes do not establish validated individual intervals. Draft counts do not establish correct facts or clinical review. Source geometry, internal anatomy, neural/vascular continuity, territories and physiology remain unvalidated. Older milestone counts below are historical.

The latest [organ curriculum](ORGAN_CURRICULUM.md) supplies 46 cited Anatomy/Function drafts for 23 existing representations. No organ-system Function entry is now pending, but that does not imply complete organ geometry or clinical teaching. Source eye-component asymmetry, adult-male tract, fixed-age thymus and internal-layer limitations are explicit. Unresolved muscle FMA19728 and fornical commissure FMA61970 remain pending. Earlier milestone counts below are historical; the table and generated inventory are current.

These are counts among the **1,022 body representations**, not unique lessons, accepted anatomy or independent clinical reviews. The dedicated shoulder's nine entries have draft text in all eight topics; reuse supplies eleven body entries because component representations can share shoulder teaching.

| Body topic | Specific or source-group draft | Generic identity/disclaimer | Explicitly pending | Generated identification prompt |
| --- | ---: | ---: | ---: | ---: |
| Anatomy | 1020 | 2 | 0 | 0 |
| Function | 1018 | 0 | 4 | 0 |
| CT | 11 | 0 | 1,011 | 0 |
| MRI | 11 | 0 | 1,011 | 0 |
| Ultrasound | 11 | 0 | 1,011 | 0 |
| Pathology | 11 | 0 | 1,011 | 0 |
| Clinical | 11 | 0 | 1,011 | 0 |
| Quiz notes | 11 | 0 | 0 | 1,011 |

“Specific draft” now means the authoring branch explicitly marks its lesson draft. It does **not** promise complete attachments, innervation, detailed citations, correct facts or independent review. The generated Quiz note is separate from the working multi-question identification session. The report contains the same breakdown for each region; do not sum overlapping regional rows. The original audit had 259/617 Function draft/pending counts; explicit metadata corrects pending FMA61970/FMA62072, whose headings previously fooled the title heuristic.

The shoulder/arm curriculum now adds 64 original draft sections for 32 previously pending muscle representations. Among the region's 91 entries, Anatomy has 43 drafts and 48 identity-only entries; Function has 43 drafts, 45 generic vascular disclaimers and three pending left-bone records. No missing nerve geometry is invented. See [curriculum scope, citations and review gates](SHOULDER_ARM_CURRICULUM.md).

## Highest-impact anatomy gaps

The [foot curriculum](FOOT_CURRICULUM.md) adds 72 basic drafts for 36 muscle/head/slip entries. Foot's 118 representations have 44 draft Anatomy / 74 identity-only and 48 draft Function / 16 generic / 54 pending. The variable opponens action remains explicitly unresolved; draft status is not proof of full functional knowledge. No missing dorsal interossei, nerve courses or specialist content are fabricated.

The [lower-leg curriculum](LEG_CURRICULUM.md) adds 56 basic drafts for 28 muscle/head entries. The leg's 60 representations have 30 draft Anatomy / 30 identity-only and 32 draft Function / 18 generic / 10 pending. Every represented leg muscle now has basic Anatomy/Function teaching, without claiming independently mapped tendon slips, nerve courses, compartments or accepted clinical/modality content.

The [hip/thigh curriculum](THIGH_CURRICULUM.md) adds 108 basic drafts for 54 muscle/head/portion entries. Among the thigh's 81 representations, Anatomy now has 56 drafts / 25 identity-only; Function has 56 drafts / 20 generic disclaimers / 5 pending. Overlapping pelvic entries reuse the same exact identities; do not count these again. No specialist topic, nerve mesh, individual attachment map or clinical approval is added.

The [hand curriculum](HAND_CURRICULUM.md) adds/enriches 40 Anatomy/Function sections for 20 existing muscle/head/group entries, including six previous Function drafts. Hand's 124 entries now have 62 draft Anatomy / 62 identity-only and 62 draft Function / 8 generic disclaimers / 54 pending. Its clinical/modality topics remain pending. Group identity is not individual segmentation; held thumb sources remain excluded.

The subsequent [forearm curriculum](FOREARM_CURRICULUM.md) adds 84 draft sections for 42 existing muscle representations. Among the region's 66 entries, Anatomy now has 49 drafts / 17 identity-only; Function has 49 drafts / 10 generic disclaimers / 7 pending. All mapped forearm muscles have basic drafts, not a complete clinical curriculum. Specialist topics, geometry and review status are unchanged.

Retain the source-level decisions and exact held IDs in `GAP_FILLING.md`, `SOURCE_INVENTORY.md`, `ABDOMINAL_WALL_AUDIT.md`, `SUPPORTING_TOPOLOGY.md` and subsequent regional source audits. No hold is lifted here.

- Dedicated shoulder capsule, labrum, subacromial/subdeltoid bursa and key ligament detail; no independently segmented shoulder nerve/vessel in the nine-structure pilot.
- Limb peripheral nerves, brachial/lumbosacral plexuses and a genuine cord segmentation. The central-canal surface is not a spinal cord. Brain/orbital surfaces do not fill those gaps.
- Missing abdominal-wall/back muscles requiring compatible sources and registration; fuller pelvic floor and female anatomy. Do not mix the six unregistered legacy wall candidates into v4.
- Comprehensive joint/fascial/lymphatic layers, finer organ interiors and complete vascular branches/lumina. The 80 organ and 227 vessel entries are selected reference subsets, not complete systems.
- Source quality/adjudication for held alternatives and identified fragments/aliases. Repeat screening alone cannot resolve clinical identity or supply source-author evidence.

## Ordered next actions

1. **Completed locally — content ingestion contract.** Multi-part source bindings, representation scopes and explicit topic readiness now have a v2 schema, actual shoulder export and whole-body/source/rejection checks. See `CONTENT_CONTRACT.md`. Clinical reviews, canonical IDs, displayed copy and private data are unchanged. Production curriculum storage and automatic legacy migration are not claimed.
2. **Continue source-linked teaching.** After the connective Anatomy milestone, two foot-sesamoid aggregate Anatomy entries remain identity-only. Resolve their source scope where evidence allows, then develop clinical/pathology, modality teaching and reviewed questions in existing panels. Foot-sesamoid groups FMA45097/FMA45098, pelvic muscle FMA19728 and fornical commissure FMA61970 require source evidence or specialist adjudication, not readiness promotion. The unassigned disc FJ3211 remains a separate geometry/level hold. Draft overviews do not establish full anatomy or validated pathways; do not replace unknown nerve geometry with guessed routes or fill scan tabs with synthetic findings.
3. **Accept the current UI on actual devices when authorized/available.** Use the matrix below before calling navigation, labels or explosion visually complete. Fix observed defects rather than add speculative controls. A browser-testing request is required for this environment's browser workflow; no browser-only preview is started in background audit work.
4. **Resolve source, specialist and imaging inputs.** Supply rights-cleared compatible geometry or qualified adjudication for held candidates; obtain revision-bound anatomical/editorial review. Connect the user's real imaging function only after its interface, scope and data/registration evidence exist.
5. **Deliver the exact accepted revision.** Restore authorized source-service/GitHub access, then publish privately and update only the existing anatomy backup branch. Main-website integration needs a chosen route/embed and access policy; no sharing change is assumed.

Action 2 remains safe actionable local work, so this goal is **not blocked or complete** merely because actions 3–5 have external gates. Additional navigation widgets are not needed to create artificial progress.

## Current UI acceptance matrix — not yet executed

Test the dedicated shoulder, head/neck, a small distal region, spine and whole body. Include desktop, tablet and a physical phone; keyboard-only, screen reader and 200% text sizing; a representative lower-powered GPU.

1. Open the model without scrolling past tools. Open/close both sheets, change modes, use Focus view and return. Confirm no trapped focus, clipped control or unwanted page overflow.
2. Select via mesh, search and structure list. Rotate to both sides; labels stay in their anchor's screen half without obscuring the selected structure or leaking quiz answers.
3. Compare Spread/Extract/Tray at 0%, intermediate and 100%, with isolated/ghosted/removed structures. Test selection change, framing, camera preservation and exact source reassembly; do not infer free-orbit surface clearance from tray endpoint tests.
4. Advance a layer; open an independent window; remove/restore/Undo; apply cuts and opacity. Reveal only the selected target, reapply its cut, save/reload a study view and confirm surrounding study context persists.
5. Run find/name practice, skip/reveal/retry and exit. Simulate actual loading failure and graphics loss/restart; unavailable geometry must pause answers without trapping the learner.
6. Record measured frame rate, memory and load time for the chosen device/system scope. A successful build and finite geometry do not establish mobile performance. Body GLBs total 96,645,168 bytes before transport compression; lazy loading reduces requested subsets, not their eventual GPU memory cost.

## Evidence boundaries

This audit verifies current displayed content and brand hashes and uses focused software reports for feature evidence. It does not claim all historical suites were rerun together, that every dependency's source licence text was individually re-audited, that all anatomy is manifold, or that any private clinician review was inspected. The current curriculum changes 64 explicitly pinned teaching sections, not runtime geometry, rendering, review fingerprints or licence obligations.

External delivery facts are dated in the accompanying local checkpoint; this document deliberately contains no source credential, private review or patient data.
