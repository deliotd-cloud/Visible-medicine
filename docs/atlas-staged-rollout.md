# Register first, activate after verification

The staging API and administrator maintenance page now combine the active model
inventory with one separately source-bound candidate. The protected delivery API
continues to resolve paths and revisions exclusively against the active inventory
and its existing policy. No staging operation activates a release or changes an
entitlement, clinical decision, user role or original geometry.

## Abdomen rollout

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
as a Sites version. Publish the staging-only commit first, not the merge merely
because it is the newest HEAD. Never force-push, weaken the active registry, or
return to the old 44-static-model bootstrap to make the staging build fit.

## Checks and limits

The local real Workers/R2 test uploads all 21 exact candidate GLBs, checks full
SHA-256 bytes, HEAD, range and conditional reads, verifies unauthorized staging
denials, and confirms their active delivery paths remain unavailable. An existing
active object still passes protected delivery afterwards. Registry tests reject
malformed hashes/paths, conflicting sizes and ambiguity, preserve both inputs,
and test registration of a future object revision without replacing active bytes.
These are local test fixtures, not live user accounts or production storage.

The staging-only suite passes 88 tests and TypeScript. The candidate already has
its recorded local model/browser evidence. Live upload, live candidate denial,
actual staging-page browser checks and publication are still pending. Neither
suite confers clinical approval, privacy clearance or learner-release permission.

Inventory JSON is explicitly checked out as LF through `.gitattributes`: its
fingerprint must not change solely because recovery takes place on Windows.
All source/licence assets retain their existing exact-byte attributes. No new
dependency, paid service, patient data, splash change or anatomy modification.
