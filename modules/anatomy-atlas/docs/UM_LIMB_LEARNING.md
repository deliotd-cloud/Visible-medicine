# Independent lower-limb learning

## Experience

Select a structure and expand **Learn · anatomy, clinical & imaging** in the existing side panel. All 67 supplied selections have source-bound anatomy/function drafts; all 42 muscle selections include typical proximal/distal attachments and motor supply. The [modality-topic completion](UM_LIMB_MODALITY_COMPLETION.md) preserves earlier teaching and gives 65 explicitly mapped selections all six extended clinical/pathology/imaging draft tabs and their original self-checks. Three outer groups and their topic tabs keep the panel compact. Unsupported topics remain explicitly pending. These are general teaching facts, not measured footprints, reconstructed nerves or clinically approved segmentation labels. Grouped pelvis/foot bones keep source-scope descriptions without invented individual identities.

**Practise identification** starts a round of up to ten visible, pinned selections; at least two are required. The target is highlighted and framed; other tissues fade. Names, landmarks and origin guides are suppressed. Two to four answer buttons support keyboard/touch input, preferring same-tissue distractors. Camera presets, rotation and zoom remain available. Wrong answers allow retries, repeated clicks cannot inflate results, and revealed answers never earn first-try credit. Completed rounds offer **Retry missed** or **New round**. This is source-label recall, not an accredited exam.

Answering pauses until the renderer and required visible bundles are ready. Failed loading directs the user back to dissection to retry. Returning restores tissue choices, history and display settings; the scene remounts, so a manually dragged free-orbit pose is not restored exactly. Region changes or closing the modal end the round. Results are temporary and never sent to an account, browser storage or clinical record.

## Implementation

- `content/um-limb-teaching.ts` makes explicit concept choices. Forty-one muscles reuse Visible Medicine's original factual drafts by concept key, NOT by FMA. One extensor digitorum brevis draft and 25 bone/tissue/group entries are separately authored. Other-subject cautions, FMA identities, scan hooks and entitlements are excluded.
- `content/um-limb-teaching-bindings.v1.json` pins each complete source entry, declared bundle SHA256 and authored lesson. Runtime lookup compares selected/current entries with the pin; changed, foreign or unknown bindings fail closed. It never substitutes a similarly named structure.
- `lib/um-limb-teaching.ts` returns detached lessons and controls the visible-pool quiz, scoring and retry progression.
- `app/um-limb-learning.tsx` reuses installed Tabs, Buttons and Select. Learn stays collapsed; practice temporarily replaces the workbench without changing its state.

Inspect source identity, grouping, provenance and lesson suitability before explicitly rerunning the pin script. Repinning is NOT clinical review. Runtime binding compares catalogue metadata; it does not cryptographically hash GPU downloads. Existing geometry/export checks establish artifact integrity separately.

The briefs are original factual prose, not copied reference tables or illustrations. References remain attached per lesson. New facts were checked against OpenStax lower-limb bones/selected joints and NCBI Bookshelf knee/leg/foot chapters. These works are not imported, relicensed or claimed CC0; the UM meshes retain separate CC0 provenance. No new dependencies, fonts, textures or paid service.

## Checks and remaining work

`npm run um-limb-learning:test` checks pin freshness, all 67 bindings, mutation/foreign-source rejection, 42 muscle records, round progression/reveals/retry scoring and installed React/Base UI markup. Component checks replace only the GPU scene. Retain the existing knee/limb suites for geometry and dissection regression. These checks are not clinical or browser acceptance.

[Direct study links](UM_LIMB_NAVIGATION.md) can open an exact source selection with any available topic expanded. Pending or unbound topics cannot be linked. They identify the specimen, not a patient or paid-content entitlement.

## Calf depth draft — 5 October 2026

Nine existing source selections now have additional compartment/tendon
relationships, typical arterial supply and one clinical pitfall: tibialis anterior,
tibialis posterior, flexor digitorum longus, flexor hallucis longus, peroneus
(fibularis) longus, soleus, both separate gastrocnemius heads and popliteus.
The source-bound addition is `um-calf-depth-20261005-v1`; it reaches 24 existing
knee/calf/foot/whole-body study placements, not 24 new anatomical structures.
All earlier anatomy/function, attachments, motor, clinical, pathology, imaging and
self-check text remains intact; the other 58 source lessons are unchanged.

