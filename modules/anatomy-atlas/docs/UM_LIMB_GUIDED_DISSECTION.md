# Independent lower-limb guided dissection

Five original draft sequences extend the existing collapsed **Guided learning**
panel: hip/thigh9 steps, knee6, calf7, ankle/foot8, whole-limb16 (46 total).
Each regional sequence includes every admitted surface in its scope; the
whole-limb sequence visits all67 supplied surfaces. These counts describe this
incomplete right adult-male specimen, not anatomical completeness or whole-body
registration. The separate whole-body atlas and its existing tours are unchanged.

Start within the independent lower-limb viewer, expand Guided learning and choose
Start guided dissection. Previous/Next changes the visible source subset,
selection, caption and camera preset. Finish or Exit restores the exact manual
display, visibility/selection, search, Undo/Redo and captured camera through the
existing player. Ordinary manual dissection remains available outside the guide.
No extra permanent toolbar or automatically expanded panel was added.

The whole-limb guide reuses the admitted hip, knee and foot camera bounds for
the corresponding steps, so a knee or foot view is not forced to fit entire
long bones. Framing does not cut, move or hide additional geometry; the caption
continues to disclose long structures beyond the regional view.

The existing smooth1800ms camera transition is reused, with reduced-motion
preference, hidden-document pause and renderer/bundle readiness gates. This
release adds sequence data rather than a new animation engine. Production hook
tests verify92 guided camera states (46 steps in both motion modes); they do not
prove GPU smoothness or actual browser appearance.

## Boundaries and review

Source-slug plans resolve only against the entire admitted definition, including
IDs, laterality, geometry metadata, bundle hashes, source attribution, coordinate
transforms, studies and limitations. Modified or foreign definitions produce no
guide. Returned plans, guides and review packets are detached copies. Meshes,
existing study recipes, navigation pins and all existing topic prose remain exact.

The pelvis, Phalanges and meniscus source groups stay grouped. No missing nerve,
vessel, fascia, retinaculum, capsule, labrum, individual digit or separate meniscus
is invented. Visibility changes are not surgical planes, simulated procedures,
anatomical boundary validation, tendon continuity or scan registration.

Clinical Review includes the exact captions, order, views and context/selection
IDs, with a guided-step checklist on154 overlapping regional contexts. Their
teaching revisions change; all356 source packets and202 unrelated teaching
packets remain exact. The four grouped contexts retain their identity holds and
all previous approvals require their own current revision/scope.462 stale or
foreign-frame requests must reject before storage. No approval is migrated.

The selected structure retains its existing CT/MRI/X-ray/ultrasound draft notes,
anatomy/function and source reading. Stable IDs are future imaging-link hooks,
not a registered scan correspondence or an entitlement. Atlas, case and lecture
rights remain independent. No scans, patient coordinates or new external viewer.

The source catalogue/studies are authoritative for represented structures.
General muscle groupings were cross-checked against the publisher's
[OpenStax lower-limb chapter](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs).
This is a reading link, not an imported illustration, textbook adaptation or
redistribution licence. Captions are original instructions about admitted meshes;
reading and automated tests do not validate the particular specimen's orientation.

Before release, the radiologist must inspect each step's identity, visible
neighbours, useful camera framing, grouping/omissions and caption in the actual
source viewer. Signed-in integration, full browser zoom/accessibility and device
animation acceptance remain separate gates. Source-only until generated website
integration; nothing is published or clinically approved by this change.

## Checks

`npm run um-guided-dissection:test` covers exact order/membership, all-surface
coverage, source/frame/bundle mutation rejection, clone isolation, full review
transition and the actual player hook path. Retain the separate historical UM
modality-transition test at its delivered revision; the new current test verifies
all original topics and holds remain unchanged. Existing renderer/review, teaching,
navigation, TypeScript, lint and builds are required before saving this batch.

No new dependency, geometry, font, texture, image or mandatory paid service.
UM CC0 source provenance and all prior notices remain; the existing software
licences and independent clinical/privacy requirements still apply.
