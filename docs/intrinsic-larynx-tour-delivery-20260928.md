# Intrinsic laryngeal guided learning — local delivery

28 September 2026. Imported immutable Atlas source
`bf5c3964677ff866b166404355349267dbf2c503` into the regional learner and protected
Clinical Review. This is local administrator-review delivery, not publication or
clinical approval.

## Delivered

- Seven stops: paired posterior and lateral cricoarytenoids, transverse arytenoid,
  and paired oblique arytenoids, with cricoid and paired arytenoid context.
- Three head/neck choices; fourteen tours in the regional/whole-body library.
- Existing smooth 1.8-second camera transitions, per-step framing, pause/next,
  mobile captions and return-to-Explore behavior.
- Shared cartilage review packets include both the framework and intrinsic-muscle
  tours. Tests reject omission of either, duplication, altered teaching, source
  bounds or step ordering. Changed teaching requires revision-bound review.

This imports teaching and camera sequences, not new geometry. All 136 model
objects / 143 paths and independent specimen pins remain unchanged. No new
dependencies, fonts, textures or external media were introduced; source notices
are retained. No scans, patient identifiers or masks are included.

## Verification

- All 238 website tests pass; TypeScript and production build pass.
- Immutable source import and review renderer verification pass. Current test
  delivery pins were refreshed without changing historical model baselines.
- Actual embedded phone preview (375 x 812): all seven stops, correct headings,
  one canvas and no horizontal overflow. Finish restores Explore and keyboard
  focus to the Guided learning launcher.
- Actual cricoid Clinical Review shows both draft tours, their exact source
  context and camera instructions at phone width without overflow. No review
  decision was submitted.
- Integration hash:
  `1db692ef88840e479fca5bcaaa09220fb4e2330cabb4c8623bc3746423589957`.

Logs and receipts are in the main coordination workspace under
`work/intrinsic-larynx-website-*20260928.log` and
`work/intrinsic-larynx-tour-import-20260928.json`. The final coordination checkpoint
records the exact website commit and independently verified GitHub/D recovery.

## Remaining gates

Radiologist review of surfaces, spatial relationships, captions and teaching is
still required. Static surfaces do not demonstrate vocal-fold motion, airway
patency, endoscopy, procedural routes or patient-specific imaging registration.
CT/MRI/X-ray/ultrasound links remain governed by separate cleared-case evidence
and entitlements. Native MRI implementation remains complete; no desktop PACS
changes were made. Separate fracture-exam changes were preserved and excluded
from this delivery commit.
