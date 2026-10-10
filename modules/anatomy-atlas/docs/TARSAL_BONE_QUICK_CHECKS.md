# Tarsal bone quick checks

Seven original formative questions replace generic identification notes for the
14 existing left/right talus, calcaneus, navicular, cuboid and cuneiform selections.
They are reached through the existing Practice / Quiz notes controls, without a
new navigation section. All are drafts, not scored exams or clinical approvals.

The checks cover ankle load transfer, Achilles attachment, the talonavicular to
cuneiform relationship, the lateral column, Lisfranc ligament endpoints, the
second tarsometatarsal joint and lateral cuneiform orientation. They do not add
bone landmarks, ligaments, tendon meshes, patient images or registration.

## Sources and commercial scope

Factual references only; no source diagrams, screenshots, prose, scan data,
fonts or other assets are copied or bundled. These citations do not grant a
licence to redistribute those publishers' material.

- [OpenStax lower-limb anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb): talus and navicular relationships.
- [Texas Tech anatomy tables](https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html): calcaneal attachment, cuboid and lateral cuneiform relationships.
- [AO Surgery Reference](https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/lisfranc-injury/treatment-of-lisfranc-injuries): Lisfranc and second metatarsal–middle cuneiform relationships; no operative instructions included.
- [AAOS Lisfranc teaching](https://www.orthoinfo.org/diseases--conditions/lisfranc-midfoot-injury/): ligamentous injury can occur without a fracture; not a patient diagnostic rule.

Existing source model notices remain unchanged. This batch adds no dependency,
external asset or paid service; it is not an exhaustive new legal audit of the
whole product or a promise about future hosting costs.

## Source and review contract

`content/tarsal-bone-quiz-pins.json` captures exact identities, frame, model
digests and the immutable `871c57b7` teaching baseline. A lesson is returned only
for a complete matching source identity and the Quiz topic. Laterality, name,
source lists/digests, bundle, bounds and validation changes refuse that binding.
Each returned array is copied. The transition records 14 exact old/new lessons.

Teaching worksheets/fingerprints advance for these selections only. Any earlier
teaching decision must be reassessed against the new content. No sign-off is
carried over; Atlas, cases and paid lectures retain independent access.
Historical tests replay the exact recorded lessons, not a looser replacement
golden. The earlier thoracoabdominal milestone executes its saved dispatcher so
its review closures stay at that epoch; this batch independently verifies that
all 9,922 other current topics, including those notes, are unchanged.

The carpal validator's older mixed-live/history snapshot also failed when this
batch was rolled back to the exact `871c57b7` baseline. Its original carpal
goldens now run against the recorded `d9cd141f` epoch, with an independent check
that all 16 current carpal Quiz lessons remain identical. No original checksum
was replaced. Failed attempts and the before-batch reproduction are retained on E:.

## Verification and remaining acceptance

Run `node scripts/test-tarsal-bone-quiz.mjs`, the structure and regional quick-check
tests, current content/Review checks and TypeScript. Component tests represent
opened notes after priming the real lazy loader; closed server-rendered notes
correctly contain no quiz controls. This is not a browser or GPU check.

Before release: the radiologist must review each question, answer, explanation,
reference and source laterality; verify wording and anatomical relationships
against the displayed donor model; and sign the exact teaching revision in
Clinical Review. Whole bones do not independently validate articular surfaces,
tendon insertions or Lisfranc ligaments. Model loading, actual desktop interaction,
published delivery and authenticated approval persistence require separate checks.
