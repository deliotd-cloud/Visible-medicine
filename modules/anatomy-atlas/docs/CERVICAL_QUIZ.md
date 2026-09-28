# Cervical quick checks

Five original formative draft questions bind to the unchanged source selections
C1 (`FMA12519`), C2 (`FMA12520`), C3 (`FMA12521`), C7 (`FMA12525`) and T1
(`FMA9165`). Each has four distinct choices, exactly one answer and a short
explanation. They cover the absent C1 body, C2 dens, transverse versus vertebral
foramen, the usual prominent C7 spinous process, and thoracic rib facets at T1.

The C3 question makes no claim that arteries traverse every cervical transverse
foramen. The C7 landmark cannot determine numbering in an individual patient.
Models are educational surfaces; they do not establish patient anatomy or scan
registration. Clinical acceptance remains pending revision-bound radiologist
sign-off. Atlas, imaging-case and lecture access remain independent.

References checked by the main coordinator on 28 September 2026:

- [UAMS bones of the back](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-of-the-back-region/)
- [TTUHSC El Paso spinal cord and vertebral column](https://anatomy.ttuhscep.edu/musculoskeletal_system/spinalcord_tables.html)

No source wording or illustrations are reproduced. Conservative derived-word
counts include repeated correct answers: 166 words for UAMS and 39 for TTUHSC.

`scripts/pin-cervical-quiz.mjs` runs only before dispatcher integration at source
HEAD `77244671eaf419095f681bb284737c01ecfbf6bb`. It replays that exact Git
revision, checks the complete prior teaching/recipe snapshot and unchanged
geometry, then writes exclusive pins with `wx`. Do not regenerate pins after
integration to conceal a change.

`node scripts/test-cervical-quiz.mjs` tests the resolver, complete source identity,
four choices and answer key, unknown identities, non-quiz tabs, nested source
drift, mutable return values and unchanged geometry. Once the dispatcher is
wired, `node scripts/test-cervical-quiz.mjs --integrated` additionally checks
only the five quiz placements change, their content/review records and actual
QuizNotes rendering and interaction. Transition/history recording is owned by
the main coordinator; this test never writes those files.

The existing regional Guided learning player exposes explicitly keyed lessons
through a collapsed Quick check inside its explanation, including these five
questions and previously authored regional checks. Opening pauses both autoplay
and camera motion; changing steps resets answers and model failure removes the
check. Closing does not resume. No extra toolbar, popup, scored-exam state or
tour source-membership change is introduced.

Browser validation caught duplicate sibling keys for imaging and quiz disclosures;
their keys now have distinct prefixes. Mobile explanations have a bounded reading
area so opening a check does not push the anatomical model off screen.

`scripts/cervical-quiz-transition.mjs` records exactly five changed placements
and 9,931 unchanged topics. The immutable parent and all prior pins stay intact;
`scripts/cervical-quiz-history.mjs` restores only those exact five changes for
older regression suites and rejects mixed/unrecorded lessons. Source and website
delivery are separately verified; source completion does not mean publication.

Read-only next-gap audit: Terra Medium. Bounded question/resolver/pin/test work:
Sol Medium. Main reviewed references, question scope and diffs and owns history,
tour integration, regression validation and recovery. Worker tokens unavailable.
