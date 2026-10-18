# Deep plantar ultrasound teaching

Two source-bound original editorial drafts, not new imaging or validated anatomy.
The exact identities and prior lessons are in
`content/deep-plantar-ultrasound-pins.json`; the recorded transition preserves all
other teaching placements and source geometry. Run the unit, integration and
history checks in `scripts/test-deep-plantar-ultrasound*.mjs` sequentially.
The pin generator is a pre-authoring admission tool, not a new source importer.

Reference: [Koelemay et al. (1998)](https://doi.org/10.1016/S1078-5884(98)80086-5).
The original study was consulted through its institutional publication record.
It is reference-only: no article text, figures, tables, scan, texture or other
media is incorporated. No new dependency, licensed mesh, font or image is added.
Existing BodyParts3D notices and source holds remain in force.

The drafts require the owner's exact-revision radiologist review. Source,
checklist and geometry decisions are not broadened; the changed teaching
fingerprint invalidates stale teaching submissions. Imaging approval remains
unavailable without an independently validated acquired-image mapping.
The superficial medial plantar branches remain pending.

## Verification boundary

The runtime comparison against exact parent `7b3e678ae4b8059aadb84459048ebd05f7abe7b9`
changes two of 9,936 display placements, preserving the other 9,934 and all 109
model bundles. The raw-catalog database export has 1,022 records, distinct from
the 1,104-structure display catalog. Regeneration also catches up 605 pre-existing
stale export placements; comparison with the parent's actual resolver proves that
only these two new source lessons change. Export metadata and approval fields
are unchanged. The old generated file is retained in scoped local recovery.

Unit, integration, exact reversal, schema/export, type, renderer, display-pin,
shoulder Review and nested-binding checks pass. This is not a whole-suite pass:
an unchanged older shoulder-history global-hash assertion fails identically
against every lesson resolved from the parent source. The diagnostic and original
failure are retained; no expected historical hash or approval was changed.
The website's generated Atlas module is not yet updated with these drafts.
