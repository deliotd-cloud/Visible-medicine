# Register first, activate after verification

The staging API and administrator maintenance page now combine the active model
inventory with one separately source-bound candidate. The protected delivery API
continues to resolve paths and revisions exclusively against the active inventory
and its existing policy. No staging operation activates a release or changes an
entitlement, clinical decision, user role or original geometry.

## Pelvis and spine rollout — 13 September

The current candidate is copied exactly from website `554054e4791f5f7f5e11c2e5c38431873140d017`:
94 objects / 100 paths, inventory SHA-256
`091481333b4d5a89fc1a3d05f38db397d125e8009280100b0c69c72e61a79b4b`.
Its 14 additional objects total 14,198,676 bytes. All 80 currently active objects
and their paths remain. The staging-only source starts from version 59's
`64f7156427972050307d24a6253049b4f5f11970` and changes no active model inventory,
runtime, route, policy, identity, environment, source geometry or notice.

Publish this staging-only source first; upload the 14 exact licensed GLBs through
the existing administrator route, verify all 94 complete downloads and the old
80 active objects, then activate the complete regional source. Keep both histories
and immutable stored objects for rollback. Registration and passing local tests
do not establish live availability or clinical approval.

The local test now exercises this exact 80-to-94 transition, preserving full-body
denial, checksum, size, range, conditional and active-path rejection assertions.
A minimal six-MiB early-response worker reproduced 26 connection resets in 30
local requests; consuming its unused finite fixture body completed 30/30.
Only the two test worker wrappers drain unused bodies after the real handler has
returned. Production authorization and streaming are unchanged. This follows the
transport limitation reported in [workerd issue 918](https://github.com/cloudflare/workerd/issues/918).
The complete 91-test candidate suite passed twice before updating this registry;
rollout and final source checks must still be recorded separately.

The complete candidate's delivery diagnostic also visits every registered URL,
including the six extra shared-model aliases. Each path gets HEAD, full SHA-256
download, range and conditional checks. The real local D1/R2 fixture uses a shared
model and proves a failed second alias cannot be reported as success; cancellation
and missing/repeated paths fail explicitly. All 91 tests and TypeScript pass.
This affects administrator diagnostics only, not authorization or source anatomy.

## Historical abdomen rollout

The candidate is the exact 80-model inventory from saved website source
`1268adcd49339e5766142b9c34aec156e0167db3`, SHA-256
`d64267746511da4c2052827c06fe98cdd82edbf1c82bc66e35d05c56584c210e`.
It contains the existing 59 models and 21 additional licensed bundles totaling
35,683,112 bytes. This does not admit scans or arbitrary models. Its source commit
contains the unchanged source geometry, licence notices and complete candidate
runtime; the staging-only build does not need duplicate candidate GLBs.

1. Build and privately publish the staging-only revision based on the working
   version-56 source (`841183d…`). Preserve its 59-model inventory, policy, all four
   runtime directories, routes, authentication, environment and source notices.
2. In `/workspace/atlas-models`, upload the 21 candidate files and verify storage
   plus complete downloads. “Check Atlas delivery” deliberately checks only the
   59 active models, not the candidate-only paths. Check those paths are still
   rejected by active delivery even after storage succeeds.
3. Publish the complete 80-model abdomen source only after the candidate uploads
   and complete-byte/loader checks succeed. Its own active policy binds the new
   inventory. Recheck all 80 live delivery paths and representative abdomen,
   hepatic/pancreatic, abdominal-wall and renal journeys.
4. Preserve both source revisions and stored immutable objects for rollback.
   Rolling back active code/inventory does not require deleting candidate objects.

The main branch can merge the staging-only revision while retaining its complete
abdomen runtime. Both exact source commits must be pushed before either is saved
as a Sites version. Sites also requires the saved commit to be the configured
remote main HEAD. For this rollout, two explicit history-preserving deployment
snapshots solved that constraint: `fef7471…` has the exact staging-only tree
`8f5ebb7…`; descendant `95d39ec…` restores the complete candidate tree `2c776f0…`.
Both prior source branches and all commits remain ancestors; no force-push or
source deletion occurred. Publish the staging-only snapshot first. Never weaken the active registry or
return to the old 44-static-model bootstrap to make the staging build fit.

## Checks and limits

The local real Workers/R2 test uploads all 21 exact candidate GLBs, checks full
SHA-256 bytes, HEAD, range and conditional reads, verifies unauthorized staging
denials, and confirms their active delivery paths remain unavailable. An existing
active object still passes protected delivery afterwards. Registry tests reject
malformed hashes/paths, conflicting sizes and ambiguity, preserve both inputs,
and test registration of a future object revision without replacing active bytes.
These are local test fixtures, not live user accounts or production storage.

The staging-only suite passes 88 tests and TypeScript; the complete candidate
passes 90 tests. Version 57's real administrator session staged all 21 added
models, fully verified all 80 staged downloads, then passed all 59 active delivery
checks. Version 58 activated the candidate and passed all 80 active full-byte,
HEAD, range and conditional checks. Separate local installed-GLTFLoader checks
parsed all 80 exact files successfully. See [live pilot evidence](abdomen-atlas-pilot.md).
The attempted direct pending-model browser inspection was client-blocked before
an application response: live pending denial is not claimed. Local tests above
cover all 21; do not bypass browser policy to claim a live result. Neither tests
nor this publication confer clinical approval, privacy or learner-release permission.

Inventory JSON is explicitly checked out as LF through `.gitattributes`: its
fingerprint must not change solely because recovery takes place on Windows.
All source/licence assets retain their existing exact-byte attributes. No new
dependency, paid service, patient data, splash change or anatomy modification.
