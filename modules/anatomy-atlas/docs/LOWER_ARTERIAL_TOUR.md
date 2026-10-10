# Right lower-limb arterial orientation — v2 draft

This nine-stop guided sequence selects existing right-sided external iliac,
femoral, deep femoral, popliteal, anterior and posterior tibial, dorsalis pedis,
and medial and lateral plantar artery surfaces. It runs in Whole-body Guided
learning because its existing source memberships span the pelvis, abdomen,
thigh, leg and foot. The abdomen is an existing membership of the external
iliac record, not an added stop. The scope is derived from the nine pinned
catalogue records. V2 adds nine exact, right-sided skeletal surfaces as faded
spatial context: hip bone, femur, tibia, fibula, talus, navicular, calcaneus,
and first and fifth metatarsals. These are the catalogue's existing, licensed
surfaces in its original coordinate frame. No surface is moved, cut, mirrored
or newly generated. Proximal stops frame nearby supplied arteries; distal
stops frame the target artery with only nearby foot landmarks: talus and
navicular dorsally, calcaneus for the two plantar views. The whole tibia never
enters a foot camera frame. All surfaces remain assembled.

The original captions use factual orientation from the [TTUHSC El Paso lower-limb
artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html),
[thigh table](https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html)
and [leg table](https://anatomy.ttuhscep.edu/musculoskeletal_system/leg_tables.html).
These links are reading references. No source prose, image, table or other asset
has been imported.

The sequence distinguishes the deep femoral branch from the main femoral route.
It links the anterior tibial name to dorsalis pedis and the posterior tibial
name to its medial and lateral plantar branches as typical anatomy, not as
verified continuity between the supplied surfaces. The fibular artery, other
runoff branches and complete plantar arch are omitted. Lateral plantar is an
arch contributor; medial plantar is not claimed as a usual contributor.

The skeletal context improves orientation but does not establish arterial
continuity or exact bony relationships. The tour cannot establish a continuous lumen, junction, patency, flow,
stenosis, pulse, diagnostic projection, procedural route, acquired imaging or
patient registration. Fading and camera framing change visibility only. Exact
source identities, all frames, anatomical captions and limitations need
revision-bound radiologist sign-off. Existing CT, MRI and ultrasound lessons
remain separate from this spatial sequence. Case, Atlas and lecture access stay
independent; clinical PACS and CT-head masks are outside this work.

## V2 skeletal-context source binding

The nine arterial targets, their order, captions, references and views are
identical to V1. The first six frame IDs remain unchanged; the final three
gain only nearby foot bones. Nine context records and their four skeletal bundles
are added to the source pin separately from the arteries. The V2 pin retains
the original catalogue baseline `a453a3708749d1976a1cc18b69d8ece3f0eeec1e`
and binds the V1 tour commit `aff36c610e3aba541dfdcc97b708c9d6d19a24d2`.
The transition generator accepts only that exact V1 pin and checks the model
bytes, catalogue records, bundles, licence and coordinate system. Review
packets for the nine bones and nine arteries now carry the changed tour
revision and full context. Earlier packets require renewed review; no
clinical decision or sign-off transfers to V2.

Focused V2 pin and source tests pass: 18 changed review packets, 1,086
unchanged packets, all 9,936 topic placements unchanged, 195 source refusals
and 144 altered-packet refusals. V1 packets reject against V2. The logs are
under `E:/VisibleMedicine-LocalStaging/20261008-arterial-context/`.
All 52 player cases, whole-body picker, camera, content contract, all 1,104
review packets, decisions, renderer, recovery, inventory and fresh TypeScript
checks pass. The isolated regional build passes with existing chunk warnings.
The initial shared validation exposed stale display pins; the existing generator
refreshed those pins before the successful v2 validation. Original failure logs
are retained alongside the successful logs.

Correction to the original checkpoint: the right hip bone has four tours,
not five. The parser's previous four-tour bound therefore was not proven to
reject this hip record. Using the trusted registry for its preliminary size
bound is preventive hardening; exact membership, uniqueness and canonical
packet equality remain mandatory. Extra, missing, duplicate and altered tours
still reject, as do obsolete V1 packets.

Actual scan-free desktop QA at 1280 x 720 inspected pelvic/thigh, posterior knee,
dorsal foot and both plantar views. The selected arteries and labels fit; faint
skeletal context is visible, and the distal camera remains local rather than
framing the whole leg. Step-picker and Next navigation work; no console errors
or page overflow were observed. Context is deliberately very faint under the
existing fade treatment; contrast and projected overlap remain presentation
review items, not anatomical acceptance. Screenshot and browser evidence are
saved in the E stage. The temporary port-3002 fixture was stopped and its tab
closed; website port 3000 and historical preview 3001 were not changed.

V2 was subsequently integrated into the local website learner and protected
Clinical Review at website commit 55b31ec28681a40218689037c3980d951dd77a0e.
Website `docs/LOWER_ARTERIAL_WEBSITE_IMPORT.md` records that acceptance and
`docs/LOCAL_PREVIEW_RUNTIME_RECOVERY.md` its later local-runtime fix. These
supersede the historical source-only status. Clinical sign-off, arterial
continuity, patient registration and public deployment are not claimed.

## V1 source checkpoint verification (historical)

Nine exact catalogue records and four model bundles are pinned against Atlas
`a453a3708749d1976a1cc18b69d8ece3f0eeec1e`; geometry bytes are unchanged.
The registry now has 33 tours / 198 stops, preserving all 32 previous tours,
regional defaults and 9,936 topic placements. Only nine guided-teaching packets
gain this sequence; source and renderer revisions remain separate review inputs.
101 source/sequence mutations and 36 altered review packets reject; obsolete
teaching packets cannot stand in for the new sequence. No decisions migrate.

All 52 player component cases pass, including the new nine-stop sequence,
four-bundle readiness, assembled frames, pause/stale callback, reduced motion
and source-drift refusal. The shared picker, historical review suite, smooth
camera, content contract, body-review/decision, renderer, inventory and fresh
TypeScript checks pass. Regional runtime builds on E; existing large-chunk
warnings remain. Component/GPU-boundary tests do not establish browser/GPU or
clinical acceptance. Actual desktop framing acceptance and generated website
learner/Clinical Review integration remain next, not claimed complete here.

The historical review fixture previously combined its 30-tour display hashes
with later teaching imports. Its transitive project teaching now loads from
that exact saved epoch; all original assertions are retained. Current-source
parsers are independently exercised across all 1,104 packets by the new suite.
Initial stale-pin/picker-count failures were corrected by the existing pin
generator and explicit 33-choice assertions, not by relaxing acceptance.

Full logs, scoped source snapshots and incremental recovery are saved under
`E:/VisibleMedicine-LocalStaging/20261008-lower-arterial-tour` (same machine,
not verified GitHub/off-device backup). No website deployment, patient access,
mask edit, new asset/dependency or approval is included in this checkpoint.
