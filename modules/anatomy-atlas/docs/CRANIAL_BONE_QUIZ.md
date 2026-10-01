# Cranial bone quick checks

Six original formative draft questions bind to eight existing skull-bone
selections: frontal (`FMA52734`), left/right parietal (`FMA52788`, `FMA52789`),
occipital (`FMA52735`), left/right temporal (`FMA52738`, `FMA52739`), sphenoid
(`FMA52736`) and ethmoid (`FMA52740`). Paired selections intentionally share a
question. Each question has four distinct choices, one exact answer and an
explanation. Topics are orbit roof, sagittal suture, occipital condyles and C1,
petrous temporal labyrinth, sphenoid sella and ethmoid cribriform passage.

References verified by the main coordinator on 1 October 2026:

- [UAMS bones and cartilages of the head and neck](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/)
- [TTUHSC El Paso alphabetical bone table](https://anatomy.ttuhscep.edu/anatomytables/bones_alpha.html)

No source wording or images are reproduced. Conservative derived-word counts,
including repeated answer text, are 88 words for UAMS and 101 for TTUHSC.
Landmarks, foramina and the inner ear are teaching facts, not individually
segmented or validated on these meshes. They do not establish patient anatomy,
scan registration or clinical acceptance. Revision-bound radiologist review is
pending. Atlas, imaging-case and lecture access remain independent.

`scripts/pin-cranial-bone-quiz.mjs` runs only before dispatcher integration at
source HEAD `bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8`. It replays that exact
Git revision, checks the complete prior teaching/recipe snapshot and original
GLB bytes/hashes, then writes exclusive pins with `wx`. Do not regenerate pins
after integration to conceal a source change.

`node scripts/test-cranial-bone-quiz.mjs` tests the resolver, complete source
identity, four choices and answer keys, non-quiz tabs, source drift, detached
returns, unchanged geometry and eight rendered quick-check interactions. Once
the main coordinator wires dispatch, run the same command with `--integrated`
to check exactly eight changed quiz placements and 9,928 unchanged topics,
content/review records and the shipped QuizNotes presentation. Transition and
history recording are owned by the main coordinator. A source test is not a
browser, GPU, deployment or radiologist review.

The recorded transition and test-only history adapter restore the exact eight
prior quiz topics; mixed or unrecorded states fail. The history check preserves
the full 9,936-topic baseline and verifies exactly eight changed display-review
pins. Review packet tests reject changed answers, choices, explanations,
references, readiness, approval flags or a missing quiz. Existing quiz harnesses
exercise the current lazy notes panel without changing historical content
assertions. These test adapters are not learner or approval APIs.

The source batch must be imported through the website's generated learner and
Clinical Review pipeline before it is available there. Website/browser
acceptance and radiologist sign-off are separate remaining steps. No extra
panel, scan registration, patient data or paid dependency is introduced.
