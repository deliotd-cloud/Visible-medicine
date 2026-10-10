# Source-pinned teaching replay repair — 4 October 2026

This is an offline test-infrastructure checkpoint. No learner content, runtime,
model, licence, dependency, imaging registration or approval record changes.
The Atlas goal remains active; all teaching still needs revision-bound review.

## Why the older checks failed

Three failures were reproduced on their saved parent, before the eight new
thoracic/GI Quiz lessons. Their replay adapters omitted later CT, MRI, X-ray,
ultrasound and Quiz authoring. Their original expected snapshots were correct;
rebasing those expected hashes would have concealed missing reversals.

`scripts/late-teaching-epoch-history.mjs` now names 24 later families explicitly.
Each replay verifies the original complete pin/transition hashes, exact source
identity, recorded current or prior lesson, exported helper (when present), and
matching displayed content. Mixed states, unknown lessons and forged records
are refused. Optional exports are explicit because exact Git display APIs do
not export every lesson helper; a present malformed/forged helper is never optional.

Six families lacked saved transitions. `late-teaching-author-records.json`
contains only 86 hashes derived from their exact original author commits and
parents. Independent Git replay checks these, rather than trusting today's
output as the expected value. The four cubital-vein ultrasound records likewise
come from author `fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06` and parent
`5f1a0c86d76089a35c711caa951ade1a162a1dbf`: four changed and 9,932
preserved placements, with catalogue, shoulder and recipes retained.

## Epoch boundaries and repeat safety

- Foot-surface baseline already contains the hyoid/epiglottis notes: keep them.
- Thoracic replay reverses later families, leaving its 27 Quiz drafts for its
  own adapter. Cubital notes belong before cranial Quiz, after lumbar replay.
- Overlapping hallux/toe updates require recognition of the entire frozen
  terminal footprint, not a per-topic mixed-state exception or a trusted marker.
- With a catalogue/display supplied, the foot, thoracic and cranial prior
  returns verify their immutable whole snapshot, not just affected topics.
- Earlier carpal, tentorium and cerebellar states must match their own complete
  immutable prior hash before avoiding a newer child's epoch gate. Original
  record and later source/helper checks still run; unknown snapshots are refused.

These scripts are not a clinical, licensing or security approval service.
APIs without a supplied display retain their existing narrow composition
contracts; their calling full-epoch tests supply the complete snapshot proof.

## Verification and recovery

Run the isolated engine, hyoid history, combined epoch and brain-chain tests,
then the affected legacy checks. Tests include cloned return values, catalogue
identity changes, current/all-prior unrelated edits, malformed/forged helpers,
mixed teaching and immutable record tampering. Original pins and hashes stay
unchanged. No production rebuild is needed for test-only changes.

Complete results and retained initial failures are in
`E:/VisibleMedicine-LocalStaging/20261004-teaching-replay-repair/`.
`validation-final.json` records the risk-matched final acceptance;
`source-recovery.json` records the exact restored commit/tree and strict fsck.
This is not an all-historical-suite, browser or clinical acceptance claim.
E: is same-machine recovery, not GitHub or an off-device backup.

All protected source/model/notices bytes, unrelated website changes and prior
coordination-document raw tails must remain intact. No D: writes, private case
access, accepted CT-head mask changes, desktop PACS work or publication.

Next: resume original teaching and regional interaction work on admitted
models. The alternative plexus asset remains isolated until its exact donor
rights/provenance and subsequent spatial/clinical checks are established.
