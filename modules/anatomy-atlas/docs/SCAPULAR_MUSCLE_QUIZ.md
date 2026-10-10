# Scapular muscle question coverage

## Integrated source checkpoint — 10 October 2026

The shared dispatcher serves all eight draft placements. Integrated checks
confirm 9,928 other topic placements are unchanged, 96 altered identities are
refused, and four real component correct/wrong/reset cycles pass. Current
untampered Review packets are accepted; predecessor and altered packets are
rejected. This is source validation, not browser or clinical acceptance.
The coordinator independently verified the Texas Tech and UW pages and the
indexed WSU terminology mapping. No reference media was copied.

## Draft scope

Four original formative multiple-choice questions cover eight exact source
selections: right and left subclavius, and right and left ascending, transverse
and descending trapezius parts. Each bilateral pair shares general anatomy
wording, but each displayed identity is separately pinned. These are draft Quiz
lessons pending revision-bound radiologist sign-off. Source surfaces do not
validate muscle activation, motion, attachments, patient registration or
clinical findings. No model geometry or asset is changed by this draft.

## Factual references and provenance

- [Texas Tech University Health Sciences Center, upper-limb muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): subclavius attaches to the first rib and clavicle. The attributed question, choices and explanation total 46 original words.
- [Texas Tech, upper-limb movement module](https://anatomy.ttuhscep.edu/modules/upper_limb_module/upper_limb_03.html): upper trapezius helps elevate and lower trapezius helps depress the scapula. These motions are distinct from scapular rotation. The two attributed questions, choices and explanations total 77 original words.
- [Washington State University Medicine, posterior shoulder dissection](https://learning.medicine.wsu.edu/cohort-2029/dissector/lab-2-station-6/): maps descending to upper, transverse to middle, and ascending to inferior trapezius fibers. Two attributed questions, choices and explanations total 77 original words. The page's indexed university text showed the mapping; direct opening redirected to a WSU login during independent review.
- [University of Washington Radiology, trapezius](https://rad.uw.edu/muscle-atlas/trapezius): middle fibers retract the scapula. The attributed question, choices and explanation total 41 original words. Its illustration is copyrighted and was not copied.

References checked 10 October 2026. Counts use the focused test's whitespace
tokenization and conservatively count all question, choice and explanation
words for each cited page. All wording is original. No source prose, tables,
figures, exam items or media were imported. Citation links establish factual
support, not redistribution rights.

## Source and verification contract

Immutable parent: `f2e1a56027bbe0efe9eef1720ccc699ae7da90fe`.
The pin record retains complete displayed identities, prior generated
identification lessons, coordinate system and both referenced bundle byte
lengths/SHA-256 values. Its canonical JSON SHA-256 is
`279a1f624474b997e1329d12f72c99329b45096559b085a6f5f1278221d95ee3`.
The pin helper accepts only the exact empty bootstrap stub on first write;
subsequent verification uses `--check`.

Before shared dispatcher integration, run
`node scripts/pin-scapular-muscle-quiz.mjs --check` and
`node scripts/test-scapular-muscle-quiz.mjs --source-only`. The source-only
test checks eight target placements, 9,928 other topic placements, 96 altered
source refusals, four answer groups and four actual correct/wrong/reset
component cycles. It does not establish learner dispatch. The integration
hook is `scapularMuscleQuizLesson(structure, tab)` from
`lib/scapular-muscle-quiz.ts`. After the coordinator routes it through the
shared dispatcher and refreshes review evidence, the test without
`--source-only` requires current Quiz lessons and untampered Review packets,
while rejecting predecessor packets. Review validity is not clinical approval.
Browser/GPU, deployment and off-device backup acceptance remain separate.
