# Current atlas status

27 September restoration follow-through: the historical model-first validator
now replays exact saved-view/practice/control migrations without rewriting its
original baseline. All 3,844 checks and 105 markup cases pass; four deliberate
handler/callback drift mutations are rejected. The tested restoration source
`eecf73c` is imported into the website's local Clinical Review viewer; learner
delivery and public deployment remain separate. No geometry, teaching or clinical
decisions change in this follow-through.

27 September dissection restoration: Restore one/matching now exits isolation
fading and selected-only framing, then refits without changing source geometry,
teaching, layout, separation or cutaway. The foot-viewer failure was reproduced;
invalid/out-of-scope requests and exam mode cannot change history or display.
See [workbench behaviour](DISSECTION_WORKBENCH.md).

27 September review evidence: body review topic disclosures now show authored
draft answer keys and explanations, matching the dedicated shoulder reviewer.
Unkeyed legacy notes gain no inferred answer. Teaching, models, checklists and
saved decisions are unchanged; website presentation must be rebound on import.

27 September foot vascular quizzes: eight exact source selections now have four
paired formative questions with explicit answers and explanations. Existing
collapsed controls are reused; exam mode hides them. Full source pins preserve
all other topics/models. Original factual-reference questions remain drafts for
radiologist sign-off, not patient findings or proof of flow. See
[scope and evidence](FOOT_VASCULAR_QUIZ.md); website delivery is separately pinned.

27 September review search: Clinical Review reuses the existing source-checked
Atlas vocabulary and dedicated shoulder synonyms. Achilles now finds both exact
whole-body tendons as well as the separate specimens. Scope/side filters, source
labels, links and decisions remain independent. No new anatomical synonyms or
clinical approvals; index, page, queue/status tests and TypeScript pass.

27 September follow-up: resolved the legacy Achilles MRI/US historical validation
mismatch without changing its expected hash. The replay now accounts for exactly
eleven later regional quiz keys. All learner content/models remain unchanged;
unknown or mixed answer-key changes are rejected. See [details](ACHILLES_CT.md).

27 September 2026: [Achilles CT orientation](ACHILLES_CT.md) adds two exact-source
drafts distinguishing conventional/spectral CT, experimental evidence and model
limitations. MRI/US, geometry and unsupported limb CT gaps remain unchanged.
No patient images or approvals; verification/recovery is recorded in the main
checkpoint. Website export and clinical acceptance remain separate gates.

26 September 2026: [Regional selectable structure checks](REGIONAL_QUICK_CHECK.md)
reuse the shoulder answer controls for 11 explicitly keyed regional/whole-body
quiz entries. Other quiz notes remain unchanged; exam mode hides formative
answers. Source tests/build pass; browser acceptance and website export pending.
No clinical approval or teaching/geometry changes.

26 September 2026: [Clinical review history protection](CLINICAL_REVIEW_HOME.md)
fixes a reproduced delayed-response overwrite in internal and specimen reviews.
Refresh/exit cancels obsolete reads; late results cannot replace new notes or
report outdated failures. Existing draft reconciliation and save guards remain.
This is local source work, not publication or radiologist approval.

