# Intrinsic hand questions: local website integration

9 October 2026. Both the regional learner and protected Clinical Review now
import Atlas `1dc7916410479346c5f96ed0d9a42461eaada69b`. Nine original
question groups cover 20 bilateral intrinsic-hand selections. Both adductor
heads share an action question; lumbricals and interossei remain aggregate
selections, not separately resolved slips. All material remains a revision-bound
radiologist-review draft; earlier decisions cannot approve these new packets.

The Site integration workflow regenerated delivery from the separately versioned
Atlas rather than editing generated modules. The existing four-choice Quick
Check presents the teaching, with matching answers, explanations and source
identities in Clinical Review. No new UI panels, dependencies or assets were added.
The source reference and original-wording notice travel with the Review import.

## Verification

- 22 affected integration cases pass, including all 20 hand packets, exact
  learner/Review source equivalence and stale/altered packet rejection.
- Fresh TypeScript, combined Review verifier (1,131 source files), regional
  module/export and local E website build pass.
- 46 local route/access checks and 19 exact learner-file HTTP readbacks pass.
  Unauthenticated Review decisions and model access remain refused.
- All 136 regional model bundles and 12 scopes are unchanged. The complete
  model inventory retains identical 137 model records and 144 delivery paths.
- Existing regional tests retain their exact fixed expectations, updated only
  to the verified new delivery/source hashes; their behavior checks remain intact.

No new signed-in browser, native-image, GPU, clinical, spatial-registration or
privacy acceptance is claimed. Source scans, accepted masks, Didanix desktop
PACS, independent entitlements and unrelated fracture work were not changed.

## Recovery and next work

Evidence: `E:/VisibleMedicine-LocalStaging/20261009-hand-muscle-integration/`.
`saved-state.json` records the website commit, exact source-only copies and an
incremental Git bundle requiring parent `410cbccf6cbd0704ffee2206fc4426eb35b41372`.
This is same-machine recovery, not verified GitHub or off-device backup.
32 obsolete generated chunks were retained there before removal. 144 redundant
build-only model copies were removed after exact E recovery-copy verification;
canonical model bytes were not removed.

Local preview session 93704 serves port 3000, replacing deliberately stopped
63557. Historical port 3001 and the owner's loaded scan tabs were not touched.
Nothing was publicly deployed. Continue substantive linked-learning and regional
teaching improvements; clinical review stays queued without stalling other work.
