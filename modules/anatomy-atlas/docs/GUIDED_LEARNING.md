# Agent-authored guided learning

## Coeliac branch orientation — 27 September

Abdomen Guided learning now offers five selected artery stops: coeliac trunk,
left gastric, splenic, common hepatic and hepatic artery proper. The abdominal
aorta is faded context, not an additional stop or a complete abdominal vascular
map. Mobile inspection found the overview too wide for the small origin: v2
uses named source-bound close-ups for coeliac/gastric and hepatic stops, retaining
the five-target overview for the splenic stop. Camera position and target glide
between these frames; anatomy stays fixed. Other context may extend beyond the
close-up. Frame identities and computed bounds are part of teaching evidence;
altered/missing frames and frames excluding the selected target are rejected.

The existing source-bound `celiac-display-corrected` bundle is required; missing
or archived duplicate display bindings fail closed. Other targets retain their
`abdomen-vessels-recovery` geometry. No new triangles, inferred connections,
licences or images. BodyParts3D attribution stays visible. The six structures
and two actual display bundles are included in teaching review evidence.

Captions are original summaries referencing TTUHSC stomach/duodenum tables;
the tour qualifies the usual branching pattern and excludes blood flow,
continuous lumen, patency, calibre, procedural use and patient registration.
It shows neither the organs nor all downstream branches. Existing modality
notes follow each exact selected structure; incomplete content is not relabelled
as complete. Radiologist review must inspect branch identity, spatial relations,
source omissions, fine-surface legibility, transitions and teaching before sign-off.
Source-only until generated website/review import; no deployment implied.

## Cervical spine expansion — 27 September

The spine library now offers **Cervical spine: C1 to T1**, five manual/playable
stops at atlas, axis, C3, C7 and T1. C4–C6 are faded context. All eight exact
BodyParts3D identities belong to the spine region and the same skeleton bundle;
no geometry is created, moved or relabelled. A fixed cervical bounding frame
keeps the short tour legible instead of framing the entire spine. Existing
1.8-second eased orbital transitions, reduced-motion support, pause/readiness
gates and pre-tour workspace restoration are reused.