The additional learner notes are closed by default inside the existing Anatomy
and Clinical tabs. Clinical Review shows all three notes, their reading links and
model limitations, with an independent unchecked `calf-depth` teaching item.
The 24 affected teaching fingerprints advance; older decisions cannot approve
the new text. Shared renderer-dependent display fingerprints expire conservatively
without changing any mesh, source frame or scan registration.

The prose is original and factual. Eight linked readings include Texas Tech's
lower-limb muscle table, NCBI Bookshelf chapters, and the Jeon popliteus vascular
and Delgado tennis-leg papers. Reference copyright remains with its owners: no
table, figure, image or scan is imported or relicensed. The table is not CC0;
commercial inclusion of its media is not inferred from access to factual readings.
No new model, font, texture, dependency or paid service was introduced. Arterial
contributions can vary, and medial gastrocnemius findings are not extrapolated
to the lateral head. Missing vessels, nerves, fascia and retinacula remain missing;
these notes do not simulate perfusion, pressure, disease or tendon motion.

`npm run um-calf-depth:test` checks the nine source-pinned additions, unchanged
older fields/other lessons, detached returns and foreign-binding refusal; actual
React markup in both learner tabs and Review; all 356 independent source-review
packets, the 24 changed/332 unchanged teaching contexts, and stale-save refusals
before storage. A disposable in-memory SQLite test also verifies successful draft
and fully attested synthetic approval saves, response/history parsing, optimistic
conflicts, old event compatibility and rejection of malformed scopes. Synthetic
approval is not radiologist sign-off. These tests do not establish clinical
correctness or browser acceptance.

Still needed: revision-bound specialist review of these drafts; deeper supply,
relationships and clinical/pathology teaching elsewhere; validated identities for
grouped bones; missing nerves/other structures; keyboard/screen-reader, GPU/mobile
and performance acceptance; approved imaging registration and the owner's real
resource manifests. Root-body teaching counts, review authority and separately
paid lecture entitlements are unchanged. Source changes are not automatically
integrated into or published on the website.

## Hip/thigh depth draft — 5 October 2026

Ten existing selections receive original draft relationships, typical arterial
supply and a clinical pitfall: the four quadriceps heads, biceps femoris long
head, semitendinosus, semimembranosus, adductor longus, adductor magnus and
gluteus medius. The same source selections occur in Hip/thigh and Whole body
(20 review placements). Their earlier teaching and the other 57 source lessons,
including every calf note, stay exact. No mesh, anatomical frame or scan changes.

The notes remain inside closed Anatomy/Clinical details. Review exposes all
three notes, named reference links, limitations and the exact draft revision
`um-thigh-depth-20261005-v1`. Its unchecked `thigh-depth` scope is distinct from
`calf-depth`; mixed scopes and unknown revisions fail closed. Existing approvals
cannot approve the additional text. Renderer-dependent display fingerprints
expire conservatively, without asserting a change to source mesh geometry.
Whole tab controls wrap onto another row in narrow panels; individual tab labels
are not split into fragments. No new top-level menu or smaller font is required.

Eight factual readings link to Texas Tech and NCBI Bookshelf. Their tables,
illustrations, images and text are not imported or relicensed; the prose is
original and the reference copyright remains separate. Direct NCBI page opens
encountered a CAPTCHA; indexed primary-source entries identified the chapters.
No challenge was bypassed. Only posterior gluteus medius is described as covered
by gluteus maximus. Usual supply and function are teaching facts, not validated
vascular meshes, perfusion, tendon architecture, gait or diagnostic findings.
No dependency, texture, font, service fee or third-party model was added.

`npm run um-thigh-depth:test` checks exact source/lesson bindings, all 356
independent source packets, 20 changed and 336 unchanged teaching contexts,
detached returns, 402 foreign-binding and 60 stale-save refusals; actual React
learner/Review markup; unsupported-depth refusal; and disposable SQLite
POST/readback/history/conflict/old-event/mixed-scope cases. Synthetic approvals
are software fixtures, never radiologist sign-off. Earlier calf delta suites
explicitly replay the saved 5acfa46 milestone against their original 4b0c1958
baseline. The new thigh transition independently proves current calf teaching
is still exact; existing calf content/component/persistence tests use live source.

