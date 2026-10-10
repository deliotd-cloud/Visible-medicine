# Local backup and teaching history validation

This checkpoint improves source-backup checks and restores the original
abdominal Quiz regression without changing learner content, geometry, licences,
dependencies or clinical approval. The website remains at `97defd833fa981b62bfca152397eda7df48f6153`,
with learner and Review source `0b38b93e5626f34bf1a79a45734171371d52fb3d`.
All work is local; the full Atlas goal remains active.

## Changes

The central-vessel history adapter accepts the celiac record's exact archived
identity or its exact recorded corrected-display identity. The corrected-display
branch rechecks the complete pinned catalogue on every lookup. It rejects altered
identities and later catalogue mutations instead of treating a shared anatomical
ID as permission to transfer historical material. This adapter is offline-only.

The abdominal Quiz test now composes the existing exact lumbar MRI and coronary
study reversals before comparing its original milestone. Its immutable parent,
pins, assertions and target teaching remain unchanged. Its component VM receives
the standard `structuredClone` global required by the current shared component.

The new import-only filesystem collector independently inventories every file
in a prepared stage. It streams hashes and refuses unsafe paths, links, aliases,
hardlinks, unsupported options and detectable changes. It does not prepare a
stage, infer rights or upload files. See `SOURCE_SNAPSHOT_VALIDATION.md` for the
interface, bounds and limitations.

## Verified results

- Celiac tests accept 12 intended lookups, preserve the other 28 central-vessel
  entries and reject 64 malformed identity/catalogue cases, including catalogue
  changes after adapter construction.
- The original abdominal Quiz test passes in both modes. Integrated checks prove
  six intended Quiz placements and 9,930 unchanged other teaching placements,
  six actual lazy renders and answer interactions, 215 source refusals and
  42 altered-binding refusals. Correct feedback, retry, focus and exam controls
  pass; these are automated component checks, not signed-in browser acceptance.
- The collector and unchanged manifest suites pass 102 tests with two Windows
  platform skips out of 104. Junction and hardlink tests run; the filesystem
  cannot create two case-colliding names or an ordinary file symlink.
- The full teaching-history epoch suite passes its original complete snapshots,
  checks six author epochs and rejects 48 malformed helper states. Current
  teaching remains unchanged.

Logs and phase receipts are retained privately at
`E:/VisibleMedicine-LocalStaging/20261007-celiac-history/`.
Initial failures remain alongside successful reruns.

## Remaining boundaries

The original abdominal-organ imaging validator still fails its full historical
snapshot assertion. The immutable September parent independently reproduces its
original pinned hash. Diagnosis identifies later catalogue additions/celiac
display correction, 57 differing old-structure teaching placements, and shoulder
and recipe differences; no reference hash or original assertion was changed.
The older abdominal vascular MRI test's current-notice versus historical-notice
mismatch also remains open. Current licence notices must not be replaced by old
bytes to make that test pass.

The collector does not prove a complete, buildable source whitelist, scan allowed
text for private data, authenticate rights or protect against hostile filesystem
races. A complete independently derived build-input inventory, privacy/rights
clearance, isolated build and second-directory restore remain necessary. The
manifest still rejects the original-source archive required by the default build;
no automatic exception or alternative-build success is claimed. Raw Atlas
GitHub upload stays held.

E recovery is same-machine recovery, not off-device backup. No scan, CT-head mask,
private clinical decision, desktop PACS, hosted deployment or existing specialist
work is changed. Clinical acceptance and acquired-image correspondence still
require the owner's revision-bound radiologist review.
