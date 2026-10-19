# Mesenteric arterial tour — local website integration

Atlas source: `f12348a11c0e8e0b642ec43c9285107259ca7ea5`.
Website parent: `72c9d468c990db0045a13456bdaefe4807f1f5d0`.
Evidence/recovery: `E:/VisibleMedicine-LocalStaging/20261009-mesenteric-integration`.

In **3D Atlas → Abdomen → Guided learning**, choose **Mesenteric arteries: SMA
and IMA branches**. It is also available through the whole-body tour library.
Five stops compare the SMA, middle colic, ileocolic, IMA and left colic arteries,
with the existing aorta as a faded landmark. Existing tour defaults are retained.
The shared player retains smooth 1.8-second camera transitions, reduced-motion
support, pause and restore. This compares branches, not a serial blood-flow route.

The generated learner and protected Clinical Review share the exact source.
Six worksheets carry the sequence, source identities and frame evidence. Drafts
remain unapproved; this import submits no clinical decisions. Current packets
must pass; changed captions, omitted stops, invented registration, altered source
hashes and stale revisions must fail.

Source tests preserve all 35 prior tours, 1,098 unaffected Review packets and
9,936 topic placements. The website import preserves 136 regional models and
twelve scopes, plus the complete 137-model/144-path delivery inventory. Dedicated
shoulder, accepted CT/MRI masks, native image controls, specialist files, Didanix
desktop and independently paid-resource access are unchanged.

Local logs record the source/learner/Review binding, integration and head-link
regressions, types, combined source verification, isolated E build and exact HTTP
readbacks. The saved-state receipt establishes which checks completed; this
document alone is not evidence of a pass. Signed-in browser/GPU readability and
radiologist acceptance remain separate.

## Local-preview failure — not accepted as a complete runtime pass

All 39 integration tests, 36 head-link tests, types, 1,172-input source verification
and the isolated website build passed. The first local HTTP run served the atlas
and protected routes correctly, including a 401 for an unauthenticated POST with
a JSON body. The following page request returned 500 and Wrangler exited with
code 1. This repeated on a fresh process and with curl; original logs are retained.
No authorization or clinical record changed. It resembles the framework-mediated
unread-body failure described in
[workers-sdk issue 15203](https://github.com/cloudflare/workers-sdk/issues/15203),
but the precise cause in this application has not been proven.

Browsing is restored with the same build. A separate GET-only check does not
replace the failed POST/stability gate. Investigate a bounded local reproduction
and fix or verify a compatible runtime remedy before accepting save-path stability.
No dependency upgrade, authentication workaround or production claim was made.

Original captions cite TTUHSC factual teaching; no diagrams, tables or prose are
imported. Existing mesh licence/attribution obligations are unchanged. No new
asset, dependency, font, fee, public deployment or verified remote backup.
Obsolete generated chunks are recoverable on E. Redundant build-only model copies
may be removed only after exact recovery verification; canonical models remain.
