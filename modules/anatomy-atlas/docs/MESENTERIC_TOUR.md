# Mesenteric arterial guided learning

Source milestone: 9 October 2026. Draft, not clinical approval or publication.

Abdomen → Guided learning adds **Mesenteric arteries: SMA and IMA branches**,
also discoverable in the whole-body tour library. Five stops compare the superior
mesenteric, middle colic, ileocolic, inferior mesenteric and left colic arteries.
The unchanged aorta provides faded context. Existing defaults remain unchanged.

Branch-specific frames compare each colic surface with its parent; the two aortic
branches share an overview frame. The established player supplies 1.8-second
quintic camera transitions, 14-second dwell, pause/restore and reduced-motion
behavior. No new controls or geometry are introduced.

## Source and rights

`content/mesenteric-tour-pins.json` binds five target records, one context record,
two bundles, coordinate system, source version and existing licence metadata to
Atlas `613daed2219432ba4c5321105d9552c7c9765e3e`. The checker verifies full record
identity and unchanged model byte counts/SHA-256. Runtime admission refuses
altered records, duplicate/FMA-alias targets, bundles, captions or sequence.

Original short factual captions reference the institutional
[TTUHSC El Paso abdominal artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html),
consulted 9 October 2026. This is a reading citation, not permission to reproduce
its diagrams, table or prose. None are imported. Existing mesh licences and
attribution remain in THIRD_PARTY_NOTICES; original wording/code use project MIT.

## Acceptance and limitations

`npm run mesenteric-tour:test` checks exact source admission, frames, prior-tour
preservation, stale/tampered Review refusal, and shared player/camera behavior.
The current registry contains 36 tours/213 stops. All previous 35 tours, 1,098
unaffected Review packets and all 9,936 topic placements remain unchanged; six
packets gain the new revision-bound sequence. Historical upper-venous admission
tests replay their completed registry epoch; the new test compares the actual
current registry and every packet with its immediate baseline.

These are exterior surfaces, not a serial flow route or a complete marginal arcade.
Bowel, mesentery, other branches and veins are omitted. No connected lumen,
collateral reserve, perfusion, stenosis, ischaemia, surgical plane or patient-space
registration is established. Actual source junctions, extents, orientation,
camera framing, caption accuracy and readability need radiologist review.
Unit/source tests do not establish live GPU visibility or clinical acceptance.
No CT/MRI/US link is invented without a corresponding source-bound study target.

This source milestone precedes website delivery. Import the generated regional
learner and matching protected Clinical Review together. Preserve dedicated
shoulder, accepted imaging masks, specialist files and existing loaded viewers.
Local recovery evidence: `E:/VisibleMedicine-LocalStaging/20261009-mesenteric-tour`.
