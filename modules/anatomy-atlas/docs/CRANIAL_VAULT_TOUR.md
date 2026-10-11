# Cranial vault guided orientation

The existing 3D Atlas now offers **Cranial vault: exterior orientation** in
Guided learning for Head and neck and the Whole body tour library. It moves
through the frontal bone, right parietal, right temporal, occipital, left
temporal and left parietal bones without moving the source surfaces apart.
All six stops use one camera frame, so changing the highlight does not change
the model scale. The existing 1.8-second eased camera transitions, pause,
step selection and reduced-motion controls remain in use.

## Anatomy and source scope

The six separately selectable BodyParts3D surfaces remain in their supplied
frame. This is exterior orientation, not a complete skull-base atlas or a
reconstruction of sutures, foramina, bone subparts or disease. Bone names use
anatomical laterality, independent of viewing direction. No patient imaging
or spatial registration is implied.

The original short captions cite [OpenStax Skull anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull)
for the general positions of these bones. No source prose, illustration,
texture or new mesh is incorporated. Existing model notices and commercial
licensing requirements are unchanged; no dependency or paid service is added.

## Review and verification

The tour is a draft. In the private Clinical Review area, select any of its
six bones and review the guided-learning evidence. The complete tour,
source records, bundle hash, assembled frame and transition policy are bound
to that teaching packet; earlier decisions do not approve this revision.
Review anatomical identification, orientation, captions, visibility and the
smoothness of every transition before signing off.

The source baseline is `4624f82b6c517767238da9c31daf5d8c7fbe7d8b`;
the tour revision is `cranial-vault-tour-20261011-r1`. Exact records and bundle
identity are in `content/cranial-vault-tour-pins.json`. Run
`npm run cranial-vault-tour:test` for pin, source, packet, player, library,
review and camera checks. Passing checks do not establish clinical acceptance
or browser GPU performance. Website integration must use the normal four
module exports and protected Review pipeline, never manual generated edits.
