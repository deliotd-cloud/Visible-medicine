# Chest-wall guided learning draft

`lib/chest-wall-tour.ts` exports `chestWallTour` for integration by the coordinator.
Six 14-second stops use existing source surfaces: external, internal and
innermost intercostals; right and left transversus thoracis; diaphragm.
No geometry is generated or moved. Preset views use the existing smooth camera
player; the first three remain right-sided, followed by posterior paired views
and a superior diaphragm view.

The three intercostal `midline` catalogue records contain paired source files:
they are grouped bilateral surfaces, not single unpaired muscles or separately
selectable intercostal spaces. IDs, bounds, coordinate frame, source records
and unvalidated status are retained. Context is restricted to body of sternum
and the two fourth ribs. The sternum is a recovered, unreviewed source surface.
Intercostal and diaphragm frames use their own source bounds; transversus frames
include the sternum. No whole-body camera context is added.

The original factual captions refer to the
[TTUHSC El Paso thoracic-muscle teaching reference](https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html).
The script enforces a combined 190-word caption ceiling. No table, images or
copyrighted prose are imported. The source supplies educational facts; it does
not validate these model surfaces or authorize clinical use.

The layer sequence and neurovascular-plane relationship are conceptual. Fading
does not establish verified boundaries, attachments, pleura or procedural
planes. The posterior preset is an orientation camera, not a complete view
inside the chest. The diaphragm is static: no breathing, excursion, openings,
disease interpretation, acquired imaging or patient registration is established.
The draft requires revision-bound radiologist review; this change creates no
clinical approval, decisions, access changes or patient data.

Focused verification: `node scripts/test-chest-wall-tour.mjs` from the Atlas root.
It validates all six exact IDs, context/region/bundle/frame bindings, negative
cases, baseline source records and actual bytes against the pinned hashes for
`thorax-muscles`, `thorax-skeleton` and `thorax-skeleton-recovery`. It does not
build the application or write shared validator output. Tour registration,
regional selection and review integration are now included. The thorax offers
two tours, with the existing airway tour remaining the default; the whole-body
library offers twelve. Selecting a different tour discards the old player and
waits for an explicit Start. Unsupported regions fail closed.

Local source acceptance, 28 September 2026: production build and TypeScript
checks passed, alongside source identity, selector/host, 27 player, review,
camera and imaging-note checks. Review tests reject 54 chest-wall evidence
mutations, including captions, source hashes and camera frames.
At a 375 × 812 mobile browser viewport all six stops retained one visible canvas
without horizontal overflow. Posterior transversus and superior diaphragm views
were visually inspected. Switching away from a playing tour left the replacement
waiting at Start beyond the old 14-second timer interval. These checks establish
UI behaviour, not anatomical validation. Website import and publication are not
claimed by this source checkpoint.