Original captions reference the TTUHSC Back & Spinal Cord anatomy table
(https://anatomy.ttuhscep.edu/schemes/back_tables.html); no images or prose were
imported. Existing mesh credits and licensing remain unchanged. This tour
does not display discs, ligaments, cord or nerve roots; it does not assert
patient-level vertebral numbering, normality, motion or scan alignment.

All eight visible selections receive the complete tour in teaching-review
evidence. Prior thoracic evidence is unchanged; unrelated teaching retains its
revision. The review viewer names the appropriate regional learner. The owner
must review vertebral identities, orientation, fine mesh features, sequence,
camera readability and captions before clinical sign-off. Each of the five
stops also exposes the existing four modality notes without inventing scans.
Source implementation only until explicitly imported into the website.

The owner requested agent-authored tours, grouped under **Guided learning**,
not an educator authoring dependency. The first local pilot is the existing
right-shoulder module: deltoid cover, infraspinatus, teres minor, supraspinatus,
subscapularis. Only supplied source-registered geometry is used.

## Learner behaviour

- Guided learning is an optional library surface alongside Explore, Dissect and
  Practice. The underlying Explore/Dissect session is retained, not overwritten.
- Start is manual. Back/Next move through captions, named source selections,
  layers and camera presets. Play advances every 12 seconds; Pause freezes
  playback and camera motion. The last step stays visible until Finish/Exit.
- Camera transitions use flowing 1.8-second orbital sweeps with quintic easing
  (zero endpoint velocity and acceleration), not a straight path through the model.
  Reduced
  motion uses immediate presets. Normal non-tour camera behaviour is unchanged.
- Exit restores the pre-tour camera, selection, systems, layers, separation,
  isolation, guides, inspection and zoom step. The capture is detached.
- Hidden tabs and unavailable/recovering WebGL pause without automatically
  resuming. Exit remains available if the model cannot render. Timers are cleaned
  up on pause, step, exit and unmount. No auto-start on entry.
- Conflicting controls are suspended during playback. Other workspaces retain
  their existing three-mode navigation until they have a supported tour library.

## Review and licensing

`lib/shoulder-tours.ts` separates teaching revision from the exact manifest mesh
revision; every selected structure must occur in the supplied manifest. Original
short captions cite the TTUHSC upper-limb anatomy table, not copied assets.
Existing BodyParts3D attribution remains visible, including during playback.
No new dependencies, paid service or third-party images.

The complete sequence appears in shoulder teaching-review evidence, including
captions, IDs, layers, camera directions, timing and references. Current teaching
fingerprints include the tour source; historical fingerprints are not migrated.
The checklist explicitly requires playing the sequence and checking framing.
No private decision is read or changed by the fingerprint scripts. All content
remains draft: the radiologist must check anatomy, omissions, views and teaching.

## Linking to CT/MRI (design, not delivered imaging)

27 September source increment: shoulder and thorax tour steps now include a
collapsed **CT / MRI & imaging notes** reader. CT, MRI, X-ray and Ultrasound
reuse the exact selected structure's existing teaching sections, including
readiness, source references and limitations. The reader is keyboard-focusable
with bounded internal scrolling to keep the model and controls close by.
Opening it pauses camera/playback; closing it does not auto-resume. Each step
remounts a fresh collapsed reader on CT, so neither an old structure's notes nor
its open/scroll state silently follows the next target. Play explicitly resumes.
These are teaching notes, not a delivered scan linkage or acquisition viewer.
All44displayed modality/step combinations are checked against source teaching;
the24thorax combinations match existing review topics. Review renderer hashes
include this display. No case/lecture access or source geometry is changed.

Acceptance for this increment:44source-bound modality lessons,6regional player
tests,7shoulder session tests,3shoulder content/player tests,235reviewchecks,
1,104regional review packets,detached host restore and101camera orbit samples
pass. TypeScript and both production module builds pass. Actual375px previews
for shoulder/thorax confirm opening pauses Play, CT/MRI switches correctly,
next step closes the reader and resets CT/scroll position, and one canvas/no
horizontal overflow. The reader is244px high at this viewport; inspected the
rendered thorax screenshot. Source-only until the next website import; these
checks do not approve clinical teaching or claim actual image synchronization.

Future steps can reference a stable anatomical ID plus an approved educational
case, series, image/frame or landmark and its revision. The integrated Didanix
Education/light viewer can present that scan beside the 3D tour. This does not
require changes to the separate clinical desktop application.

Two distinct capabilities must stay explicit:

1. **Semantic link:** show the same named structure in the 3D atlas and a reviewed
   CT/MRI image. This works without asserting that generic anatomy is registered
   to the individual scan. Multiple reviewed modality examples may be attached.
2. **Spatial link:** synchronized crosshair, slice plane or segmentation needs a
   verified coordinate transform/registration and matching scan revision. Patient
   DICOM orientation/spacing and laterality must be respected. No generic-mesh
   coordinates are to be passed off as patient-specific registration.

Teaching, atlas, case and lecture entitlements remain independent. A tour must
continue in 3D when an image is absent, uncleared or inaccessible; it may explain
the unavailable link but must not leak restricted previews or scan identifiers.
Resolve authorized case references server-side; don't embed private scans in
tour definitions, GitHub or public exports. The owner radiologist reviews
structure-to-image mapping; CT-head masks/boundaries remain in their specialist
task. No synthetic scan or unvalidated automatic overlay is a substitute.

## Next delivery

The shoulder pilot was delivered locally to website `3f639ae` on 27 September.
The next source increment adds a six-stop thorax tour: trachea, right/left main
bronchi, aortic arch and right/left pulmonary arteries, with two lung context
surfaces. It uses an integrated regional Guided learning tab, not a popup.
The ordinary scene unmounts while touring; dissection history, filters, selection,
zoom and workspace mode remain untouched. Exit remounts that workspace with a
detached copy of its original camera. Tour selections do not publish imaging
events or change case/lecture entitlements. Only the supported thorax region
offers this tour; whole-body and other regions do not advertise missing tours.

All target/context identities resolve exactly, and all required bundles plus a
healthy renderer gate playback. Missing anatomy fails closed with usable Exit.
Pause, hidden tabs and renderer loss pause motion and playback; recovery never
auto-resumes. The same 1.8s quintic orbit and reduced-motion behavior apply.
The camera frame is the stable union of six target bounds; lung context does
not force an unnecessarily distant full-source camera. No mesh is repositioned.

Review worksheet schema3 rejects cached schema2 clients rather than silently
hiding new evidence. Eight source selections carry the complete tour, all
context geometry identities, bundle hashes, frame, captions, timings and
references in their teaching fingerprint, with a required guided-tour checklist.
The remaining1,096teaching fingerprints retain their prior exact hash domain.
No clinical decisions are migrated or written. Imaging approval stays unavailable.

Additional checks: `node scripts/test-regional-tour-player.mjs`,
`node scripts/test-regional-tour-host.mjs`, `node scripts/test-regional-tour-review.mjs`,
`node scripts/test-body-reasoning-review.mjs`, existing body review/decision,
camera/navigation checks and regional build. Clinical review remains mandatory.

Thorax source acceptance, 27 September: actual component harness5/5, entry/exit
camera/state guard, eight-source tour binding and1,096unchanged teaching hashes,
9malformed packets and8missing-source rejections; body-review1,104selections/
9,936topics,1,104decision contexts/3,312tracks and real SQLite isolation/history tests,
268reasoning packets, camera27resize/414zoom checks,169,949navigation and141,680
study-navigation assertions pass. The navigation test's old exact selection-guard
string was updated to require the added guided-learning guard, not weaken it.
TypeScript and regional build pass. Actual1280px source preview shows the selected
trachea with faded context;375px tour advances through all six stops and Finish
returns to Explore, with no horizontal overflow and about390px model height on
entry. Source captions, geometry relationships and framing still need radiologist
assessment. Regional website import and live protected review QA remain next.

Bounded contribution: Terra Medium supplied read-only source/reference research;
existing Sol Medium worker supplied only the new player test file (5passingtests).
Main implemented/integrated the source and review changes. Per-run token totals
were unavailable; no token-saving percentage or clinical approval is claimed.

After source acceptance and recovery backup, regenerate/import the shoulder
learner and protected website review from this same commit. Shared camera and
navigation fingerprints also affect regional exports; synchronize those through
the established delivery checks. This document does not assert website delivery.
Then expand tours to source-supported regions. Defer "follow the brachial plexus"
until the relevant validated source geometry exists; do not invent nerves.

## Verification

Run `node scripts/test-shoulder-tours.mjs`,
`node scripts/test-shoulder-tour-session.mjs`, `node scripts/test-tour-camera.mjs`,
existing camera/shoulder/review tests, TypeScript and the shoulder module build.
Actual browser acceptance must cover desktop/mobile, all steps, pause/finish,
keyboard focus, text growth and entry/exit from altered camera/layer states.
Software acceptance is not clinical approval.

Source acceptance on 27 September 2026: 3 content/player tests, 6 actual host
session/navigation tests, orbit/pause/restore/reduced-motion/resize camera tests,
9-structure review transition test, 27 existing resize checks, 414 zoom checks,
14 keyboard tests, 235 review checks, 1,445 shoulder workspace checks, 18,990
saved-view checks, 169,949 navigation checks, 5 protected review queue tests and
4 review-hub rendering tests pass. TypeScript, targeted lint and production
shoulder build pass (existing large-chunk warning remains). Desktop and 375px
browser checks exercised library entry, all steps, actual autoplay to the last
step, Finish/Exit, restored surface layer, focus return and return to Explore.
The supraspinatus step now explicitly fades other structures for visibility.
No clinical decision, geometry, private scan, website deployment or desktop PACS
was changed. Website import and review integration are the next delivery step.

## Right forearm muscle orientation — 27 September 2026

Five right-sided stops: brachioradialis, extensor digitorum, flexor carpi radialis,
flexor digitorum superficialis and pronator quadratus. Exact right radius and
ulna source records provide faded context. Each camera frame is bound to its
selected muscle; the smaller distal pronator quadratus receives a closer view.
Existing muscle/skeleton bundles and credits are retained; no new model, image,
texture, font or dependency is included. The source has no forearm nerve meshes:
this is explicitly not a nerve-pathway tour or a complete compartment dissection.

Original teaching is referenced to TTUHSC's Forearm & Wrist dissector answers:
https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_ans.html
No diagrams or source text are copied. All tour evidence, context and computed
frames are material to the radiologist's revision-bound teaching review.
Existing CT/MRI/X-ray/US lessons are reused without implying an aligned scan.
The visible step heading is a polite atomic live region so collapsed mobile
explanations do not suppress step-change announcements.

The added negative review test exposed accepted inconsistent context laterality.
The response parser now rejects a context or target whose laterality is missing,
unknown or disagrees with its anatomical ID. The test remains strict; no clinical
decision or prior source evidence is rewritten by this validation change.

Read-only source/reference audit: existing Terra Medium worker; bounded player
and review tests: Sol Medium worker; main owns definitions, integration and risk
review. No nested delegation. Per-run worker token totals unavailable.

## Right thigh, leg and hand — 27 September 2026

Three additional five-stop draft tours use existing exact-source muscle meshes,
selected-target close-up frames and the same smooth, pauseable camera player.
Thigh: rectus femoris, vastus lateralis, adductor longus, biceps femoris long head,
semitendinosus; femur context. Leg: tibialis anterior, extensor digitorum longus,
fibularis longus, soleus, tibialis posterior; tibia/fibula context. Hand: abductor
pollicis brevis, opponens pollicis, abductor digiti minimi, flexor digiti minimi
brevis, opponens digiti minimi; first/fifth metacarpal context. All are right-sided.

Original short captions are fact-checked against TTUHSC's topographical, leg/foot
and hand tables (links in each step). No reference prose, diagrams or new assets
are imported. Existing model licences/credits remain unchanged. Tour membership,
captions, context, frames and limits are included in revision-bound clinical review.
The three additions bind 60 existing modality notes; they do not supply new scans
or establish registration. All 164 tour/step/modality bindings are tested together.

Review must check small/deep hand and tibialis posterior visibility, anatomical
orientation, mesh fidelity and attachment limits. Soleus is in the superficial
posterior compartment, not the outermost calf muscle; gastrocnemius is omitted.
The thigh tour selects only the long biceps head, not both. Fading is explicitly
not a physical fascial dissection. New tours remain drafts until radiologist sign-off.

Negative tests exposed a prior gap: nonselected context source digests were only
shape-checked. Review responses now compare the complete tour evidence with this
build's trusted display catalogue, including every context surface, source digest,
bundle, bounds, coordinate frame and source version. A well-formed but altered
context is rejected. This protects review presentation; it grants no approval.
Website integration and visual acceptance are separate delivery gates; source
implementation alone does not mean they are published or clinically accepted.

## Foot and upper arm; polar camera stability — 27 September 2026

The right-foot tour moves from dorsal extensor hallucis brevis to plantar
abductor hallucis, flexor digitorum brevis, abductor digiti minimi and quadratus
plantae (source name flexor accessorius). Calcaneus and first/fifth metatarsals
provide context. Source axes require superior for dorsal and inferior for
plantar, not the anterior preset. Five separate target frames are retained.

The right upper-arm tour distinguishes long/short biceps heads, brachialis and
long/lateral/medial triceps heads. Six targets span muscle and dissection bundles;
canonical upper-limb humerus/scapula IDs provide context. It does not duplicate
the dedicated shoulder rotator-cuff tour. No radius/ulna or intact tendon system
is claimed. Both tours remain draft and reuse existing licensed meshes/credits.

References: TTUHSC Leg & Foot and Axilla/Posterior Shoulder/Arm tables, linked
in each original caption. No external images or prose imported. Read-only source
audit by Terra Medium; main authored/verified code. No nested delegation.
Additional test-worker requests were unavailable; main completed the tests.

A new dorsal-to-plantar regression exposed independent radial/up interpolation
becoming parallel during an antipodal polar sweep. Camera interpolation now
slerps a single rigid orientation frame while retaining quintic easing, radius
and target interpolation, exact endpoints, pause/resume and reduced motion.
202 bidirectional polar samples verify orthogonality and no orientation flip;
the actual-camera harness verifies the polar pause/resume. The prior101antipodal
orbit samples and existing camera checks remain. Camera source changes are
renderer-review material; no prior clinical acceptance is assumed.

Nine regional tours plus shoulder now bind208step/modality notes. Complete
sequence/context/frame evidence covers65source records; previous49tour evidence
records are checked unchanged. Review stays revision-bound and unapproved.
Website import and actual browser acceptance are separate delivery gates.

## Compact regional tour presentation — 27 September 2026

At widths up to 600px, the explanation starts collapsed; opening it exposes the
complete caption, modality notes and references, and pauses camera/playback.
Closing it never resumes playback. Desktop explanations start expanded. The
step title, step count and playback/exit controls remain outside the disclosure.
In embedded mobile tours only, repeated regional metadata is hidden because the
website already identifies the region; mode navigation remains available. Exit
restores the ordinary regional header. No tour definitions or geometry changed.