26 September 2026: [Clinical review continuity](CLINICAL_REVIEW_HOME.md#sign-in-continuity-and-keyboard-focus--26-september-2026)
retains exact structure/model/source selections through sign-in and adds missing
internal/specimen sign-in links after initial record-load failures. Review list
keyboard focus stays inside its clipping boundary. Existing access, unsaved-edit
and revision gates are unchanged; live integration and browser checks remain open.

26 September 2026: [Common interosseous ultrasound](COMMON_INTEROSSEOUS_US.md)
adds two attributed, exact-source drafts. Existing anterior-artery teaching and
all models are preserved; recurrent US and small-branch MRI remain pending.
Local source only, not clinical approval or live publication.

26 September 2026: [Label focus continuity](LABEL_FOCUS_CONTINUITY.md) returns
focus from a label omitted by rotation or compact layout to its model canvas,
without scrolling or taking focus from another control. No added UI, anatomy
or teaching changes. Browser acceptance and website integration remain pending.

26 September 2026: [Eye ultrasound](EYE_ULTRASOUND.md) adds four lens/sclera
draft placements with CC BY attribution. Exact source/parent bindings, prior
teaching and geometry are preserved. No images imported or approvals created.
Local source only; website integration remains pending.

26 September 2026: [Plantar arterial ultrasound](PLANTAR_ARTERIAL_US.md) adds
six source-bound drafts with CC BY attribution; six unsupported branch/venous
slots stay pending. No models, clinical approvals or controls change. The main
checkpoint records validation/recovery; source work is not live publication.

26 September 2026: [Lateral cricoarytenoid ultrasound](LATERAL_CRICOARYTENOID_US.md)
adds two exact-source drafts in the existing notes, with explicit cadaver-study
limits and CC BY attribution. All other topics and models remain unchanged;
clinical review is pending. Final validation and recovery are recorded in the
main-workspace checkpoint. No publication or real-image validation is inferred.

26 September 2026: [Clinical review home](CLINICAL_REVIEW_HOME.md) at
`/review/overview` connects all four existing approval workspaces through a
searchable index. Exact model scopes and nested source tokens are preserved;
private decisions and their validation are unchanged. This is source-app work,
not a deployed website approval area. Website integration, staff authorization,
private-store compatibility and live save/reload/browser acceptance remain open.

26 September 2026: [Small-intestinal mesentery MRI](SMALL_INTESTINAL_MESENTERY_MRI.md)
adds an attributed CC BY draft to the existing notes for the exact FMA14643 source
surface. No new controls, anatomy assets or patient images are introduced; all
other topics and source holds remain unchanged. The dedicated tests exercise
source identity, history, rendering and review contracts. Clinical approval,
actual-image/browser acceptance, publication and external recovery remain pending;
the main-workspace checkpoint records final verification. Desktop untouched.

26 September 2026: website imaging-link subscribers now have synchronous fault
isolation in both selection and comparison bridges. One failing observer can no
longer block registration cleanup handles or the remaining observers; snapshot
delivery also prevents self-rebinding from extending a notification. Actual-bridge
synthetic regressions cover lifecycle, observer changes and adapter failures.
See [the link contract](IMAGING_LINK.md#observer-fault-isolation-26-september-2026).
Anatomy and teaching are unchanged; revision-bound reviews remain unsigned.
Desktop software is untouched. Publication, browser acceptance and external
recovery remain pending; final evidence is in the main-workspace checkpoint.

26 September 2026: [Transverse-mesocolon MRI](TRANSVERSE_MESOCOLON_MRI.md)
adds one exact-source draft to existing Abdomen/Whole body notes. The primary
study and commercial-compatible CC BY attribution are recorded; no media is
imported. The new validator confirms 9,935 other topics unchanged, 39 source
rejections, actual note rendering and exact baseline replay. Geometry, prior
source holds and clinical approval remain unchanged. The main-workspace checkpoint
records final integration checks and recovery; publication and radiologist review
remain pending.

26 September 2026: [Website volume-link lifecycle](VOLUME_VIEWER.md) now
invalidates the optional CT/MRI comparison when its source Atlas detaches.
Pending loads abort; mounted pixels and retired controls clear immediately;
late outcomes cannot restore images, and revocation stays effective. Synthetic
CT/MRI regressions reproduce the original failure and pass after the fix, along
with linked-imaging, Didanix, independent-navigation and review checks. This is
integration groundwork, not an installed live volume viewer or desktop change.
Source geometry, teaching, approvals and current renderer bindings are unchanged.
Publication, browser/real-image acceptance and external recovery remain pending.

26 September 2026: [Search pagination focus](SEARCH_PAGINATION_FOCUS.md)
keeps direct and related results independently paged and focuses the first newly
revealed match, including the final page. Fourteen controlled component scenarios,
existing search/review/workspace regressions, TypeScript/lint and both module
builds pass. A pre-existing navigation-test mock was repaired after reproduction
on the saved baseline. Anatomy and teaching are unchanged; review bindings are
refreshed but unsigned. Browser acceptance, website publication and external
recovery remain pending. Didanix desktop is untouched.

26 September 2026: [Plantar arterial CT orientation](PLANTAR_ARTERIAL_CT.md)
adds five paired source-bound concepts to ten existing Foot/Whole body CT panels.
All 9,926 other topics, geometry and controls are retained; source identities,
panel rendering and unsigned review/export are checked. These remain drafts,
not vessel-patency or scan-correspondence claims. The main-workspace checkpoint
records final verification and recovery; website publication/clinical gates stay open.

26 September2026: [Integrated catalogue intake](CATALOG_INPUT_VALIDATION.md)
rejects malformed records before selection/link setup and prevents late timed-out
responses from committing. All raw/display anatomy is preserved;73 intake tests,
eight related suites, TypeScript/lint and regional build pass. No desktop changes.
Browser acceptance, website integration/publication and external recovery remain
pending. Main-workspace checkpoint is authoritative; older entries are historical.

26 September2026: [Limb-bone ultrasound](LIMB_BONE_ULTRASOUND.md) adds ten
source-bound draft placements through existing regional/whole-body notes;
patellar ultrasound, all other teaching and geometry remain unchanged. Focused
content/history/review checks, TypeScript and regional build pass. Publication,
browser acceptance, external recovery and radiologist sign-off remain pending.
The main coordination workspace's latest checkpoint is authoritative for saved
heads/deployment state; older milestone entries below are historical.

[Central-vessel historical verification](CENTRAL_VESSEL_HISTORY_REPAIR.md) now
separates the immutable source-era snapshot from live scoped transition checks.
The original baseline hash and 79 replacements are preserved; runtime teaching,
geometry and approvals are unchanged. Pulmonary-vein website integration is next.

[Pulmonary-vein ultrasound orientation](PULMONARY_VEIN_ULTRASOUND.md) fills four
pending topics with distinct right/left superior/inferior echo drafts, citing
official TTE/TEE references. Other 9,932 topics, all geometry and existing controls
are unchanged. Source/rendering/history checks cover the addition; radiologist
sign-off, generated website integration and hosted verification remain open.

[Study close-up captions and browser QA](STUDY_CLOSE_UP_CAPTIONS.md): the
whole-body popliteal study opens, renders and supports selection/Remove/Undo in
the local browser. A misleading Elbow caption is corrected to Knee by recipe
identity. Narrow-screen laterality works; full device/clinical acceptance and
website integration remain pending.

[Study activation feedback](SEARCH_ACTIVATION_FEEDBACK.md) keeps Search open
with an accessible notice when a source guard rejects a study. Mode and panels
remain unchanged; successful handoffs retain the existing uncluttered behavior.
Controlled component/focus checks pass. No anatomy or teaching changes;
fresh-browser popliteal/feedback QA and website integration remain outstanding.

[Popliteal artery–vein study](POPLITEAL_VESSEL_STUDY.md) combines existing vessels
and knee context in Leg and Whole body through one searchable focus. Exact-source
guards, side filtering, steady close-up bounds, real mesh label anchors and
Remove/Undo/Redo pass focused tests. Browser Search found the new study, but
fresh navigation was blocked after a development reload error; completed-build
desktop/mobile visual acceptance remains open. No model bytes, teaching topics,
entitlements or hosted publication change. Continue verification/integration and
the full regional roadmap; clinical and imaging gates remain open.

[Dorsal penile vascular source review](DORSAL_PENILE_SOURCE_REVIEW.md) retains
five exact original meshes for three missing candidate structures and a
three-view source projection. Complete definitions, current-catalogue overlap
and component/contact diagnostics are available for adjudication; no learner
geometry is admitted and clinical review remains pending. Website `fd6a9f1`
already integrates contextual Undo from Atlas `15029f9`; the older pending-
integration statements below are historical. Continue substantive regional
coverage while preserving the full goal and imaging/privacy/entitlement gates.

[Contextual Undo](CONTEXTUAL_DISSECTION_UNDO.md) restores a just-hidden/removed
structure directly from the existing regional/whole-body information panel.
History/side/practice guards and panel-only reveal pass focused tests and sampled
desktop/mobile-browser checks. Geometry and teaching are unchanged. Website
`03a0d89` remains published; this source improvement awaits generated integration.
Earlier source-only publication statements below are historical.

[Pes anserinus convergence](PES_ANSERINE_STUDY.md) adds right/left whole-body
relationship views using three existing muscles and the same-side tibia. Search,
selection, Remove/Undo and existing separation controls are reused. Source
memberships, geometry and all teaching topics are unchanged; no separately
segmented tendons or clinical approval are implied. Source-only pending website
integration; website `7bed5b9` remains the verified private publication.

[Intrinsic laryngeal muscle imaging](LARYNGEAL_MUSCLE_IMAGING.md) adds 14 CT/MRI
orientation drafts for seven exact retained sources, using existing panels.
Eight family/modality concepts distinguish expected anatomical locations from
routine visibility and cadaveric research. Other 9,922 topics, geometry and
recipes remain unchanged. Clinical sign-off and acquired-image registration
are not implied. Source-only pending generated website integration; website
`c9d149f` remains the verified private publication. Older entries are historical.

[Spine history verification](SPINE_IMAGING_TEACHING.md#historical-verification-repair--24-september-2026)
now passes while retaining original evidence and current teaching checks. Twelve
later lacrimal CT/MRI topics explained the old whole-snapshot mismatch; disc
Function content was not responsible. The repaired suite verifies 156 current
renders, 2,808 identity rejections and 141 original replacements across 25,422
checks. This is verification-only: no runtime, source geometry or approval changes.
Website `c9d149f` privately publishes Atlas `5efeed6`, including the 22 disc
Function drafts, with verified GitHub/D recovery. Older entries below are historical.

[Spinal-disc Function teaching](SPINAL_DISC_FUNCTION.md) adds source-bound drafts
for 22 retained discs, with distinct cervical, thoracic and lumbar explanations.
All other 9,914 topics and geometry/recipes are preserved. Focused tests verify
22 viewer-note renders and reject 374 altered identities. The unresolved source
level remains unadmitted; no patient-level registration or approval is implied.
This update is source-only pending generated website integration. The website
already publishes the earlier proper-digital notes from Atlas `bff0cbb` in
website `f7a0983`; older publication statements below are historical.

[Hand clinical-history verification](HAND_VESSEL_CLINICAL_CURRICULUM.md#historical-replay-correction--24-september-2026)
now distinguishes exact recorded Git snapshots from current scoped transitions.
Original hashes remain intact; all 84 historical hand sections are checked
directly, and negative tests require a passing unmodified control. No runtime,
geometry, teaching or approval was changed by this verification repair. The
proper-digital notes below still await generated website integration.
The hand suite passes 21,081 checks (57 negatives / 56 source components);
the broad content contract passes 33,445 checks. The proper-digital focused
suite and exact previous-source reconstruction also pass; clinical approval
and hosted availability are not inferred from these engineering checks.

[Proper digital artery teaching](PROPER_DIGITAL_TEACHING.md) replaces twenty
generic Anatomy/Function placements with named finger/border orientation and
arterial supply notes across the ten existing hand selections (six right, four
left). All other 9,916 topics, source geometry and recipes remain unchanged.
Clinical, pathology and imaging drafts are preserved; no missing artery is
invented. Revision-bound radiologist review remains pending.

Website `ae5cb2c` now privately publishes the shared viewer from Atlas `facf4a4`,
including the Search handoff correction below. All 136 protected model objects
and 143 paths are retained. The main task's Search handoff website checkpoint
records 185 website tests and verified GitHub/D recovery. This is publication,
not hosted-device or clinical acceptance; older integration-pending notes are historical.

[Renal segmental source review](RENAL_SEGMENTAL_SOURCE_REVIEW.md) audits five
additional source-labelled branches against 1,104 root and seven nested renal
selections. Two source-bound review figures expose unresolved parent continuity
and kidney-relative extents. All five remain outside the learner catalogue;
no connecting geometry, perfusion territory or clinical approval is invented.
Audit and figure replay pass. Runtime, teaching and website are unchanged.

[Search study handoff](SEARCH_STUDY_HANDOFF.md) now opens confirmed study windows
and focuses with the model unobstructed, instead of opening the tools drawer.
Search regains keyboard focus; explicit Dissect and direct structure selection
retain their tools/details actions. Focused checks and actual 1087×854 / 390×844
browser checks pass. No model, source teaching, licence or entitlement changes.
Website integration is pending; the full goal and clinical/device gates remain.

[Main-bronchus X-ray orientation](MAIN_BRONCHUS_XRAY.md) adds two exact-source,
unsigned draft topics for the right/left main bronchi. The other 9,934 topics,
all geometry and dissection recipes are unchanged. Local browser checks show
both notes in the existing Imaging → X-ray panel; no radiograph, registration,
diagnostic certification or entitlement is supplied. Website integration is a
separate step; the full goal and radiologist review remain open.

[Tibial recurrent source review](TIBIAL_RECURRENT_SOURCE_REVIEW.md) holds two
newly inspected official source definitions pending radiologist identity/extent
review. They are technically closed meshes but include broad anterior-knee
loops. Current export policy blocks both and source-sharing aliases; all 1,104
displayed definitions remain unchanged. Two source-bound review figures and an
exactly replayed audit preserve the evidence. This is not an anatomy admission
or website publication. The native MRI local import-QA role remains complete;
the full Atlas roadmap and clinical/device/imaging gates remain open.

[Male pelvic visceral subset](PELVIC_VISCERAL_STUDY.md) adds one compact Pelvis and Whole body focus using the four already supplied bladder, prostate, rectum and urethra surfaces. It preserves their source IDs/positions and existing controls, with no complete pelvic-floor, continuous-lumen, imaging-registration or clinical-approval claim. Focused source/dissection checks and a bounded desktop interaction pass; the separate older composite content-history digest remains open.

[Central airway source study](CENTRAL_AIRWAY_STUDY.md) changes the Thorax focus from a broad name pattern to three exact source-bound trachea and main-bronchus identities. Both-side and side-filtered focus behaviour, missing/changed/duplicate source rejection, and prior-recipe preservation are checked. The separate airway window, source geometry and clinical status are unchanged; this is not lumen, carinal/lobar-tree or patient registration evidence. Website publication is tracked separately.

[Lacrimal drainage CT/MRI orientation](LACRIMAL_DRAINAGE_IMAGING.md) adds 12 source-pinned draft placements for six existing paired canaliculus, sac and nasolacrimal-duct selections. Ultrasound and X-ray remain pending. The focused transition check preserves 9,924 other teaching slots and unchanged source geometry. No routine-scan lumen, patency, patient registration, clinical approval or imported image is claimed. Broader historical curriculum replay remains a separate failing baseline and is not waived.

[Main-bronchus external ultrasound limits](THORACOABDOMINAL_ORGAN_IMAGING.md) add two exact-source draft notes for the right and left main bronchi. Routine transthoracic pleural artefacts are not direct bronchial-lumen images; endobronchial/endoscopic ultrasound is outside this lesson. No scan, mesh, registration or clinical approval is added.

[Forearm superficial-vein MRI orientation](FOREARM_VENOUS_IMAGING.md) adds four draft topics for the bilateral cephalic and basilic veins. The other 9,932 topics, original geometry and dissection recipes are unchanged; CT remains pending. MR-venography evidence is not extrapolated to routine MRI, patient mapping, access planning or a registered scan. Revision-bound radiologist review and website/host integration remain separate.

[Laryngeal CT/MRI orientation](LARYNGEAL_IMAGING.md) fills six draft topics for the existing epiglottis, thyroid cartilage and cricoid cartilage. All other 9,930 topics, source geometry and dissection recipes remain unchanged. Existing hyoid notes are preserved; small ligament imaging stays pending. No acquired scans, registration, protocol or clinical approval is added; website integration is separately tracked.

[Celiac-artery display correction](CELIAC_DISPLAY_CORRECTION.md) removes one proven duplicate render copy (476 to 238 triangles), preserving exact shape/normals/bounds, both source records, all 1,104 selection identities and all 9,936 teaching topics. A new asset revision is used; the raw catalogue and original model remain intact. Old source-bound links do not silently transfer, and clinical review remains pending.

[Lower-neck study](LOWER_NECK_STUDY.md) combines fourteen existing vessel/scalene targets with four muscle context surfaces in Head & neck and Whole body. Both sides, focused practice, removal/undo and source-bound links reuse existing controls. Whole surfaces remain unchanged; no sheath, nerve plexus, procedural corridor, scan registration or clinical approval is supplied.

[Hand intrinsic-muscle studies](HAND_INTRINSIC_STUDIES.md) adds two hand-only comparisons using fourteen existing muscle selections and ten metacarpal context selections. Existing compact Study controls, side filters, removal/undo and focused identification are reused; grouped muscles remain grouped, with no new anatomy, scan, procedure or clinical approval.

[Shoulder arterial MRI](SHOULDER_ARTERIAL_MRI.md) adds six source-bound drafts across paired posterior circumflex humeral, circumflex scapular and suprascapular arteries. Small-study findings are explicitly limited; other9,930 topics, geometry and recipes are unchanged. No acquired scans, diagnostic protocol, registration or clinical approval is added.

[Distal palmar MRI](DISTAL_PALMAR_MRI.md) adds six source-bound drafts for paired palmar-metacarpal, princeps-pollicis and radialis-indicis selections. Three short modality texts distinguish specialised MRA from routine MRI. Grouped source components, all other9,930 topics and recipes remain unchanged; no acquired images, registration or clinical approval are added.

[Lesser-toe X-ray orientation](LESSER_TOE_XRAY.md) adds24 source-bound drafts for existing proximal, middle and distal phalanges of digits2–5. Three modality texts retain digit-specific landmarks; existing CT/MRI drafts, all other9,912 topics, source geometry and recipes are unchanged. Grouped sesamoids remain held. No scans, fracture simulation, new controls or clinical approval are supplied.

[Metatarsal X-ray and ultrasound](METATARSAL_SURFACE_IMAGING.md) adds twenty source-bound draft placements across ten existing first–fifth metatarsals, using six original modality texts and established digit-specific landmarks. All other 9,916 topics, geometry and dissection recipes remain unchanged. Grouped foot sesamoids retain their identity hold. Existing compact panels are reused; no scans, publisher media, registration or clinical approval are supplied.

[Anterior cardiac vein](ANTERIOR_CARDIAC_VEIN.md) adds one source-defined group from two original files (730 retained triangles), with a compact cardiac-venous Study and draft Anatomy/Function/self-check. All previous 1,103 root records, bundles, recipes and 9,927 topics are preserved. Apparent vessel/heart contact is not a validated junction or drainage pathway; other teaching, clinical approval and website model staging remain pending.

[Anterior elbow studies](CUBITAL_STUDIES.md) bring 32 existing arm/forearm selections together in two focused whole-body views: muscles/arteries and superficial veins. Source-derived elbow close-ups, side filters, removal, extraction and Undo reuse existing controls. Whole surfaces remain unchanged; nerves, fascia, bicipital aponeurosis and verified vessel junctions are not supplied. No procedure, patient registration or clinical approval is implied.

[Regional branch imaging](REGIONAL_BRANCH_IMAGING.md) adds eight CT/MRI/Ultrasound draft placements across four existing descending lateral circumflex femoral and subscapular arteries. Specialised angiography and selected perforator evidence are distinguished from ordinary scans and reference geometry. Existing panels and all other content remain; no new model, image, procedure or clinical approval.

[Genicular imaging](GENICULAR_IMAGING.md) adds eighteen CT/MRI/Ultrasound draft placements across ten existing arterial selections. CBCT is distinguished from routine CT; MRI guidance is limited to the inferior medial pair and ultrasound observations to three branch pairs. Unsupported sections remain pending. Existing panels, geometry and recipes are unchanged; no images, procedures or clinical approval are supplied.

[Iliotibial and long-plantar imaging](TRACT_PLANTAR_IMAGING.md) adds six MRI/Ultrasound draft placements across four existing selections. Local scan coverage and fine attachment anatomy remain distinct from broad donor surfaces. Long-plantar Ultrasound, CT and X-ray remain pending. Existing tabs, other teaching, geometry and dissection recipes are unchanged; no scans or clinical approval are supplied.

[Iliac arterial imaging](ILIAC_ARTERIAL_IMAGING.md) adds sixteen CT/MRI/Ultrasound draft placements across six existing common, external and internal iliac selections. Eight modality texts and three anatomical orientation notes reuse the current inspector. Internal-iliac Ultrasound and X-ray remain pending; other teaching, geometry and dissection recipes are unchanged. No scans, patient registration, access grant or clinical approval is supplied.

[Regional and whole-body Education connection](BODY_EDUCATION_CONNECTION.md) exposes the existing imaging bridge to a trusted same-origin Didanix Education host, using current source identities and existing learner controls. Region, side, Practice and separate dissection changes pause linking and cancel pending reveals. Synthetic CT/MRI/X-ray/Ultrasound tests do not connect a real case, grant access or establish registration. Cleared media, independent server entitlements and clinical acceptance remain required.

[Forearm framing](FOREARM_FRAMING.md) fits complete regional tissue and shorter vessel sources without changing meshes or adding controls. Long vessels and upper-arm context remain loaded; selecting them restores full-source framing. Existing elbow study views retain priority. Physical-device and clinical acceptance remain separate.

[Forearm arterial imaging](FOREARM_ARTERIAL_IMAGING.md) adds 16 evidence-backed draft placements to six radial/ulnar/anterior-interosseous selections. Eight modality texts distinguish acquired calibre and flow from source geometry. Anterior-interosseous MRI, common/recurrent branch imaging and X-ray remain pending; 9,911 other topics/recipes are unchanged. No new model, control, imaging asset or clinical approval.

[Iliac-vein imaging](ILIAC_VENOUS_IMAGING.md) adds 18 CT/MRI/Ultrasound draft placements across six exact common/external/internal iliac selections. Nine modality texts retain source grouping and distinguish acquired findings from anatomy, with explicit study-population limits. No geometry, controls, imaging assets or clinical approvals are added; 9,909 other topics and all recipes remain unchanged.

[Lower-limb venous imaging](LOWER_VENOUS_IMAGING.md) fills 42 CT/MRI/ultrasound draft placements across 14 exact existing selections. Twelve modality texts and seven landmark/source-limit pairs distinguish deep/superficial routes and acquired imaging from geometry. No new controls, scans, source surfaces or clinical approvals; 9,885 other topics and all recipes remain unchanged.

[Bowel component navigation](BOWEL_COMPONENTS.md) makes the existing small-/large-bowel aggregates, rectum and ileocecal junction easier to study together. The selected Dissect panel has a collapsed source-bound control with regional availability, whole-body continuation and reversible isolation. Four existing selections account for the complete source-file partitions; no new tissue, duplicated surface, lumen or clinical approval is implied.

[Colonic source review](COLONIC_SOURCE_REVIEW.md) separates six existing source surfaces in a local diagnostic only, retaining all 56,878 rendered triangles and normals. Descending/sigmoid extent and fragmented taenia surfaces require review before anatomical subdivision; the compact bowel scope note states this limitation. The prototype adds no released anatomy, delivered model or clinical approval.

[Descending lateral circumflex femoral branches](CIRCUMFLEX_FEMORAL.md) add 2 original source selections and 10464 retained triangles. Both lateral circumflex parents already exist inside deep-femoral aggregates and are not duplicated. Existing arterial navigation distinguishes routes through grouped parents from direct branches or absent segments; all 1080 prior source records remain unchanged. Draft teaching is not clinical approval, continuous-lumen proof or patient registration.

[Subscapular arteries](SUBSCAPULAR_ARTERIES.md) add 2 original source selections and 1576 retained triangles. Existing arterial navigation now links each to its same-side axillary parent and circumflex scapular/thoracodorsal branches, with reversible context isolation. No guessed connecting geometry, complete collateral circuit, patient registration or clinical approval.

[Compact vessel controls](VESSEL_VISIBILITY.md) separate the existing 198 artery selections and 99 vein selections behind the Vessels label. Region/side-scoped show/hide, mixed visibility and shared Undo/Redo reuse the current dissection; other tissues, camera, classification and geometry stay unchanged. No new default panel or patient-imaging event. Browser/device and clinical acceptance remain separate.

[Abdominal-organ imaging](ABDOMINAL_ORGAN_IMAGING.md) adds CT/MRI/Ultrasound/X-ray orientation to eight existing liver/pancreas/gallbladder/spleen/kidney/adrenal selections: 32 draft placements with 20 distinct modality texts and six landmark/scope groups. Phase, sequence and ultrasound-coverage limitations are explicit. The corrected pancreatic parent, independent kidney specimen, internal dissections and patient scans retain separate identities; no new geometry or clinical approval is inferred.

[Thoracic-bone imaging](THORACIC_BONE_IMAGING.md) fills CT, MRI, X-ray and Ultrasound notes for 24 existing sided ribs and three sternal parts: 108 draft placements, using eight shared modality texts and eight landmark groups. No new anatomy, controls, scan data or clinical approval is implied. Earlier teaching and geometry are preserved; the owner radiologist must review the content and variants.

[Limb-bone imaging](LIMB_BONE_IMAGING.md) fills 24 pending sections across 12 exact radius/ulna/fibula/femur/tibia/patella selections: 12 X-ray, 6 CT and 6 MRI placements, using 12 distinct topic texts and six landmark notes. Existing knee CT/MRI/US lessons, geometry and controls remain unchanged. The existing Imaging tabs distinguish the whole source bone from the imaged joint; these are original referenced drafts, not scans, validated landmark segmentations or clinical approval.

[Independent specimen reviews](SPECIMEN_REVIEWS.md) cover nine source/region scopes (354 scoped records / 267 distinct source IDs): HRA kidneys/female pelvis, version-3 abdominal wall/back layers and five overlapping UM lower-limb regions. [Exact study links](INDEPENDENT_STUDY_LINKS.md) open the selected structure and study, and return to its review worksheet. Source/frame/geometry/teaching/checklist revisions are bound to private append-only records; no approval transfers between scopes. Anatomy and teaching are separate; acquired-imaging approval remains unavailable. [Nested review](NESTED_REVIEWS.md) now has its own isolated parent/study/child records and source-bound return links; source implementation is not hosted migration acceptance. This inventory reads no personal review records and asserts no clinical/device sign-off or hosted rollout.

[Lower-limb arterial imaging](LOWER_ARTERIAL_IMAGING.md) supplies 12 existing artery selections with CT/MRI/US drafts (36 placements / 9 regional-modality texts). Six concept-specific cautions and the existing inspector keep navigation compact. Missing fibular/trunk selections, complete runoff, scans, registration and radiologist/device approval remain outstanding.

[Deep-brain septal landmarks](LIMBIC_LANDMARKS.md) adds 4 complete source selections / 8042 retained triangles and one compact study with 7 context records. Lamina point-contact, septal compound and stria laterality limits are explicit; the defective stria-terminalis source remains offline. Eleven introductory draft placements do not constitute comprehensive teaching, complete circuits, clinical/device acceptance or patient registration.

[Separate back layers](BACK_LAYERS_SPECIMEN.md) adds 14 source muscle surfaces with 34 same-source bones and 8 reversible studies. All 333182 original triangles remain in a separate version-3 frame; source fragments are disclosed. [Detailed teaching](BACK_LAYERS_TEACHING.md) supplies attachments/motor notes for 14 selections and 191 extended draft placements using 34 topic texts and 17 clinical self-checks. Existing collapsed controls are reused; unsupported topics remain pending. No complete back stack, fascia, discs, nerve path, scan registration or clinical approval is supplied. Separate CC BY-SA 2.1 Japan asset terms remain; main-body counts are unchanged.

[Pelvic venous tributaries](PELVIC_VEINS.md) retains 10 original vein selections and 65026 original triangles, with 7 context selections in one compact Study. [Source-bound teaching](PELVIC_VEIN_TEACHING.md) now provides Function for 10, Clinical/Pathology for 10, CT for 9 and MRI/Ultrasound for 5 selections. The extension reuses 18 topic texts; unsupported topics remain pending. Two left-labelled definitions remain offline. No complete network, joined lumen, scan connection or clinical/device acceptance is claimed.

[Inferior epigastric vessels](INFERIOR_EPIGASTRIC_VESSELS.md) adds 4 original arterial/venous selections and 28968 retained triangles. One focused abdominal-wall Study pairs them with 6 existing vascular references, without adding a permanent toolbar. Anatomy, Function, inguinal-orientation and self-check are drafts. Fascia, rings, complete perforators, joined lumens, acquired scans and clinical/device acceptance remain absent or pending.

[Male pelvis: deferent ducts](DEFERENT_DUCTS.md) adds 2 original selections and 2054 retained source triangles. The existing Study menu combines them with 8 nearby organ selections, side filtering and reversible removal. Search accepts vas/ductus deferens. Anatomy, Function and self-check are drafts; clinical/imaging teaching and device acceptance remain pending. No generated junction, continuous lumen or patient correspondence is claimed.

[Original-resolution batching](BODY_BATCHING.md) groups 560 compatible opaque surfaces into 30 batches in the all-visible whole-body CPU model. Original geometry, anatomical identities and existing controls are retained; selected/transparent/cut/muscle surfaces and small views keep individual rendering. Unsupported devices fall back. This is not measured GPU performance, browser visual acceptance or clinical sign-off.

[Inferior thyroid arteries](INFERIOR_THYROID_ARTERIES.md) add 2 original neck selections (962 retained triangles), same-side thyrocervical navigation and 8 existing context bones. Four muscle-part candidates remain offline source-condition evidence, not admitted geometry. No complete gland/nerve anatomy, joined lumen, clinical approval or patient registration is claimed.

[Genicular knee study](GENICULAR_ARTERIES.md#focused-knee-study) groups 22 original selections into one compact posterior view in Knee & leg and Whole body. Source-bound transitions, stable close-up framing and reversible removal reuse existing controls. Ten genicular source groups retain all 21686 original triangles; disconnected middle-genicular pieces are not bridged. Clinical/device review and imaging registration remain outstanding.

[Inferior collicular brachia](COLLICULAR_BRACHIA.md) adds 2 original neural surfaces (568 retained triangles) within brainstem dissection, with pair/midbrain views and source-bound auditory teaching. The 2 superior candidates remain withheld for contradictory source laterality. Existing brainstem meshes are unchanged; no complete auditory pathway, fibre reconstruction, clinical approval or patient scan is supplied.

[Longus colli](LONGUS_COLLI.md) adds 3 source-preserving left muscle parts (7162 triangles) and a focused study in Head & neck, Spine and Whole body. Use Both or Left; the right side is unavailable. Select parts, remove covering context and Undo without adding a permanent toolbar. Attachment geometry, fascial planes, clinical accuracy and imaging registration remain unvalidated.

[Hepatic veins](HEPATIC_VEINS.md) add 3 genuine source groups with 13984 retained triangles from 10 files. The middle hepatic vein and right/left tributary groups reuse selection, labels, dissection and the compact venous panel. All 13 disconnected components remain in their original positions; no bridging, complete tree, Couinaud territory, flow or patient registration is claimed.

[Portal tributaries](PORTAL_VEINS.md) add 5 genuine source meshes (3892 retained triangles): splenic and paired gastric/gastroepiploic veins. The existing selected-vein panel now connects 11 portal selections through 10 typical relationships, with reversible isolation and no new toolbar. Variable mesenteric outlets and missing sinusoidal/collateral networks remain explicit. No flow, scan registration or clinical approval is supplied.

[Limb vascular dissection](LIMB_VASCULAR_STUDIES.md) adds 3 focused Study choices using 42 existing vessel, muscle and bone selections. Compare anterior/posterior calf and deep femoral relationships; hide a context muscle, extract a selected vessel and Undo. No permanent controls, new geometry, complete neurovascular bundle, surgical approach or imaging registration are supplied.

[Arm vascular dissection](ARM_VASCULAR_STUDIES.md) adds 2 compact Study choices across Shoulder & arm and Whole body, using 22 existing source selections. Compare brachial vessels with anterior flexors, or the deep brachial artery with triceps. Side filtering, muscle removal, extraction and Undo reuse existing controls. No new mesh, nerve path, fascial plane, complete paired veins, patient registration or clinical approval is supplied.

[Upper-limb vessel imaging](UPPER_VESSEL_IMAGING.md) adds source-bound introductory drafts for 14 existing selections: CT 10, MRI 10, US 14. These reuse 10 topic texts across 4 groups with seven selection-specific cautions. Existing Imaging tabs are reused; superficial-vein CT/MRI and X-ray remain pending. No scan, flow, procedural clearance or clinical approval is supplied.

[Systemic venous drainage](SYSTEMIC_VENOUS_DRAINAGE.md) connects 51 existing source selections through 57 typical relationships (28 groups). One collapsed selected-vein panel offers tributary/outlet navigation, cross-region links and reversible isolation with bones. Missing routes, variable small-saphenous outlets and unsegmented common-femoral regions remain explicit. Intracranial sinuses, portal/pulmonary/cardiac drainage and measured flow are not provided by this map.

[Focused elbow dissection](ELBOW_STUDIES.md) adds five Forearm studies using eight existing bone/muscle selections. Stable source-derived close-ups, real-surface labels and reversible windows reuse the existing Study controls. Whole structures remain intact; no new nerve, ligament, cartilage, simulated motion or scan correspondence is supplied.

[Wrist-bone imaging orientation](WRIST_IMAGING_TEACHING.md) adds 48 X-ray/CT/MRI drafts across sixteen existing carpal selections: five groups / fifteen distinct modality topics, with eight bone-specific cautions. The existing Imaging tabs are reused. No new surface, radiograph, CT voxel, MR signal, patient registration or clinical approval is supplied; ultrasound remains unchanged.

[Arterial connections](ARTERIAL_CONNECTIONS.md) offers upstream/downstream and communicating-neighbour exploration for 157 existing source selections through 175 mapped relationships (93 concepts; 5 alternative routes, not simultaneous donor connections). A selected-artery panel stays collapsed; regional isolation is reversible and outside neighbours use source-bound whole-body links. Missing segments remain explicit; no vessel lumen, flow or patient registration is invented.

[Lower-limb muscles by nerve](LOWER_LIMB_MOTOR.md) links 118 existing root-body selections through 120 typical relationships in 15 groups. Pelvis/hip, thigh, leg and foot reuse the same collapsed control as the upper limb. Source/frame checks and dissection history are retained; no nerve path or patient correspondence is invented. The independent lower-limb specimen remains separate.

[Private body reviews](BODY_REVIEW_DECISIONS.md) now record scoped decisions for root-body selections in a separate append-only store from the shoulder pilot. These records are not inspected by this inventory or propagated as clinical approval. Imaging approval remains unavailable without validated acquired resources.

[Upper-limb muscles by nerve](UPPER_LIMB_MOTOR.md) links 102 exact existing muscle selections through 112 typical relationships across 17 nerve/branch groups. In Shoulder & arm, Forearm or Hand, choose Dissect → Muscles by nerve to show the group's available muscles with bone context. The control stays collapsed; left/right filters, selection and existing dissection history remain usable. Mixed supply and grouped surfaces are qualified. No nerve route, sensory field, lesion simulation, scan registration or clinical approval is added.

[Spinal imaging orientation](SPINE_IMAGING_TEACHING.md) adds 141 CT/MRI/X-ray topic drafts across 47 exact existing bone/disc source records: nine concept groups and 27 distinct modality topics, not 141 unique concepts. The existing compact Imaging panel and six focused level studies are retained. Other body teaching and geometry are unchanged; whole discs, unresolved T12–L1 geometry and absent neural tissues remain explicit. No patient scans, registration, paid-resource access or clinical approval are supplied.

[Separate kidneys](HRA_KIDNEY_SPECIMEN.md): 82 original HRA surfaces / 189794 retained triangles and 9 guided studies. 82 draft Anatomy/Function selections share 12 concepts; 13 non-lettered selections are eligible for identification. [Renal clinical/imaging detail](HRA_RENAL_TEACHING.md) adds 44 topic texts across 398 placements, with 12 self-checks across 82 selections. Unsupported topics remain pending. Three defective surfaces remain held; drainage correspondence, patient registration and clinical/device sign-off are not supplied. Main-body counts are unchanged.

[Separate female pelvis](HRA_FEMALE_PELVIS.md): 43 original HRA surfaces, 11 dissection studies and 43 draft Anatomy/Function selections. The other 0 selections remain unavailable for teaching; six disputed/overlapping source groups are withheld. This independent CC BY 4.0 reference is not a complete female body or patient registration. Clinical/device sign-off is pending; main-body counts are unchanged.

[Pelvic teaching detail](HRA_FEMALE_PELVIS.md#structure-specific-teaching) now distinguishes 29 anatomical concepts and adds 190 extended draft placements / 43 source-bound self-check placements. Clinical 43, Pathology 43, MRI 43, US 41 and CT 14 remain introductory drafts, not unique lessons per placement, acquired imaging or approval. Existing compact tabs are reused; other topics explicitly remain pending.

[Abdominal-wall teaching](ABDOMINAL_WALL_SPECIMEN.md#detailed-teaching) supplies 8 exact-source Anatomy/Function lessons, 8 attachment/motor records, 48 introductory clinical/pathology/imaging topics and 8 self-checks. Three groups in the existing collapsed Learn panel keep the model prominent. Imaging notes explain recognition and limitations, not real scans or registration; source changes fail closed. Specialist validation remains pending.

[Abdominal identification practice](ABDOMINAL_WALL_SPECIMEN.md#identification-practice) covers 8 source muscles across 7 studies. Visible muscles alone enter rounds; bones stay contextual, labels/guides are hidden, and first-try/reveal/retry-missed scoring preserves the dissection history. Exact source/frame checks reject mismatches. This is source-label practice, not a clinical examination or approval.

[Separate abdominal-wall specimen](ABDOMINAL_WALL_SPECIMEN.md): 8 version-3 muscle surfaces and 21 partial skeletal context selections. Seven reversible studies expose the internal obliques, transversus and rectus pairs missing from the current body geometry. This is a separate source frame under CC BY-SA 2.1 JP, with downloadable assets and reuse notices; not a registration into version 4 or a complete surgical wall. No source face is removed. Clinical, device and source-interface review remain pending.

[Lossless production model delivery](MODEL_DELIVERY.md) retains canonical source hashes and anatomical detail while reducing transport file size. Each production build checks decoded buffers and installed-loader scene equality for every model. Catalogue hashes/byte counts remain canonical, with separate transport hashes in the generated delivery manifest. This is not new anatomy, browser-performance or clinical certification.

[Muscles by nerve](UM_LIMB_MOTOR.md) links 42 source muscle selections through 43 typical motor relationships across 15 nerve/branch groups. One collapsed control shows available targets with bone context and reversible visibility. Dual/variable supply is qualified; no nerve geometry or donor-specific innervation is supplied. [Peripheral-source candidates](PERIPHERAL_NERVE_CANDIDATES.md) remain unimported pending actual files, rights and spatial review.

[Independent lower-limb specimen](UM_LIMB_DISSECTION.md): 67 unique selectable CC0 source surfaces across 26 studies. Hip/thigh, calf, ankle/foot and an optional whole-limb view extend the unchanged 15-part knee study. Open from Pelvis & hip, Hip & thigh, Knee & leg or Ankle & foot. [Learning](UM_LIMB_LEARNING.md) includes 67 source-bound anatomy/function drafts, 42 muscle attachment/motor-supply records and visible-pool identification practice. Regional scopes overlap within one source subject; they are not added to the body below. Registration, clinical approval and further clinical/pathology/imaging teaching remain pending.

[Knee dissection studies](KNEE_STUDIES.md) add three compact views with automatic joint close-ups: bony relationships, patella set aside and posterior popliteus. Ten existing source representations remain whole; cartilage, ligaments and menisci are not added.

[Direct specimen links](UM_LIMB_NAVIGATION.md) open exact selections and studies across 5 scopes at available teaching topics. The dedicated page skips the other body model; mismatched sources/recipes and pending topics stop with a warning. Links grant neither separately paid-resource access nor scan registration.

[Independent clinical/imaging teaching](UM_LIMB_CLINICAL.md) adds 228 introductory topic drafts and 65 clinical self-checks across hip/thigh, knee, calf and foot selections. Three compact groups reuse the Learn panel; pending topics remain explicit. These are source-bound educational drafts, not pathological meshes, patient images or clinical approval. The root-body counts below do not include them.

[Development priority](DEVELOPMENT_PRIORITIES.md) is the wider atlas and body regions; detailed oral work is deferred. Six [spinal-level studies](SPINAL_LEVEL_STUDIES.md) expose existing bone/disc groups with compact controls. T12–L1 is explicitly bones-only because its source disc is unresolved.

[Live camera direction](LIVE_CAMERA_ORIENTATION.md) now follows actual rotation in regional, whole-body and nested viewers. A reserved read-only line distinguishes model-left/right from screen position, without covering labels or expanding the page. It hides in exam/recovery states and does not imply patient-scan orientation. Anatomy counts and the dedicated shoulder renderer are unchanged.

[Wrist and foot bone exposure studies](ACRAL_BONE_STUDIES.md) add four compact Study choices using 30 existing bone representations, with no new geometry. Side filters, selection/removal and Undo/Redo reuse the established dissection controls. These are unvalidated source-bone arrangements, not cartilage, ligament or radiographic joint models.

Generated from the actual catalogue, teaching resolver, dissection profiles and question definitions. Run `npm run requirements:audit`; `npm run requirements:audit -- --check` checks this page and [the JSON inventory](requirement-audit.json) together. Historical milestone totals elsewhere are not current coverage.

## Delivered source scope

[X-ray orientation](XRAY_TEACHING.md) is available in the existing Imaging group: 389 source-pinned body drafts now include six shoulder-bone sources plus 47 spinal sources. The 3 overlapping dedicated-shoulder drafts cover three shoulder-bone concepts separately. Other entries remain pending, including all 104 nested selections. No radiographs, calibrated projections or paid-lecture access are supplied. Old display/teaching approvals require re-review; earlier topics are preserved through exact authoring transitions.

The [cricothyroid dissection](CRICOTHYROID_DISSECTION.md) adds 4 source-defined muscle parts with 2 optional, nonselectable cartilage landmarks. It reuses the compact selection, cutaway, separation, labels and Undo/Redo controls. The source-preserving derivative explicitly omits 12 audited artifact faces; this is disclosed, not clinical approval. Introductory teaching is draft and CT/MRI/US remain pending for these parts. Cartilage is a navigation landmark, not the muscle's tissue parent.

The [biliary and gallbladder relationship view](HEPATIC_BILIARY_RELATIONSHIPS.md) adds 1 liver study preset using 3 existing gallbladder/duct landmarks alongside faint liver tissue. Both internal biliary groups remain selectable; landmarks are nonselectable and disappear during separation. Source labels and geometry are unchanged; no common-bile-duct completion, junction validation, scan or surgical model is inferred.

[Component imaging shortcuts](COMPONENT_IMAGING_NAVIGATION.md) connect supported parent organs to existing child CT/MRI/US drafts through a collapsed, source-labelled picker. Opening selects the exact part and its imaging topic in the existing dissection. Pending lessons are omitted; root teaching coverage, scan/lecture entitlements and source geometry remain unchanged. This is local teaching navigation, not patient synchronization or additional clinical coverage.

The [pancreatic duct study](PANCREATIC_DISSECTION.md) separates 2 source components with 1 optional envelope, preserving all 12,690 retained triangles from 3 files. The existing compact controls provide presets, cutaway, separation and draft teaching. It does not infer an accessory duct, validated lumen or scan correspondence. The [root display correction](PANCREATIC_SOURCE_REVIEW.md) and original archives remain intact; old four-source imaging/lecture bindings are not silently mapped to the three-source display. Clinical/device acceptance remains outstanding.

The [optic chiasm and tract study](VISUAL_PATHWAY_DISSECTION.md) adds 3 selectable neural surfaces from 4 source files inside Dissect brain. It opens from below with landmarks off. Across its views, 5 existing landmarks are available: four posterior landmarks or the pituitary in the [chiasm–pituitary relationship view](VISUAL_PATHWAY_RELATIONSHIPS.md). Shared dissection controls and MRI teaching stay compact. Source seams and relationships still need anatomical review; no complete fibre pathway or patient correspondence is supplied. The original nonpublic prototype remains retained separately.

- 1104 body representations, 109 body GLBs, 11 regions plus whole body.
- Dedicated shoulder: 9 representations / 11 source parts, overlapping the body catalogue.
- Pancreatic dissection: 2 selectable duct components and 1 optional reference surface. These subdivide the corrected pancreas, not new unique anatomy.
- Nested dissections: 15 eye components, 4 ventricular spaces, 4 brainstem/cerebellar compounds, 14 cerebral selections, 4 cardiac cavities, 5 partial lung branch groups, 7 liver branch groups, 7 renal/adrenal vascular groups and 3 chiasm/tract surfaces. Four superior temporal source parts, seven renal/adrenal groups and three chiasm/tract surfaces add coverage; other nested studies subdivide existing parents. Context reuses existing structures. These are partial source surfaces, not complete organ interiors or clinical approvals. Brief drafts are separate from the root-body inventory below. 137 public/archive GLBs are retained, including original and alternate display assets. The original catalogue counts remain unchanged.
- 159 dissection stages and 182 focuses. These operate on supplied surfaces; they do not establish complete anatomy.
- Internal studies have optional selected-part original-position guides inside their collapsed separation controls. Guides use the source surface and the exact display displacement; flat plates, cutaways, hidden/context parts and exam mode suppress them. They are display annotations, not anatomical connections. See [scope and checks](ORIGIN_GUIDES.md).
- Find/name identification practice; 126 draft reasoning concepts bound to 238 representations in head-neck, foot, thigh, leg, pelvis, spine, thorax, abdomen, shoulder-arm, hand, forearm. Each concept occurs at most once per session, without contralateral repetition. See [practice scope and tests](REASONING_PRACTICE.md).
- [Learning-resource contract](LEARNING_RESOURCE_CONTRACT.md): version 1, ct/mri/xray/ultrasound/lecture/quiz anchors; 0 configured resources / 0 correspondences. Read-only linking infrastructure, not a connected external viewer or publication approval.

## Body teaching readiness

Counts are representations with displayed copy, not unique lessons, complete topic coverage or clinical approvals. Shared source-group copy is counted per representation. The dedicated shoulder retains draft text in its original eight topics; X-ray adds 3 draft and 6 pending entries. Do not add overlapping representations to claim more unique anatomy.

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
| Anatomy | 1102 | 2 | 0 | 0 |
| Function | 1099 | 0 | 5 | 0 |
| CT | 837 | 0 | 267 | 0 |
| MRI | 824 | 0 | 280 | 0 |
| X-ray | 389 | 0 | 715 | 0 |
| Ultrasound | 571 | 0 | 533 | 0 |
| Pathology | 1092 | 0 | 12 | 0 |
| Clinical | 1097 | 0 | 7 | 0 |
| Quiz notes | 72 | 0 | 1 | 1031 |

Quiz-tab notes are separate from interactive practice. [X-ray orientation](XRAY_TEACHING.md) includes the shoulder and spine plus wrist, tarsal and [limb-bone notes](LIMB_BONE_IMAGING.md). The table above is the current count; historical milestone totals elsewhere are not cumulative current coverage. Remaining entries stay pending. Imaging text is not an acquired-image viewer, segmentation or validated spatial correspondence.

The opt-in [nested learning registry](NESTED_LEARNING_LINKS.md) exposes 104 exact child destinations within 1217 scope-specific representations. It supports document versions 1 and 2, while the configured production document stays version 1 with no resources. Nested parent/child source and bundle bindings can resolve into the existing dissection routes; this is not a live viewer connection or entitlement.

The ventricular study also has 3 [guided relationship presets](VENTRICULAR_RELATIONSHIPS.md), using existing source spaces and context without adding unique anatomy or another panel. Context disappears during separation; pointer handlers do not block selectable structures beneath it. Device acceptance remains pending.

The [cardiac vessel guides](CARDIAC_VESSEL_RELATIONSHIPS.md) add 4 chamber–vessel comparisons using 8 existing source landmarks. Only the chosen view's vessel surfaces are displayed; one shared source bundle loads on demand. No new mesh files or selectable identities are added. Context is not a connected flow model, validated ostium or valve; clinical/device review remains pending.

The [lung branch study](PULMONARY_DISSECTION.md) separates 5 source-defined groups across two lungs. All 280 source files already belonged to the parent lung compounds; none is a separately delineated lobe tissue envelope or fissure. The missing parenchymal surfaces remain a documented gap, not a completed lobe dissection.

## Nested anatomy teaching

The [pancreatic and biliary imaging extension](DUCT_IMAGING_TEACHING.md) supplies three pancreatic CT/MRI/US drafts and one biliary CT draft across four existing source selections. Existing core teaching, quizzes, models, source pins and compact disclosures are unchanged. These are referenced orientation notes, not scans, validated duct communications or automatic access to an imaging atlas or paid lecture.

The [renal venous relationships](RENAL_VENOUS_RELATIONSHIPS.md) add 4 side-specific views through the existing Study view menu, reusing supplied renal/adrenal veins and landmarks. The left adrenal view keeps both veins selectable. Choosing a view is one Undo step; context disappears during separation. No new geometry, connected lumen, flow, clinical approval or resource entitlement is inferred.

The [internal-brain imaging extension](BRAIN_IMAGING_TEACHING.md) adds 14 original CT/MRI drafts across seven existing concepts/eight selections: ventricular spaces, midbrain, pons, medulla and cerebellum. Five primary references cover ventricular assessment and fluid-flow artefacts, posterior-fossa CT limitations and sequence-dependent brainstem MRI detail. Existing identities, core teaching, geometry and access gates are unchanged. Ultrasound and actual scan correspondence remain separate work; clinical/editorial review is pending.

Internal dissection includes [Undo/Redo layers](NESTED_HISTORY.md) across all ten study families. This bounded layer/selection history reuses the compact action row and does not rewind camera, cutaway or separation settings. Device acceptance remains pending.

The [renal vascular study](RENAL_VASCULAR_STUDY.md) adds 7 source-labelled vascular groups across 2 kidney views, from 10 source files. Optional same-side tissue/vessel context is shown initially and disappears during separation. Renal veins, adrenal vessels and ureteric arterial branches are not a complete circulation or internal kidney tissue. The defective left inferior suprarenal artery remains excluded. [Fourteen shared teaching drafts](RENAL_TEACHING.md) now cover Pathology/CT/MRI, plus ultrasound for ureteric arterial and renal venous groups. Adrenal-vessel ultrasound remains pending; side-specific reference examples do not validate contralateral imaging or any source mesh.

The [pulmonary teaching extension](PULMONARY_TEACHING.md) supplies Clinical/Pathology/CT drafts plus six MRI/ultrasound topic texts across five partial branch groups in the existing collapsed panel. The added ten placements distinguish MR signal/respiratory limitations from ultrasound artefacts and accessible pleural disease; they do not imply deep branch visibility. No tissue, fissure, disease geometry or scan correspondence is inferred.

The [cerebral teaching extension](CEREBRAL_TEACHING.md) supplies five shared Pathology/CT/MRI drafts across the bilateral insula and anterior superior-temporal fragments. Disease examples explain imaging and regional context, not lesion territories, diagnostic measurements or functional localisation. Specialist review remains required.

The [liver internal-branch study](HEPATIC_DISSECTION.md) exposes 7 source groups from 57 existing liver files. Arteries, portal veins, bile ducts and a partial venous tributary have distinct colours and presets. Optional tissue context is nonselectable. Unresolved source VI/VII near-overlap and VIII grouping prevent individual segment labels; no validated Couinaud map or clinical volume is supplied.

Optional pulmonary airway context reuses 3 existing trachea/main-bronchus landmarks across 2 per-lung views. It is off by default and absent during separation, with no new model files or nested identities. Main-lung selection now discloses the missing tissue/fissure surfaces. Context is orientation, not validated airway continuity.

The collapsed [Learn more section](NESTED_ANATOMY_TEACHING.md) uses 44 source-pinned concepts within 104 selectable parts, with 86 reference links. These counts are separate from the root-body table and overlap parent anatomy. 29 unnamed cranial source pieces deliberately have no independent teaching identity; every topic stays pending for them, without borrowing the parent lesson. Anatomy has 75 draft / 29 pending representations. Clinical has 69 draft / 35 pending; Pathology has 69 draft / 35 pending. Current authored imaging notes cover CT 35 draft / 69 pending, MRI 40 draft / 64 pending, and ultrasound 33 draft / 71 pending. These are introductory notes, not complete clinical coverage, scans or synchronized viewers. Model-scope self-checks test documented model limitations instead of medical recall. No clinical approvals or external resource access are implied.

The [cardiac chamber study](CARDIAC_CHAMBERS.md) exposes 4 existing cavity shapes and 2 atrial-wall references. These are spaces and context, not new unique anatomy or a complete dissectible heart. Ambiguous source labels are documented and not admitted to this study.

## Boundaries and next work

- All new teaching and reasoning questions remain drafts requiring independent anatomical, clinical and educator review. Private shoulder review records are not read by this inventory.
- Unresolved teaching identities remain held: FMA45097/FMA45098 (foot sesamoid groups), FMA19728 (pelvic muscle category), FMA61970 (fornical commissure). Source/geometry holds such as unassigned disc FJ3211 remain separate.
- Peripheral nerves/plexuses, complete joint layers, organ interiors, female anatomy and other source gaps remain. Numerical surface counts do not measure completeness.
- The compact interface, device usability, accessibility, label placement and free-orbit explode behaviour still require current browser/device acceptance. Software/SSR tests are not that acceptance.
- The [multimodal integration plan](MULTIMODAL_LEARNING_PLAN.md) distinguishes anatomy-to-resource links from spatial registration. No CT/MRI/X-ray/US viewer or lecture-player connection is implemented by this milestone.
- 808 lockfile entries classified; 0 unclassified. This is not exhaustive legal clearance or a perpetual free-hosting guarantee. BodyParts3D credit/CC BY 4.0 and existing dependency obligations remain; brand rights are reserved. No bundled font binaries or new paid API.
- Saving/publishing and remote GitHub/D-drive recovery are evidenced by dated, verified release checkpoints, not these source counts or a same-PC module snapshot. Conversation history and private review data have separate recovery requirements.

Use [the requirement/acceptance audit](REQUIREMENT_AUDIT.md), [content contract](CONTENT_CONTRACT.md), and [ordered improvement plan](CONTINUOUS_IMPROVEMENT.md) for scope. This summary is not clinical, visual, deployment or legal certification.
