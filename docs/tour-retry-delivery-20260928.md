# Guided-tour recovery — local website integration

28 September 2026. Source `367ec85339ef2f7bd11df43a96514ac85712f4ab` is
imported into the regional/whole-body learner and protected Clinical Review.
The dedicated shoulder export is rebound to the same source commit; its existing
player is unchanged. No public deployment or clinical approval is implied.

Guided learning offers Retry missing anatomy only when a required source bundle
has failed. It clears that failed cache entry, preserves the current step and
teaching, and keeps playback paused. Successful recovery requires explicit
Start/Play. Keyboard focus returns safely if the disappearing retry control left
it on the document body. Exit and independent permissions remain unchanged.

## Evidence

- Immutable source import and separately built review renderer verify against
  the exact revision. Integration hash:
  `388e5cb921dd9b187b2bc40a0aa59ccc4eaf9d66c96b3d5995547691a1059c23`.
- All239 website tests, TypeScript and production build pass. New delivery test
  binds the exact tested player, retry policy and scene to learner/review inputs
  and checks that compiled output replaces the old reload-only instruction.
- Actual 375px embedded learner: start intrinsic-muscle tour, next to left
  posterior cricoarytenoid, visible model/label, paused Play, no retry control
  during normal operation, one canvas and no horizontal overflow. Exit returns
  to Explore and its launcher focus. Screenshot visually inspected.
- The source's separate real-browser fault test induced503 then recovered200
  without reload; all33 source player tests and792 shared renderer checks pass.
  Mid-tour step preservation is tested with production-component callbacks;
  browser fault injection occurred before Start. These are not physical-device
  or clinical acceptance claims.
- All136 model objects /143 paths, source geometry, teaching, independent
  specimen pins and entitlements unchanged. No new assets or dependencies.

Superseded generated JavaScript was hash-backed-up before replacement in the main
coordination workspace at `work/tour-retry-prior-generated-20260928`; it is also
recoverable from Git. Fracture-specific changes and the other task's shared-plan
entry are excluded from this commit and preserved on disk. No patient data,
desktop PACS or CT-head masks touched.

Logs are `work/tour-retry-website-*20260928.log` in the main workspace. Its final
checkpoint records exact GitHub/D recovery. The full Atlas goal remains active;
source validation, cleared patient imaging and revision-bound radiologist review
remain independent gates. Native MRI implementation is already complete.
