# Main-bronchus X-ray orientation — 24 September 2026

Two source-bound draft topics fill the previously pending X-ray panels for
FMA7395 (right main bronchus) and FMA7396 (left main bronchus). They reuse the
existing Imaging → X-ray navigation; no control, image or model is added.
The full Atlas goal remains active, and neither note is clinically signed off.

## Teaching scope and references

The learner starts with the visible tracheal air column and carina, then follows
the visible main-bronchial air column on the actual radiograph. The notes compare
the normally steeper right course with the more oblique left course, while
distinguishing the visible airway from surrounding projected opacity. They do
not claim a complete wall, unobstructed distal tree, registered detector frame,
diagnosis or tube-positioning guidance.

- [King's College London: How to Interpret a CXR — lungs](https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html),
  by consultant radiologists Pamela Allen and Lisa Meacock: visible airway,
  carinal division and different bronchial courses.
- [Radiology Masterclass: trachea and major bronchi](https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page1),
  by consultant radiologist Graham Lloyd-Jones: airway visibility and positioning
  considerations. Page states last reviewed February 2020; inspected 24 September 2026.

These are factual reading links, not cleared image libraries. New prose is
original; no reference diagrams, X-rays, screenshots or annotations are imported.
Existing anatomical citations and CC BY 4.0 source attribution remain intact.
No dependency, font, texture or fee-bearing service is introduced.

## Identity and review boundaries

Both bindings reuse immutable `thoracoabdominal-organ-imaging-pins.json` records.
The right source belongs to the `partof` tree and the left to `isa`; they must not
be normalised into one source tree merely because they share an anatomical type.
Different IDs, laterality, source files/hashes, tree, bounds or other pinned
fields do not inherit these lessons. Review status remains draft and imaging,
Atlas and paid-lecture entitlements stay independent.

The transition binds parent `977ac4160e27f0762c497741e6a2250aa3f4749e`, both
draft hashes, prior pending lessons and the prior full teaching/recipe digest.
The new offline history step restores only these two topics. It cannot run in
the viewer, confer approval or weaken the existing immutable history assertions.
Mixed, altered or wrong-source history fails rather than silently rebasing.

## Verification

`npm run main-bronchus-xray:test` checks both changed topics, all 9,934 other
topics and the original display/recipe digest, 32 wrong-source mutations,
fresh return values, exact content export, and the actual viewer note callback.
It also rejects mixed/tampered history and limits reference-derived text to
200 words per source. The older external-ultrasound and eleven-topic X-ray
transitions remain intact; broad content and body-review checks remain applicable.

A local desktop browser sample at `/regions/thorax` used Search → right main
bronchus → Imaging → X-ray, then selected the left main bronchus. Both correct
notes, cited reading links, draft limits and the no-study-loaded state appeared.
The selected X-ray tab persisted across the side change. This is not physical
device, screen-reader, patient-imaging or clinical acceptance. No website version
is claimed here; use the main-task deployment/recovery checkpoint for that state.
