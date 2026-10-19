# Shoulder search integration and desktop checks

The local website now integrates Atlas source `5bc52ef3f35fe08231bc6d6b498b78847ea70026`.
Typing a structure name previously left all nine shoulder suggestions visible.
The corrected filtered list also searches existing Latin names, landmarks,
synonyms and anatomical IDs. Search controls have explicit accessible names;
clearing the query does not clear the anatomical selection.

## Verified local behaviour

In the actual 1280 by 720 desktop browser, `supraspinatus` returns one result.
ArrowDown and Enter select Supraspinatus. Clearing preserves that selection;
`glenoid` returns Scapula, and Escape closes suggestions without changing the
selected structure. An unmatched query displays no results; an empty query
recovers all nine. Both side panels and the rendered model remain available
without horizontal page overflow.

The Explore slider reaches 100 percent with End and reassembles with Home.
Dissect opens the inline rotator-cuff layer; isolation preserves the selected
structure. The Supraspinatus quick check accepts Greater tuberosity, shows
Correct and Practise again, then clears the answer and returns focus to the
first radio. These are interaction checks, not clinical validation.

## Source and regression evidence

Canonical shoulder and shared-regional builds and exports bind the clean Atlas
source. All 1,083 Review source blobs and adapted files verify independently;
the only new imported path is `lib/shoulder-search.ts`. All 137 unique model
payloads across 144 paths, dependency entries and licence notices remain exact.
Female-pelvis and lower-limb payloads are byte-identical. No new asset, geometry,
teaching text, scan, registration or entitlement is added.

The initial selected website run passed 56 of 58 cases. Its two Spread failures
are retained: a count omitted five already-delivered Quiz and pulmonary inputs,
and the display comparison did not include the new helper. The corrected two
cases pass with exact previous/current source hashes and closure checks. A
narrow, two-hash projection preserves the older workspace-control epoch rather
than relaxing its anatomy-search assertion. Other 56 checks remain unchanged.
Fresh final nonincremental types and the full local website build pass. The build
includes 50 preserved specialist pending paths; it is not an isolated sanitized
source reproduction. Original historical pins, access and stale-review refusals
remain in force.

Review display fingerprints bind the new helper. Source teaching/imaging
revisions and models are unchanged; conservative website integration bindings
advance. No private decision is read or migrated and no earlier clinical
approval is transferred.

## Recovery and remaining gates

Evidence, before/after screenshots, full logs and exact recovery receipts are
under `E:/VisibleMedicine-LocalStaging/20261007-desktop-journeys`.
Seventeen superseded generated JavaScript files have hash-verified E recovery
copies. A stale lock belonging to the stopped earlier local preview is also
retained on E; no unrelated process was terminated. E is same-machine recovery,
not an off-device backup. New heads are not uploaded or deployed.

The earlier unattributed MutationObserver error reproduces after reload and is
not suppressed or accepted as fixed. Three.js clock and shadow-map deprecation
warnings also remain. Native 200 percent zoom, screen-reader, physical-device,
genuine private reviewer/readback, acquired-image correspondence, rights/privacy
clearance and revision-bound radiologist sign-off remain release gates.
The full Atlas goal remains active; CT-head masks and clinical desktop PACS are
untouched. Next priority is to attribute the remaining browser error safely,
then continue desktop acceptance and cleared cross-modality integration.