Remaining gates: the owner's revision-bound clinical review, real browser/device
and accessibility acceptance, deeper teaching for other muscles/structures,
cleared missing geometry and validated imaging/case/lecture resource manifests.
These source changes require controlled website generation and separate
publication authority before appearing in a new hosted release.

## Deep hip rotator depth draft — 5 October 2026

Six existing source selections gain original relationships, arterial-supply
notes, clinical pitfalls and explicit model limits: piriformis, both gemelli,
both obturators and quadratus femoris. They occur in Hip/thigh and Whole body
(12 study placements). The earlier 20 thigh and 24 calf teaching placements,
344 other teaching contexts and all 356 independent source packets stay exact.
No mesh, anatomical frame, nerve, vessel, scan or registration is added.

Closed Anatomy/Clinical details and the existing Review layout are reused.
The exact draft revision `um-deep-hip-depth-20261005-v1` shares the existing
unchecked `thigh-depth` scope, but never the earlier revision's approval.
Only the two explicit thigh revisions are accepted; unsupported revisions,
mixed scopes and stale saves fail closed. Display fingerprints expire
conservatively without asserting a source-geometry change.

Nine primary academic/publisher readings support original prose. No tables,
illustrations, scans, images or third-party prose are imported or relicensed.
The arterial notes include medial circumflex femoral contributions to quadratus
femoris and acknowledge differing inferior-gemellus reference descriptions.
The greater/lesser sciatic foramina are distinguished. Nerves and vessels remain
absent, and static surfaces cannot establish entrapment, perfusion or pathology.
Direct NCBI/PMC opens encountered a challenge; indexed primary records supplied
the cited reading, without bypassing it. No dependency, font, fee or asset added.

`npm run um-deep-hip-depth:test` checks current exact pins, bounded citations,
all 67 bindings and 402 foreign refusals, six changed/61 unchanged lessons,
12 changed/344 unchanged teaching contexts, retained thigh/calf content,
36 stale-save refusals, actual React modes and disposable SQLite
POST/readback/history/conflict/checklist/old-event cases. Synthetic approvals
are fixtures, not radiologist sign-off. The earlier thigh delta/React/persistence
suites explicitly replay immutable `d5e5641` against their original milestone;
the new live transition independently proves those 20 earlier contexts exact.

Remaining gates include the owner's revision-bound clinical review, accessibility
and device acceptance, missing cleared spatial anatomy, and real approved
imaging/case/lecture manifests. Controlled website generation and separate
publication are still required; source tests do not prove clinical correctness.

## Knee stability comparison guide — 5 October 2026

The knee Guided learning sequence adds **Compare knee stabilizers** after its
cruciate step. All six earlier step definitions/captions stay intact. The new
step shows the existing ACL, PCL, MCL and LCL selections with the whole tibia
and fibula. The femur stays hidden solely for visibility: restoring its opaque
surface obscured the selected ACL in actual desktop QA. No bone is cut or moved.
The step does not split the grouped menisci or define new tissues.
The hip/thigh, calf, foot and 16-stop whole-limb sequences remain unchanged.
The existing collapsed Guided learning panel and smooth camera player are reused.

The caption connects existing source-pinned Function teaching, not new movement
simulation: cruciate translation restraint and collateral valgus/varus restraint.
These are simplified general roles, not exclusive functions, calibrated laxity,
attachment measurements or injury grading. [NCBI knee anatomy](https://www.ncbi.nlm.nih.gov/books/NBK500017/),
[ACL anatomy](https://www.ncbi.nlm.nih.gov/books/NBK559233/) and
[PCL anatomy](https://www.ncbi.nlm.nih.gov/books/NBK535416/) support the original
summary. Indexed primary records were inspected; direct ACL/PCL opens returned
a CAPTCHA, which was not bypassed. No reference prose, figure or scan is imported
or relicensed. Mesh licences and all anatomy/clinical/imaging lessons stay separate.

The exact step order, caption, neighbours, selection and camera direction are
Clinical Review material. The existing unchecked `guided-dissection` checklist
still requires actual-viewer inspection; earlier teaching decisions cannot cover
this revised knee sequence. Shared renderer-dependent display fingerprints expire
conservatively, without implying new geometry, patient registration or clinical
approval. There is no new asset, dependency, font, fee or paid-lecture access.
Website integration and publication require their own later controlled checks.
